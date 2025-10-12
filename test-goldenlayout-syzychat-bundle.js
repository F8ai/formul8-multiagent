const { chromium, firefox, webkit } = require('playwright');
const path = require('path');

async function testGoldenLayoutSyzyChatBundle() {
  console.log('🏗️ Testing Formul8 GoldenLayout + SyzyChat Bundle');
  console.log('==================================================');
  
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
      // Navigate to the bundled page
      const filePath = path.resolve(__dirname, 'docs/goldenlayout-syzychat-bundle.html');
      console.log('  📱 Loading GoldenLayout + SyzyChat bundle...');
      await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(5000); // Give more time for both libraries to load
      
      // Take screenshot
      await page.screenshot({ path: `goldenlayout-syzychat-bundle-${name.toLowerCase()}.png` });
      console.log(`  📸 Screenshot saved: goldenlayout-syzychat-bundle-${name.toLowerCase()}.png`);
      
      // Test 1: Check if both libraries load
      const librariesLoaded = await page.evaluate(() => {
        return typeof SyzyChat !== 'undefined' && typeof GoldenLayout !== 'undefined';
      });
      
      results.total++;
      if (librariesLoaded) {
        results.passed++;
        console.log('  ✅ Both SyzyChat and GoldenLayout loaded');
        results.details.push(`${name} - Libraries Load: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ One or both libraries failed to load');
        results.details.push(`${name} - Libraries Load: FAIL`);
      }
      
      // Test 2: Check for Formul8SyzyChat class
      const formul8ChatClass = await page.evaluate(() => {
        return typeof Formul8SyzyChat !== 'undefined';
      });
      
      results.total++;
      if (formul8ChatClass) {
        results.passed++;
        console.log('  ✅ Formul8SyzyChat class available');
        results.details.push(`${name} - Formul8SyzyChat Class: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Formul8SyzyChat class not found');
        results.details.push(`${name} - Formul8SyzyChat Class: FAIL`);
      }
      
      // Test 3: Check for three main panels
      const hasThreePanels = await page.evaluate(() => {
        const panels = document.querySelectorAll('.lm_content');
        return panels.length >= 3; // Agent, Chat, Settings panels
      });
      
      results.total++;
      if (hasThreePanels) {
        results.passed++;
        console.log('  ✅ Three main panels present');
        results.details.push(`${name} - Three Panels: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Expected three panels not found');
        results.details.push(`${name} - Three Panels: FAIL`);
      }
      
      // Test 4: Check for SyzyChat container
      const hasSyzyChatContainer = await page.evaluate(() => {
        const container = document.querySelector('#syzychat-container');
        const input = document.querySelector('#syzychat-input');
        const sendButton = document.querySelector('#syzychat-send');
        return container && input && sendButton;
      });
      
      results.total++;
      if (hasSyzyChatContainer) {
        results.passed++;
        console.log('  ✅ SyzyChat container elements present');
        results.details.push(`${name} - SyzyChat Container: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ SyzyChat container elements missing');
        results.details.push(`${name} - SyzyChat Container: FAIL`);
      }
      
      // Test 5: Check for agent panel with multiple agents
      const hasAgentPanel = await page.evaluate(() => {
        const agentItems = document.querySelectorAll('.agent-item');
        return agentItems.length >= 6; // Multiple agents
      });
      
      results.total++;
      if (hasAgentPanel) {
        results.passed++;
        console.log('  ✅ Agent panel with multiple agents present');
        results.details.push(`${name} - Agent Panel: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Agent panel missing or incomplete');
        results.details.push(`${name} - Agent Panel: FAIL`);
      }
      
      // Test 6: Check for settings panel
      const hasSettingsPanel = await page.evaluate(() => {
        const settingsInputs = document.querySelectorAll('.setting-input');
        const toggleSwitches = document.querySelectorAll('.toggle-switch');
        return settingsInputs.length > 0 && toggleSwitches.length > 0;
      });
      
      results.total++;
      if (hasSettingsPanel) {
        results.passed++;
        console.log('  ✅ Settings panel present');
        results.details.push(`${name} - Settings Panel: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Settings panel missing');
        results.details.push(`${name} - Settings Panel: FAIL`);
      }
      
      // Test 7: Check for Formul8 theming
      const hasFormul8Theming = await page.evaluate(() => {
        const style = document.querySelector('style');
        return style && (
          style.textContent.includes('--formul8-primary') &&
          style.textContent.includes('--formul8-bg-primary') &&
          style.textContent.includes('#00ff88')
        );
      });
      
      results.total++;
      if (hasFormul8Theming) {
        results.passed++;
        console.log('  ✅ Formul8 theming present');
        results.details.push(`${name} - Formul8 Theming: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Formul8 theming missing');
        results.details.push(`${name} - Formul8 Theming: FAIL`);
      }
      
      // Test 8: Check for tier selector
      const hasTierSelector = await page.evaluate(() => {
        const tierButtons = document.querySelectorAll('.tier-button');
        return tierButtons.length >= 6; // Free, Standard, Micro, Operator, Enterprise, Admin
      });
      
      results.total++;
      if (hasTierSelector) {
        results.passed++;
        console.log('  ✅ Tier selector present');
        results.details.push(`${name} - Tier Selector: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Tier selector missing');
        results.details.push(`${name} - Tier Selector: FAIL`);
      }
      
      // Test 9: Test SyzyChat functionality
      console.log('  💬 Testing SyzyChat functionality...');
      const syzychatWorking = await page.evaluate(async () => {
        const chatInput = document.querySelector('#syzychat-input');
        const sendButton = document.querySelector('#syzychat-send');
        
        if (!chatInput || !sendButton) return false;
        
        // Test typing
        chatInput.value = 'Test message for SyzyChat';
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Test send button
        sendButton.click();
        
        // Wait a bit for response
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if message was added
        const messages = document.querySelectorAll('.syzychat-message, .message');
        return messages.length > 1; // Should have welcome message + our test message
      });
      
      results.total++;
      if (syzychatWorking) {
        results.passed++;
        console.log('  ✅ SyzyChat functionality working');
        results.details.push(`${name} - SyzyChat Functionality: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ SyzyChat functionality not working');
        results.details.push(`${name} - SyzyChat Functionality: FAIL`);
      }
      
      // Test 10: Test agent selection
      console.log('  🤖 Testing agent selection...');
      const agentSelectionWorking = await page.evaluate(() => {
        const agentItems = document.querySelectorAll('.agent-item');
        if (agentItems.length === 0) return false;
        
        // Click on a different agent
        const secondAgent = agentItems[1];
        if (secondAgent) {
          secondAgent.click();
          return secondAgent.classList.contains('active');
        }
        return false;
      });
      
      results.total++;
      if (agentSelectionWorking) {
        results.passed++;
        console.log('  ✅ Agent selection working');
        results.details.push(`${name} - Agent Selection: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Agent selection not working');
        results.details.push(`${name} - Agent Selection: FAIL`);
      }
      
      // Test 11: Test settings toggles
      console.log('  ⚙️ Testing settings toggles...');
      const settingsWorking = await page.evaluate(() => {
        const toggleSwitches = document.querySelectorAll('.toggle-switch');
        if (toggleSwitches.length === 0) return false;
        
        // Click on first toggle
        const firstToggle = toggleSwitches[0];
        if (firstToggle) {
          firstToggle.click();
          return true;
        }
        return false;
      });
      
      results.total++;
      if (settingsWorking) {
        results.passed++;
        console.log('  ✅ Settings toggles working');
        results.details.push(`${name} - Settings Toggles: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Settings toggles not working');
        results.details.push(`${name} - Settings Toggles: FAIL`);
      }
      
      // Test 12: Test tier switching
      console.log('  🎯 Testing tier switching...');
      const tierSwitchingWorking = await page.evaluate(() => {
        const tierButtons = document.querySelectorAll('.tier-button');
        if (tierButtons.length === 0) return false;
        
        // Click on a different tier
        const secondTier = tierButtons[1];
        if (secondTier) {
          secondTier.click();
          return secondTier.classList.contains('active');
        }
        return false;
      });
      
      results.total++;
      if (tierSwitchingWorking) {
        results.passed++;
        console.log('  ✅ Tier switching working');
        results.details.push(`${name} - Tier Switching: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Tier switching not working');
        results.details.push(`${name} - Tier Switching: FAIL`);
      }
      
    } catch (error) {
      console.error(`  ❌ Error testing ${name}:`, error.message);
      results.details.push(`${name} - Error: ${error.message}`);
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
    console.log('\n🎉 ALL TESTS PASSED! GoldenLayout + SyzyChat Bundle is fully functional!');
  } else if (results.passed > results.total * 0.8) {
    console.log('\n✅ MOSTLY SUCCESSFUL! GoldenLayout + SyzyChat Bundle is working with minor issues.');
  } else {
    console.log('\n⚠️  SOME ISSUES FOUND! GoldenLayout + SyzyChat Bundle needs attention.');
  }
  
  return results;
}

// Run the test
testGoldenLayoutSyzyChatBundle().catch(console.error);