const { test, expect } = require('@playwright/test');

test.describe('Main Agent API Tests', () => {
  let freeApiKey;

  test.beforeAll(async ({ request }) => {
    // Get a free API key for testing
    const response = await request.post('/api/free-key', {
      data: { username: 'test-user' }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    freeApiKey = data.apiKey;
    expect(freeApiKey).toBeDefined();
  });

  test('should generate free API key', async ({ request }) => {
    const response = await request.post('/api/free-key', {
      data: { username: 'playwright-test' }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data).toHaveProperty('apiKey');
    expect(data).toHaveProperty('username');
    expect(data).toHaveProperty('plan');
    expect(data.plan).toBe('free');
    expect(data.apiKey).toMatch(/^f8_free_/);
  });

  test('should reject requests without API key', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: { message: 'test message' }
    });
    
    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('API key required');
  });

  test('should reject invalid API key', async ({ request }) => {
    const response = await request.post('/api/chat', {
      headers: { 'X-API-Key': 'invalid-key' },
      data: { message: 'test message' }
    });
    
    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should handle chat with free API key', async ({ request }) => {
    const response = await request.post('/api/chat', {
      headers: { 'X-API-Key': freeApiKey },
      data: { 
        message: 'What is cannabis compliance?',
        plan: 'free'
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('response');
    expect(data).toHaveProperty('agent');
    expect(data).toHaveProperty('plan');
    expect(data.plan).toBe('free');
    expect(data.response).toContain('compliance');
  });

  test('should select appropriate agent based on message', async ({ request }) => {
    const testCases = [
      { message: 'How do I formulate a cannabis product?', expectedAgent: 'formulation' },
      { message: 'What are the scientific properties of THC?', expectedAgent: 'science' },
      { message: 'Help with compliance requirements', expectedAgent: 'compliance' }
    ];

    for (const testCase of testCases) {
      const response = await request.post('/api/chat', {
        headers: { 'X-API-Key': freeApiKey },
        data: { 
          message: testCase.message,
          plan: 'free'
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.agent).toBe(testCase.expectedAgent);
    }
  });

  test('should enforce rate limiting', async ({ request }) => {
    // Make multiple rapid requests to test rate limiting
    const promises = [];
    for (let i = 0; i < 15; i++) {
      promises.push(
        request.post('/api/chat', {
          headers: { 'X-API-Key': freeApiKey },
          data: { 
            message: `Rate limit test ${i}`,
            plan: 'free'
          }
        })
      );
    }

    const responses = await Promise.all(promises);
    
    // Some requests should be rate limited
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  test('should handle malformed requests gracefully', async ({ request }) => {
    const response = await request.post('/api/chat', {
      headers: { 'X-API-Key': freeApiKey },
      data: { 
        // Missing required fields
        plan: 'free'
      }
    });
    
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should sanitize user input', async ({ request }) => {
    const maliciousInput = '<script>alert("xss")</script>What is cannabis?';
    
    const response = await request.post('/api/chat', {
      headers: { 'X-API-Key': freeApiKey },
      data: { 
        message: maliciousInput,
        plan: 'free'
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    // Response should not contain the script tag
    expect(data.response).not.toContain('<script>');
    expect(data.response).not.toContain('alert("xss")');
  });

  test('should return proper response structure', async ({ request }) => {
    const response = await request.post('/api/chat', {
      headers: { 'X-API-Key': freeApiKey },
      data: { 
        message: 'Test message',
        plan: 'free'
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    // Check response structure
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('response');
    expect(data).toHaveProperty('agent');
    expect(data).toHaveProperty('plan');
    expect(data).toHaveProperty('tokens');
    expect(data).toHaveProperty('cost');
    expect(data).toHaveProperty('timestamp');
    
    // Check token structure
    expect(data.tokens).toHaveProperty('total');
    expect(data.tokens).toHaveProperty('prompt');
    expect(data.tokens).toHaveProperty('completion');
    
    // Check cost structure
    expect(typeof data.cost).toBe('number');
    expect(data.cost).toBeGreaterThan(0);
  });
});