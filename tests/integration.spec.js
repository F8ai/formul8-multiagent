const { test, expect } = require('@playwright/test');

test.describe('End-to-End Integration Tests', () => {
  let freeApiKey;

  test.beforeAll(async ({ request }) => {
    // Get a free API key for testing
    const response = await request.post('/api/free-key', {
      data: { username: 'integration-test' }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    freeApiKey = data.apiKey;
  });

  test('should complete full chat flow with agent selection', async ({ request }) => {
    const testMessages = [
      {
        message: 'I need help with cannabis compliance requirements in California',
        expectedAgent: 'compliance'
      },
      {
        message: 'How do I formulate a cannabis tincture with 20mg THC?',
        expectedAgent: 'formulation'
      },
      {
        message: 'What is the molecular structure of CBD?',
        expectedAgent: 'science'
      }
    ];

    for (const testCase of testMessages) {
      const response = await request.post('/api/chat', {
        headers: { 'X-API-Key': freeApiKey },
        data: { 
          message: testCase.message,
          plan: 'free'
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.agent).toBe(testCase.expectedAgent);
      expect(data.response).toBeDefined();
      expect(data.response.length).toBeGreaterThan(0);
    }
  });

  test('should handle plan-based agent access', async ({ request }) => {
    // Test free plan limitations
    const freePlanResponse = await request.post('/api/chat', {
      headers: { 'X-API-Key': freeApiKey },
      data: { 
        message: 'I need help with cannabis operations',
        plan: 'free'
      }
    });
    
    expect(freePlanResponse.status()).toBe(200);
    const freeData = await freePlanResponse.json();
    
    // Free plan should not have access to operations agent
    expect(freeData.agent).not.toBe('operations');
    expect(freeData.plan).toBe('free');
  });

  test('should integrate with future-agent for standard plan', async ({ request }) => {
    // This test would require a standard plan API key
    // For now, we'll test the structure
    const response = await request.post('/api/chat', {
      headers: { 'X-API-Key': freeApiKey },
      data: { 
        message: 'What are the latest cannabis cultivation techniques?',
        plan: 'free'
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.response).toBeDefined();
    
    // Check if response includes Future4200 content (if plan allows)
    // This would be more relevant for standard/enterprise plans
  });

  test('should handle concurrent requests', async ({ request }) => {
    const concurrentRequests = Array.from({ length: 5 }, (_, i) => 
      request.post('/api/chat', {
        headers: { 'X-API-Key': freeApiKey },
        data: { 
          message: `Concurrent test message ${i}`,
          plan: 'free'
        }
      })
    );

    const responses = await Promise.all(concurrentRequests);
    
    // All requests should succeed
    for (const response of responses) {
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    }
  });

  test('should maintain session state across requests', async ({ request }) => {
    const sessionId = `session-${Date.now()}`;
    
    // First request
    const response1 = await request.post('/api/chat', {
      headers: { 
        'X-API-Key': freeApiKey,
        'X-Session-ID': sessionId
      },
      data: { 
        message: 'What is cannabis compliance?',
        plan: 'free'
      }
    });
    
    expect(response1.status()).toBe(200);
    const data1 = await response1.json();
    expect(data1.success).toBe(true);
    
    // Follow-up request
    const response2 = await request.post('/api/chat', {
      headers: { 
        'X-API-Key': freeApiKey,
        'X-Session-ID': sessionId
      },
      data: { 
        message: 'What about in California specifically?',
        plan: 'free'
      }
    });
    
    expect(response2.status()).toBe(200);
    const data2 = await response2.json();
    expect(data2.success).toBe(true);
    
    // Both should use the same agent
    expect(data1.agent).toBe(data2.agent);
  });

  test('should handle error recovery gracefully', async ({ request }) => {
    // Test with malformed message
    const response = await request.post('/api/chat', {
      headers: { 'X-API-Key': freeApiKey },
      data: { 
        message: '', // Empty message
        plan: 'free'
      }
    });
    
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
    
    // System should still be functional after error
    const recoveryResponse = await request.post('/api/chat', {
      headers: { 'X-API-Key': freeApiKey },
      data: { 
        message: 'Test recovery',
        plan: 'free'
      }
    });
    
    expect(recoveryResponse.status()).toBe(200);
    const recoveryData = await recoveryResponse.json();
    expect(recoveryData.success).toBe(true);
  });

  test('should provide consistent response times', async ({ request }) => {
    const responseTimes = [];
    
    for (let i = 0; i < 3; i++) {
      const startTime = Date.now();
      
      const response = await request.post('/api/chat', {
        headers: { 'X-API-Key': freeApiKey },
        data: { 
          message: `Performance test ${i}`,
          plan: 'free'
        }
      });
      
      const endTime = Date.now();
      responseTimes.push(endTime - startTime);
      
      expect(response.status()).toBe(200);
    }
    
    // Check that response times are reasonable and consistent
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    expect(avgResponseTime).toBeLessThan(10000); // Less than 10 seconds average
    
    // Check that response times don't vary too much
    const maxTime = Math.max(...responseTimes);
    const minTime = Math.min(...responseTimes);
    expect(maxTime - minTime).toBeLessThan(5000); // Less than 5 second variance
  });

  test('should handle different message lengths', async ({ request }) => {
    const testMessages = [
      'Hi', // Very short
      'What is cannabis compliance?', // Medium
      'I need comprehensive information about cannabis cultivation, including legal requirements, best practices, equipment needed, and compliance with state and federal regulations in California.', // Long
    ];

    for (const message of testMessages) {
      const response = await request.post('/api/chat', {
        headers: { 'X-API-Key': freeApiKey },
        data: { 
          message: message,
          plan: 'free'
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.response).toBeDefined();
    }
  });

  test('should validate all required response fields', async ({ request }) => {
    const response = await request.post('/api/chat', {
      headers: { 'X-API-Key': freeApiKey },
      data: { 
        message: 'Comprehensive validation test',
        plan: 'free'
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    // Required fields
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('response');
    expect(data).toHaveProperty('agent');
    expect(data).toHaveProperty('plan');
    expect(data).toHaveProperty('tokens');
    expect(data).toHaveProperty('cost');
    expect(data).toHaveProperty('timestamp');
    
    // Field types
    expect(typeof data.success).toBe('boolean');
    expect(typeof data.response).toBe('string');
    expect(typeof data.agent).toBe('string');
    expect(typeof data.plan).toBe('string');
    expect(typeof data.tokens).toBe('object');
    expect(typeof data.cost).toBe('number');
    expect(typeof data.timestamp).toBe('string');
    
    // Token structure
    expect(data.tokens).toHaveProperty('total');
    expect(data.tokens).toHaveProperty('prompt');
    expect(data.tokens).toHaveProperty('completion');
    expect(typeof data.tokens.total).toBe('number');
    expect(typeof data.tokens.prompt).toBe('number');
    expect(typeof data.tokens.completion).toBe('number');
    
    // Cost validation
    expect(data.cost).toBeGreaterThan(0);
    expect(data.cost).toBeLessThan(1); // Should be reasonable cost
    
    // Timestamp validation
    const timestamp = new Date(data.timestamp);
    expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 60000); // Within last minute
  });
});