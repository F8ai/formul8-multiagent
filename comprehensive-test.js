const { chromium, firefox, webkit } = require('playwright');

// Test scenarios
const testScenarios = [
  // Free Tier Tests
  {
    category: 'Free Tier - Basic Questions',
    questions: [
      { question: 'What is THC?', expectedAgent: 'science' },
      { question: 'How do I calculate THC dosage?', expectedAgent: 'formulation' },
      { question: 'What are the benefits of cannabis?', expectedAgent: 'f8_agent' }
    ]
  },
  // Micro Tier Tests
  {
    category: 'Micro Tier - Compliance & Marketing',
    questions: [
      { question: 'What are the compliance requirements for cannabis businesses in California?', expectedAgent: 'compliance' },
      { question: 'How should I market my cannabis brand on social media?', expectedAgent: 'marketing' },
      { question: 'Can I patent my cannabis extraction process?', expectedAgent: 'patent' }
    ]
  },
  // Operator Tier Tests
  {
    category: 'Operator Tier - Full Suite',
    questions: [
      { question: 'How do I optimize my cannabis facility operations?', expectedAgent: 'operations' },
      { question: 'Where can I source high-quality cannabis seeds?', expectedAgent: 'sourcing' },
      { question: 'How do I analyze cannabis potency using spectroscopy?', expectedAgent: 'spectra' }
    ]
  }
];

async function testChatFunctionality(browserType, browserName) {
  console.log(`\n🌐 Testing with ${browserName}...`);
  
  const browser = await browserType.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to chat page
    await page.goto('https://f8.syzygyx.com/chat', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const results = [];
    
    // Test each scenario
    for (const scenario of testScenarios) {
      console.log(`\n📋 Testing ${scenario.category}...`);
      
      for (const testCase of scenario.questions) {
        console.log(`  ❓ "${testCase.question}"`);
        
        try {
          // Find input and send button
          const input = page.locator('input').first();
          const sendButton = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Submit")').first();
          
          // Type question
          await input.fill(testCase.question);
          await sendButton.click();
          
          // Wait for response
          await page.waitForTimeout(8000);
          
          // Check for response
          const responseElements = await page.locator('.message, .response, .chat-message, [data-testid*="message"]');
          const responseCount = await responseElements.count();
          
          if (responseCount > 0) {
            const lastResponse = responseElements.nth(responseCount - 1);
            const responseText = await lastResponse.textContent();
            
            console.log(`    ✅ Response received (${responseText.length} chars)`);
            
            // Check for ad delivery on free tier
            if (scenario.category.includes('Free Tier')) {
              const adElements = await page.locator('text=/upgrade|Upgrade|Standard|Micro|Operator|Enterprise|\\$\\d+/').count();
              if (adElements > 0) {
                console.log(`    📢 Ad delivery detected`);
              }
            }
            
            results.push({
              browser: browserName,
              category: scenario.category,
              question: testCase.question,
              success: true,
              responseLength: responseText.length,
              hasAds: scenario.category.includes('Free Tier') && await page.locator('text=/upgrade|Upgrade|\\$\\d+/').count() > 0
            });
          } else {
            console.log(`    ❌ No response received`);
            results.push({
              browser: browserName,
              category: scenario.category,
              question: testCase.question,
              success: false,
              error: 'No response received'
            });
          }
          
        } catch (error) {
          console.log(`    ❌ Error: ${error.message}`);
          results.push({
            browser: browserName,
            category: scenario.category,
            question: testCase.question,
            success: false,
            error: error.message
          });
        }
        
        // Small delay between questions
        await page.waitForTimeout(1000);
      }
    }
    
    return results;
    
  } catch (error) {
    console.error(`❌ ${browserName} test failed:`, error.message);
    return [];
  } finally {
    await browser.close();
  }
}

async function testHealthEndpoints() {
  console.log('\n🏥 Testing health endpoints...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Test health endpoint
    const healthResponse = await page.request.get('https://f8.syzygyx.com/health');
    console.log(`  Health endpoint: ${healthResponse.status()}`);
    
    if (healthResponse.ok()) {
      const healthData = await healthResponse.json();
      console.log(`  Status: ${healthData.status}`);
      console.log(`  Microservices: ${healthData.microservices?.summary?.total || 'N/A'}`);
    }
    
    // Test agents endpoint
    const agentsResponse = await page.request.get('https://f8.syzygyx.com/api/agents');
    console.log(`  Agents endpoint: ${agentsResponse.status()}`);
    
    if (agentsResponse.ok()) {
      const agentsData = await agentsResponse.json();
      console.log(`  Available agents: ${agentsData.agents?.length || 'N/A'}`);
    }
    
  } catch (error) {
    console.error('❌ Health endpoint test failed:', error.message);
  } finally {
    await browser.close();
  }
}

async function testPerformance() {
  console.log('\n⚡ Testing performance...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://f8.syzygyx.com/chat', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const input = page.locator('input').first();
    const sendButton = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Submit")').first();
    
    const questions = [
      'What is cannabis?',
      'How do I extract THC?',
      'What are terpenes?',
      'How do I test potency?',
      'What is the difference between indica and sativa?'
    ];
    
    const startTime = Date.now();
    
    for (const question of questions) {
      const questionStart = Date.now();
      
      await input.fill(question);
      await sendButton.click();
      await page.waitForTimeout(5000); // Wait for response
      
      const questionTime = Date.now() - questionStart;
      console.log(`  "${question}" - ${questionTime}ms`);
    }
    
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / questions.length;
    
    console.log(`  Total time: ${totalTime}ms`);
    console.log(`  Average time per question: ${avgTime}ms`);
    
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
  } finally {
    await browser.close();
  }
}

async function runComprehensiveTests() {
  console.log('🚀 Starting Formul8 Multiagent Chat Comprehensive Test Suite');
  console.log('='.repeat(60));
  
  const allResults = [];
  
  // Test health endpoints first
  await testHealthEndpoints();
  
  // Test performance
  await testPerformance();
  
  // Test with different browsers
  const browsers = [
    { type: chromium, name: 'Chromium' },
    { type: firefox, name: 'Firefox' },
    { type: webkit, name: 'WebKit' }
  ];
  
  for (const browser of browsers) {
    const results = await testChatFunctionality(browser.type, browser.name);
    allResults.push(...results);
  }
  
  // Generate summary
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const totalTests = allResults.length;
  const successfulTests = allResults.filter(r => r.success).length;
  const failedTests = totalTests - successfulTests;
  
  console.log(`Total tests: ${totalTests}`);
  console.log(`Successful: ${successfulTests} (${((successfulTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`Failed: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);
  
  // Browser breakdown
  const browserStats = {};
  allResults.forEach(result => {
    if (!browserStats[result.browser]) {
      browserStats[result.browser] = { total: 0, success: 0 };
    }
    browserStats[result.browser].total++;
    if (result.success) browserStats[result.browser].success++;
  });
  
  console.log('\nBrowser Performance:');
  Object.entries(browserStats).forEach(([browser, stats]) => {
    const successRate = ((stats.success / stats.total) * 100).toFixed(1);
    console.log(`  ${browser}: ${stats.success}/${stats.total} (${successRate}%)`);
  });
  
  // Category breakdown
  const categoryStats = {};
  allResults.forEach(result => {
    if (!categoryStats[result.category]) {
      categoryStats[result.category] = { total: 0, success: 0 };
    }
    categoryStats[result.category].total++;
    if (result.success) categoryStats[result.category].success++;
  });
  
  console.log('\nCategory Performance:');
  Object.entries(categoryStats).forEach(([category, stats]) => {
    const successRate = ((stats.success / stats.total) * 100).toFixed(1);
    console.log(`  ${category}: ${stats.success}/${stats.total} (${successRate}%)`);
  });
  
  // Show failed tests
  const failedResults = allResults.filter(r => !r.success);
  if (failedResults.length > 0) {
    console.log('\n❌ Failed Tests:');
    failedResults.forEach(result => {
      console.log(`  ${result.browser} - ${result.category}: "${result.question}"`);
      console.log(`    Error: ${result.error}`);
    });
  }
  
  console.log('\n✅ Comprehensive test suite completed!');
  console.log('='.repeat(60));
  
  return allResults;
}

// Run the comprehensive tests
runComprehensiveTests().catch(console.error);