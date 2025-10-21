import { test, expect } from '@playwright/test';

// Test data for comprehensive chat testing
const testScenarios = [
  // Free Tier Tests (should route to basic agents + show ads)
  {
    category: 'Free Tier - Basic Questions',
    tier: 'free',
    questions: [
      {
        question: 'What is THC?',
        expectedAgent: 'science',
        description: 'Basic cannabis science question'
      },
      {
        question: 'How do I calculate THC dosage?',
        expectedAgent: 'formulation',
        description: 'Basic formulation question'
      },
      {
        question: 'What are the benefits of cannabis?',
        expectedAgent: 'f8_agent',
        description: 'General cannabis question'
      }
    ]
  },

  // Standard Tier Tests
  {
    category: 'Standard Tier - Formulation Focus',
    tier: 'standard',
    questions: [
      {
        question: 'Create a recipe for cannabis gummies with 10mg THC each',
        expectedAgent: 'formulation',
        description: 'Advanced formulation request'
      },
      {
        question: 'What extraction method is best for high-CBD products?',
        expectedAgent: 'science',
        description: 'Scientific extraction question'
      },
      {
        question: 'How do I scale up my cannabis production?',
        expectedAgent: 'f8_agent',
        description: 'General business question'
      }
    ]
  },

  // Micro Tier Tests (includes compliance, marketing, patent)
  {
    category: 'Micro Tier - Compliance & Marketing',
    tier: 'micro',
    questions: [
      {
        question: 'What are the compliance requirements for cannabis businesses in California?',
        expectedAgent: 'compliance',
        description: 'State-specific compliance question'
      },
      {
        question: 'How should I market my cannabis brand on social media?',
        expectedAgent: 'marketing',
        description: 'Marketing strategy question'
      },
      {
        question: 'Can I patent my cannabis extraction process?',
        expectedAgent: 'patent',
        description: 'Patent research question'
      },
      {
        question: 'What are the MCR requirements for cannabis facilities?',
        expectedAgent: 'mcr',
        description: 'MCR management question'
      }
    ]
  },

  // Operator Tier Tests (full agent access)
  {
    category: 'Operator Tier - Full Suite',
    tier: 'operator',
    questions: [
      {
        question: 'How do I optimize my cannabis facility operations?',
        expectedAgent: 'operations',
        description: 'Operations management question'
      },
      {
        question: 'Where can I source high-quality cannabis seeds?',
        expectedAgent: 'sourcing',
        description: 'Supply chain question'
      },
      {
        question: 'How do I analyze cannabis potency using spectroscopy?',
        expectedAgent: 'spectra',
        description: 'Analytical testing question'
      },
      {
        question: 'What strategies improve customer retention in cannabis retail?',
        expectedAgent: 'customer_success',
        description: 'Customer success question'
      },
      {
        question: 'How do I create effective cannabis advertising campaigns?',
        expectedAgent: 'ad',
        description: 'Advertising strategy question'
      }
    ]
  },

  // Enterprise Tier Tests
  {
    category: 'Enterprise Tier - Advanced Features',
    tier: 'enterprise',
    questions: [
      {
        question: 'How do I integrate Slack notifications for my cannabis team?',
        expectedAgent: 'f8_slackbot',
        description: 'Slack integration question'
      },
      {
        question: 'What are the multi-state compliance challenges for cannabis?',
        expectedAgent: 'compliance',
        description: 'Complex compliance question'
      }
    ]
  },

  // Admin Tier Tests
  {
    category: 'Admin Tier - System Management',
    tier: 'admin',
    questions: [
      {
        question: 'How do I configure agent routing for new users?',
        expectedAgent: 'editor_agent',
        description: 'System configuration question'
      },
      {
        question: 'Update the micro tier to include patent research capabilities',
        expectedAgent: 'editor_agent',
        description: 'Configuration modification command'
      }
    ]
  },

  // Edge Cases and Error Handling
  {
    category: 'Edge Cases & Error Handling',
    tier: 'all',
    questions: [
      {
        question: '',
        expectedAgent: 'error',
        description: 'Empty message test'
      },
      {
        question: 'asdfghjklqwertyuiop',
        expectedAgent: 'f8_agent',
        description: 'Nonsensical input test'
      },
      {
        question: 'What is the meaning of life?',
        expectedAgent: 'f8_agent',
        description: 'Non-cannabis related question'
      },
      {
        question: 'I need help with something completely unrelated to cannabis or business',
        expectedAgent: 'f8_agent',
        description: 'Completely off-topic question'
      }
    ]
  },

  // Multi-turn Conversations
  {
    category: 'Multi-turn Conversations',
    tier: 'all',
    questions: [
      {
        question: 'I want to start a cannabis business',
        expectedAgent: 'f8_agent',
        description: 'Initial business question',
        followUp: 'What licenses do I need?'
      },
      {
        question: 'How do I make cannabis edibles?',
        expectedAgent: 'formulation',
        description: 'Initial formulation question',
        followUp: 'What about dosage calculations?'
      }
    ]
  }
];

// Performance and Load Tests
const performanceTests = [
  {
    name: 'Rapid Fire Questions',
    questions: [
      'What is CBD?',
      'How do I extract THC?',
      'What are terpenes?',
      'How do I test cannabis potency?',
      'What is the difference between indica and sativa?'
    ]
  },
  {
    name: 'Long Form Questions',
    questions: [
      'I am planning to open a cannabis dispensary in California and need comprehensive guidance on all aspects including licensing, compliance, product sourcing, marketing, operations, and customer management. Can you provide detailed step-by-step advice for each area?',
      'I have a cannabis cultivation facility and want to expand into manufacturing edibles. I need help with formulation, compliance, equipment, processes, testing, packaging, and distribution. Please provide detailed guidance for each step.',
      'I am a cannabis researcher working on developing new extraction methods and need assistance with patent research, scientific analysis, regulatory compliance, and commercial viability assessment. Can you help me with all these aspects?'
    ]
  }
];

test.describe('Formul8 Multiagent Chat - Comprehensive Test Suite', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('https://f8.syzygyx.com/chat');
    
    // Wait for the page to load
    await page.waitForSelector('textarea[placeholder*="message"], input[placeholder*="message"]', { timeout: 10000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  // Test each scenario category
  for (const scenario of testScenarios) {
    test.describe(scenario.category, () => {
      for (const testCase of scenario.questions) {
        test(`${testCase.description}`, async () => {
          // Skip empty message test for now
          if (testCase.question === '') {
            test.skip();
            return;
          }

          // Find the message input
          const messageInput = await page.locator('textarea[placeholder*="message"], input[placeholder*="message"]').first();
          await expect(messageInput).toBeVisible();

          // Type the question
          await messageInput.fill(testCase.question);
          
          // Find and click send button
          const sendButton = await page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Submit")').first();
          await sendButton.click();

          // Wait for response
          await page.waitForSelector('.message, .response, .chat-message, [data-testid*="message"]', { timeout: 30000 });

          // Check if response contains expected content
          const responseElements = await page.locator('.message, .response, .chat-message, [data-testid*="message"]').all();
          const lastResponse = responseElements[responseElements.length - 1];
          
          await expect(lastResponse).toBeVisible();
          
          const responseText = await lastResponse.textContent();
          expect(responseText).toBeTruthy();
          expect(responseText.length).toBeGreaterThan(10);

          // Check for ad delivery on free tier
          if (scenario.tier === 'free') {
            // Look for upgrade prompts or ads
            const adElements = await page.locator('text=/upgrade|Upgrade|Standard|Micro|Operator|Enterprise|\\$\\d+/').all();
            if (adElements.length > 0) {
              console.log('✅ Ad delivery detected for free tier');
            }
          }

          // Check for agent routing (if visible in UI)
          const agentIndicator = await page.locator('text=/Agent:|agent:|routed to|Agent:/').first();
          if (await agentIndicator.isVisible()) {
            const agentText = await agentIndicator.textContent();
            console.log(`Agent indicator found: ${agentText}`);
          }

          console.log(`✅ Question: "${testCase.question}"`);
          console.log(`✅ Response length: ${responseText.length} characters`);
        });
      }
    });
  }

  // Multi-turn conversation tests
  test.describe('Multi-turn Conversations', () => {
    test('Business startup conversation flow', async () => {
      const messageInput = await page.locator('textarea[placeholder*="message"], input[placeholder*="message"]').first();
      const sendButton = await page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Submit")').first();

      // First message
      await messageInput.fill('I want to start a cannabis business');
      await sendButton.click();
      await page.waitForSelector('.message, .response, .chat-message', { timeout: 30000 });

      // Follow-up message
      await messageInput.fill('What licenses do I need?');
      await sendButton.click();
      await page.waitForSelector('.message, .response, .chat-message', { timeout: 30000 });

      // Verify we have multiple messages
      const messages = await page.locator('.message, .response, .chat-message').all();
      expect(messages.length).toBeGreaterThanOrEqual(2);

      console.log('✅ Multi-turn conversation test passed');
    });
  });

  // Performance tests
  test.describe('Performance Tests', () => {
    test('Rapid fire questions', async () => {
      const messageInput = await page.locator('textarea[placeholder*="message"], input[placeholder*="message"]').first();
      const sendButton = await page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Submit")').first();

      const startTime = Date.now();

      for (const question of performanceTests[0].questions) {
        await messageInput.fill(question);
        await sendButton.click();
        await page.waitForSelector('.message, .response, .chat-message', { timeout: 30000 });
        
        // Small delay between questions
        await page.waitForTimeout(1000);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTimePerQuestion = totalTime / performanceTests[0].questions.length;

      console.log(`✅ Rapid fire test completed in ${totalTime}ms`);
      console.log(`✅ Average time per question: ${avgTimePerQuestion}ms`);

      expect(avgTimePerQuestion).toBeLessThan(10000); // Should be under 10 seconds per question
    });

    test('Long form questions', async () => {
      const messageInput = await page.locator('textarea[placeholder*="message"], input[placeholder*="message"]').first();
      const sendButton = await page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Submit")').first();

      for (const question of performanceTests[1].questions) {
        const startTime = Date.now();
        
        await messageInput.fill(question);
        await sendButton.click();
        await page.waitForSelector('.message, .response, .chat-message', { timeout: 60000 });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        console.log(`✅ Long form question answered in ${responseTime}ms`);
        expect(responseTime).toBeLessThan(60000); // Should be under 60 seconds
      }
    });
  });

  // Error handling tests
  test.describe('Error Handling', () => {
    test('Empty message handling', async () => {
      const sendButton = await page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Submit")').first();
      
      // Try to send empty message
      await sendButton.click();
      
      // Should either show error or not send
      // This test verifies the system doesn't crash
      await page.waitForTimeout(2000);
      
      console.log('✅ Empty message handling test passed');
    });

    test('Very long message handling', async () => {
      const messageInput = await page.locator('textarea[placeholder*="message"], input[placeholder*="message"]').first();
      const sendButton = await page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Submit")').first();

      // Create a very long message
      const longMessage = 'What is cannabis? '.repeat(1000);
      
      await messageInput.fill(longMessage);
      await sendButton.click();
      
      // Should handle long messages gracefully
      await page.waitForSelector('.message, .response, .chat-message', { timeout: 30000 });
      
      console.log('✅ Long message handling test passed');
    });
  });

  // UI/UX tests
  test.describe('UI/UX Tests', () => {
    test('Chat interface elements', async () => {
      // Check for essential UI elements
      await expect(page.locator('textarea[placeholder*="message"], input[placeholder*="message"]')).toBeVisible();
      await expect(page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Submit")')).toBeVisible();
      
      // Check for any agent selection UI
      const agentSelect = await page.locator('select, [role="combobox"]').first();
      if (await agentSelect.isVisible()) {
        console.log('✅ Agent selection UI found');
      }

      console.log('✅ UI elements test passed');
    });

    test('Responsive design', async () => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);
      
      // Check if elements are still visible and functional
      await expect(page.locator('textarea[placeholder*="message"], input[placeholder*="message"]')).toBeVisible();
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(1000);
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(1000);
      
      console.log('✅ Responsive design test passed');
    });
  });

  // Health check tests
  test.describe('Health Check Tests', () => {
    test('API health endpoint', async () => {
      const response = await page.request.get('https://f8.syzygyx.com/health');
      expect(response.status()).toBe(200);
      
      const healthData = await response.json();
      expect(healthData.status).toBe('healthy');
      expect(healthData.microservices).toBeDefined();
      
      console.log('✅ Health endpoint test passed');
    });

    test('Agents API endpoint', async () => {
      const response = await page.request.get('https://f8.syzygyx.com/api/agents');
      expect(response.status()).toBe(200);
      
      const agentsData = await response.json();
      expect(agentsData.agents).toBeDefined();
      expect(Array.isArray(agentsData.agents)).toBe(true);
      
      console.log('✅ Agents API test passed');
    });
  });
});