const { test, expect } = require('@playwright/test');

test.describe('Performance and Load Tests', () => {
  let freeApiKey;

  test.beforeAll(async ({ request }) => {
    // Get a free API key for testing
    const response = await request.post('/api/free-key', {
      data: { username: 'performance-test' }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    freeApiKey = data.apiKey;
  });

  test('should handle load with multiple concurrent users', async ({ request }) => {
    const concurrentUsers = 10;
    const requestsPerUser = 3;
    
    const userPromises = Array.from({ length: concurrentUsers }, (_, userIndex) => {
      return Array.from({ length: requestsPerUser }, (_, requestIndex) => {
        return request.post('/api/chat', {
          headers: { 'X-API-Key': freeApiKey },
          data: { 
            message: `Load test from user ${userIndex}, request ${requestIndex}`,
            plan: 'free'
          }
        });
      });
    });

    const startTime = Date.now();
    const allResponses = await Promise.all(userPromises.flat());
    const endTime = Date.now();
    
    const totalTime = endTime - startTime;
    const totalRequests = concurrentUsers * requestsPerUser;
    
    // Check that all requests succeeded
    const successfulRequests = allResponses.filter(r => r.status() === 200);
    expect(successfulRequests.length).toBe(totalRequests);
    
    // Check performance metrics
    const avgResponseTime = totalTime / totalRequests;
    expect(avgResponseTime).toBeLessThan(5000); // Average response time under 5 seconds
    
    console.log(`Load test: ${totalRequests} requests in ${totalTime}ms (avg: ${avgResponseTime.toFixed(2)}ms per request)`);
  });

  test('should maintain response times under load', async ({ request }) => {
    const responseTimes = [];
    const numRequests = 20;
    
    for (let i = 0; i < numRequests; i++) {
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
    
    // Calculate statistics
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];
    
    // Performance assertions
    expect(avgResponseTime).toBeLessThan(8000); // Average under 8 seconds
    expect(maxResponseTime).toBeLessThan(15000); // Max under 15 seconds
    expect(p95ResponseTime).toBeLessThan(12000); // 95th percentile under 12 seconds
    
    console.log(`Performance metrics:
      Average: ${avgResponseTime.toFixed(2)}ms
      Min: ${minResponseTime}ms
      Max: ${maxResponseTime}ms
      P95: ${p95ResponseTime}ms`);
  });

  test('should handle rate limiting gracefully', async ({ request }) => {
    // Make rapid requests to trigger rate limiting
    const rapidRequests = Array.from({ length: 20 }, (_, i) => {
      return request.post('/api/chat', {
        headers: { 'X-API-Key': freeApiKey },
        data: { 
          message: `Rate limit test ${i}`,
          plan: 'free'
        }
      });
    });

    const responses = await Promise.all(rapidRequests);
    
    // Some requests should be rate limited (429 status)
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    const successfulResponses = responses.filter(r => r.status() === 200);
    
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
    expect(successfulResponses.length).toBeGreaterThan(0);
    
    // Rate limited responses should have proper error message
    for (const response of rateLimitedResponses) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('rate limit');
    }
    
    console.log(`Rate limiting test: ${successfulResponses.length} successful, ${rateLimitedResponses.length} rate limited`);
  });

  test('should handle memory efficiently', async ({ request }) => {
    // Test with large messages to check memory handling
    const largeMessage = 'A'.repeat(10000); // 10KB message
    
    const startTime = Date.now();
    const response = await request.post('/api/chat', {
      headers: { 'X-API-Key': freeApiKey },
      data: { 
        message: largeMessage,
        plan: 'free'
      }
    });
    const endTime = Date.now();
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    
    // Large message should still respond reasonably quickly
    const responseTime = endTime - startTime;
    expect(responseTime).toBeLessThan(15000); // Under 15 seconds even for large input
    
    console.log(`Large message test: ${largeMessage.length} characters processed in ${responseTime}ms`);
  });

  test('should maintain consistency across multiple requests', async ({ request }) => {
    const testMessage = 'What is cannabis compliance?';
    const numRequests = 5;
    const responses = [];
    
    for (let i = 0; i < numRequests; i++) {
      const response = await request.post('/api/chat', {
        headers: { 'X-API-Key': freeApiKey },
        data: { 
          message: testMessage,
          plan: 'free'
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      responses.push(data);
    }
    
    // All responses should use the same agent
    const agents = responses.map(r => r.agent);
    const uniqueAgents = [...new Set(agents)];
    expect(uniqueAgents.length).toBe(1); // All should use same agent
    
    // All responses should have similar structure
    for (const response of responses) {
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('response');
      expect(response).toHaveProperty('agent');
      expect(response).toHaveProperty('plan');
      expect(response.success).toBe(true);
      expect(response.plan).toBe('free');
    }
    
    console.log(`Consistency test: All ${numRequests} requests used agent '${uniqueAgents[0]}'`);
  });

  test('should handle agent selection performance', async ({ request }) => {
    const testMessages = [
      'cannabis compliance requirements',
      'THC extraction methods',
      'cannabis marketing strategies',
      'growing techniques',
      'legal requirements'
    ];
    
    const responseTimes = [];
    
    for (const message of testMessages) {
      const startTime = Date.now();
      
      const response = await request.post('/api/chat', {
        headers: { 'X-API-Key': freeApiKey },
        data: { 
          message: message,
          plan: 'free'
        }
      });
      
      const endTime = Date.now();
      responseTimes.push(endTime - startTime);
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.agent).toBeDefined();
    }
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    expect(avgResponseTime).toBeLessThan(8000); // Agent selection should be fast
    
    console.log(`Agent selection test: Average response time ${avgResponseTime.toFixed(2)}ms across ${testMessages.length} different messages`);
  });

  test('should handle error recovery performance', async ({ request }) => {
    // Test error handling doesn't significantly impact performance
    const errorRequests = [
      { message: '', plan: 'free' }, // Empty message
      { message: 'test', plan: 'invalid' }, // Invalid plan
      { message: 'test' } // Missing plan
    ];
    
    const startTime = Date.now();
    
    for (const requestData of errorRequests) {
      const response = await request.post('/api/chat', {
        headers: { 'X-API-Key': freeApiKey },
        data: requestData
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(400); // Should be an error
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Error handling should be fast
    expect(totalTime).toBeLessThan(5000); // All error requests under 5 seconds
    
    // System should still work after errors
    const recoveryResponse = await request.post('/api/chat', {
      headers: { 'X-API-Key': freeApiKey },
      data: { 
        message: 'Recovery test',
        plan: 'free'
      }
    });
    
    expect(recoveryResponse.status()).toBe(200);
    const data = await recoveryResponse.json();
    expect(data.success).toBe(true);
    
    console.log(`Error recovery test: ${errorRequests.length} error requests handled in ${totalTime}ms`);
  });
});