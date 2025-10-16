const { chromium } = require('playwright');

async function testBothURLs() {
  console.log('🔍 Testing F8 URL Variants');
  console.log('==========================\n');
  
  const browser = await chromium.launch({ headless: false });
  
  const urls = [
    'https://f8.syzygyx.com',
    'https://f8.syzygyx.com/chat',
    'https://f8.syzygyx.com/chat.html'
  ];
  
  for (const url of urls) {
    console.log(`\n📱 Testing: ${url}`);
    console.log('─'.repeat(50));
    
    const page = await browser.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
      
      const title = await page.title();
      const finalUrl = page.url();
      
      console.log(`  ✅ Loaded successfully`);
      console.log(`  📄 Title: "${title}"`);
      console.log(`  🔗 Final URL: ${finalUrl}`);
      
      // Check for key elements
      const elements = await page.evaluate(() => {
        const input = document.querySelector('input[type="text"], textarea, #chatInput');
        const sendButton = document.querySelector('button');
        const planSelect = document.querySelector('#planSelect');
        
        // Check for Formul8 theme vars
        const root = document.documentElement;
        const primaryColor = getComputedStyle(root).getPropertyValue('--formul8-primary')?.trim();
        
        return {
          hasInput: !!input,
          inputId: input?.id || 'none',
          hasSendButton: !!sendButton,
          hasPlanSelect: !!planSelect,
          hasFormul8Theme: !!primaryColor,
          primaryColor: primaryColor || 'none'
        };
      });
      
      console.log(`  ${elements.hasInput ? '✅' : '❌'} Chat Input (${elements.inputId})`);
      console.log(`  ${elements.hasSendButton ? '✅' : '❌'} Send Button`);
      console.log(`  ${elements.hasPlanSelect ? '✅' : '❌'} Plan Selector`);
      console.log(`  ${elements.hasFormul8Theme ? '✅' : '❌'} Formul8 Theme (${elements.primaryColor})`);
      
      // Take screenshot
      const filename = url.replace(/https?:\/\//, '').replace(/\//g, '-') + '.png';
      await page.screenshot({ path: filename });
      console.log(`  📸 Screenshot: ${filename}`);
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    } finally {
      await page.close();
    }
  }
  
  await browser.close();
  
  console.log('\n\n🎯 SUMMARY');
  console.log('═'.repeat(50));
  console.log('✅ Test the URLs above to see which one has:');
  console.log('   1. Formul8 branding (#00ff88 theme)');
  console.log('   2. Plan selector dropdown');
  console.log('   3. Proper authentication');
}

testBothURLs().catch(console.error);



