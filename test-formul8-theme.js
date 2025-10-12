const { chromium, firefox, webkit } = require('playwright');

async function testFormul8DarkTheme() {
  console.log('🎨 Testing Formul8 Dark Theme Deployment');
  console.log('==========================================');
  
  const browsers = [
    { name: 'Chromium', browser: chromium },
    { name: 'Firefox', browser: firefox },
    { name: 'WebKit', browser: webkit }
  ];
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };
  
  for (const { name, browser } of browsers) {
    console.log(`\n🌐 Testing with ${name}...`);
    
    const browserInstance = await browser.launch({ headless: false });
    const page = await browserInstance.newPage();
    
    try {
      // Navigate to the chat page
      console.log('  📱 Loading f8.syzygyx.com/chat...');
      await page.goto('https://f8.syzygyx.com/chat', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      // Take screenshot
      await page.screenshot({ path: `formul8-theme-${name.toLowerCase()}.png` });
      console.log(`  📸 Screenshot saved: formul8-theme-${name.toLowerCase()}.png`);
      
      // Test 1: Check if page loads
      const pageLoaded = await page.evaluate(() => {
        return document.title.includes('Formul8') && document.title.includes('Dark Theme');
      });
      
      results.total++;
      if (pageLoaded) {
        results.passed++;
        console.log('  ✅ Page loads with correct title');
        results.details.push(`${name} - Page Title: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Page title incorrect');
        results.details.push(`${name} - Page Title: FAIL`);
      }
      
      // Test 2: Check for Formul8 CSS variables
      const hasFormul8CSS = await page.evaluate(() => {
        const style = document.querySelector('style');
        return style && style.textContent.includes('--formul8-primary');
      });
      
      results.total++;
      if (hasFormul8CSS) {
        results.passed++;
        console.log('  ✅ Formul8 CSS variables present');
        results.details.push(`${name} - CSS Variables: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Formul8 CSS variables missing');
        results.details.push(`${name} - CSS Variables: FAIL`);
      }
      
      // Test 3: Check for dark theme
      const hasDarkTheme = await page.evaluate(() => {
        const style = document.querySelector('style');
        return style && (
          style.textContent.includes('var(--formul8-bg-primary)') ||
          style.textContent.includes('#0a0a0a') ||
          style.textContent.includes('background: linear-gradient')
        );
      });
      
      results.total++;
      if (hasDarkTheme) {
        results.passed++;
        console.log('  ✅ Dark theme styling present');
        results.details.push(`${name} - Dark Theme: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Dark theme styling missing');
        results.details.push(`${name} - Dark Theme: FAIL`);
      }
      
      // Test 4: Check for tier selector buttons
      const hasTierButtons = await page.evaluate(() => {
        const buttons = document.querySelectorAll('[data-tier]');
        return buttons.length >= 6; // Free, Standard, Micro, Operator, Enterprise, Admin
      });
      
      results.total++;
      if (hasTierButtons) {
        results.passed++;
        console.log('  ✅ Tier selector buttons present');
        results.details.push(`${name} - Tier Buttons: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Tier selector buttons missing');
        results.details.push(`${name} - Tier Buttons: FAIL`);
      }
      
      // Test 5: Check for Formul8 branding elements
      const hasFormul8Branding = await page.evaluate(() => {
        const hasTitle = document.title.includes('Formul8');
        const hasHeader = document.querySelector('h1') && document.querySelector('h1').textContent.includes('Formul8');
        const hasFeatureTags = document.querySelectorAll('.feature-tag').length > 0;
        return hasTitle && hasHeader && hasFeatureTags;
      });
      
      results.total++;
      if (hasFormul8Branding) {
        results.passed++;
        console.log('  ✅ Formul8 branding elements present');
        results.details.push(`${name} - Branding: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Formul8 branding elements missing');
        results.details.push(`${name} - Branding: FAIL`);
      }
      
      // Test 6: Check for chat interface elements
      const hasChatInterface = await page.evaluate(() => {
        const hasInput = document.querySelector('input[type="text"]') || document.querySelector('.chat-input');
        const hasSendButton = document.querySelector('button') && document.querySelector('button').textContent.includes('Send');
        const hasChatWrapper = document.querySelector('.chat-wrapper') || document.querySelector('.chat-messages');
        return hasInput && hasSendButton && hasChatWrapper;
      });
      
      results.total++;
      if (hasChatInterface) {
        results.passed++;
        console.log('  ✅ Chat interface elements present');
        results.details.push(`${name} - Chat Interface: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Chat interface elements missing');
        results.details.push(`${name} - Chat Interface: FAIL`);
      }
      
      // Test 7: Check for responsive design
      const hasResponsiveDesign = await page.evaluate(() => {
        const hasViewport = document.querySelector('meta[name="viewport"]');
        const hasFlexbox = document.querySelector('.tier-selector') && 
                          window.getComputedStyle(document.querySelector('.tier-selector')).display === 'flex';
        return hasViewport && hasFlexbox;
      });
      
      results.total++;
      if (hasResponsiveDesign) {
        results.passed++;
        console.log('  ✅ Responsive design elements present');
        results.details.push(`${name} - Responsive Design: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Responsive design elements missing');
        results.details.push(`${name} - Responsive Design: FAIL`);
      }
      
      // Test 8: Check for cannabis industry styling
      const hasCannabisStyling = await page.evaluate(() => {
        const style = document.querySelector('style');
        if (!style) return false;
        
        const hasGreenColors = style.textContent.includes('#00ff88') || style.textContent.includes('#00d4aa');
        const hasGlowEffects = style.textContent.includes('glow') || style.textContent.includes('box-shadow');
        const hasCannabisTerms = document.body.textContent.toLowerCase().includes('cannabis') || 
                                document.body.textContent.toLowerCase().includes('thc');
        
        return hasGreenColors && hasGlowEffects && hasCannabisTerms;
      });
      
      results.total++;
      if (hasCannabisStyling) {
        results.passed++;
        console.log('  ✅ Cannabis industry styling present');
        results.details.push(`${name} - Cannabis Styling: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Cannabis industry styling missing');
        results.details.push(`${name} - Cannabis Styling: FAIL`);
      }
      
      // Test tier switching functionality
      console.log('  🔄 Testing tier switching...');
      const tierSwitching = await page.evaluate(() => {
        const buttons = document.querySelectorAll('[data-tier]');
        if (buttons.length === 0) return false;
        
        // Try clicking different tiers
        let switched = false;
        for (let i = 0; i < Math.min(3, buttons.length); i++) {
          const button = buttons[i];
          if (button) {
            button.click();
            if (button.classList.contains('active')) {
              switched = true;
              break;
            }
          }
        }
        return switched;
      });
      
      results.total++;
      if (tierSwitching) {
        results.passed++;
        console.log('  ✅ Tier switching functional');
        results.details.push(`${name} - Tier Switching: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Tier switching not functional');
        results.details.push(`${name} - Tier Switching: FAIL`);
      }
      
    } catch (error) {
      console.error(`  ❌ Error testing ${name}:`, error.message);
      results.fetails.push(`${name} - Error: ${error.message}`);
    } finally {
      await browserInstance.close();
    }
  }
  
  // Print results
  console.log('\n📊 TEST RESULTS');
  console.log('================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} (${((results.passed / results.total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${results.failed} (${((results.failed / results.total) * 100).toFixed(1)}%)`);
  
  console.log('\n📋 DETAILED RESULTS');
  console.log('===================');
  results.details.forEach(detail => console.log(`  ${detail}`));
  
  if (results.passed === results.total) {
    console.log('\n🎉 ALL TESTS PASSED! Formul8 Dark Theme is fully deployed and working!');
  } else if (results.passed > results.total * 0.8) {
    console.log('\n✅ MOSTLY SUCCESSFUL! Formul8 Dark Theme is mostly working with minor issues.');
  } else {
    console.log('\n⚠️  SOME ISSUES FOUND! Formul8 Dark Theme needs attention.');
  }
  
  return results;
}

// Run the test
testFormul8DarkTheme().catch(console.error);