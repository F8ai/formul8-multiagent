const { chromium } = require('playwright');

async function testLocalChat() {
  console.log('🧪 Testing Local Chat Interface');
  console.log('================================\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Test local first
    console.log('📱 Loading local chat...');
    await page.goto('http://localhost:3333/chat.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('✅ Page loaded successfully');
    
    // Take screenshot
    await page.screenshot({ path: 'local-chat-test.png', fullPage: true });
    console.log('📸 Screenshot saved: local-chat-test.png');
    
    // Check page title
    const title = await page.title();
    console.log(`📄 Page title: "${title}"`);
    
    // Check for chat elements
    const elements = await page.evaluate(() => {
      const input = document.querySelector('#chatInput');
      const sendButton = document.querySelector('#sendButton');
      const messages = document.querySelector('#chatMessages');
      const planSelect = document.querySelector('#planSelect');
      
      return {
        hasInput: !!input,
        inputPlaceholder: input?.placeholder || 'None',
        hasSendButton: !!sendButton,
        buttonText: sendButton?.textContent?.trim() || 'None',
        hasMessages: !!messages,
        hasPlanSelect: !!planSelect,
        planOptions: planSelect ? Array.from(planSelect.options).map(o => o.value) : []
      };
    });
    
    console.log('\n🔍 Interface Elements:');
    console.log(`  ${elements.hasInput ? '✅' : '❌'} Chat Input: ${elements.inputPlaceholder}`);
    console.log(`  ${elements.hasSendButton ? '✅' : '❌'} Send Button: ${elements.buttonText}`);
    console.log(`  ${elements.hasMessages ? '✅' : '❌'} Messages Container`);
    console.log(`  ${elements.hasPlanSelect ? '✅' : '❌'} Plan Selector`);
    
    if (elements.hasPlanSelect) {
      console.log(`  📋 Plans available: ${elements.planOptions.join(', ')}`);
    }
    
    // Test typing
    console.log('\n⌨️  Testing input...');
    await page.fill('#chatInput', 'Hello, this is a test message!');
    console.log('  ✅ Successfully typed in input');
    
    // Check if input has the value
    const inputValue = await page.inputValue('#chatInput');
    console.log(`  📝 Input value: "${inputValue}"`);
    
    // Check theme
    console.log('\n🎨 Checking theme...');
    const theme = await page.evaluate(() => {
      const root = document.documentElement;
      const primaryColor = getComputedStyle(root).getPropertyValue('--formul8-primary').trim();
      const bgColor = getComputedStyle(root).getPropertyValue('--formul8-bg-primary').trim();
      
      return {
        primaryColor,
        bgColor,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        bodyColor: getComputedStyle(document.body).color
      };
    });
    
    console.log(`  ✅ Primary color: ${theme.primaryColor}`);
    console.log(`  ✅ Background: ${theme.bgColor}`);
    console.log(`  📊 Body background: ${theme.bodyBg}`);
    console.log(`  📊 Body text color: ${theme.bodyColor}`);
    
    // Overall assessment
    const allWorking = elements.hasInput && 
                      elements.hasSendButton && 
                      elements.hasMessages && 
                      elements.hasPlanSelect &&
                      inputValue === 'Hello, this is a test message!';
    
    console.log('\n\n🎯 TEST RESULT:');
    console.log(`${allWorking ? '✅ ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'}`);
    console.log(`\nLocal chat interface is ${allWorking ? 'fully functional' : 'partially functional'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testLocalChat().catch(console.error);



