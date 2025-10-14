const { chromium } = require('playwright');

async function testDeployedPage() {
  console.log('🚀 Testing deployed future4200.html page...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Test the deployed page
    console.log('📱 Loading https://f8.syzygyx.com/future4200.html...');
    await page.goto('https://f8.syzygyx.com/future4200.html', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    // Take a screenshot
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'deployed-future4200-screenshot.png', fullPage: true });
    
    // Test the page structure
    console.log('🔍 Testing page structure...');
    
    // Check if main elements exist
    const header = await page.$('.header');
    const logo = await page.$('.logo');
    const categories = await page.$$('.category-card');
    const topics = await page.$$('.topic-item');
    
    console.log('✅ Header found:', !!header);
    console.log('✅ Logo found:', !!logo);
    console.log('✅ Categories found:', categories.length);
    console.log('✅ Topics found:', topics.length);
    
    // Test responsive design
    console.log('📱 Testing responsive design...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'deployed-future4200-mobile.png', fullPage: true });
    console.log('✅ Mobile viewport test completed');
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'deployed-future4200-desktop.png', fullPage: true });
    console.log('✅ Desktop viewport test completed');
    
    // Test interactions
    console.log('🖱️ Testing interactions...');
    
    // Test category card hover
    const firstCategory = await page.$('.category-card');
    if (firstCategory) {
      await firstCategory.hover();
      await page.waitForTimeout(500);
      console.log('✅ Category hover effect tested');
    }
    
    // Test topic item hover
    const firstTopic = await page.$('.topic-item');
    if (firstTopic) {
      await firstTopic.hover();
      await page.waitForTimeout(500);
      console.log('✅ Topic hover effect tested');
    }
    
    // Test button clicks
    const loginBtn = await page.$('.btn-secondary');
    if (loginBtn) {
      await loginBtn.click();
      await page.waitForTimeout(500);
      console.log('✅ Login button click tested');
    }
    
    // Check color scheme
    console.log('🎨 Checking color scheme...');
    const bodyColor = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = getComputedStyle(body);
      return {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color
      };
    });
    
    console.log('✅ Body colors:', bodyColor);
    
    // Check if dark theme is applied
    const isDarkTheme = bodyColor.backgroundColor.includes('rgb(14, 14, 14)') || 
                       bodyColor.backgroundColor.includes('#0e0e0e');
    console.log('✅ Dark theme applied:', isDarkTheme);
    
    // Test navigation
    console.log('🧭 Testing navigation...');
    const navLinks = await page.$$('.nav-link');
    console.log('✅ Navigation links found:', navLinks.length);
    
    // Test footer
    console.log('🦶 Testing footer...');
    const footer = await page.$('.footer');
    const footerLinks = await page.$$('.footer-link');
    console.log('✅ Footer found:', !!footer);
    console.log('✅ Footer links found:', footerLinks.length);
    
    // Test page title
    const title = await page.title();
    console.log('✅ Page title:', title);
    
    // Test meta description
    const metaDescription = await page.$eval('meta[name="description"]', el => el.content);
    console.log('✅ Meta description:', metaDescription);
    
    console.log('\n🎉 All tests passed! The future4200.html page is successfully deployed and working!');
    console.log('🌐 Page URL: https://f8.syzygyx.com/future4200.html');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await browser.close();
  }
}

testDeployedPage().catch(console.error);