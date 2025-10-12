const { chromium } = require('playwright');

async function testFormul8Chat() {
  console.log('🚀 Starting Formul8 Chat Test...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the chat page
    console.log('📱 Navigating to https://f8.syzygyx.com/chat...');
    await page.goto('https://f8.syzygyx.com/chat', { waitUntil: 'networkidle' });
    
    // Wait for the page to load
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('📸 Screenshot saved as test-screenshot.png');
    
    // Check if we can find any input elements
    const inputs = await page.locator('input, textarea').count();
    console.log(`🔍 Found ${inputs} input elements`);
    
    // Check for any text content
    const bodyText = await page.textContent('body');
    console.log(`📄 Page content length: ${bodyText.length} characters`);
    
    // Check for specific elements
    const hasTextarea = await page.locator('textarea').count() > 0;
    const hasInput = await page.locator('input').count() > 0;
    const hasButton = await page.locator('button').count() > 0;
    
    console.log(`✅ Textarea found: ${hasTextarea}`);
    console.log(`✅ Input found: ${hasInput}`);
    console.log(`✅ Button found: ${hasButton}`);
    
    // Try to find chat-related elements
    const chatElements = await page.locator('[class*="chat"], [id*="chat"], [class*="message"], [id*="message"]').count();
    console.log(`💬 Chat-related elements found: ${chatElements}`);
    
    // Check for any error messages
    const errorElements = await page.locator('[class*="error"], [class*="Error"]').count();
    console.log(`❌ Error elements found: ${errorElements}`);
    
    // Check page title
    const title = await page.title();
    console.log(`📋 Page title: "${title}"`);
    
    // Check URL
    const url = page.url();
    console.log(`🌐 Current URL: ${url}`);
    
    // Test basic functionality if we find input elements
    if (hasTextarea || hasInput) {
      console.log('🧪 Testing basic chat functionality...');
      
      const inputSelector = hasTextarea ? 'textarea' : 'input';
      const input = page.locator(inputSelector).first();
      
      if (await input.isVisible()) {
        console.log('✅ Input element is visible');
        
        // Try to type a test message
        await input.fill('What is cannabis?');
        console.log('✅ Successfully typed test message');
        
        // Look for send button
        const sendButton = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Submit")').first();
        
        if (await sendButton.isVisible()) {
          console.log('✅ Send button found and visible');
          
          // Click send button
          await sendButton.click();
          console.log('✅ Clicked send button');
          
          // Wait for response
          await page.waitForTimeout(5000);
          console.log('⏳ Waited for response...');
          
          // Check for response elements
          const responseElements = await page.locator('.message, .response, .chat-message, [data-testid*="message"]').count();
          console.log(`💬 Response elements found: ${responseElements}`);
          
          if (responseElements > 0) {
            console.log('✅ Chat functionality appears to be working!');
          } else {
            console.log('⚠️ No response elements found, but input worked');
          }
        } else {
          console.log('⚠️ Send button not found or not visible');
        }
      } else {
        console.log('⚠️ Input element not visible');
      }
    } else {
      console.log('⚠️ No input elements found for testing');
    }
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await browser.close();
    console.log('🔚 Browser closed');
  }
}

// Run the test
testFormul8Chat().catch(console.error);