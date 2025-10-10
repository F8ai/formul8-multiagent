#!/usr/bin/env node

/**
 * Live Platform Test Runner for f8.syzygyx.com
 * Comprehensive testing of the live Formul8 platform
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🌐 Live Platform Testing - f8.syzygyx.com');
console.log('==========================================\n');

async function runLivePlatformTests() {
  const results = {
    startTime: new Date().toISOString(),
    platform: 'f8.syzygyx.com',
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    }
  };

  console.log('🚀 Starting live platform tests...\n');

  // Test basic connectivity first
  console.log('🔍 Testing basic connectivity...');
  try {
    const curlResult = execSync('curl -s -w "HTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" https://f8.syzygyx.com/health', { 
      encoding: 'utf8',
      timeout: 10000
    });
    console.log(curlResult);
    
    results.tests.push({
      name: 'Basic Connectivity Test',
      status: 'passed',
      duration: 0,
      description: 'Basic HTTP connectivity to f8.syzygyx.com'
    });
  } catch (error) {
    console.log('❌ Basic connectivity test failed:', error.message);
    results.tests.push({
      name: 'Basic Connectivity Test',
      status: 'failed',
      duration: 0,
      description: 'Basic HTTP connectivity to f8.syzygyx.com',
      error: error.message
    });
  }

  // Test API endpoints
  console.log('\n🔍 Testing API endpoints...');
  const apiTests = [
    { name: 'Health Endpoint', command: 'curl -s https://f8.syzygyx.com/health | jq .status' },
    { name: 'Status Endpoint', command: 'curl -s https://f8.syzygyx.com/api/status | jq .status' },
    { name: 'Chat Endpoint', command: 'curl -s -X POST -H "Content-Type: application/json" -d \'{"message":"API test","user_id":"test"}\' https://f8.syzygyx.com/api/mcr/chat | jq .success' }
  ];
  
  for (const test of apiTests) {
    try {
      const result = execSync(test.command, { encoding: 'utf8', timeout: 5000 });
      console.log(`✅ ${test.name}: ${result.trim()}`);
      results.tests.push({
        name: test.name,
        status: 'passed',
        duration: 0,
        description: `Testing ${test.name}`
      });
    } catch (error) {
      console.log(`❌ ${test.name}: Failed`);
      results.tests.push({
        name: test.name,
        status: 'failed',
        duration: 0,
        description: `Testing ${test.name}`,
        error: error.message
      });
    }
  }

  // Run Playwright tests for live platform
  console.log('\n🎭 Running Playwright tests for live platform...');
  try {
    const startTime = Date.now();
    execSync('npx playwright test tests/integration/live-platform.spec.ts --reporter=html,json', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    const endTime = Date.now();
    
    results.tests.push({
      name: 'Playwright Live Platform Tests',
      status: 'passed',
      duration: endTime - startTime,
      description: 'Comprehensive testing of f8.syzygyx.com with Playwright'
    });
    
    console.log('✅ Playwright tests completed successfully\n');
  } catch (error) {
    console.log('❌ Playwright tests failed\n');
    
    results.tests.push({
      name: 'Playwright Live Platform Tests',
      status: 'failed',
      duration: 0,
      description: 'Comprehensive testing of f8.syzygyx.com with Playwright',
      error: error.message
    });
  }

  // Calculate summary
  results.tests.forEach(test => {
    results.summary.total++;
    if (test.status === 'passed') {
      results.summary.passed++;
    } else if (test.status === 'failed') {
      results.summary.failed++;
    }
  });

  results.endTime = new Date().toISOString();
  results.duration = new Date(results.endTime) - new Date(results.startTime);

  // Generate summary report
  console.log('📊 LIVE PLATFORM TEST SUMMARY');
  console.log('==============================');
  console.log(`Platform: ${results.platform}`);
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Success Rate: ${Math.round((results.summary.passed / results.summary.total) * 100)}%`);
  console.log(`Total Duration: ${Math.round(results.duration / 1000)}s\n`);

  // Save results
  const resultsDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(resultsDir, 'live-platform-test-summary.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('📁 Live platform test reports saved to:');
  console.log(`   - test-results/live-platform-test-summary.json`);
  console.log(`   - playwright-report/index.html\n`);

  return results;
}

// Run the live platform tests
runLivePlatformTests().catch(console.error);
