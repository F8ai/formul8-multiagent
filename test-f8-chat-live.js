const { chromium } = require('playwright');

async function testF8ChatLive() {
  console.log('🌐 Testing F8 Chat Live Functionality');
  console.log('=====================================');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the live F8 chat
    console.log('📱 Loading f8.syzygyx.com/chat...');
    await page.goto('https://f8.syzygyx.com/chat', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'f8-chat-live-test.png' });
    console.log('📸 Screenshot saved: f8-chat-live-test.png');
    
    // Test 1: Check if page loads
    const pageLoaded = await page.evaluate(() => {
      return document.title.includes('Formul8') && document.title.includes('Chat');
    });
    
    console.log(`✅ Page loads: ${pageLoaded ? 'YES' : 'NO'}`);
    
    // Test 2: Check for chat interface elements
    const chatElements = await page.evaluate(() => {
      const chatInput = document.querySelector('input[type="text"]') || document.querySelector('.chat-input');
      const sendButton = document.querySelector('button') || document.querySelector('.send-button');
      const messages = document.querySelector('.chat-messages') || document.querySelector('#chatMessages');
      
      return {
        hasInput: !!chatInput,
        hasSendButton: !!sendButton,
        hasMessages: !!messages,
        inputPlaceholder: chatInput?.placeholder || 'No input found',
        buttonText: sendButton?.textContent || 'No button found'
      };
    });
    
    console.log('🎯 Chat elements found:', chatElements);
    
    // Test 3: Test typing in chat
    if (chatElements.hasInput) {
      console.log('💬 Testing chat input...');
      
      const input = page.locator('input[type="text"], .chat-input').first();
      await input.fill('Test message from Playwright');
      console.log('✅ Successfully typed test message');
      
      // Test 4: Test sending message
      if (chatElements.hasSendButton) {
        console.log('📤 Testing send button...');
        
        const sendButton = page.locator('button, .send-button').first();
        await sendButton.click();
        console.log('✅ Successfully clicked send button');
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        // Check for response
        const responseFound = await page.evaluate(() => {
          const messages = document.querySelectorAll('.message, [class*="message"]');
          return messages.length > 0;
        });
        
        console.log(`💬 Response received: ${responseFound ? 'YES' : 'NO'}`);
      }
    }
    
    // Test 5: Check for tier selector
    const tierSelector = await page.evaluate(() => {
      const tierButtons = document.querySelectorAll('[data-tier], .tier-button');
      return {
        hasTierButtons: tierButtons.length > 0,
        buttonCount: tierButtons.length,
        buttonTexts: Array.from(tierButtons).map(btn => btn.textContent)
      };
    });
    
    console.log('🎯 Tier selector:', tierSelector);
    
    // Test 6: Check for Formul8 theming
    const theming = await page.evaluate(() => {
      const style = document.querySelector('style');
      const hasFormul8Vars = style?.textContent.includes('--formul8-primary') || false;
      const hasGreenColors = style?.textContent.includes('#00ff88') || false;
      const hasDarkBg = style?.textContent.includes('var(--formul8-bg-primary)') || false;
      
      return {
        hasFormul8Vars,
        hasGreenColors,
        hasDarkBg,
        styleLength: style?.textContent.length || 0
      };
    });
    
    console.log('🎨 Theming check:', theming);
    
    // Test 7: Test API directly
    console.log('🔌 Testing API directly...');
    
    const apiResponse = await page.request.post('https://f8.syzygyx.com/api/chat', {
      data: { message: 'API test from Playwright' }
    });
    
    const apiData = await apiResponse.json();
    console.log('📡 API response:', {
      status: apiResponse.status(),
      success: apiData.success,
      hasResponse: !!apiData.response,
      agent: apiData.agent
    });
    
    // Overall assessment
    const overallWorking = pageLoaded && 
                          chatElements.hasInput && 
                          chatElements.hasSendButton && 
                          tierSelector.hasTierButtons &&
                          theming.hasFormul8Vars;
    
    console.log('\n📊 OVERALL ASSESSMENT:');
    console.log(`✅ F8 Chat Working: ${overallWorking ? 'YES' : 'NO'}`);
    console.log(`✅ Page Loads: ${pageLoaded ? 'YES' : 'NO'}`);
    console.log(`✅ Chat Interface: ${chatElements.hasInput && chatElements.hasSendButton ? 'YES' : 'NO'}`);
    console.log(`✅ Tier Selector: ${tierSelector.hasTierButtons ? 'YES' : 'NO'}`);
    console.log(`✅ Formul8 Theming: ${theming.hasFormul8Vars ? 'YES' : 'NO'}`);
    console.log(`✅ API Working: ${apiResponse.status() === 200 ? 'YES' : 'NO'}`);
    
    if (overallWorking) {
      console.log('\n🎉 F8 Chat is fully functional!');
    } else {
      console.log('\n⚠️  F8 Chat has some issues that need attention.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testF8ChatLive().catch(console.error);