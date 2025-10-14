const { test, expect } = require('@playwright/test');

test.describe('Future Agent Tests', () => {
  const futureAgentUrl = 'https://future-agent.vercel.app';

  test('should be accessible and healthy', async ({ request }) => {
    const response = await request.get(`${futureAgentUrl}/api/health`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('healthy');
  });

  test('should return thread data for queries', async ({ request }) => {
    const response = await request.post(`${futureAgentUrl}/api/threads`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'free-key'
      },
      data: {
        query: 'cannabis cultivation techniques',
        max_results: 5
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('threads');
    expect(Array.isArray(data.threads)).toBe(true);
    expect(data.threads.length).toBeLessThanOrEqual(5);
    
    // Check thread structure
    if (data.threads.length > 0) {
      const thread = data.threads[0];
      expect(thread).toHaveProperty('title');
      expect(thread).toHaveProperty('content');
      expect(thread).toHaveProperty('url');
      expect(thread).toHaveProperty('relevance_score');
      expect(typeof thread.title).toBe('string');
      expect(typeof thread.content).toBe('string');
      expect(typeof thread.url).toBe('string');
      expect(typeof thread.relevance_score).toBe('number');
    }
  });

  test('should handle different query types', async ({ request }) => {
    const queries = [
      'cannabis compliance',
      'THC extraction methods',
      'cannabis marketing strategies',
      'growing techniques',
      'legal requirements'
    ];

    for (const query of queries) {
      const response = await request.post(`${futureAgentUrl}/api/threads`, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'free-key'
        },
        data: {
          query: query,
          max_results: 3
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.threads)).toBe(true);
    }
  });

  test('should respect max_results parameter', async ({ request }) => {
    const maxResults = 2;
    const response = await request.post(`${futureAgentUrl}/api/threads`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'free-key'
      },
      data: {
        query: 'cannabis',
        max_results: maxResults
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.threads.length).toBeLessThanOrEqual(maxResults);
  });

  test('should handle empty queries gracefully', async ({ request }) => {
    const response = await request.post(`${futureAgentUrl}/api/threads`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'free-key'
      },
      data: {
        query: '',
        max_results: 5
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.threads)).toBe(true);
  });

  test('should handle malformed requests', async ({ request }) => {
    const response = await request.post(`${futureAgentUrl}/api/threads`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'free-key'
      },
      data: {
        // Missing required query field
        max_results: 5
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should require authentication', async ({ request }) => {
    const response = await request.post(`${futureAgentUrl}/api/threads`, {
      data: {
        query: 'test',
        max_results: 5
      }
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should have proper CORS headers', async ({ request }) => {
    const response = await request.options(`${futureAgentUrl}/api/threads`);
    const headers = response.headers();
    
    expect(headers['access-control-allow-origin']).toBeDefined();
    expect(headers['access-control-allow-methods']).toBeDefined();
    expect(headers['access-control-allow-headers']).toBeDefined();
  });

  test('should respond within reasonable time', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.post(`${futureAgentUrl}/api/threads`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'free-key'
      },
      data: {
        query: 'cannabis',
        max_results: 3
      }
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(15000); // Should respond within 15 seconds
  });

  test('should return threads with relevant content', async ({ request }) => {
    const response = await request.post(`${futureAgentUrl}/api/threads`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'free-key'
      },
      data: {
        query: 'cannabis cultivation',
        max_results: 5
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    
    if (data.threads.length > 0) {
      // Check that threads contain relevant content
      const hasRelevantContent = data.threads.some(thread => 
        thread.title.toLowerCase().includes('cannabis') ||
        thread.content.toLowerCase().includes('cannabis') ||
        thread.title.toLowerCase().includes('cultivation') ||
        thread.content.toLowerCase().includes('cultivation')
      );
      expect(hasRelevantContent).toBe(true);
    }
  });
});