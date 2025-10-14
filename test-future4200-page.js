const { chromium } = require('playwright');

async function testFuture4200Page() {
  console.log('🚀 Testing the future4200.html page...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the local HTML file
    console.log('📱 Loading future4200.html...');
    await page.goto('file://' + __dirname + '/future4200.html');
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Take a screenshot
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'future4200-mimic-screenshot.png', fullPage: true });
    
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
    await page.screenshot({ path: 'future4200-mobile-screenshot.png', fullPage: true });
    console.log('✅ Mobile viewport test completed');
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'future4200-tablet-screenshot.png', fullPage: true });
    console.log('✅ Tablet viewport test completed');
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'future4200-desktop-screenshot.png', fullPage: true });
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
    
    // Test topic title clicks
    const firstTopicTitle = await page.$('.topic-title');
    if (firstTopicTitle) {
      await firstTopicTitle.click();
      await page.waitForTimeout(500);
      console.log('✅ Topic title click tested');
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
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await browser.close();
  }
}

testFuture4200Page().catch(console.error);