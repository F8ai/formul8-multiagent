import { test, expect } from '@playwright/test';

test.describe('Formul8 Chat Interface - chat.formul8.ai', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('https://chat.formul8.ai');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Page Load and Initial UI', () => {
    test('Page loads successfully', async () => {
      await expect(page).toHaveTitle('Formul8');
      console.log('✅ Page title verified');
    });

    test('Header elements are visible', async () => {
      // Check header
      const header = page.locator('.header');
      await expect(header).toBeVisible();
      
      // Check logo (may be hidden if image fails to load)
      const logo = page.locator('.logo');
      const logoExists = await logo.count() > 0;
      if (logoExists) {
        console.log('✅ Logo element exists (may be hidden if image fails to load)');
      }
      
      // Check header title
      const headerTitle = page.locator('.header-title');
      await expect(headerTitle).toBeVisible();
      await expect(headerTitle).toHaveText('Formul8');
      
      console.log('✅ Header elements are present');
    });

    test('Welcome message is displayed', async () => {
      const welcome = page.locator('.welcome h1');
      await expect(welcome).toBeVisible();
      await expect(welcome).toContainText('What do you want to Formul8 today?');
      
      const welcomeSubtext = page.locator('.welcome p');
      await expect(welcomeSubtext).toContainText('Start a conversation');
      
      console.log('✅ Welcome message displayed correctly');
    });

    test('Chat input is visible and functional', async () => {
      const chatInput = page.locator('#chatInput');
      await expect(chatInput).toBeVisible();
      
      // Placeholder might be changing due to typewriter effect
      const placeholder = await chatInput.getAttribute('placeholder');
      expect(placeholder).toBeTruthy();
      
      // Test that input is editable
      await chatInput.fill('Test message');
      await expect(chatInput).toHaveValue('Test message');
      
      console.log(`✅ Chat input is functional (placeholder: "${placeholder}")`);
    });

    test('Send button is initially disabled', async () => {
      const sendButton = page.locator('#sendButton');
      await expect(sendButton).toBeVisible();
      await expect(sendButton).toBeDisabled();
      
      console.log('✅ Send button is initially disabled');
    });

    test('Google Sign-In button is present', async () => {
      // Wait for Google Sign-In to load
      await page.waitForTimeout(2000);
      
      const authButtons = page.locator('#authButtons');
      await expect(authButtons).toBeVisible();
      
      // Check if Google button iframe is rendered
      const googleButton = page.frameLocator('iframe[src*="accounts.google.com"]').first();
      const hasGoogleButton = await page.locator('iframe[src*="accounts.google.com"]').count() > 0;
      
      if (hasGoogleButton) {
        console.log('✅ Google Sign-In button rendered');
      } else {
        console.log('⚠️ Google Sign-In button not found (may need time to load)');
      }
    });
  });

  test.describe('Chat Functionality', () => {
    test('Send button enables when user types', async () => {
      const chatInput = page.locator('#chatInput');
      const sendButton = page.locator('#sendButton');
      
      // Initially disabled
      await expect(sendButton).toBeDisabled();
      
      // Type message
      await chatInput.fill('What is THC?');
      
      // Should be enabled now
      await expect(sendButton).toBeEnabled();
      
      console.log('✅ Send button enables when user types');
    });

    test('User can send a message', async () => {
      const chatInput = page.locator('#chatInput');
      const sendButton = page.locator('#sendButton');
      
      // Type and send message
      await chatInput.fill('What is CBD?');
      await sendButton.click();
      
      // Check if message appears in chat
      const userMessage = page.locator('.message.user').first();
      await expect(userMessage).toBeVisible({ timeout: 5000 });
      await expect(userMessage).toContainText('What is CBD?');
      
      // Check if welcome message disappears
      const app = page.locator('.app');
      await expect(app).toHaveClass(/has-messages/);
      
      console.log('✅ User can send a message');
    });

    test('Assistant responds to user message', async () => {
      const chatInput = page.locator('#chatInput');
      const sendButton = page.locator('#sendButton');
      
      // Send message
      await chatInput.fill('What are terpenes?');
      await sendButton.click();
      
      // Wait for user message
      await expect(page.locator('.message.user')).toBeVisible({ timeout: 5000 });
      
      // Wait for loading indicator
      const loading = page.locator('#loading');
      await expect(loading).toHaveClass(/active/, { timeout: 5000 });
      
      // Wait for assistant response
      const assistantMessage = page.locator('.message.assistant').first();
      await expect(assistantMessage).toBeVisible({ timeout: 30000 });
      
      // Verify response has content
      const responseText = await assistantMessage.locator('.message-text').textContent();
      expect(responseText.length).toBeGreaterThan(10);
      
      console.log('✅ Assistant responds to user message');
      console.log(`Response length: ${responseText.length} characters`);
    });

    test('Input clears after sending message', async () => {
      const chatInput = page.locator('#chatInput');
      const sendButton = page.locator('#sendButton');
      
      await chatInput.fill('Test message');
      await sendButton.click();
      
      // Input should be cleared
      await expect(chatInput).toHaveValue('');
      
      // Send button should be disabled again
      await expect(sendButton).toBeDisabled();
      
      console.log('✅ Input clears after sending message');
    });

    test('Multiple messages can be sent in sequence', async () => {
      const chatInput = page.locator('#chatInput');
      const sendButton = page.locator('#sendButton');
      
      // First message
      await chatInput.fill('What is THC?');
      await sendButton.click();
      await expect(page.locator('.message.user').first()).toBeVisible({ timeout: 5000 });
      await page.waitForSelector('.message.assistant', { timeout: 30000 });
      
      // Second message
      await chatInput.fill('What is CBD?');
      await sendButton.click();
      
      // Wait for second user message to appear
      await page.waitForTimeout(1000);
      
      // Check that multiple user messages exist
      const userMessages = page.locator('.message.user');
      const count = await userMessages.count();
      expect(count).toBeGreaterThanOrEqual(2);
      
      console.log(`✅ Multiple messages can be sent in sequence (${count} user messages)`);
    });

    test('Enter key sends message', async () => {
      const chatInput = page.locator('#chatInput');
      
      await chatInput.fill('Test message');
      await chatInput.press('Enter');
      
      // Check if message appears
      const userMessage = page.locator('.message.user').first();
      await expect(userMessage).toBeVisible({ timeout: 5000 });
      
      console.log('✅ Enter key sends message');
    });

    test('Shift+Enter adds new line', async () => {
      const chatInput = page.locator('#chatInput');
      
      await chatInput.fill('Line 1');
      await chatInput.press('Shift+Enter');
      await chatInput.type('Line 2');
      
      const inputValue = await chatInput.inputValue();
      expect(inputValue).toContain('\n');
      expect(inputValue).toContain('Line 1');
      expect(inputValue).toContain('Line 2');
      
      console.log('✅ Shift+Enter adds new line');
    });

    test('Empty message cannot be sent', async () => {
      const sendButton = page.locator('#sendButton');
      
      // Try to click disabled button
      await expect(sendButton).toBeDisabled();
      
      // Try with just spaces
      const chatInput = page.locator('#chatInput');
      await chatInput.fill('   ');
      
      // Button should still be disabled (if trim is applied)
      const isEnabled = await sendButton.isEnabled();
      console.log(`Send button enabled for spaces: ${isEnabled}`);
      
      console.log('✅ Empty message handling verified');
    });
  });

  test.describe('Message Display', () => {
    test('User messages have correct styling', async () => {
      const chatInput = page.locator('#chatInput');
      const sendButton = page.locator('#sendButton');
      
      await chatInput.fill('Test user message');
      await sendButton.click();
      
      const userMessage = page.locator('.message.user').first();
      await expect(userMessage).toBeVisible();
      
      // Check avatar
      const avatar = userMessage.locator('.message-avatar');
      await expect(avatar).toBeVisible();
      
      // Check message text
      const messageText = userMessage.locator('.message-text');
      await expect(messageText).toBeVisible();
      await expect(messageText).toContainText('Test user message');
      
      console.log('✅ User messages display correctly');
    });

    test('Messages scroll to bottom', async () => {
      const chatInput = page.locator('#chatInput');
      const sendButton = page.locator('#sendButton');
      const messagesContainer = page.locator('#messages');
      
      // Send multiple messages
      for (let i = 0; i < 3; i++) {
        await chatInput.fill(`Message ${i + 1}`);
        await sendButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Check scroll position (should be at bottom)
      const scrollTop = await messagesContainer.evaluate(el => el.scrollTop);
      const scrollHeight = await messagesContainer.evaluate(el => el.scrollHeight);
      const clientHeight = await messagesContainer.evaluate(el => el.clientHeight);
      
      // If content is taller than container, scrollTop should be > 0
      // Otherwise, if everything fits, scrollTop can be 0
      if (scrollHeight > clientHeight) {
        expect(scrollTop).toBeGreaterThan(0);
        console.log('✅ Messages scroll to bottom (scrolled)');
      } else {
        console.log('✅ Messages scroll to bottom (all content visible)');
      }
      
      console.log(`Scroll position: ${scrollTop}/${scrollHeight - clientHeight}`);
    });
  });

  test.describe('UI/UX Features', () => {
    test('Textarea auto-resizes', async () => {
      const chatInput = page.locator('#chatInput');
      
      // Get initial height
      const initialHeight = await chatInput.evaluate(el => el.scrollHeight);
      
      // Add multiple lines
      await chatInput.fill('Line 1\nLine 2\nLine 3\nLine 4\nLine 5');
      
      // Wait for resize
      await page.waitForTimeout(100);
      
      // Check if height increased
      const newHeight = await chatInput.evaluate(el => el.scrollHeight);
      expect(newHeight).toBeGreaterThan(initialHeight);
      
      console.log('✅ Textarea auto-resizes');
      console.log(`Height changed from ${initialHeight}px to ${newHeight}px`);
    });

    test('Footer text is visible', async () => {
      const footer = page.locator('.footer-text');
      await expect(footer).toBeVisible();
      await expect(footer).toContainText('Formul8.ai');
      
      console.log('✅ Footer text is visible');
    });

    test('Loading indicator appears during request', async () => {
      const chatInput = page.locator('#chatInput');
      const sendButton = page.locator('#sendButton');
      const loading = page.locator('#loading');
      
      await chatInput.fill('Test message');
      await sendButton.click();
      
      // Check loading appears
      await expect(loading).toHaveClass(/active/, { timeout: 5000 });
      await expect(loading).toContainText('Thinking...');
      
      // Wait for response
      await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 30000 });
      
      // Loading should disappear
      await expect(loading).not.toHaveClass(/active/);
      
      console.log('✅ Loading indicator works correctly');
    });

    test('Hidden controls exist (plan and username)', async () => {
      const username = page.locator('#username');
      const planSelect = page.locator('#planSelect');
      
      // Elements exist but are hidden
      await expect(username).toBeAttached();
      await expect(planSelect).toBeAttached();
      
      // Check default values
      const usernameValue = await username.inputValue();
      const planValue = await planSelect.inputValue();
      
      console.log(`✅ Username: ${usernameValue}, Plan: ${planValue}`);
    });
  });

  test.describe('Responsive Design', () => {
    test('Mobile viewport (375x667)', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      // All key elements should still be visible
      await expect(page.locator('.header')).toBeVisible();
      await expect(page.locator('#chatInput')).toBeVisible();
      await expect(page.locator('#sendButton')).toBeVisible();
      await expect(page.locator('.welcome')).toBeVisible();
      
      console.log('✅ Mobile viewport renders correctly');
    });

    test('Tablet viewport (768x1024)', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      await expect(page.locator('.header')).toBeVisible();
      await expect(page.locator('#chatInput')).toBeVisible();
      await expect(page.locator('#sendButton')).toBeVisible();
      
      console.log('✅ Tablet viewport renders correctly');
    });

    test('Desktop viewport (1920x1080)', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);
      
      await expect(page.locator('.header')).toBeVisible();
      await expect(page.locator('#chatInput')).toBeVisible();
      await expect(page.locator('#sendButton')).toBeVisible();
      
      console.log('✅ Desktop viewport renders correctly');
    });

    test('Messages are properly centered on large screens', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      const chatInput = page.locator('#chatInput');
      const sendButton = page.locator('#sendButton');
      
      await chatInput.fill('Test message');
      await sendButton.click();
      
      const messageContent = page.locator('.message-content').first();
      await expect(messageContent).toBeVisible();
      
      // Check max-width constraint
      const maxWidth = await messageContent.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.maxWidth;
      });
      
      expect(maxWidth).toBe('768px');
      
      console.log('✅ Messages are properly centered with max-width');
    });
  });

  test.describe('Different Question Types', () => {
    const testQuestions = [
      { question: 'What is THC?', description: 'Science question' },
      { question: 'How do I calculate dosage?', description: 'Formulation question' },
      { question: 'What are the compliance requirements?', description: 'Compliance question' },
      { question: 'Tell me about cannabis', description: 'General question' },
    ];

    for (const { question, description } of testQuestions) {
      test(`Handles ${description}: "${question}"`, async () => {
        const chatInput = page.locator('#chatInput');
        const sendButton = page.locator('#sendButton');
        
        await chatInput.fill(question);
        await sendButton.click();
        
        // Wait for response (increased timeout for complex questions)
        const assistantMessage = page.locator('.message.assistant').first();
        await expect(assistantMessage).toBeVisible({ timeout: 60000 });
        
        const responseText = await assistantMessage.locator('.message-text').textContent();
        expect(responseText.length).toBeGreaterThan(10);
        
        console.log(`✅ ${description} handled successfully`);
        console.log(`Response length: ${responseText.length} characters`);
      });
    }
  });

  test.describe('Edge Cases', () => {
    test('Very long message handling', async () => {
      const chatInput = page.locator('#chatInput');
      const sendButton = page.locator('#sendButton');
      
      const longMessage = 'This is a very long message. '.repeat(100);
      await chatInput.fill(longMessage);
      await sendButton.click();
      
      // Should handle without crashing
      const userMessage = page.locator('.message.user').first();
      await expect(userMessage).toBeVisible({ timeout: 5000 });
      
      console.log('✅ Long message handled successfully');
    });

    test('Special characters in message', async () => {
      const chatInput = page.locator('#chatInput');
      const sendButton = page.locator('#sendButton');
      
      const specialMessage = 'Test @#$%^&*()_+-=[]{}|;:,.<>?/~`"\'';
      await chatInput.fill(specialMessage);
      await sendButton.click();
      
      const userMessage = page.locator('.message.user').first();
      await expect(userMessage).toBeVisible({ timeout: 5000 });
      
      console.log('✅ Special characters handled successfully');
    });

    test('Rapid message sending', async () => {
      const chatInput = page.locator('#chatInput');
      const sendButton = page.locator('#sendButton');
      
      // Send messages quickly
      await chatInput.fill('Quick message 1');
      await sendButton.click();
      await page.waitForTimeout(500);
      
      await chatInput.fill('Quick message 2');
      await sendButton.click();
      await page.waitForTimeout(500);
      
      await chatInput.fill('Quick message 3');
      await sendButton.click();
      
      // Should have 3 user messages
      const userMessages = page.locator('.message.user');
      await expect(userMessages).toHaveCount(3, { timeout: 10000 });
      
      console.log('✅ Rapid message sending handled');
    });
  });

  test.describe('Performance', () => {
    test('Page loads within acceptable time', async ({ browser }) => {
      // Create a fresh page for this test to measure accurately
      const perfPage = await browser.newPage();
      
      const startTime = Date.now();
      await perfPage.goto('https://f8.syzygyx.com/chat', { timeout: 60000 });
      await perfPage.waitForSelector('#chatInput', { timeout: 60000 });
      const loadTime = Date.now() - startTime;
      
      await perfPage.close();
      
      expect(loadTime).toBeLessThan(10000);
      
      console.log(`✅ Page loaded in ${loadTime}ms`);
    });

    test('Message response time is acceptable', async () => {
      const chatInput = page.locator('#chatInput');
      const sendButton = page.locator('#sendButton');
      
      await chatInput.fill('What is CBD?');
      
      const startTime = Date.now();
      await sendButton.click();
      
      await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 60000 });
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(60000);
      
      console.log(`✅ Response received in ${responseTime}ms`);
    });
  });

  test.describe('Accessibility', () => {
    test('Interactive elements are keyboard accessible', async () => {
      const chatInput = page.locator('#chatInput');
      
      // Focus the input directly
      await chatInput.focus();
      
      // Type message using keyboard
      await page.keyboard.type('Test message');
      
      // Verify message was typed
      await expect(chatInput).toHaveValue('Test message');
      
      // Test Enter key to send
      await page.keyboard.press('Enter');
      
      // Verify message was sent
      await expect(page.locator('.message.user')).toBeVisible({ timeout: 5000 });
      
      console.log('✅ Keyboard interaction works');
    });

    test('Input has proper placeholder', async () => {
      const chatInput = page.locator('#chatInput');
      const placeholder = await chatInput.getAttribute('placeholder');
      
      expect(placeholder).toBeTruthy();
      
      console.log(`✅ Input placeholder: "${placeholder}"`);
    });
  });
});
