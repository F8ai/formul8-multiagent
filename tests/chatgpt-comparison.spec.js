const { test, expect } = require('@playwright/test');

test.describe('F8 Chat vs ChatGPT Interface Comparison', () => {
  let freeApiKey;

  test.beforeAll(async ({ request }) => {
    // Get a free API key for testing
    const response = await request.post('/api/free-key', {
      data: { username: 'chatgpt-comparison-test' }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    freeApiKey = data.apiKey;
  });

  test('should have ChatGPT-like visual design', async ({ page }) => {
    await page.goto('/chat.html');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check main container structure
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('.chat-container')).toBeVisible();
    await expect(page.locator('.chat-messages')).toBeVisible();
    await expect(page.locator('.chat-input-container')).toBeVisible();
    
    // Check header design
    await expect(page.locator('.header')).toBeVisible();
    await expect(page.locator('.logo')).toContainText('F8 Multiagent');
    await expect(page.locator('.status')).toBeVisible();
    await expect(page.locator('.status-dot')).toBeVisible();
    
    // Check input area design
    await expect(page.locator('.chat-input-wrapper')).toBeVisible();
    await expect(page.locator('.chat-input')).toBeVisible();
    await expect(page.locator('.send-button')).toBeVisible();
    
    // Verify ChatGPT-like styling
    const chatContainer = page.locator('.chat-container');
    await expect(chatContainer).toHaveCSS('border-radius', '20px');
    await expect(chatContainer).toHaveCSS('background-color', /rgba\(255, 255, 255, 0\.95\)/);
    
    // Check message styling
    const messageContent = page.locator('.message-content');
    if (await messageContent.count() > 0) {
      await expect(messageContent.first()).toHaveCSS('border-radius', '20px');
    }
  });

  test('should have ChatGPT-like welcome screen', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Check welcome message structure
    await expect(page.locator('.welcome-message')).toBeVisible();
    await expect(page.locator('.welcome-message h2')).toContainText('Welcome to F8 Multiagent Chat');
    
    // Check example prompts grid
    await expect(page.locator('.example-prompts')).toBeVisible();
    await expect(page.locator('.example-prompt')).toHaveCount(4);
    
    // Verify example prompt content
    const prompts = page.locator('.example-prompt');
    await expect(prompts.nth(0)).toContainText('Compliance');
    await expect(prompts.nth(1)).toContainText('Formulation');
    await expect(prompts.nth(2)).toContainText('Science');
    await expect(prompts.nth(3)).toContainText('Marketing');
    
    // Check prompt styling
    await expect(prompts.first()).toHaveCSS('border-radius', '12px');
    await expect(prompts.first()).toHaveCSS('cursor', 'pointer');
  });

  test('should handle API key setup like ChatGPT', async ({ page }) => {
    // Clear any existing API key
    await page.evaluate(() => {
      localStorage.removeItem('f8-api-key');
    });
    
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Should show API key setup screen
    await expect(page.locator('.api-key-setup')).toBeVisible();
    await expect(page.locator('.api-key-setup h3')).toContainText('API Key Required');
    await expect(page.locator('#api-key-input')).toBeVisible();
    await expect(page.locator('.setup-button')).toContainText('Get Free API Key');
    
    // Test API key generation
    await page.click('.setup-button');
    await page.waitForTimeout(2000); // Wait for API call
    
    // Should redirect to main chat after key generation
    await expect(page.locator('.welcome-message')).toBeVisible();
  });

  test('should have ChatGPT-like message flow', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Send a message
    const chatInput = page.locator('#chat-input');
    await chatInput.fill('What is cannabis compliance?');
    await page.click('#send-button');
    
    // Check user message appears
    await expect(page.locator('.message.user')).toBeVisible();
    await expect(page.locator('.message.user .message-text')).toContainText('What is cannabis compliance?');
    await expect(page.locator('.message.user .message-avatar')).toContainText('👤');
    
    // Check typing indicator appears
    await expect(page.locator('#typing-indicator')).toBeVisible();
    await expect(page.locator('.typing-indicator')).toContainText('F8 is thinking');
    
    // Wait for response (with timeout)
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    
    // Check assistant message appears
    await expect(page.locator('.message.assistant')).toBeVisible();
    await expect(page.locator('.message.assistant .message-avatar')).toContainText('🤖');
    await expect(page.locator('.message.assistant .message-text')).toBeVisible();
    
    // Check message metadata
    await expect(page.locator('.message-meta')).toBeVisible();
    await expect(page.locator('.agent-badge')).toBeVisible();
  });

  test('should have ChatGPT-like input behavior', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const chatInput = page.locator('#chat-input');
    const sendButton = page.locator('#send-button');
    
    // Test auto-resize
    await chatInput.fill('This is a long message that should cause the textarea to resize automatically');
    const initialHeight = await chatInput.evaluate(el => el.offsetHeight);
    
    await chatInput.fill('This is an even longer message that should definitely cause the textarea to resize even more to accommodate the additional text content');
    const resizedHeight = await chatInput.evaluate(el => el.offsetHeight);
    
    expect(resizedHeight).toBeGreaterThan(initialHeight);
    
    // Test Enter key sends message
    await chatInput.fill('Test message');
    await chatInput.press('Enter');
    
    // Should send message
    await expect(page.locator('.message.user')).toBeVisible();
    await expect(page.locator('.message.user .message-text')).toContainText('Test message');
    
    // Test Shift+Enter creates new line
    await chatInput.fill('Line 1');
    await chatInput.press('Shift+Enter');
    await chatInput.type('Line 2');
    
    const inputValue = await chatInput.inputValue();
    expect(inputValue).toContain('\n');
  });

  test('should have ChatGPT-like message styling', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Send a message to create message elements
    await page.fill('#chat-input', 'Test styling');
    await page.click('#send-button');
    
    // Wait for messages to appear
    await page.waitForSelector('.message.user', { timeout: 10000 });
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    
    // Check user message styling
    const userMessage = page.locator('.message.user .message-content');
    await expect(userMessage).toHaveCSS('background-color', /linear-gradient/);
    await expect(userMessage).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(userMessage).toHaveCSS('border-radius', '20px');
    
    // Check assistant message styling
    const assistantMessage = page.locator('.message.assistant .message-content');
    await expect(assistantMessage).toHaveCSS('background-color', 'rgb(248, 250, 252)');
    await expect(assistantMessage).toHaveCSS('color', 'rgb(30, 41, 59)');
    await expect(assistantMessage).toHaveCSS('border-radius', '20px');
    
    // Check message avatars
    await expect(page.locator('.message.user .message-avatar')).toHaveCSS('border-radius', '50%');
    await expect(page.locator('.message.assistant .message-avatar')).toHaveCSS('border-radius', '50%');
  });

  test('should have ChatGPT-like responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    const chatContainer = page.locator('.chat-container');
    await expect(chatContainer).toHaveCSS('max-width', '1200px');
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check mobile-specific styling
    await expect(chatContainer).toHaveCSS('margin', /0\.5rem/);
    await expect(chatContainer).toHaveCSS('border-radius', '15px');
  });

  test('should have ChatGPT-like error handling', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set invalid API key
    await page.evaluate(() => {
      localStorage.setItem('f8-api-key', 'invalid-key');
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Send message with invalid key
    await page.fill('#chat-input', 'Test error handling');
    await page.click('#send-button');
    
    // Should show error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Error:');
  });

  test('should have ChatGPT-like status indicators', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Check initial status
    await expect(page.locator('#status-text')).toContainText('Ready');
    await expect(page.locator('.status-dot')).toBeVisible();
    
    // Set API key and test status changes
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Send message and check status changes
    await page.fill('#chat-input', 'Status test');
    await page.click('#send-button');
    
    // Should show "Thinking..." status
    await expect(page.locator('#status-text')).toContainText('Thinking...');
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    
    // Should return to "Ready" status
    await expect(page.locator('#status-text')).toContainText('Ready');
  });

  test('should have ChatGPT-like message formatting', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Send message with formatting
    await page.fill('#chat-input', 'Test **bold** and *italic* and `code` formatting');
    await page.click('#send-button');
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    
    // Check formatting is applied
    const messageText = page.locator('.message.assistant .message-text');
    await expect(messageText.locator('strong')).toContainText('bold');
    await expect(messageText.locator('em')).toContainText('italic');
    await expect(messageText.locator('code')).toContainText('code');
  });

  test('should have ChatGPT-like example prompt interactions', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Click on example prompt
    await page.click('.example-prompt:first-child');
    
    // Should fill input with example text
    const chatInput = page.locator('#chat-input');
    await expect(chatInput).toHaveValue(/compliance/);
    
    // Send the example prompt
    await page.click('#send-button');
    
    // Should send the message
    await expect(page.locator('.message.user')).toBeVisible();
    await expect(page.locator('.message.user .message-text')).toContainText('compliance');
  });

  test('should have ChatGPT-like loading states', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Send message
    await page.fill('#chat-input', 'Loading test');
    await page.click('#send-button');
    
    // Check typing indicator appears
    await expect(page.locator('#typing-indicator')).toBeVisible();
    await expect(page.locator('.typing-dots')).toBeVisible();
    await expect(page.locator('.typing-dot')).toHaveCount(3);
    
    // Check send button is disabled during typing
    await expect(page.locator('#send-button')).toBeDisabled();
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    
    // Typing indicator should be removed
    await expect(page.locator('#typing-indicator')).not.toBeVisible();
    
    // Send button should be enabled again
    await expect(page.locator('#send-button')).toBeEnabled();
  });

  test('should have ChatGPT-like scroll behavior', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Send multiple messages to test scrolling
    for (let i = 0; i < 5; i++) {
      await page.fill('#chat-input', `Message ${i + 1}`);
      await page.click('#send-button');
      await page.waitForSelector('.message.assistant', { timeout: 30000 });
    }
    
    // Check that chat scrolls to bottom
    const chatMessages = page.locator('.chat-messages');
    const scrollTop = await chatMessages.evaluate(el => el.scrollTop);
    const scrollHeight = await chatMessages.evaluate(el => el.scrollHeight);
    const clientHeight = await chatMessages.evaluate(el => el.clientHeight);
    
    // Should be scrolled to bottom (or very close)
    expect(scrollTop + clientHeight).toBeGreaterThanOrEqual(scrollHeight - 10);
  });

  test('should have ChatGPT-like accessibility features', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('#chat-input')).toBeFocused();
    
    // Check ARIA labels and roles
    await expect(page.locator('#chat-input')).toHaveAttribute('placeholder');
    await expect(page.locator('#send-button')).toBeVisible();
    
    // Check color contrast (basic check)
    const chatInput = page.locator('#chat-input');
    const inputColor = await chatInput.evaluate(el => 
      window.getComputedStyle(el).color
    );
    const inputBg = await chatInput.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should have good contrast
    expect(inputColor).not.toBe('rgb(255, 255, 255)'); // Not white on white
  });
});