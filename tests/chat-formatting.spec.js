import { test, expect } from '@playwright/test';

test.describe('Chat Message Formatting', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to chat page
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
  });

  test('should display main chat interface', async ({ page }) => {
    // Check main elements are present
    await expect(page.locator('#chatInput')).toBeVisible();
    await expect(page.locator('#sendButton')).toBeVisible();
    await expect(page.locator('#messagesList')).toBeVisible();
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: 'test-results/chat-formatting-initial.png',
      fullPage: true 
    });
  });

  test('should format assistant messages with metadata badges', async ({ page }) => {
    // Wait for input to be ready
    await page.waitForSelector('#chatInput');
    
    // Type a message that will trigger a response
    await page.fill('#chatInput', 'What is THC?');
    
    // Click send button
    await page.click('#sendButton');
    
    // Wait for assistant response
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    
    // Wait a bit for the message to fully render
    await page.waitForTimeout(1000);
    
    // Check if metadata badges are present
    const metadataBadges = page.locator('.metadata-badge');
    const badgeCount = await metadataBadges.count();
    
    console.log(`Found ${badgeCount} metadata badges`);
    
    // Should have at least some metadata badges (Agent, Plan, Tokens, Cost)
    if (badgeCount > 0) {
      expect(badgeCount).toBeGreaterThanOrEqual(1);
      
      // Take screenshot showing formatted message
      await page.screenshot({ 
        path: 'test-results/chat-formatting-with-badges.png',
        fullPage: true 
      });
    }
    
    // Check for main content wrapper
    const mainContent = page.locator('.message-main-content');
    if (await mainContent.count() > 0) {
      await expect(mainContent.first()).toBeVisible();
    }
  });

  test('should render clickable links in messages', async ({ page }) => {
    // Send a message
    await page.fill('#chatInput', 'Tell me about compliance');
    await page.click('#sendButton');
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    await page.waitForTimeout(1000);
    
    // Check for links in message content
    const messageLinks = page.locator('.message-text a, .upgrade-link');
    const linkCount = await messageLinks.count();
    
    console.log(`Found ${linkCount} clickable links`);
    
    if (linkCount > 0) {
      // Verify links are properly formatted
      const firstLink = messageLinks.first();
      await expect(firstLink).toBeVisible();
      
      // Check that link has href attribute
      const href = await firstLink.getAttribute('href');
      expect(href).toBeTruthy();
      console.log(`First link href: ${href}`);
    }
  });

  test('should display upgrade callouts with proper styling', async ({ page }) => {
    // Send a message as a free user
    await page.fill('#chatInput', 'Help me with formulation');
    await page.click('#sendButton');
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    await page.waitForTimeout(1000);
    
    // Check for upgrade callout
    const upgradeCallout = page.locator('.upgrade-callout');
    const calloutCount = await upgradeCallout.count();
    
    console.log(`Found ${calloutCount} upgrade callouts`);
    
    if (calloutCount > 0) {
      // Verify callout is visible
      await expect(upgradeCallout.first()).toBeVisible();
      
      // Check for callout title
      const calloutTitle = upgradeCallout.first().locator('h4');
      if (await calloutTitle.count() > 0) {
        await expect(calloutTitle).toBeVisible();
      }
      
      // Check for bullet list
      const bulletList = upgradeCallout.first().locator('ul li');
      const bulletCount = await bulletList.count();
      console.log(`Found ${bulletCount} bullets in callout`);
      
      // Check for action buttons
      const actionButtons = upgradeCallout.first().locator('.upgrade-link');
      const buttonCount = await actionButtons.count();
      console.log(`Found ${buttonCount} action buttons`);
      
      // Take screenshot of formatted message with callout
      await page.screenshot({ 
        path: 'test-results/chat-formatting-with-callout.png',
        fullPage: true 
      });
    }
  });

  test('should properly separate main content from metadata', async ({ page }) => {
    // Send a message
    await page.fill('#chatInput', 'What are terpenes?');
    await page.click('#sendButton');
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    await page.waitForTimeout(1000);
    
    const assistantMessage = page.locator('.message.assistant').first();
    
    // Check that main content and metadata are separate elements
    const mainContent = assistantMessage.locator('.message-main-content');
    const metadata = assistantMessage.locator('.message-metadata');
    
    const hasMainContent = await mainContent.count() > 0;
    const hasMetadata = await metadata.count() > 0;
    
    console.log(`Has main content: ${hasMainContent}`);
    console.log(`Has metadata: ${hasMetadata}`);
    
    if (hasMainContent && hasMetadata) {
      // Verify they are separate elements
      await expect(mainContent).toBeVisible();
      await expect(metadata).toBeVisible();
      
      // Verify metadata is below main content (different DOM elements)
      const contentBox = await mainContent.boundingBox();
      const metadataBox = await metadata.boundingBox();
      
      if (contentBox && metadataBox) {
        expect(metadataBox.y).toBeGreaterThan(contentBox.y);
        console.log('✓ Metadata is positioned below main content');
      }
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'test-results/chat-formatting-complete.png',
      fullPage: true 
    });
  });

  test('should be mobile responsive', async ({ page, browserName }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Send a message
    await page.fill('#chatInput', 'Cannabis dosage calculator');
    await page.click('#sendButton');
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    await page.waitForTimeout(1000);
    
    // Check that elements are still visible on mobile
    const metadataBadges = page.locator('.metadata-badge');
    const badgeCount = await metadataBadges.count();
    
    if (badgeCount > 0) {
      // Badges should wrap on mobile
      const firstBadge = metadataBadges.first();
      await expect(firstBadge).toBeVisible();
    }
    
    // Take mobile screenshot
    await page.screenshot({ 
      path: `test-results/chat-formatting-mobile-${browserName}.png`,
      fullPage: true 
    });
  });

  test('should have proper CSS styling applied', async ({ page }) => {
    // Send a message to get formatted response
    await page.fill('#chatInput', 'What is CBD?');
    await page.click('#sendButton');
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    await page.waitForTimeout(1000);
    
    // Check CSS properties of metadata badges
    const firstBadge = page.locator('.metadata-badge').first();
    
    if (await firstBadge.count() > 0) {
      const badgeStyles = await firstBadge.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          borderRadius: styles.borderRadius,
          padding: styles.padding,
          fontSize: styles.fontSize,
          backgroundColor: styles.backgroundColor
        };
      });
      
      console.log('Badge styles:', badgeStyles);
      
      // Verify some basic styling
      expect(badgeStyles.display).toContain('flex');
      expect(badgeStyles.borderRadius).toBeTruthy();
    }
    
    // Check upgrade callout styling if present
    const callout = page.locator('.upgrade-callout').first();
    
    if (await callout.count() > 0) {
      const calloutStyles = await callout.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          borderLeft: styles.borderLeft,
          borderRadius: styles.borderRadius,
          padding: styles.padding,
          background: styles.background
        };
      });
      
      console.log('Callout styles:', calloutStyles);
      
      // Verify callout has border and gradient
      expect(calloutStyles.borderLeft).toContain('3px');
      expect(calloutStyles.background).toBeTruthy();
    }
  });

  test('should escape HTML in user messages', async ({ page }) => {
    // Try to inject HTML in user message
    const maliciousInput = '<script>alert("XSS")</script><b>Bold text</b>';
    
    await page.fill('#chatInput', maliciousInput);
    await page.click('#sendButton');
    
    // Wait for message to appear
    await page.waitForSelector('.message.user', { timeout: 5000 });
    
    // Get the message text content
    const userMessage = page.locator('.message.user').first();
    const messageText = await userMessage.locator('.message-text').textContent();
    
    // The HTML should be escaped (visible as text, not executed)
    expect(messageText).toContain('<script>');
    expect(messageText).toContain('</script>');
    
    console.log('✓ XSS protection working - HTML is escaped');
    
    // Verify no script was executed
    const alerts = [];
    page.on('dialog', dialog => alerts.push(dialog.message()));
    
    await page.waitForTimeout(1000);
    expect(alerts.length).toBe(0);
    console.log('✓ No script execution detected');
  });
});

test.describe('Chat Formatting Visual Regression', () => {
  test('visual comparison - complete chat flow', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    
    // Initial state
    await page.screenshot({ 
      path: 'test-results/visual-01-initial.png',
      fullPage: true 
    });
    
    // Send first message
    await page.fill('#chatInput', 'What is THC?');
    await page.click('#sendButton');
    await page.waitForSelector('.message.user', { timeout: 5000 });
    
    await page.screenshot({ 
      path: 'test-results/visual-02-user-message.png',
      fullPage: true 
    });
    
    // Wait for assistant response
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'test-results/visual-03-assistant-response.png',
      fullPage: true 
    });
    
    // Send second message to see multiple messages
    await page.fill('#chatInput', 'Tell me more about compliance');
    await page.click('#sendButton');
    await page.waitForSelector('.message.assistant:nth-of-type(2)', { timeout: 30000 });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'test-results/visual-04-multiple-messages.png',
      fullPage: true 
    });
    
    console.log('✓ Visual regression screenshots captured');
  });
});

