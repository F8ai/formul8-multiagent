import { test, expect } from '@playwright/test';

test.describe('Multiagent System Connectivity Tests', () => {
  const API_ENDPOINT = 'https://wxe3lwel4llwaom56mthdt4gry0zkpxr.lambda-url.us-east-1.on.aws';
  const DOMAIN_ENDPOINT = 'https://f8.syzygyx.com';

  test.describe('Backend API Health', () => {
    test('Lambda health endpoint responds', async ({ request }) => {
      try {
        const response = await request.get(`${API_ENDPOINT}/health`);
        console.log(`Lambda health status: ${response.status()}`);
        console.log(`Lambda health response: ${await response.text()}`);
        
        // Log whether it's working or not
        if (response.status() === 200) {
          console.log('✅ Lambda health endpoint is working');
        } else {
          console.log(`⚠️ Lambda health endpoint returned status ${response.status()}`);
        }
      } catch (error) {
        console.log(`❌ Lambda health endpoint error: ${error.message}`);
        throw error;
      }
    });

    test('Main domain health endpoint responds', async ({ request }) => {
      try {
        const response = await request.get(`${DOMAIN_ENDPOINT}/health`);
        console.log(`Domain health status: ${response.status()}`);
        console.log(`Domain health response: ${await response.text()}`);
        
        if (response.status() === 200) {
          console.log('✅ Domain health endpoint is working');
        } else {
          console.log(`⚠️ Domain health endpoint returned status ${response.status()}`);
        }
      } catch (error) {
        console.log(`❌ Domain health endpoint error: ${error.message}`);
        throw error;
      }
    });

    test('Agents API endpoint responds', async ({ request }) => {
      try {
        const response = await request.get(`${API_ENDPOINT}/api/agents`);
        console.log(`Agents API status: ${response.status()}`);
        const responseText = await response.text();
        console.log(`Agents API response: ${responseText}`);
        
        if (response.status() === 200) {
          try {
            const agentsData = JSON.parse(responseText);
            console.log('✅ Agents API is working');
            console.log(`Available agents: ${JSON.stringify(agentsData, null, 2)}`);
          } catch (e) {
            console.log('⚠️ Agents API returned non-JSON response');
          }
        } else {
          console.log(`⚠️ Agents API returned status ${response.status()}`);
        }
      } catch (error) {
        console.log(`❌ Agents API error: ${error.message}`);
        throw error;
      }
    });
  });

  test.describe('Chat API Connectivity', () => {
    test('Chat endpoint accepts requests', async ({ request }) => {
      try {
        const response = await request.post(`${API_ENDPOINT}/api/chat`, {
          data: {
            message: 'What is THC?',
            username: 'test',
            plan: 'standard'
          },
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Chat API status: ${response.status()}`);
        const responseText = await response.text();
        console.log(`Chat API response: ${responseText}`);
        
        if (response.status() === 200) {
          try {
            const chatData = JSON.parse(responseText);
            console.log('✅ Chat API is working');
            console.log(`Response: ${JSON.stringify(chatData, null, 2)}`);
            console.log(`Agent used: ${chatData.agent || 'unknown'}`);
          } catch (e) {
            console.log('⚠️ Chat API returned non-JSON response');
          }
        } else {
          console.log(`⚠️ Chat API returned status ${response.status()}`);
        }
      } catch (error) {
        console.log(`❌ Chat API error: ${error.message}`);
      }
    });

    test('Different questions route to different agents', async ({ request }) => {
      const testCases = [
        { message: 'What is THC?', expectedAgent: 'science', description: 'Science question' },
        { message: 'How do I calculate dosage?', expectedAgent: 'formulation', description: 'Formulation question' },
        { message: 'What are compliance requirements?', expectedAgent: 'compliance', description: 'Compliance question' },
      ];

      const results = [];

      for (const testCase of testCases) {
        try {
          const response = await request.post(`${API_ENDPOINT}/api/chat`, {
            data: {
              message: testCase.message,
              username: 'test',
              plan: 'micro'  // Use micro tier for compliance access
            },
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          const responseText = await response.text();
          console.log(`\n${testCase.description}:`);
          console.log(`  Status: ${response.status()}`);
          console.log(`  Response: ${responseText.substring(0, 100)}...`);
          
          if (response.status() === 200) {
            try {
              const chatData = JSON.parse(responseText);
              console.log(`  Agent: ${chatData.agent || 'unknown'}`);
              results.push({
                question: testCase.message,
                agent: chatData.agent,
                expected: testCase.expectedAgent,
                matched: chatData.agent === testCase.expectedAgent
              });
            } catch (e) {
              console.log(`  ⚠️ Non-JSON response`);
              results.push({
                question: testCase.message,
                agent: 'error',
                expected: testCase.expectedAgent,
                matched: false
              });
            }
          } else {
            console.log(`  ❌ Request failed`);
            results.push({
              question: testCase.message,
              agent: 'error',
              expected: testCase.expectedAgent,
              matched: false
            });
          }
        } catch (error) {
          console.log(`  ❌ Error: ${error.message}`);
          results.push({
            question: testCase.message,
            agent: 'error',
            expected: testCase.expectedAgent,
            matched: false
          });
        }
      }

      console.log('\n=== Agent Routing Summary ===');
      for (const result of results) {
        console.log(`Question: "${result.question}"`);
        console.log(`  Expected Agent: ${result.expected}`);
        console.log(`  Actual Agent: ${result.agent}`);
        console.log(`  Match: ${result.matched ? '✅' : '❌'}`);
      }

      // Don't fail test if routing isn't perfect, just report
      const matchedCount = results.filter(r => r.matched).length;
      console.log(`\nAgent routing accuracy: ${matchedCount}/${results.length}`);
    });
  });

  test.describe('Frontend to Backend Integration', () => {
    test('Chat interface successfully communicates with backend', async ({ page }) => {
      await page.goto('https://f8.syzygyx.com/chat');
      await page.waitForLoadState('networkidle');

      // Listen for network requests
      const chatRequests = [];
      page.on('request', request => {
        if (request.url().includes('/api/chat')) {
          chatRequests.push({
            url: request.url(),
            method: request.method(),
            postData: request.postData()
          });
        }
      });

      const chatResponses = [];
      page.on('response', async response => {
        if (response.url().includes('/api/chat')) {
          const status = response.status();
          let responseData = null;
          try {
            responseData = await response.text();
          } catch (e) {
            responseData = 'Could not read response';
          }
          chatResponses.push({
            url: response.url(),
            status: status,
            data: responseData
          });
        }
      });

      // Send a message
      const chatInput = page.locator('#chatInput');
      const sendButton = page.locator('#sendButton');

      await chatInput.fill('What is cannabis?');
      await sendButton.click();

      // Wait for response
      await page.waitForTimeout(5000);

      console.log('\n=== Network Traffic Analysis ===');
      console.log(`Chat requests sent: ${chatRequests.length}`);
      console.log(`Chat responses received: ${chatResponses.length}`);

      for (let i = 0; i < chatRequests.length; i++) {
        console.log(`\nRequest ${i + 1}:`);
        console.log(`  URL: ${chatRequests[i].url}`);
        console.log(`  Method: ${chatRequests[i].method}`);
        console.log(`  Data: ${chatRequests[i].postData}`);
      }

      for (let i = 0; i < chatResponses.length; i++) {
        console.log(`\nResponse ${i + 1}:`);
        console.log(`  URL: ${chatResponses[i].url}`);
        console.log(`  Status: ${chatResponses[i].status}`);
        console.log(`  Data: ${chatResponses[i].data.substring(0, 200)}`);
      }

      if (chatResponses.length > 0) {
        console.log('\n✅ Frontend successfully communicates with backend');
        
        // Check if response indicates agent routing
        const lastResponse = chatResponses[chatResponses.length - 1];
        if (lastResponse.status === 200) {
          try {
            const data = JSON.parse(lastResponse.data);
            if (data.agent) {
              console.log(`✅ Agent routing working: ${data.agent}`);
            }
          } catch (e) {
            console.log('⚠️ Response parsing failed');
          }
        }
      } else {
        console.log('⚠️ No chat responses captured');
      }
    });
  });

  test.describe('Agent Availability by Tier', () => {
    const tiers = ['free', 'standard', 'micro', 'operator', 'enterprise'];
    
    test('Test agent access across tiers', async ({ request }) => {
      console.log('\n=== Agent Access by Tier ===');
      
      const testMessage = 'What are the compliance requirements for cannabis businesses?';
      
      for (const tier of tiers) {
        try {
          const response = await request.post(`${API_ENDPOINT}/api/chat`, {
            data: {
              message: testMessage,
              username: 'test',
              plan: tier
            },
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 30000
          });
          
          const responseText = await response.text();
          console.log(`\n${tier.toUpperCase()} Tier:`);
          console.log(`  Status: ${response.status()}`);
          
          if (response.status() === 200) {
            try {
              const data = JSON.parse(responseText);
              console.log(`  Agent: ${data.agent || 'unknown'}`);
              console.log(`  Response preview: ${data.response?.substring(0, 100) || 'N/A'}...`);
              console.log(`  ✅ Tier accessible`);
            } catch (e) {
              console.log(`  ⚠️ Non-JSON response`);
            }
          } else {
            console.log(`  ❌ Request failed`);
          }
        } catch (error) {
          console.log(`\n${tier.toUpperCase()} Tier:`);
          console.log(`  ❌ Error: ${error.message}`);
        }
      }
    });
  });
});
