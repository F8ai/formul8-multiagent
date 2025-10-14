const { test, expect } = require('@playwright/test');

test.describe('ChatGPT Functionality Mirror Tests', () => {
  let freeApiKey;

  test.beforeAll(async ({ request }) => {
    // Get a free API key for testing
    const response = await request.post('/api/free-key', {
      data: { username: 'chatgpt-mirror-test' }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    freeApiKey = data.apiKey;
  });

  test('should mirror ChatGPT conversation flow exactly', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Simulate ChatGPT conversation flow
    const conversation = [
      {
        user: "Hello! Can you help me with cannabis compliance?",
        expectedAgent: "compliance",
        expectedKeywords: ["compliance", "regulation", "legal"]
      },
      {
        user: "What about formulation? How do I make a tincture?",
        expectedAgent: "formulation", 
        expectedKeywords: ["formulation", "tincture", "recipe"]
      },
      {
        user: "What's the science behind THC?",
        expectedAgent: "science",
        expectedKeywords: ["science", "THC", "molecular", "chemistry"]
      }
    ];
    
    for (let i = 0; i < conversation.length; i++) {
      const { user, expectedAgent, expectedKeywords } = conversation[i];
      
      // Send user message
      await page.fill('#chat-input', user);
      await page.click('#send-button');
      
      // Wait for user message to appear
      await expect(page.locator('.message.user').nth(i)).toBeVisible();
      await expect(page.locator('.message.user').nth(i).locator('.message-text')).toContainText(user);
      
      // Wait for assistant response
      await page.waitForSelector('.message.assistant', { timeout: 30000 });
      
      // Verify response structure
      const assistantMessage = page.locator('.message.assistant').nth(i);
      await expect(assistantMessage).toBeVisible();
      
      // Check agent badge
      const agentBadge = assistantMessage.locator('.agent-badge');
      await expect(agentBadge).toContainText(expectedAgent);
      
      // Check response contains expected keywords
      const responseText = await assistantMessage.locator('.message-text').textContent();
      const hasExpectedKeyword = expectedKeywords.some(keyword => 
        responseText.toLowerCase().includes(keyword.toLowerCase())
      );
      expect(hasExpectedKeyword).toBe(true);
      
      // Verify message metadata
      const messageMeta = assistantMessage.locator('.message-meta');
      await expect(messageMeta).toBeVisible();
      await expect(messageMeta).toContainText(expectedAgent);
      await expect(messageMeta).toContainText('free');
    }
  });

  test('should mirror ChatGPT input behavior exactly', async ({ page }) => {
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
    
    // Test 1: Single line input
    await chatInput.fill('Single line message');
    await expect(chatInput).toHaveValue('Single line message');
    
    // Test 2: Multi-line input with Shift+Enter
    await chatInput.fill('Line 1');
    await chatInput.press('Shift+Enter');
    await chatInput.type('Line 2');
    await chatInput.press('Shift+Enter');
    await chatInput.type('Line 3');
    
    const multiLineValue = await chatInput.inputValue();
    expect(multiLineValue).toBe('Line 1\nLine 2\nLine 3');
    
    // Test 3: Auto-resize behavior
    const initialHeight = await chatInput.evaluate(el => el.offsetHeight);
    await chatInput.fill('A'.repeat(200)); // Long text
    const resizedHeight = await chatInput.evaluate(el => el.offsetHeight);
    expect(resizedHeight).toBeGreaterThan(initialHeight);
    
    // Test 4: Enter key sends message
    await chatInput.fill('Enter key test');
    await chatInput.press('Enter');
    await expect(page.locator('.message.user')).toBeVisible();
    
    // Test 5: Send button behavior
    await chatInput.fill('Send button test');
    await sendButton.click();
    await expect(page.locator('.message.user').nth(1)).toBeVisible();
  });

  test('should mirror ChatGPT typing indicators exactly', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Send message to trigger typing indicator
    await page.fill('#chat-input', 'Typing indicator test');
    await page.click('#send-button');
    
    // Verify typing indicator appears immediately
    await expect(page.locator('#typing-indicator')).toBeVisible();
    await expect(page.locator('.typing-indicator')).toContainText('F8 is thinking');
    
    // Verify typing dots animation
    const typingDots = page.locator('.typing-dots');
    await expect(typingDots).toBeVisible();
    await expect(typingDots.locator('.typing-dot')).toHaveCount(3);
    
    // Verify send button is disabled during typing
    await expect(page.locator('#send-button')).toBeDisabled();
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    
    // Verify typing indicator is removed
    await expect(page.locator('#typing-indicator')).not.toBeVisible();
    
    // Verify send button is enabled again
    await expect(page.locator('#send-button')).toBeEnabled();
  });

  test('should mirror ChatGPT message styling exactly', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Send message to create message elements
    await page.fill('#chat-input', 'Styling test message');
    await page.click('#send-button');
    
    // Wait for messages
    await page.waitForSelector('.message.user', { timeout: 10000 });
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    
    // Verify user message styling
    const userMessage = page.locator('.message.user .message-content');
    await expect(userMessage).toHaveCSS('border-radius', '20px');
    await expect(userMessage).toHaveCSS('padding', '1rem 1.5rem');
    await expect(userMessage).toHaveCSS('background-color', /linear-gradient/);
    await expect(userMessage).toHaveCSS('color', 'rgb(255, 255, 255)');
    
    // Verify assistant message styling
    const assistantMessage = page.locator('.message.assistant .message-content');
    await expect(assistantMessage).toHaveCSS('border-radius', '20px');
    await expect(assistantMessage).toHaveCSS('padding', '1rem 1.5rem');
    await expect(assistantMessage).toHaveCSS('background-color', 'rgb(248, 250, 252)');
    await expect(assistantMessage).toHaveCSS('color', 'rgb(30, 41, 59)');
    await expect(assistantMessage).toHaveCSS('border', '1px solid rgb(226, 232, 240)');
    
    // Verify avatar styling
    const userAvatar = page.locator('.message.user .message-avatar');
    const assistantAvatar = page.locator('.message.assistant .message-avatar');
    
    await expect(userAvatar).toHaveCSS('width', '40px');
    await expect(userAvatar).toHaveCSS('height', '40px');
    await expect(userAvatar).toHaveCSS('border-radius', '50%');
    await expect(userAvatar).toHaveCSS('background-color', /linear-gradient/);
    
    await expect(assistantAvatar).toHaveCSS('width', '40px');
    await expect(assistantAvatar).toHaveCSS('height', '40px');
    await expect(assistantAvatar).toHaveCSS('border-radius', '50%');
    await expect(assistantAvatar).toHaveCSS('background-color', /linear-gradient/);
  });

  test('should mirror ChatGPT scroll behavior exactly', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Send multiple messages to test scrolling
    const messages = [
      'First message',
      'Second message with more content to test scrolling behavior',
      'Third message to further test the scroll functionality',
      'Fourth message to ensure proper scrolling behavior',
      'Fifth message to complete the scroll test'
    ];
    
    for (let i = 0; i < messages.length; i++) {
      await page.fill('#chat-input', messages[i]);
      await page.click('#send-button');
      await page.waitForSelector('.message.assistant', { timeout: 30000 });
      
      // Check that chat scrolls to bottom after each message
      const chatMessages = page.locator('.chat-messages');
      const scrollTop = await chatMessages.evaluate(el => el.scrollTop);
      const scrollHeight = await chatMessages.evaluate(el => el.scrollHeight);
      const clientHeight = await chatMessages.evaluate(el => el.clientHeight);
      
      // Should be scrolled to bottom (or very close)
      expect(scrollTop + clientHeight).toBeGreaterThanOrEqual(scrollHeight - 10);
    }
  });

  test('should mirror ChatGPT error handling exactly', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set invalid API key
    await page.evaluate(() => {
      localStorage.setItem('f8-api-key', 'invalid-key');
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Send message to trigger error
    await page.fill('#chat-input', 'Error test message');
    await page.click('#send-button');
    
    // Wait for error message
    await page.waitForSelector('.error-message', { timeout: 10000 });
    
    // Verify error styling
    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveCSS('background-color', 'rgb(254, 242, 242)');
    await expect(errorMessage).toHaveCSS('color', 'rgb(220, 38, 38)');
    await expect(errorMessage).toHaveCSS('border-radius', '12px');
    await expect(errorMessage).toHaveCSS('border', '1px solid rgb(254, 202, 202)');
    
    // Verify error content
    const errorText = await errorMessage.textContent();
    expect(errorText).toContain('Error:');
  });

  test('should mirror ChatGPT status indicators exactly', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Check initial status
    await expect(page.locator('#status-text')).toContainText('Ready');
    await expect(page.locator('.status-dot')).toBeVisible();
    
    // Set API key
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

  test('should mirror ChatGPT example prompt interactions exactly', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Test clicking on example prompts
    const examplePrompts = page.locator('.example-prompt');
    await expect(examplePrompts).toHaveCount(4);
    
    // Click first example prompt
    await examplePrompts.first().click();
    
    // Verify input is filled
    const chatInput = page.locator('#chat-input');
    const inputValue = await chatInput.inputValue();
    expect(inputValue).toContain('compliance');
    
    // Send the example prompt
    await page.click('#send-button');
    
    // Verify message is sent
    await expect(page.locator('.message.user')).toBeVisible();
    await expect(page.locator('.message.user .message-text')).toContainText('compliance');
  });

  test('should mirror ChatGPT message formatting exactly', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set API key
    await page.evaluate((key) => {
      localStorage.setItem('f8-api-key', key);
    }, freeApiKey);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Send message with various formatting
    const formattedMessage = `**Bold text** and *italic text* and \`code text\`

This is a paragraph with multiple lines.

- Bullet point 1
- Bullet point 2

1. Numbered item 1
2. Numbered item 2`;
    
    await page.fill('#chat-input', formattedMessage);
    await page.click('#send-button');
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    
    // Verify formatting is applied
    const messageText = page.locator('.message.user .message-text');
    await expect(messageText.locator('strong')).toContainText('Bold text');
    await expect(messageText.locator('em')).toContainText('italic text');
    await expect(messageText.locator('code')).toContainText('code text');
    
    // Verify line breaks are preserved
    const textContent = await messageText.textContent();
    expect(textContent).toContain('\n');
  });

  test('should mirror ChatGPT responsive design exactly', async ({ page }) => {
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
      
      // Verify responsive elements
      const chatContainer = page.locator('.chat-container');
      const chatInput = page.locator('#chat-input');
      const sendButton = page.locator('#send-button');
      
      await expect(chatContainer).toBeVisible();
      await expect(chatInput).toBeVisible();
      await expect(sendButton).toBeVisible();
      
      // Check mobile-specific adjustments
      if (viewport.name === 'mobile') {
        await expect(chatContainer).toHaveCSS('margin', /0\.5rem/);
        await expect(chatContainer).toHaveCSS('border-radius', '15px');
      }
      
      // Test functionality on each viewport
      await page.fill('#chat-input', `Test on ${viewport.name}`);
      await page.click('#send-button');
      await page.waitForSelector('.message.assistant', { timeout: 30000 });
    }
  });

  test('should mirror ChatGPT accessibility features exactly', async ({ page }) => {
    await page.goto('/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('#chat-input')).toBeFocused();
    
    // Test keyboard shortcuts
    await page.keyboard.type('Test message');
    await page.keyboard.press('Enter');
    await expect(page.locator('.message.user')).toBeVisible();
    
    // Test focus management
    const chatInput = page.locator('#chat-input');
    const sendButton = page.locator('#send-button');
    
    await chatInput.focus();
    await expect(chatInput).toBeFocused();
    
    await sendButton.focus();
    await expect(sendButton).toBeFocused();
    
    // Test ARIA attributes
    await expect(chatInput).toHaveAttribute('placeholder');
    await expect(sendButton).toBeVisible();
    
    // Test color contrast (basic check)
    const inputColor = await chatInput.evaluate(el => 
      window.getComputedStyle(el).color
    );
    const inputBg = await chatInput.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should have good contrast
    expect(inputColor).not.toBe('rgb(255, 255, 255)'); // Not white on white
    expect(inputBg).not.toBe('rgb(0, 0, 0)'); // Not black on black
  });
});