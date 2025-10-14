#!/usr/bin/env node

/**
 * Quick ChatGPT analysis script
 * Analyzes key styles and layouts from ChatGPT
 */

const { chromium } = require('playwright');

async function quickAnalyzeChatGPT() {
  console.log('🔍 Quick ChatGPT analysis starting...');
  
  const browser = await chromium.launch({ 
    headless: true // Run headless for speed
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
    await page.waitForTimeout(2000);
    
    console.log('📊 Analyzing key elements...');
    
    // Get comprehensive style analysis
    const analysis = await page.evaluate(() => {
      const results = {};
      
      // Body styles
      const body = document.body;
      const bodyStyles = window.getComputedStyle(body);
      results.body = {
        fontFamily: bodyStyles.fontFamily,
        fontSize: bodyStyles.fontSize,
        backgroundColor: bodyStyles.backgroundColor,
        color: bodyStyles.color,
        margin: bodyStyles.margin,
        padding: bodyStyles.padding,
        minHeight: bodyStyles.minHeight
      };
      
      // Main container
      const main = document.querySelector('main, [role="main"], .main-container');
      if (main) {
        const mainStyles = window.getComputedStyle(main);
        const mainRect = main.getBoundingClientRect();
        results.main = {
          display: mainStyles.display,
          flexDirection: mainStyles.flexDirection,
          justifyContent: mainStyles.justifyContent,
          alignItems: mainStyles.alignItems,
          padding: mainStyles.padding,
          margin: mainStyles.margin,
          maxWidth: mainStyles.maxWidth,
          width: mainStyles.width,
          height: mainStyles.height,
          minHeight: mainStyles.minHeight,
          position: {
            top: mainRect.top,
            left: mainRect.left,
            right: mainRect.right,
            bottom: mainRect.bottom
          }
        };
      }
      
      // Input area
      const input = document.querySelector('textarea, input[type="text"], [data-testid*="input"], [data-testid*="composer"]');
      if (input) {
        const inputStyles = window.getComputedStyle(input);
        const inputRect = input.getBoundingClientRect();
        results.input = {
          placeholder: input.placeholder,
          fontSize: inputStyles.fontSize,
          fontFamily: inputStyles.fontFamily,
          padding: inputStyles.padding,
          margin: inputStyles.margin,
          border: inputStyles.border,
          borderRadius: inputStyles.borderRadius,
          width: inputStyles.width,
          height: inputStyles.height,
          minHeight: inputStyles.minHeight,
          maxHeight: inputStyles.maxHeight,
          backgroundColor: inputStyles.backgroundColor,
          position: {
            top: inputRect.top,
            left: inputRect.left,
            right: inputRect.right,
            bottom: inputRect.bottom
          }
        };
      }
      
      // Send button
      const sendButton = document.querySelector('button[type="submit"], [data-testid*="send"]') || 
                        Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Send'));
      if (sendButton) {
        const buttonStyles = window.getComputedStyle(sendButton);
        const buttonRect = sendButton.getBoundingClientRect();
        results.sendButton = {
          width: buttonStyles.width,
          height: buttonStyles.height,
          padding: buttonStyles.padding,
          margin: buttonStyles.margin,
          borderRadius: buttonStyles.borderRadius,
          backgroundColor: buttonStyles.backgroundColor,
          color: buttonStyles.color,
          fontSize: buttonStyles.fontSize,
          position: {
            top: buttonRect.top,
            left: buttonRect.left,
            right: buttonRect.right,
            bottom: buttonRect.bottom
          }
        };
      }
      
      // Header
      const header = document.querySelector('header, nav, .header, [role="banner"]');
      if (header) {
        const headerStyles = window.getComputedStyle(header);
        const headerRect = header.getBoundingClientRect();
        results.header = {
          height: headerStyles.height,
          padding: headerStyles.padding,
          margin: headerStyles.margin,
          backgroundColor: headerStyles.backgroundColor,
          borderBottom: headerStyles.borderBottom,
          display: headerStyles.display,
          justifyContent: headerStyles.justifyContent,
          alignItems: headerStyles.alignItems,
          position: {
            top: headerRect.top,
            left: headerRect.left,
            right: headerRect.right,
            bottom: headerRect.bottom
          }
        };
      }
      
      // Login button
      const loginButton = document.querySelector('[data-testid*="login"]') || 
                         Array.from(document.querySelectorAll('button, a')).find(btn => btn.textContent.includes('Log in'));
      if (loginButton) {
        const loginStyles = window.getComputedStyle(loginButton);
        const loginRect = loginButton.getBoundingClientRect();
        results.loginButton = {
          text: loginButton.textContent,
          fontSize: loginStyles.fontSize,
          fontFamily: loginStyles.fontFamily,
          padding: loginStyles.padding,
          margin: loginStyles.margin,
          backgroundColor: loginStyles.backgroundColor,
          color: loginStyles.color,
          borderRadius: loginStyles.borderRadius,
          position: {
            top: loginRect.top,
            left: loginRect.left,
            right: loginRect.right,
            bottom: loginRect.bottom
          }
        };
      }
      
      // Messages area
      const messagesArea = document.querySelector('[data-testid*="conversation"], .conversation, .messages, [role="log"]');
      if (messagesArea) {
        const messagesStyles = window.getComputedStyle(messagesArea);
        const messagesRect = messagesArea.getBoundingClientRect();
        results.messagesArea = {
          display: messagesStyles.display,
          flexDirection: messagesStyles.flexDirection,
          padding: messagesStyles.padding,
          margin: messagesStyles.margin,
          maxHeight: messagesStyles.maxHeight,
          overflow: messagesStyles.overflow,
          position: {
            top: messagesRect.top,
            left: messagesRect.left,
            right: messagesRect.right,
            bottom: messagesRect.bottom
          }
        };
      }
      
      // Individual messages
      const messages = document.querySelectorAll('[data-testid*="message"], .message, [role="assistant"], [role="user"]');
      results.messages = [];
      for (let i = 0; i < Math.min(messages.length, 3); i++) {
        const message = messages[i];
        const messageStyles = window.getComputedStyle(message);
        const messageRect = message.getBoundingClientRect();
        results.messages.push({
          text: message.textContent.substring(0, 100) + '...',
          padding: messageStyles.padding,
          margin: messageStyles.margin,
          backgroundColor: messageStyles.backgroundColor,
          borderRadius: messageStyles.borderRadius,
          maxWidth: messageStyles.maxWidth,
          width: messageStyles.width,
          position: {
            top: messageRect.top,
            left: messageRect.left,
            right: messageRect.right,
            bottom: messageRect.bottom
          }
        });
      }
      
      // CSS custom properties
      const root = document.documentElement;
      const rootStyles = window.getComputedStyle(root);
      const variables = {};
      for (let i = 0; i < rootStyles.length; i++) {
        const prop = rootStyles[i];
        if (prop.startsWith('--')) {
          variables[prop] = rootStyles.getPropertyValue(prop);
        }
      }
      results.cssVariables = variables;
      
      return results;
    });
    
    // Save analysis to file
    const fs = require('fs');
    fs.writeFileSync('chatgpt-analysis.json', JSON.stringify(analysis, null, 2));
    
    console.log('📊 Analysis Results:');
    console.log('==================');
    
    if (analysis.body) {
      console.log('\n🎨 Body Styles:');
      console.log(`Font Family: ${analysis.body.fontFamily}`);
      console.log(`Font Size: ${analysis.body.fontSize}`);
      console.log(`Background: ${analysis.body.backgroundColor}`);
      console.log(`Color: ${analysis.body.color}`);
    }
    
    if (analysis.main) {
      console.log('\n📦 Main Container:');
      console.log(`Display: ${analysis.main.display}`);
      console.log(`Flex Direction: ${analysis.main.flexDirection}`);
      console.log(`Justify Content: ${analysis.main.justifyContent}`);
      console.log(`Align Items: ${analysis.main.alignItems}`);
      console.log(`Max Width: ${analysis.main.maxWidth}`);
      console.log(`Padding: ${analysis.main.padding}`);
    }
    
    if (analysis.input) {
      console.log('\n📝 Input Area:');
      console.log(`Placeholder: "${analysis.input.placeholder}"`);
      console.log(`Font Size: ${analysis.input.fontSize}`);
      console.log(`Font Family: ${analysis.input.fontFamily}`);
      console.log(`Padding: ${analysis.input.padding}`);
      console.log(`Border Radius: ${analysis.input.borderRadius}`);
      console.log(`Width: ${analysis.input.width}`);
      console.log(`Height: ${analysis.input.height}`);
    }
    
    if (analysis.sendButton) {
      console.log('\n🔘 Send Button:');
      console.log(`Width: ${analysis.sendButton.width}`);
      console.log(`Height: ${analysis.sendButton.height}`);
      console.log(`Padding: ${analysis.sendButton.padding}`);
      console.log(`Border Radius: ${analysis.sendButton.borderRadius}`);
      console.log(`Background: ${analysis.sendButton.backgroundColor}`);
    }
    
    if (analysis.header) {
      console.log('\n🔝 Header:');
      console.log(`Height: ${analysis.header.height}`);
      console.log(`Padding: ${analysis.header.padding}`);
      console.log(`Background: ${analysis.header.backgroundColor}`);
      console.log(`Display: ${analysis.header.display}`);
    }
    
    if (analysis.loginButton) {
      console.log('\n🔐 Login Button:');
      console.log(`Text: "${analysis.loginButton.text}"`);
      console.log(`Font Size: ${analysis.loginButton.fontSize}`);
      console.log(`Padding: ${analysis.loginButton.padding}`);
      console.log(`Background: ${analysis.loginButton.backgroundColor}`);
      console.log(`Border Radius: ${analysis.loginButton.borderRadius}`);
    }
    
    if (analysis.messages && analysis.messages.length > 0) {
      console.log('\n💬 Messages:');
      analysis.messages.forEach((msg, i) => {
        console.log(`Message ${i + 1}:`);
        console.log(`  Padding: ${msg.padding}`);
        console.log(`  Margin: ${msg.margin}`);
        console.log(`  Max Width: ${msg.maxWidth}`);
        console.log(`  Background: ${msg.backgroundColor}`);
      });
    }
    
    if (analysis.cssVariables && Object.keys(analysis.cssVariables).length > 0) {
      console.log('\n🎨 CSS Variables:');
      Object.entries(analysis.cssVariables).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
    }
    
    console.log('\n✅ Analysis complete!');
    console.log('📄 Full analysis saved to: chatgpt-analysis.json');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await browser.close();
  }
}

// Run the analysis
quickAnalyzeChatGPT().catch(console.error);