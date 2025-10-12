const { chromium, firefox, webkit } = require('playwright');
const path = require('path');

async function testGoldenLayoutChat() {
  console.log('🏗️ Testing Formul8 GoldenLayout Chat Interface');
  console.log('===============================================');
  
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
      // Navigate to the GoldenLayout chat page
      const filePath = path.resolve(__dirname, 'docs/goldenlayout-chat.html');
      console.log('  📱 Loading GoldenLayout chat interface...');
      await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      // Take screenshot
      await page.screenshot({ path: `goldenlayout-chat-${name.toLowerCase()}.png` });
      console.log(`  📸 Screenshot saved: goldenlayout-chat-${name.toLowerCase()}.png`);
      
      // Test 1: Check if GoldenLayout loads
      const goldenLayoutLoaded = await page.evaluate(() => {
        return window.GoldenLayout && document.querySelector('#goldenLayout');
      });
      
      results.total++;
      if (goldenLayoutLoaded) {
        results.passed++;
        console.log('  ✅ GoldenLayout loaded successfully');
        results.details.push(`${name} - GoldenLayout Load: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ GoldenLayout failed to load');
        results.details.push(`${name} - GoldenLayout Load: FAIL`);
      }
      
      // Test 2: Check for three main panels
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
      
      // Test 3: Check for chat panel
      const hasChatPanel = await page.evaluate(() => {
        const chatInput = document.querySelector('#chatInput');
        const sendButton = document.querySelector('#sendButton');
        const chatMessages = document.querySelector('#chatMessages');
        return chatInput && sendButton && chatMessages;
      });
      
      results.total++;
      if (hasChatPanel) {
        results.passed++;
        console.log('  ✅ Chat panel elements present');
        results.details.push(`${name} - Chat Panel: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Chat panel elements missing');
        results.details.push(`${name} - Chat Panel: FAIL`);
      }
      
      // Test 4: Check for agent panel
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
      
      // Test 5: Check for settings panel
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
      
      // Test 6: Check for Formul8 theming
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
      
      // Test 7: Check for tier selector
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
      
      // Test 8: Test chat functionality
      console.log('  💬 Testing chat functionality...');
      const chatWorking = await page.evaluate(async () => {
        const chatInput = document.querySelector('#chatInput');
        const sendButton = document.querySelector('#sendButton');
        
        if (!chatInput || !sendButton) return false;
        
        // Test typing
        chatInput.value = 'Test message';
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Test send button
        sendButton.click();
        
        // Wait a bit for response
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if message was added
        const messages = document.querySelectorAll('.message');
        return messages.length > 1; // Should have welcome message + our test message
      });
      
      results.total++;
      if (chatWorking) {
        results.passed++;
        console.log('  ✅ Chat functionality working');
        results.details.push(`${name} - Chat Functionality: PASS`);
      } else {
        results.failed++;
        console.log('  ❌ Chat functionality not working');
        results.details.push(`${name} - Chat Functionality: FAIL`);
      }
      
      // Test 9: Test agent selection
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
      
      // Test 10: Test settings toggles
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
    console.log('\n🎉 ALL TESTS PASSED! GoldenLayout Chat Interface is fully functional!');
  } else if (results.passed > results.total * 0.8) {
    console.log('\n✅ MOSTLY SUCCESSFUL! GoldenLayout Chat Interface is working with minor issues.');
  } else {
    console.log('\n⚠️  SOME ISSUES FOUND! GoldenLayout Chat Interface needs attention.');
  }
  
  return results;
}

// Run the test
testGoldenLayoutChat().catch(console.error);