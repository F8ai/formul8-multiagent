#!/usr/bin/env node

/**
 * Playwright script to analyze ChatGPT's styles and layouts
 * This will help us understand the exact spacing, fonts, and behaviors
 */

const { chromium } = require('playwright');

async function analyzeChatGPT() {
  console.log('🔍 Starting ChatGPT analysis...');
  
  const browser = await chromium.launch({ 
    headless: false, // Run in headed mode so we can see what's happening
    slowMo: 1000 // Slow down for observation
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Navigating to ChatGPT...');
    await page.goto('https://chat.openai.com', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    console.log('📊 Analyzing initial state...');
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'chatgpt-initial-state.png', fullPage: true });
    
    // Analyze the main container
    const mainContainer = await page.locator('main, [role="main"], .main-container').first();
    const containerInfo = await mainContainer.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        flexDirection: styles.flexDirection,
        justifyContent: styles.justifyContent,
        alignItems: styles.alignItems,
        padding: styles.padding,
        margin: styles.margin,
        maxWidth: styles.maxWidth,
        width: styles.width,
        height: styles.height,
        minHeight: styles.minHeight
      };
    });
    
    console.log('📦 Main Container Styles:');
    console.log(JSON.stringify(containerInfo, null, 2));
    
    // Analyze the input area
    const inputArea = await page.locator('textarea, input[type="text"], [data-testid*="input"], [data-testid*="composer"]').first();
    const inputInfo = await inputArea.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        placeholder: el.placeholder,
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily,
        padding: styles.padding,
        margin: styles.margin,
        border: styles.border,
        borderRadius: styles.borderRadius,
        width: styles.width,
        height: styles.height,
        minHeight: styles.minHeight,
        maxHeight: styles.maxHeight,
        position: {
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom
        }
      };
    });
    
    console.log('📝 Input Area Styles:');
    console.log(JSON.stringify(inputInfo, null, 2));
    
    // Analyze the send button
    const sendButton = await page.locator('button[type="submit"], button:has-text("Send"), [data-testid*="send"]').first();
    const buttonInfo = await sendButton.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        width: styles.width,
        height: styles.height,
        padding: styles.padding,
        margin: styles.margin,
        borderRadius: styles.borderRadius,
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontSize: styles.fontSize,
        position: {
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom
        }
      };
    });
    
    console.log('🔘 Send Button Styles:');
    console.log(JSON.stringify(buttonInfo, null, 2));
    
    // Analyze the header
    const header = await page.locator('header, nav, .header, [role="banner"]').first();
    const headerInfo = await header.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        height: styles.height,
        padding: styles.padding,
        margin: styles.margin,
        backgroundColor: styles.backgroundColor,
        borderBottom: styles.borderBottom,
        display: styles.display,
        justifyContent: styles.justifyContent,
        alignItems: styles.alignItems,
        position: {
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom
        }
      };
    });
    
    console.log('🔝 Header Styles:');
    console.log(JSON.stringify(headerInfo, null, 2));
    
    // Look for login button
    const loginButton = await page.locator('button:has-text("Log in"), a:has-text("Log in"), [data-testid*="login"]').first();
    if (await loginButton.isVisible()) {
      const loginInfo = await loginButton.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          text: el.textContent,
          fontSize: styles.fontSize,
          fontFamily: styles.fontFamily,
          padding: styles.padding,
          margin: styles.margin,
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          borderRadius: styles.borderRadius,
          position: {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom
          }
        };
      });
      
      console.log('🔐 Login Button Styles:');
      console.log(JSON.stringify(loginInfo, null, 2));
    }
    
    // Analyze body and overall layout
    const bodyInfo = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        fontFamily: styles.fontFamily,
        fontSize: styles.fontSize,
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        margin: styles.margin,
        padding: styles.padding,
        minHeight: styles.minHeight,
        height: styles.height
      };
    });
    
    console.log('🎨 Body Styles:');
    console.log(JSON.stringify(bodyInfo, null, 2));
    
    // Now let's send a message to see the chat state
    console.log('💬 Sending test message to analyze chat state...');
    
    if (await inputArea.isVisible()) {
      await inputArea.fill('Hello, this is a test message to analyze ChatGPT\'s chat interface layout.');
      await page.waitForTimeout(1000);
      
      // Try to find and click send button
      if (await sendButton.isVisible()) {
        await sendButton.click();
        await page.waitForTimeout(3000);
        
        // Take screenshot of chat state
        await page.screenshot({ path: 'chatgpt-chat-state.png', fullPage: true });
        
        // Analyze messages area
        const messagesArea = await page.locator('[data-testid*="conversation"], .conversation, .messages, [role="log"]').first();
        if (await messagesArea.isVisible()) {
          const messagesInfo = await messagesArea.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
              display: styles.display,
              flexDirection: styles.flexDirection,
              padding: styles.padding,
              margin: styles.margin,
              maxHeight: styles.maxHeight,
              overflow: styles.overflow,
              position: {
                top: rect.top,
                left: rect.left,
                right: rect.right,
                bottom: rect.bottom
              }
            };
          });
          
          console.log('💬 Messages Area Styles:');
          console.log(JSON.stringify(messagesInfo, null, 2));
        }
        
        // Analyze individual messages
        const messages = await page.locator('[data-testid*="message"], .message, [role="assistant"], [role="user"]').all();
        console.log(`📨 Found ${messages.length} messages`);
        
        for (let i = 0; i < Math.min(messages.length, 3); i++) {
          const messageInfo = await messages[i].evaluate((el) => {
            const styles = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
              text: el.textContent.substring(0, 100) + '...',
              padding: styles.padding,
              margin: styles.margin,
              backgroundColor: styles.backgroundColor,
              borderRadius: styles.borderRadius,
              maxWidth: styles.maxWidth,
              width: styles.width,
              position: {
                top: rect.top,
                left: rect.left,
                right: rect.right,
                bottom: rect.bottom
              }
            };
          });
          
          console.log(`📨 Message ${i + 1} Styles:`);
          console.log(JSON.stringify(messageInfo, null, 2));
        }
      }
    }
    
    // Analyze the input area in chat state
    const inputInChatState = await page.locator('textarea, input[type="text"], [data-testid*="input"], [data-testid*="composer"]').first();
    const inputChatInfo = await inputInChatState.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        placeholder: el.placeholder,
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily,
        padding: styles.padding,
        margin: styles.margin,
        border: styles.border,
        borderRadius: styles.borderRadius,
        width: styles.width,
        height: styles.height,
        minHeight: styles.minHeight,
        maxHeight: styles.maxHeight,
        position: {
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom
        }
      };
    });
    
    console.log('📝 Input Area in Chat State:');
    console.log(JSON.stringify(inputChatInfo, null, 2));
    
    // Get all CSS custom properties (CSS variables)
    const cssVariables = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = window.getComputedStyle(root);
      const variables = {};
      
      // Get all CSS custom properties
      for (let i = 0; i < styles.length; i++) {
        const prop = styles[i];
        if (prop.startsWith('--')) {
          variables[prop] = styles.getPropertyValue(prop);
        }
      }
      
      return variables;
    });
    
    console.log('🎨 CSS Custom Properties:');
    console.log(JSON.stringify(cssVariables, null, 2));
    
    console.log('✅ Analysis complete! Check the screenshots:');
    console.log('- chatgpt-initial-state.png');
    console.log('- chatgpt-chat-state.png');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await browser.close();
  }
}

// Run the analysis
analyzeChatGPT().catch(console.error);