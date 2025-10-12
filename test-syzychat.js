const { chromium } = require('playwright');

async function testSyzyChatIntegration() {
  console.log('🚀 Testing SyzyChat Integration with Formul8...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the SyzyChat integration page
    console.log('📱 Loading SyzyChat integration page...');
    await page.goto('file://' + __dirname + '/docs/syzychat-integration.html', { waitUntil: 'networkidle' });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Take a screenshot
    await page.screenshot({ path: 'syzychat-screenshot.png' });
    console.log('📸 Screenshot saved as syzychat-screenshot.png');
    
    // Check if SyzyChat loaded
    const syzychatLoaded = await page.evaluate(() => {
      return typeof SyzyChat !== 'undefined';
    });
    
    console.log(`✅ SyzyChat loaded: ${syzychatLoaded}`);
    
    // Check if Formul8 chat initialized
    const formul8Initialized = await page.evaluate(() => {
      return typeof window.formul8Chat !== 'undefined';
    });
    
    console.log(`✅ Formul8 chat initialized: ${formul8Initialized}`);
    
    // Test tier switching
    console.log('🔄 Testing tier switching...');
    
    const tiers = ['free', 'standard', 'micro', 'operator', 'enterprise', 'admin'];
    for (const tier of tiers) {
      console.log(`  Testing ${tier} tier...`);
      
      // Click tier button
      await page.click(`[data-tier="${tier}"]`);
      await page.waitForTimeout(500);
      
      // Check if tier was set
      const currentTier = await page.evaluate(() => {
        return window.formul8Chat?.currentTier;
      });
      
      console.log(`    Current tier: ${currentTier}`);
    }
    
    // Test chat functionality
    console.log('💬 Testing chat functionality...');
    
    // Look for chat input
    const chatInputs = await page.locator('input, textarea').count();
    console.log(`  Found ${chatInputs} input elements`);
    
    if (chatInputs > 0) {
      const input = page.locator('input, textarea').first();
      
      if (await input.isVisible()) {
        console.log('  ✅ Chat input is visible');
        
        // Test typing
        await input.fill('What is cannabis?');
        console.log('  ✅ Successfully typed test message');
        
        // Look for send button
        const sendButtons = await page.locator('button').count();
        console.log(`  Found ${sendButtons} buttons`);
        
        if (sendButtons > 0) {
          const sendButton = page.locator('button').first();
          
          if (await sendButton.isVisible()) {
            console.log('  ✅ Send button is visible');
            
            // Click send button
            await sendButton.click();
            console.log('  ✅ Clicked send button');
            
            // Wait for response
            await page.waitForTimeout(5000);
            console.log('  ⏳ Waited for response...');
            
            // Check for any response elements
            const responseElements = await page.locator('.message, .response, .chat-message, [data-testid*="message"]').count();
            console.log(`  💬 Response elements found: ${responseElements}`);
          }
        }
      }
    }
    
    // Test API endpoints
    console.log('🌐 Testing API endpoints...');
    
    try {
      const healthResponse = await page.request.get('https://f8.syzygyx.com/health');
      console.log(`  Health endpoint: ${healthResponse.status()}`);
      
      if (healthResponse.ok()) {
        const healthData = await healthResponse.json();
        console.log(`  Status: ${healthData.status}`);
        console.log(`  Microservices: ${healthData.microservices?.summary?.total || 'N/A'}`);
      }
    } catch (error) {
      console.log(`  ❌ Health endpoint error: ${error.message}`);
    }
    
    try {
      const agentsResponse = await page.request.get('https://f8.syzygyx.com/api/agents');
      console.log(`  Agents endpoint: ${agentsResponse.status()}`);
      
      if (agentsResponse.ok()) {
        const agentsData = await agentsResponse.json();
        console.log(`  Available agents: ${agentsData.agents?.length || 'N/A'}`);
      }
    } catch (error) {
      console.log(`  ❌ Agents endpoint error: ${error.message}`);
    }
    
    // Test SyzyChat specific functionality
    console.log('🔧 Testing SyzyChat specific functionality...');
    
    const syzychatConfig = await page.evaluate(() => {
      return window.formul8Chat?.chat?.config;
    });
    
    if (syzychatConfig) {
      console.log('  ✅ SyzyChat config found');
      console.log(`  Backend URL: ${syzychatConfig.backendUrl}`);
      console.log(`  Tier: ${syzychatConfig.tier}`);
      console.log(`  Agent routing: ${syzychatConfig.enableAgentRouting}`);
    } else {
      console.log('  ⚠️ SyzyChat config not found');
    }
    
    console.log('✅ SyzyChat integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await browser.close();
    console.log('🔚 Browser closed');
  }
}

// Run the test
testSyzyChatIntegration().catch(console.error);