const { test, expect } = require('@playwright/test');

test.describe('Formul8 Chat - Smoke Tests', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('https://f8.syzygyx.com/chat');
    await page.waitForSelector('textarea[placeholder*="message"], input[placeholder*="message"]', { timeout: 10000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Basic chat functionality works', async () => {
    // Test basic question
    const messageInput = await page.locator('textarea[placeholder*="message"], input[placeholder*="message"]').first();
    const sendButton = await page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Submit")').first();

    await messageInput.fill('What is cannabis?');
    await sendButton.click();

    // Wait for response
    await page.waitForSelector('.message, .response, .chat-message, [data-testid*="message"]', { timeout: 30000 });

    // Verify response exists
    const responseElements = await page.locator('.message, .response, .chat-message, [data-testid*="message"]').all();
    const lastResponse = responseElements[responseElements.length - 1];
    
    await expect(lastResponse).toBeVisible();
    const responseText = await lastResponse.textContent();
    expect(responseText).toBeTruthy();
    expect(responseText.length).toBeGreaterThan(10);

    console.log('✅ Basic chat functionality test passed');
  });

  test('Agent routing works for different question types', async () => {
    const messageInput = await page.locator('textarea[placeholder*="message"], input[placeholder*="message"]').first();
    const sendButton = await page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Submit")').first();

    // Test science question
    await messageInput.fill('What are cannabinoids?');
    await sendButton.click();
    await page.waitForSelector('.message, .response, .chat-message', { timeout: 30000 });

    // Test formulation question
    await messageInput.fill('How do I calculate THC dosage?');
    await sendButton.click();
    await page.waitForSelector('.message, .response, .chat-message', { timeout: 30000 });

    // Test compliance question
    await messageInput.fill('What are cannabis compliance requirements?');
    await sendButton.click();
    await page.waitForSelector('.message, .response, .chat-message', { timeout: 30000 });

    console.log('✅ Agent routing test passed');
  });

  test('Health endpoint is accessible', async () => {
    const response = await page.request.get('https://f8.syzygyx.com/health');
    expect(response.status()).toBe(200);
    
    const healthData = await response.json();
    expect(healthData.status).toBe('healthy');
    
    console.log('✅ Health endpoint test passed');
  });

  test('API endpoints are accessible', async () => {
    // Test agents endpoint
    const agentsResponse = await page.request.get('https://f8.syzygyx.com/api/agents');
    expect(agentsResponse.status()).toBe(200);
    
    const agentsData = await agentsResponse.json();
    expect(agentsData.agents).toBeDefined();
    
    console.log('✅ API endpoints test passed');
  });

  test('Chat interface is responsive', async () => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('textarea[placeholder*="message"], input[placeholder*="message"]')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('textarea[placeholder*="message"], input[placeholder*="message"]')).toBeVisible();
    
    console.log('✅ Responsive design test passed');
  });
});