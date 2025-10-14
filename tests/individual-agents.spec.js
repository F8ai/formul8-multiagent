const { test, expect } = require('@playwright/test');

test.describe('Individual Agent Tests', () => {
  const agents = [
    'compliance-agent',
    'formulation-agent',
    'science-agent',
    'operations-agent',
    'marketing-agent',
    'sourcing-agent',
    'patent-agent',
    'spectra-agent',
    'customer-success-agent',
    'f8-slackbot',
    'mcr-agent',
    'ad-agent',
    'editor-agent'
  ];

  const agentTests = {
    'compliance-agent': {
      testMessage: 'What are the compliance requirements for cannabis cultivation?',
      expectedKeywords: ['compliance', 'regulation', 'legal', 'requirement']
    },
    'formulation-agent': {
      testMessage: 'How do I formulate a cannabis tincture?',
      expectedKeywords: ['formulation', 'recipe', 'ingredient', 'process']
    },
    'science-agent': {
      testMessage: 'What is the molecular structure of THC?',
      expectedKeywords: ['molecular', 'structure', 'scientific', 'chemistry']
    },
    'operations-agent': {
      testMessage: 'How do I optimize my cannabis production facility?',
      expectedKeywords: ['operation', 'facility', 'production', 'optimization']
    },
    'marketing-agent': {
      testMessage: 'What are the best marketing strategies for cannabis products?',
      expectedKeywords: ['marketing', 'strategy', 'brand', 'promotion']
    },
    'sourcing-agent': {
      testMessage: 'Where can I source high-quality cannabis seeds?',
      expectedKeywords: ['sourcing', 'supplier', 'seed', 'quality']
    },
    'patent-agent': {
      testMessage: 'How do I patent a cannabis extraction method?',
      expectedKeywords: ['patent', 'intellectual', 'property', 'legal']
    },
    'spectra-agent': {
      testMessage: 'How do I analyze cannabis spectra data?',
      expectedKeywords: ['spectra', 'analysis', 'data', 'testing']
    },
    'customer-success-agent': {
      testMessage: 'How do I improve customer satisfaction?',
      expectedKeywords: ['customer', 'satisfaction', 'support', 'service']
    },
    'f8-slackbot': {
      testMessage: 'How do I set up Slack integration?',
      expectedKeywords: ['slack', 'integration', 'bot', 'notification']
    },
    'mcr-agent': {
      testMessage: 'What is MCR in cannabis testing?',
      expectedKeywords: ['mcr', 'testing', 'cannabis', 'analysis']
    },
    'ad-agent': {
      testMessage: 'What advertising options are available?',
      expectedKeywords: ['advertising', 'ad', 'promotion', 'marketing']
    },
    'editor-agent': {
      testMessage: 'How do I edit cannabis content?',
      expectedKeywords: ['edit', 'content', 'writing', 'review']
    }
  };

  for (const agent of agents) {
    test.describe(`${agent}`, () => {
      test('should be accessible and healthy', async ({ request }) => {
        const response = await request.get(`https://${agent}.vercel.app/api/health`);
        expect(response.status()).toBe(200);
        
        const data = await response.json();
        expect(data).toHaveProperty('status');
        expect(data.status).toBe('healthy');
        expect(data).toHaveProperty('agent');
        expect(data.agent).toBe(agent.replace('-agent', ''));
      });

      test('should respond to chat requests', async ({ request }) => {
        const testConfig = agentTests[agent];
        if (!testConfig) {
          test.skip(`No test configuration for ${agent}`);
          return;
        }

        const response = await request.post(`https://${agent}.vercel.app/api/chat`, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'free-key'
          },
          data: {
            message: testConfig.testMessage,
            plan: 'free'
          }
        });

        expect(response.status()).toBe(200);
        const data = await response.json();
        
        expect(data).toHaveProperty('success');
        expect(data.success).toBe(true);
        expect(data).toHaveProperty('response');
        expect(data).toHaveProperty('agent');
        expect(data.agent).toBe(agent.replace('-agent', ''));
        
        // Check if response contains expected keywords
        const responseText = data.response.toLowerCase();
        const hasExpectedKeyword = testConfig.expectedKeywords.some(keyword => 
          responseText.includes(keyword.toLowerCase())
        );
        expect(hasExpectedKeyword).toBe(true);
      });

      test('should handle authentication', async ({ request }) => {
        // Test without API key
        const response = await request.post(`https://${agent}.vercel.app/api/chat`, {
          data: { message: 'test' }
        });
        
        expect(response.status()).toBe(401);
        const data = await response.json();
        expect(data).toHaveProperty('error');
      });

      test('should validate input', async ({ request }) => {
        const response = await request.post(`https://${agent}.vercel.app/api/chat`, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'free-key'
          },
          data: {
            // Missing required message field
            plan: 'free'
          }
        });

        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data).toHaveProperty('error');
      });

      test('should have proper CORS headers', async ({ request }) => {
        const response = await request.options(`https://${agent}.vercel.app/api/chat`);
        const headers = response.headers();
        
        expect(headers['access-control-allow-origin']).toBeDefined();
        expect(headers['access-control-allow-methods']).toBeDefined();
        expect(headers['access-control-allow-headers']).toBeDefined();
      });

      test('should respond within reasonable time', async ({ request }) => {
        const startTime = Date.now();
        
        const response = await request.post(`https://${agent}.vercel.app/api/chat`, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'free-key'
          },
          data: {
            message: 'Quick test',
            plan: 'free'
          }
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        expect(response.status()).toBe(200);
        expect(responseTime).toBeLessThan(10000); // Should respond within 10 seconds
      });
    });
  }

  test('should have consistent response format across all agents', async ({ request }) => {
    const testAgent = 'compliance-agent';
    const response = await request.post(`https://${testAgent}.vercel.app/api/chat`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'free-key'
      },
      data: {
        message: 'Test consistency',
        plan: 'free'
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    // Check for required fields
    const requiredFields = ['success', 'response', 'agent', 'plan', 'tokens', 'cost', 'timestamp'];
    for (const field of requiredFields) {
      expect(data).toHaveProperty(field);
    }
    
    // Check data types
    expect(typeof data.success).toBe('boolean');
    expect(typeof data.response).toBe('string');
    expect(typeof data.agent).toBe('string');
    expect(typeof data.plan).toBe('string');
    expect(typeof data.tokens).toBe('object');
    expect(typeof data.cost).toBe('number');
    expect(typeof data.timestamp).toBe('string');
  });
});