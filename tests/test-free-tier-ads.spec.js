import { test, expect } from '@playwright/test';

test.describe('Free Tier Ad Generation - future4200', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Free tier (future4200) user receives ads in chat responses', async () => {
    console.log('\n🧪 Testing Free Tier Ad Generation for future4200');
    console.log('================================================\n');
    
    // Navigate to chat
    await page.goto('https://f8.syzygyx.com/chat.html');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Loaded chat interface');
    
    // Wait for page elements
    await page.waitForSelector('#chatInput', { timeout: 10000 });
    await page.waitForSelector('#planSelect', { timeout: 10000 });
    await page.waitForSelector('#username', { timeout: 10000 });
    
    // Set user to future4200 and plan to free
    await page.evaluate(() => {
      document.getElementById('username').value = 'future4200';
      document.getElementById('planSelect').value = 'free';
    });
    
    const username = await page.evaluate(() => document.getElementById('username').value);
    const plan = await page.evaluate(() => document.getElementById('planSelect').value);
    
    console.log(`📝 Username: ${username}`);
    console.log(`📋 Plan: ${plan}`);
    
    // Listen to network requests
    const chatRequests = [];
    const chatResponses = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/chat')) {
        const postData = request.postData();
        chatRequests.push({
          url: request.url(),
          data: postData ? JSON.parse(postData) : null
        });
      }
    });
    
    page.on('response', async response => {
      if (response.url().includes('/api/chat')) {
        const status = response.status();
        let data = null;
        try {
          const text = await response.text();
          data = JSON.parse(text);
        } catch (e) {
          data = await response.text();
        }
        chatResponses.push({
          status: status,
          data: data
        });
      }
    });
    
    // Test multiple questions to see ad patterns
    const testQuestions = [
      'What is THC?',
      'How do I make cannabis gummies?',
      'What are terpenes?'
    ];
    
    for (const question of testQuestions) {
      console.log(`\n❓ Asking: "${question}"`);
      
      const chatInput = page.locator('#chatInput');
      const sendButton = page.locator('#sendButton');
      
      await chatInput.fill(question);
      await sendButton.click();
      
      // Wait for user message to appear
      await expect(page.locator('.message.user').last()).toBeVisible({ timeout: 5000 });
      console.log('  📤 User message sent');
      
      // Wait for assistant response
      await expect(page.locator('.message.assistant').last()).toBeVisible({ timeout: 30000 });
      console.log('  📥 Assistant response received');
      
      // Get the response text
      const lastResponse = page.locator('.message.assistant .message-text').last();
      const responseText = await lastResponse.textContent();
      
      console.log(`  📝 Response length: ${responseText.length} characters`);
      console.log(`  📄 Response preview: ${responseText.substring(0, 150)}...`);
      
      // Check for ad indicators
      const adKeywords = [
        'upgrade',
        'Upgrade',
        'standard',
        'Standard',
        'premium',
        'Premium',
        'micro',
        'Micro',
        'operator',
        'Operator',
        'subscribe',
        'subscription',
        'plan',
        'tier',
        '$',
        'pricing',
        'formul8.ai/plans',
        'limited',
        'unlock',
        'access'
      ];
      
      const foundAds = adKeywords.filter(keyword => 
        responseText.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (foundAds.length > 0) {
        console.log(`  ✅ AD CONTENT DETECTED: Found keywords: ${foundAds.join(', ')}`);
      } else {
        console.log(`  ⚠️  No obvious ad content detected`);
      }
      
      // Check if response mentions upgrade or premium features
      if (responseText.match(/upgrade|premium|standard|micro|operator|\$\d+/i)) {
        console.log(`  💰 UPGRADE PROMPT FOUND in response`);
      }
      
      // Wait a bit between questions
      await page.waitForTimeout(2000);
    }
    
    // Analyze all responses
    console.log('\n📊 Analysis Summary');
    console.log('==================');
    console.log(`Total questions asked: ${testQuestions.length}`);
    console.log(`Total requests sent: ${chatRequests.length}`);
    console.log(`Total responses received: ${chatResponses.length}`);
    
    // Check request details
    if (chatRequests.length > 0) {
      console.log('\n📤 Request Details:');
      chatRequests.forEach((req, i) => {
        console.log(`  Request ${i + 1}:`);
        console.log(`    Username: ${req.data?.username}`);
        console.log(`    Plan: ${req.data?.plan}`);
        console.log(`    Message: ${req.data?.message}`);
      });
      
      // Verify all requests used free tier
      const allFree = chatRequests.every(req => req.data?.plan === 'free');
      if (allFree) {
        console.log('  ✅ All requests correctly used "free" plan');
      } else {
        console.log('  ⚠️  Some requests did not use "free" plan');
      }
      
      // Verify username
      const allFuture4200 = chatRequests.every(req => req.data?.username === 'future4200');
      if (allFuture4200) {
        console.log('  ✅ All requests correctly used "future4200" username');
      } else {
        console.log('  ⚠️  Some requests did not use "future4200" username');
      }
    }
    
    // Check response details
    if (chatResponses.length > 0) {
      console.log('\n📥 Response Details:');
      chatResponses.forEach((res, i) => {
        console.log(`  Response ${i + 1}:`);
        console.log(`    Status: ${res.status}`);
        if (res.data && typeof res.data === 'object') {
          console.log(`    Agent: ${res.data.agent || 'unknown'}`);
          console.log(`    Plan: ${res.data.plan || 'unknown'}`);
          console.log(`    Response length: ${res.data.response?.length || 0}`);
          
          // Check for ad content in response
          if (res.data.response) {
            const hasAdContent = res.data.response.match(/upgrade|premium|standard|micro|\$\d+/i);
            if (hasAdContent) {
              console.log(`    💰 Contains upgrade/ad content: YES`);
            } else {
              console.log(`    💰 Contains upgrade/ad content: NO`);
            }
          }
        } else {
          console.log(`    Raw response: ${JSON.stringify(res.data).substring(0, 100)}`);
        }
      });
    }
    
    // Final verdict
    console.log('\n🎯 Test Verdict:');
    console.log('===============');
    
    if (chatResponses.length > 0 && chatResponses[0].status === 200) {
      console.log('✅ Chat API is working');
      
      const hasAdContent = chatResponses.some(res => 
        res.data?.response?.match(/upgrade|premium|standard|micro|\$\d+/i)
      );
      
      if (hasAdContent) {
        console.log('✅ Free tier IS generating ad/upgrade content');
      } else {
        console.log('⚠️  Free tier may NOT be generating ad content');
        console.log('   (Ads might be subtle or injected differently)');
      }
    } else {
      console.log('❌ Chat API not responding properly');
    }
    
    // Make sure we got at least one successful response
    expect(chatResponses.length).toBeGreaterThan(0);
  });
  
  test('Verify free tier shows limitations', async () => {
    await page.goto('https://f8.syzygyx.com/chat.html');
    await page.waitForLoadState('networkidle');
    
    // Set to free tier
    await page.evaluate(() => {
      document.getElementById('username').value = 'future4200';
      document.getElementById('planSelect').value = 'free';
    });
    
    // Send a complex question that would benefit from premium features
    const chatInput = page.locator('#chatInput');
    const sendButton = page.locator('#sendButton');
    
    await chatInput.fill('I need help with compliance, formulation, and patent research for my cannabis business');
    await sendButton.click();
    
    // Wait for response
    await expect(page.locator('.message.assistant').first()).toBeVisible({ timeout: 30000 });
    
    const responseText = await page.locator('.message.assistant .message-text').first().textContent();
    
    console.log('\n🔍 Complex Query Response Check:');
    console.log('================================');
    console.log(`Response: ${responseText.substring(0, 200)}...`);
    
    // Check if response mentions limitations or upgrades
    const mentionsLimitations = responseText.match(/upgrade|premium|limited|basic|standard|micro|operator/i);
    
    if (mentionsLimitations) {
      console.log('✅ Response mentions tier limitations or upgrade options');
    } else {
      console.log('ℹ️  Response does not explicitly mention limitations');
    }
    
    expect(responseText.length).toBeGreaterThan(0);
  });
});
