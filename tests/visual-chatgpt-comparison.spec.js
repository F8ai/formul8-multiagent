const { test, expect } = require('@playwright/test');

test.describe('Visual ChatGPT Comparison Tests', () => {
  let freeApiKey;

  test.beforeAll(async ({ request }) => {
    // Get a free API key for testing
    const response = await request.post('/api/free-key', {
      data: { username: 'visual-comparison-test' }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    freeApiKey = data.apiKey;
  });

  test('should match ChatGPT layout structure', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'test-results/chatgpt-layout-comparison.png',
      fullPage: true 
    });
    
    // Verify key layout elements
    const layoutElements = {
      header: page.locator('.header'),
      logo: page.locator('.logo'),
      status: page.locator('.status'),
      chatContainer: page.locator('.chat-container'),
      chatMessages: page.locator('.chat-messages'),
      chatInput: page.locator('.chat-input'),
      sendButton: page.locator('#send-button')
    };
    
    for (const [name, element] of Object.entries(layoutElements)) {
      await expect(element).toBeVisible();
      console.log(`✅ ${name} element is visible`);
    }
  });

  test('should match ChatGPT message styling', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Send a test message
    await page.fill('#chat-input', 'Test message for styling comparison');
    await page.click('#send-button');
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    
    // Take screenshot of messages
    await page.screenshot({ 
      path: 'test-results/chatgpt-message-styling.png',
      clip: { x: 0, y: 0, width: 800, height: 600 }
    });
    
    // Verify message styling matches ChatGPT
    const userMessage = page.locator('.message.user .message-content');
    const assistantMessage = page.locator('.message.assistant .message-content');
    
    // Check user message styling
    await expect(userMessage).toHaveCSS('border-radius', '20px');
    await expect(userMessage).toHaveCSS('padding', '1rem 1.5rem');
    
    // Check assistant message styling
    await expect(assistantMessage).toHaveCSS('border-radius', '20px');
    await expect(assistantMessage).toHaveCSS('padding', '1rem 1.5rem');
    
    // Check avatar styling
    const userAvatar = page.locator('.message.user .message-avatar');
    const assistantAvatar = page.locator('.message.assistant .message-avatar');
    
    await expect(userAvatar).toHaveCSS('border-radius', '50%');
    await expect(userAvatar).toHaveCSS('width', '40px');
    await expect(userAvatar).toHaveCSS('height', '40px');
    
    await expect(assistantAvatar).toHaveCSS('border-radius', '50%');
    await expect(assistantAvatar).toHaveCSS('width', '40px');
    await expect(assistantAvatar).toHaveCSS('height', '40px');
  });

  test('should match ChatGPT input area design', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Focus on input area
    const inputArea = page.locator('.chat-input-container');
    await inputArea.scrollIntoViewIfNeeded();
    
    // Take screenshot of input area
    await page.screenshot({ 
      path: 'test-results/chatgpt-input-area.png',
      clip: { x: 0, y: 0, width: 800, height: 200 }
    });
    
    // Verify input styling
    const chatInput = page.locator('#chat-input');
    const sendButton = page.locator('#send-button');
    
    await expect(chatInput).toHaveCSS('border-radius', '25px');
    await expect(chatInput).toHaveCSS('padding', '1rem 1.5rem');
    await expect(chatInput).toHaveCSS('border', /2px solid/);
    
    await expect(sendButton).toHaveCSS('border-radius', '50%');
    await expect(sendButton).toHaveCSS('width', '50px');
    await expect(sendButton).toHaveCSS('height', '50px');
  });

  test('should match ChatGPT welcome screen', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of welcome screen
    await page.screenshot({ 
      path: 'test-results/chatgpt-welcome-screen.png',
      fullPage: true 
    });
    
    // Verify welcome screen elements
    const welcomeMessage = page.locator('.welcome-message');
    const examplePrompts = page.locator('.example-prompts');
    
    await expect(welcomeMessage).toBeVisible();
    await expect(welcomeMessage.locator('h2')).toContainText('Welcome to F8 Multiagent Chat');
    
    await expect(examplePrompts).toBeVisible();
    await expect(examplePrompts.locator('.example-prompt')).toHaveCount(4);
    
    // Check example prompt styling
    const firstPrompt = examplePrompts.locator('.example-prompt').first();
    await expect(firstPrompt).toHaveCSS('border-radius', '12px');
    await expect(firstPrompt).toHaveCSS('padding', '1rem');
    await expect(firstPrompt).toHaveCSS('cursor', 'pointer');
  });

  test('should match ChatGPT responsive design', async ({ page }) => {
    const viewports = [
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'laptop', width: 1366, height: 768 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/chat.html');
      await page.waitForLoadState('networkidle');
      
      // Set API key
      await page.evaluate((key) => {
        localStorage.setItem('f8-api-key', key);
      }, freeApiKey);
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Take screenshot for each viewport
      await page.screenshot({ 
        path: `test-results/chatgpt-responsive-${viewport.name}.png`,
        fullPage: true 
      });
      
      // Verify responsive behavior
      const chatContainer = page.locator('.chat-container');
      const chatInput = page.locator('#chat-input');
      
      await expect(chatContainer).toBeVisible();
      await expect(chatInput).toBeVisible();
      
      // Check mobile-specific adjustments
      if (viewport.name === 'mobile') {
        await expect(chatContainer).toHaveCSS('margin', /0\.5rem/);
        await expect(chatContainer).toHaveCSS('border-radius', '15px');
      }
    }
  });

  test('should match ChatGPT loading states', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Send message to trigger loading state
    await page.fill('#chat-input', 'Loading state test');
    await page.click('#send-button');
    
    // Capture loading state
    await page.screenshot({ 
      path: 'test-results/chatgpt-loading-state.png',
      fullPage: true 
    });
    
    // Verify loading elements
    await expect(page.locator('#typing-indicator')).toBeVisible();
    await expect(page.locator('.typing-dots')).toBeVisible();
    await expect(page.locator('.typing-dot')).toHaveCount(3);
    
    // Check send button is disabled
    await expect(page.locator('#send-button')).toBeDisabled();
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    
    // Capture completed state
    await page.screenshot({ 
      path: 'test-results/chatgpt-completed-state.png',
      fullPage: true 
    });
  });

  test('should match ChatGPT error states', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set invalid API key
    await page.evaluate(() => {
      localStorage.setItem('f8-api-key', 'invalid-key');
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Send message to trigger error
    await page.fill('#chat-input', 'Error test');
    await page.click('#send-button');
    
    // Wait for error to appear
    await page.waitForSelector('.error-message', { timeout: 10000 });
    
    // Capture error state
    await page.screenshot({ 
      path: 'test-results/chatgpt-error-state.png',
      fullPage: true 
    });
    
    // Verify error styling
    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toHaveCSS('background-color', 'rgb(254, 242, 242)');
    await expect(errorMessage).toHaveCSS('color', 'rgb(220, 38, 38)');
    await expect(errorMessage).toHaveCSS('border-radius', '12px');
  });

  test('should match ChatGPT API key setup screen', async ({ page }) => {
    // Clear API key
    await page.evaluate(() => {
      localStorage.removeItem('f8-api-key');
    });
    
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Capture API key setup screen
    await page.screenshot({ 
      path: 'test-results/chatgpt-api-key-setup.png',
      fullPage: true 
    });
    
    // Verify setup screen elements
    const apiKeySetup = page.locator('.api-key-setup');
    await expect(apiKeySetup).toBeVisible();
    await expect(apiKeySetup.locator('h3')).toContainText('API Key Required');
    await expect(page.locator('#api-key-input')).toBeVisible();
    await expect(page.locator('.setup-button')).toContainText('Get Free API Key');
    
    // Check setup screen styling
    await expect(apiKeySetup).toHaveCSS('background-color', 'rgb(254, 243, 199)');
    await expect(apiKeySetup).toHaveCSS('color', 'rgb(146, 64, 14)');
    await expect(apiKeySetup).toHaveCSS('border-radius', '12px');
  });

  test('should match ChatGPT message formatting', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Send message with various formatting
    const testMessage = `Test formatting:
    
**Bold text**
*Italic text*
\`Code text\`

- Bullet point 1
- Bullet point 2

1. Numbered item 1
2. Numbered item 2`;
    
    await page.fill('#chat-input', testMessage);
    await page.click('#send-button');
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    
    // Capture formatted message
    await page.screenshot({ 
      path: 'test-results/chatgpt-message-formatting.png',
      fullPage: true 
    });
    
    // Verify formatting is applied
    const messageText = page.locator('.message.user .message-text');
    await expect(messageText.locator('strong')).toContainText('Bold text');
    await expect(messageText.locator('em')).toContainText('Italic text');
    await expect(messageText.locator('code')).toContainText('Code text');
  });

  test('should match ChatGPT color scheme and branding', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot for color analysis
    await page.screenshot({ 
      path: 'test-results/chatgpt-color-scheme.png',
      fullPage: true 
    });
    
    // Verify color scheme
    const body = page.locator('body');
    const chatContainer = page.locator('.chat-container');
    const header = page.locator('.header');
    
    // Check background gradient
    const bodyBg = await body.evaluate(el => 
      window.getComputedStyle(el).background
    );
    expect(bodyBg).toContain('linear-gradient');
    
    // Check container background
    const containerBg = await chatContainer.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(containerBg).toContain('rgba(255, 255, 255, 0.95)');
    
    // Check header styling
    const headerBg = await header.evaluate(el => 
      window.getComputedStyle(el).background
    );
    expect(headerBg).toContain('rgba(255, 255, 255, 0.1)');
  });
});