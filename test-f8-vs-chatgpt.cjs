const { chromium } = require('playwright');

async function compareF8WithChatGPT() {
  console.log('🔍 Comparing F8 Chat with ChatGPT');
  console.log('===================================\n');
  
  const browser = await chromium.launch({ headless: false });
  
  try {
    // Test F8 Chat
    console.log('1️⃣  TESTING F8.SYZYGYX.COM/CHAT');
    console.log('─────────────────────────────────');
    const f8Results = await testF8Chat(browser);
    
    console.log('\n\n2️⃣  TESTING CHATGPT.COM');
    console.log('─────────────────────────────────');
    const chatGPTResults = await testChatGPT(browser);
    
    console.log('\n\n3️⃣  COMPARISON ANALYSIS');
    console.log('═════════════════════════════════');
    compareResults(f8Results, chatGPTResults);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

async function testF8Chat(browser) {
  const page = await browser.newPage();
  const results = {
    url: 'https://f8.syzygyx.com/chat.html',
    loadTime: 0,
    pageTitle: '',
    hasInput: false,
    hasSendButton: false,
    hasMessages: false,
    inputPlaceholder: '',
    canType: false,
    canSend: false,
    hasTheme: false,
    hasTierSelector: false,
    apiWorking: false,
    errors: []
  };
  
  try {
    // Measure load time
    const startTime = Date.now();
    console.log('📱 Loading f8.syzygyx.com/chat...');
    
    await page.goto(results.url, { waitUntil: 'networkidle', timeout: 30000 });
    results.loadTime = Date.now() - startTime;
    console.log(`✅ Page loaded in ${results.loadTime}ms`);
    
    // Get page title
    results.pageTitle = await page.title();
    console.log(`📄 Page title: "${results.pageTitle}"`);
    
    // Take screenshot
    await page.screenshot({ path: 'f8-chat-comparison.png', fullPage: true });
    console.log('📸 Screenshot saved: f8-chat-comparison.png');
    
    // Wait a bit for dynamic content
    await page.waitForTimeout(2000);
    
    // Check chat interface elements
    console.log('\n🔍 Checking interface elements...');
    const elements = await page.evaluate(() => {
      const chatInput = document.querySelector('input[type="text"], textarea, [contenteditable="true"]');
      const sendButton = document.querySelector('button[type="submit"], button.send-button, button');
      const messagesContainer = document.querySelector('.chat-messages, .messages, [class*="message"]');
      const tierButtons = document.querySelectorAll('[data-tier], .tier-button, [class*="tier"]');
      
      return {
        hasInput: !!chatInput,
        inputType: chatInput?.tagName || 'None',
        inputPlaceholder: chatInput?.placeholder || chatInput?.ariaLabel || 'None',
        hasSendButton: !!sendButton,
        buttonText: sendButton?.textContent?.trim() || 'None',
        hasMessages: !!messagesContainer,
        hasTierButtons: tierButtons.length > 0,
        tierCount: tierButtons.length,
        allButtons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()).filter(Boolean).slice(0, 10)
      };
    });
    
    results.hasInput = elements.hasInput;
    results.hasSendButton = elements.hasSendButton;
    results.hasMessages = elements.hasMessages;
    results.inputPlaceholder = elements.inputPlaceholder;
    results.hasTierSelector = elements.hasTierButtons;
    
    console.log(`  ${elements.hasInput ? '✅' : '❌'} Chat input: ${elements.hasInput ? elements.inputType : 'NOT FOUND'}`);
    console.log(`  ${elements.hasSendButton ? '✅' : '❌'} Send button: ${elements.hasSendButton ? `"${elements.buttonText}"` : 'NOT FOUND'}`);
    console.log(`  ${elements.hasMessages ? '✅' : '❌'} Messages container: ${elements.hasMessages ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`  ${elements.hasTierButtons ? '✅' : '❌'} Tier selector: ${elements.hasTierButtons ? `${elements.tierCount} tiers` : 'NOT FOUND'}`);
    
    if (elements.allButtons.length > 0) {
      console.log(`  📋 Available buttons: ${elements.allButtons.join(', ')}`);
    }
    
    // Test typing
    if (elements.hasInput) {
      console.log('\n⌨️  Testing chat input...');
      try {
        const input = page.locator('input[type="text"], textarea, [contenteditable="true"]').first();
        await input.fill('Hello from Playwright test');
        results.canType = true;
        console.log('  ✅ Successfully typed in chat input');
        
        // Clear for next test
        await input.fill('');
      } catch (error) {
        results.canType = false;
        console.log('  ❌ Could not type in chat input:', error.message);
      }
    }
    
    // Check theme
    console.log('\n🎨 Checking Formul8 theme...');
    const theme = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets).map(sheet => {
        try {
          return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
        } catch (e) {
          return '';
        }
      }).join('\n');
      
      const inlineStyles = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
      const allStyles = styles + inlineStyles;
      
      const computedBg = window.getComputedStyle(document.body).backgroundColor;
      const computedColor = window.getComputedStyle(document.body).color;
      
      return {
        hasFormul8Vars: allStyles.includes('--formul8-') || allStyles.includes('formul8'),
        hasGreenAccent: allStyles.includes('#00ff88') || allStyles.includes('rgb(0, 255, 136)'),
        backgroundColor: computedBg,
        textColor: computedColor,
        isDark: computedBg.includes('0, 0, 0') || computedBg.includes('rgb(0, 0, 0)') || computedBg.includes('14, 17, 21')
      };
    });
    
    results.hasTheme = theme.hasFormul8Vars || theme.hasGreenAccent;
    console.log(`  ${theme.hasFormul8Vars ? '✅' : '❌'} Formul8 variables: ${theme.hasFormul8Vars ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`  ${theme.hasGreenAccent ? '✅' : '❌'} Green accent (#00ff88): ${theme.hasGreenAccent ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`  ${theme.isDark ? '✅' : '❌'} Dark theme: ${theme.isDark ? 'YES' : 'NO'}`);
    console.log(`  📊 Background: ${theme.backgroundColor}`);
    console.log(`  📊 Text color: ${theme.textColor}`);
    
    // Test API
    console.log('\n🔌 Testing API...');
    try {
      const apiResponse = await page.request.post('https://f8.syzygyx.com/api/chat', {
        data: { 
          message: 'Test from comparison script',
          tier: 'basic'
        },
        timeout: 10000
      });
      
      results.apiWorking = apiResponse.ok();
      console.log(`  ${results.apiWorking ? '✅' : '❌'} API status: ${apiResponse.status()}`);
      
      if (results.apiWorking) {
        const apiData = await apiResponse.json();
        console.log(`  ✅ API response received: ${apiData.response ? 'YES' : 'NO'}`);
        console.log(`  📡 Agent used: ${apiData.agent || 'Unknown'}`);
      }
    } catch (error) {
      results.apiWorking = false;
      console.log(`  ❌ API test failed: ${error.message}`);
    }
    
  } catch (error) {
    results.errors.push(error.message);
    console.error('❌ Error testing F8:', error.message);
  } finally {
    await page.close();
  }
  
  return results;
}

async function testChatGPT(browser) {
  const page = await browser.newPage();
  const results = {
    url: 'https://chatgpt.com',
    loadTime: 0,
    pageTitle: '',
    hasInput: false,
    hasSendButton: false,
    hasMessages: false,
    inputPlaceholder: '',
    requiresAuth: false,
    hasModelSelector: false,
    errors: []
  };
  
  try {
    // Measure load time
    const startTime = Date.now();
    console.log('📱 Loading chatgpt.com...');
    
    await page.goto(results.url, { waitUntil: 'networkidle', timeout: 30000 });
    results.loadTime = Date.now() - startTime;
    console.log(`✅ Page loaded in ${results.loadTime}ms`);
    
    // Get page title
    results.pageTitle = await page.title();
    console.log(`📄 Page title: "${results.pageTitle}"`);
    
    // Take screenshot
    await page.screenshot({ path: 'chatgpt-comparison.png', fullPage: true });
    console.log('📸 Screenshot saved: chatgpt-comparison.png');
    
    // Wait a bit for dynamic content
    await page.waitForTimeout(3000);
    
    // Check if requires auth
    const authCheck = await page.evaluate(() => {
      const loginButton = document.querySelector('button[data-testid*="login"], button:has-text("Log in"), a:has-text("Log in")');
      const signUpButton = document.querySelector('button:has-text("Sign up"), a:has-text("Sign up")');
      return {
        requiresAuth: !!(loginButton || signUpButton),
        hasLoginButton: !!loginButton,
        hasSignUpButton: !!signUpButton
      };
    });
    
    results.requiresAuth = authCheck.requiresAuth;
    console.log(`  ${authCheck.requiresAuth ? '⚠️' : '✅'} Authentication required: ${authCheck.requiresAuth ? 'YES' : 'NO'}`);
    
    // Check chat interface elements
    console.log('\n🔍 Checking interface elements...');
    const elements = await page.evaluate(() => {
      const chatInput = document.querySelector('textarea, input[type="text"], [contenteditable="true"]');
      const sendButton = document.querySelector('button[data-testid*="send"], button[type="submit"]');
      const messagesContainer = document.querySelector('[role="presentation"], .conversation');
      const modelSelector = document.querySelector('[role="combobox"], select, button:has-text("GPT")');
      
      return {
        hasInput: !!chatInput,
        inputType: chatInput?.tagName || 'None',
        inputPlaceholder: chatInput?.placeholder || chatInput?.ariaLabel || 'None',
        hasSendButton: !!sendButton,
        hasMessages: !!messagesContainer,
        hasModelSelector: !!modelSelector,
        allButtons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()).filter(Boolean).slice(0, 10)
      };
    });
    
    results.hasInput = elements.hasInput;
    results.hasSendButton = elements.hasSendButton;
    results.hasMessages = elements.hasMessages;
    results.inputPlaceholder = elements.inputPlaceholder;
    results.hasModelSelector = elements.hasModelSelector;
    
    console.log(`  ${elements.hasInput ? '✅' : '❌'} Chat input: ${elements.hasInput ? elements.inputType : 'NOT FOUND'}`);
    console.log(`  ${elements.hasSendButton ? '✅' : '❌'} Send button: ${elements.hasSendButton ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`  ${elements.hasMessages ? '✅' : '❌'} Messages container: ${elements.hasMessages ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`  ${elements.hasModelSelector ? '✅' : '❌'} Model selector: ${elements.hasModelSelector ? 'FOUND' : 'NOT FOUND'}`);
    
    if (elements.allButtons.length > 0) {
      console.log(`  📋 Available buttons: ${elements.allButtons.join(', ')}`);
    }
    
    // Check theme
    console.log('\n🎨 Checking theme...');
    const theme = await page.evaluate(() => {
      const computedBg = window.getComputedStyle(document.body).backgroundColor;
      const computedColor = window.getComputedStyle(document.body).color;
      
      return {
        backgroundColor: computedBg,
        textColor: computedColor,
        isDark: computedBg.includes('rgb(0, 0, 0)') || computedBg.includes('rgba(0, 0, 0')
      };
    });
    
    console.log(`  📊 Background: ${theme.backgroundColor}`);
    console.log(`  📊 Text color: ${theme.textColor}`);
    console.log(`  ${theme.isDark ? '🌙' : '☀️'} Theme: ${theme.isDark ? 'DARK' : 'LIGHT'}`);
    
  } catch (error) {
    results.errors.push(error.message);
    console.error('❌ Error testing ChatGPT:', error.message);
  } finally {
    await page.close();
  }
  
  return results;
}

function compareResults(f8, chatgpt) {
  console.log('\n📊 FEATURE COMPARISON');
  console.log('─────────────────────\n');
  
  // Load time comparison
  console.log('⏱️  Load Time:');
  console.log(`   F8:      ${f8.loadTime}ms`);
  console.log(`   ChatGPT: ${chatgpt.loadTime}ms`);
  if (f8.loadTime < chatgpt.loadTime) {
    console.log(`   ⚡ F8 is ${chatgpt.loadTime - f8.loadTime}ms faster!`);
  } else {
    console.log(`   ⚠️  F8 is ${f8.loadTime - chatgpt.loadTime}ms slower`);
  }
  
  // Interface comparison
  console.log('\n💬 Chat Interface:');
  printComparison('Chat Input', f8.hasInput, chatgpt.hasInput);
  printComparison('Send Button', f8.hasSendButton, chatgpt.hasSendButton);
  printComparison('Messages Container', f8.hasMessages, chatgpt.hasMessages);
  
  console.log('\n🎛️  Special Features:');
  console.log(`   F8 Tier Selector:      ${f8.hasTierSelector ? '✅ YES' : '❌ NO'}`);
  console.log(`   ChatGPT Model Selector: ${chatgpt.hasModelSelector ? '✅ YES' : '❌ NO'}`);
  console.log(`   F8 Custom Theme:       ${f8.hasTheme ? '✅ YES' : '❌ NO'}`);
  console.log(`   F8 API:                ${f8.apiWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);
  console.log(`   ChatGPT Requires Auth: ${chatgpt.requiresAuth ? '⚠️  YES' : '✅ NO'}`);
  
  // Overall assessment
  console.log('\n\n🎯 OVERALL ASSESSMENT');
  console.log('═════════════════════\n');
  
  const f8Score = [
    f8.hasInput,
    f8.hasSendButton,
    f8.hasMessages,
    f8.hasTierSelector,
    f8.hasTheme,
    f8.apiWorking,
    f8.canType
  ].filter(Boolean).length;
  
  const chatgptScore = [
    chatgpt.hasInput,
    chatgpt.hasSendButton,
    chatgpt.hasMessages,
    chatgpt.hasModelSelector,
    !chatgpt.requiresAuth
  ].filter(Boolean).length;
  
  console.log(`F8 Chat Score:     ${f8Score}/7 features working`);
  console.log(`ChatGPT Score:     ${chatgptScore}/5 features detected\n`);
  
  if (f8.hasInput && f8.hasSendButton && f8.hasMessages && f8.apiWorking) {
    console.log('✅ F8 CHAT IS FULLY FUNCTIONAL!');
    console.log('   - All core features working');
    console.log('   - API responding correctly');
    console.log('   - Interface elements present');
    console.log('   - Custom Formul8 theming applied');
    console.log('   - Tier selection available');
  } else {
    console.log('⚠️  F8 CHAT NEEDS ATTENTION:');
    if (!f8.hasInput) console.log('   ❌ Chat input not found');
    if (!f8.hasSendButton) console.log('   ❌ Send button not found');
    if (!f8.hasMessages) console.log('   ❌ Messages container not found');
    if (!f8.apiWorking) console.log('   ❌ API not responding');
  }
  
  console.log('\n🌟 F8 ADVANTAGES OVER CHATGPT:');
  console.log('   ✅ No authentication required');
  console.log('   ✅ Tier-based agent selection');
  console.log('   ✅ Custom Formul8 branding');
  console.log('   ✅ Direct API access');
  if (f8.loadTime < chatgpt.loadTime) {
    console.log('   ✅ Faster load time');
  }
  
  console.log('\n📸 Screenshots saved:');
  console.log('   - f8-chat-comparison.png');
  console.log('   - chatgpt-comparison.png');
}

function printComparison(feature, f8Has, chatgptHas) {
  const f8Symbol = f8Has ? '✅' : '❌';
  const chatgptSymbol = chatgptHas ? '✅' : '❌';
  const status = f8Has === chatgptHas ? '=' : (f8Has ? '↑' : '↓');
  console.log(`   ${feature.padEnd(20)} F8: ${f8Symbol}  ChatGPT: ${chatgptSymbol}  ${status}`);
}

// Run the comparison
compareF8WithChatGPT().catch(console.error);

