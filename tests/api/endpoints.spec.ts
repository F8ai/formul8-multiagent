import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  const baseURL = 'http://localhost:3001';

  test('GET /health should return service health status', async ({ request }) => {
    const response = await request.get(`${baseURL}/health`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('service', 'Formul8 Multiagent Chat');
  });

  test('GET /api/agents should return available agents', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/agents`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('agents');
  });

  test('POST /api/chat should handle chat messages', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/chat`, {
      data: {
        message: 'Test chat message',
        user_id: 'test-user'
      }
    });
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('response');
  });
});
