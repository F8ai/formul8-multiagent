#!/usr/bin/env node

/**
 * Test our local /chat implementation
 */

const { chromium } = require('playwright');

async function testLocalChat() {
  console.log('🧪 Testing local /chat implementation...');
  
  const browser = await chromium.launch({ 
    headless: false, // Run in headed mode to see the interface
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Test the Lambda function locally by creating a simple server
    console.log('📱 Testing /chat endpoint...');
    
    // Create a simple test server
    const http = require('http');
    const fs = require('fs');
    
    // Read our Lambda function
    const lambdaCode = fs.readFileSync('lambda.js', 'utf8');
    
    // Extract the HTML from the Lambda function
    const htmlMatch = lambdaCode.match(/const html = `([\s\S]*?)`;/);
    if (!htmlMatch) {
      throw new Error('Could not extract HTML from Lambda function');
    }
    
    const html = htmlMatch[1];
    
    // Create a simple server
    const server = http.createServer((req, res) => {
      if (req.url === '/chat') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    
    server.listen(3001, () => {
      console.log('🚀 Test server running on http://localhost:3001');
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Navigate to our chat interface
    await page.goto('http://localhost:3001/chat', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    console.log('✅ Successfully loaded /chat interface');
    
    // Take a screenshot
    await page.screenshot({ path: 'local-chat-test.png', fullPage: true });
    console.log('📸 Screenshot saved as local-chat-test.png');
    
    // Test the interface elements
    const title = await page.locator('.chat-title').textContent();
    console.log(`📝 Title: "${title}"`);
    
    const placeholder = await page.locator('.chat-input').getAttribute('placeholder');
    console.log(`💬 Placeholder: "${placeholder}"`);
    
    const loginButton = await page.locator('.login-button').textContent();
    console.log(`🔐 Login button: "${loginButton}"`);
    
    // Test the dynamic behavior
    console.log('🔄 Testing dynamic layout transition...');
    
    // Check initial state
    const initialContainer = await page.locator('.chat-container.initial-state');
    const isInitialState = await initialContainer.isVisible();
    console.log(`🎯 Initial state active: ${isInitialState}`);
    
    // Type a message to trigger transition
    await page.fill('.chat-input', 'Hello, this is a test message');
    console.log('✍️ Typed test message');
    
    // Click send button
    await page.click('.send-button');
    console.log('📤 Clicked send button');
    
    // Wait for transition
    await page.waitForTimeout(2000);
    
    // Check if transitioned to chat state
    const chatContainer = await page.locator('.chat-container.chat-state');
    const isChatState = await chatContainer.isVisible();
    console.log(`💬 Chat state active: ${isChatState}`);
    
    // Take another screenshot
    await page.screenshot({ path: 'local-chat-test-after-message.png', fullPage: true });
    console.log('📸 Screenshot after message saved as local-chat-test-after-message.png');
    
    console.log('✅ Local chat test completed successfully!');
    
    // Close server
    server.close();
    
  } catch (error) {
    console.error('❌ Error during local test:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testLocalChat().catch(console.error);