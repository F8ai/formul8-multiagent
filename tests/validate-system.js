#!/usr/bin/env node

/**
 * Comprehensive Formul8 System Validation Tests
 * Tests all aspects of the system to ensure everything works as expected
 */

const https = require('https');
const http = require('http');

// Test configuration
const CONFIG = {
  mainAgentUrl: 'https://lambda-package.vercel.app',
  agentUrls: {
    'compliance-agent': 'https://compliance-agent.vercel.app',
    'formulation-agent': 'https://formulation-agent.vercel.app',
    'science-agent': 'https://science-agent.vercel.app',
    'operations-agent': 'https://operations-agent.vercel.app',
    'marketing-agent': 'https://marketing-agent.vercel.app',
    'sourcing-agent': 'https://sourcing-agent.vercel.app',
    'patent-agent': 'https://patent-agent.vercel.app',
    'spectra-agent': 'https://spectra-agent.vercel.app',
    'customer-success-agent': 'https://customer-success-agent.vercel.app',
    'f8-slackbot': 'https://f8-slackbot.vercel.app',
    'mcr-agent': 'https://mcr-agent.vercel.app',
    'ad-agent': 'https://ad-agent.vercel.app',
    'editor-agent': 'https://editor-agent.vercel.app'
  },
  timeout: 10000,
  retries: 3
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: []
};

// Utility functions
const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Formul8-System-Test/1.0',
        ...options.headers
      },
      timeout: CONFIG.timeout
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            raw: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            raw: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
};

const test = async (name, testFn) => {
  testResults.total++;
  console.log(`\n🧪 Testing: ${name}`);
  
  try {
    await testFn();
    testResults.passed++;
    console.log(`✅ PASSED: ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
  }
};

// Test functions
const testMainAgentHealth = async () => {
  const response = await makeRequest(`${CONFIG.mainAgentUrl}/health`);
  
  if (response.status !== 200) {
    throw new Error(`Health check failed with status ${response.status}`);
  }
  
  if (!response.data.status || response.data.status !== 'healthy') {
    throw new Error('Main agent is not healthy');
  }
  
  console.log(`   Status: ${response.data.status}`);
  console.log(`   Service: ${response.data.service}`);
  console.log(`   Version: ${response.data.version}`);
};

const testFreeApiKeyGeneration = async () => {
  const response = await makeRequest(`${CONFIG.mainAgentUrl}/api/free-key`);
  
  if (response.status !== 200) {
    throw new Error(`Free API key generation failed with status ${response.status}`);
  }
  
  if (!response.data.success || !response.data.apiKey) {
    throw new Error('Free API key generation failed');
  }
  
  if (response.data.plan !== 'free') {
    throw new Error('Expected free plan, got ' + response.data.plan);
  }
  
  if (!response.data.limits || response.data.limits.requestsPerHour !== 10) {
    throw new Error('Invalid rate limits for free plan');
  }
  
  console.log(`   API Key: ${response.data.apiKey.substring(0, 20)}...`);
  console.log(`   Plan: ${response.data.plan}`);
  console.log(`   Rate Limit: ${response.data.limits.requestsPerHour} req/hour`);
  
  return response.data.apiKey;
};

const testFreeModeChat = async (apiKey) => {
  const response = await makeRequest(`${CONFIG.mainAgentUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey
    },
    body: {
      message: 'Hello, this is a test message for free mode'
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Chat request failed with status ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error('Chat request was not successful');
  }
  
  if (!response.data.response || response.data.response.length < 10) {
    throw new Error('Invalid or empty response from chat');
  }
  
  console.log(`   Response length: ${response.data.response.length} characters`);
  console.log(`   Agent: ${response.data.agent}`);
  console.log(`   Model: ${response.data.model}`);
};

const testRateLimiting = async (apiKey) => {
  console.log('   Testing rate limiting (this may take a moment)...');
  
  let successCount = 0;
  let rateLimited = false;
  
  // Try to exceed the rate limit (10 requests/hour for free plan)
  for (let i = 0; i < 15; i++) {
    try {
      const response = await makeRequest(`${CONFIG.mainAgentUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey
        },
        body: {
          message: `Test message ${i + 1}`
        }
      });
      
      if (response.status === 200) {
        successCount++;
      } else if (response.status === 429) {
        rateLimited = true;
        console.log(`   Rate limited after ${successCount} requests`);
        break;
      }
    } catch (error) {
      // Ignore individual request errors
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (!rateLimited && successCount > 10) {
    throw new Error('Rate limiting not working properly - exceeded 10 requests without being rate limited');
  }
  
  console.log(`   Successfully processed ${successCount} requests before rate limiting`);
};

const testAgentHealth = async (agentName, agentUrl) => {
  const response = await makeRequest(`${agentUrl}/health`);
  
  if (response.status !== 200) {
    throw new Error(`Agent health check failed with status ${response.status}`);
  }
  
  if (!response.data.status || response.data.status !== 'healthy') {
    throw new Error(`Agent ${agentName} is not healthy`);
  }
  
  console.log(`   ${agentName}: ${response.data.status}`);
  console.log(`   Service: ${response.data.service}`);
  console.log(`   Version: ${response.data.version}`);
};

const testAgentChat = async (agentName, agentUrl, apiKey) => {
  const response = await makeRequest(`${agentUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey
    },
    body: {
      message: `Test message for ${agentName} agent`
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Agent chat failed with status ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error(`Agent ${agentName} chat request was not successful`);
  }
  
  console.log(`   ${agentName}: Response received (${response.data.response.length} chars)`);
};

const testAuthenticationRequired = async () => {
  // Test that requests without authentication are rejected
  const response = await makeRequest(`${CONFIG.mainAgentUrl}/api/chat`, {
    method: 'POST',
    body: {
      message: 'This should fail without authentication'
    }
  });
  
  if (response.status !== 401) {
    throw new Error(`Expected 401 for unauthenticated request, got ${response.status}`);
  }
  
  if (!response.data.error || !response.data.code) {
    throw new Error('Invalid error response for unauthenticated request');
  }
  
  console.log(`   Unauthenticated request properly rejected: ${response.data.error}`);
};

const testInvalidApiKey = async () => {
  // Test that requests with invalid API key are rejected
  const response = await makeRequest(`${CONFIG.mainAgentUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'X-API-Key': 'invalid-api-key-12345'
    },
    body: {
      message: 'This should fail with invalid API key'
    }
  });
  
  if (response.status !== 401) {
    throw new Error(`Expected 401 for invalid API key, got ${response.status}`);
  }
  
  console.log(`   Invalid API key properly rejected: ${response.data.error}`);
};

const testAgentSelection = async (apiKey) => {
  const testMessages = [
    { message: 'I need help with compliance regulations', expectedAgent: 'compliance' },
    { message: 'How do I formulate a new product?', expectedAgent: 'formulation' },
    { message: 'What are the scientific properties of THC?', expectedAgent: 'science' },
    { message: 'Help me with facility operations', expectedAgent: 'operations' },
    { message: 'I need marketing strategy advice', expectedAgent: 'marketing' }
  ];
  
  for (const test of testMessages) {
    const response = await makeRequest(`${CONFIG.mainAgentUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey
      },
      body: {
        message: test.message
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`Agent selection test failed for: ${test.message}`);
    }
    
    if (response.data.agent !== test.expectedAgent) {
      console.log(`   Warning: Expected agent ${test.expectedAgent}, got ${response.data.agent} for: ${test.message}`);
    } else {
      console.log(`   Correctly selected ${response.data.agent} for: ${test.message}`);
    }
  }
};

const testPerformance = async (apiKey) => {
  const startTime = Date.now();
  
  const response = await makeRequest(`${CONFIG.mainAgentUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey
    },
    body: {
      message: 'Performance test message'
    }
  });
  
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  if (response.status !== 200) {
    throw new Error(`Performance test failed with status ${response.status}`);
  }
  
  if (responseTime > 5000) {
    throw new Error(`Response time too slow: ${responseTime}ms (expected < 5000ms)`);
  }
  
  console.log(`   Response time: ${responseTime}ms`);
  
  if (responseTime < 1000) {
    console.log(`   Excellent performance!`);
  } else if (responseTime < 3000) {
    console.log(`   Good performance`);
  } else {
    console.log(`   Acceptable performance`);
  }
};

const testErrorHandling = async (apiKey) => {
  // Test empty message
  const emptyResponse = await makeRequest(`${CONFIG.mainAgentUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey
    },
    body: {
      message: ''
    }
  });
  
  if (emptyResponse.status !== 400) {
    throw new Error(`Expected 400 for empty message, got ${emptyResponse.status}`);
  }
  
  // Test very long message
  const longMessage = 'a'.repeat(3000);
  const longResponse = await makeRequest(`${CONFIG.mainAgentUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey
    },
    body: {
      message: longMessage
    }
  });
  
  if (longResponse.status !== 400) {
    throw new Error(`Expected 400 for long message, got ${longResponse.status}`);
  }
  
  console.log(`   Empty message properly rejected`);
  console.log(`   Long message properly rejected`);
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Formul8 System Validation Tests');
  console.log('=' .repeat(60));
  
  let apiKey = null;
  
  // Core system tests
  await test('Main Agent Health Check', testMainAgentHealth);
  await test('Free API Key Generation', async () => {
    apiKey = await testFreeApiKeyGeneration();
  });
  
  if (!apiKey) {
    console.log('❌ Cannot continue without API key');
    return;
  }
  
  // Authentication tests
  await test('Free Mode Chat', () => testFreeModeChat(apiKey));
  await test('Authentication Required', testAuthenticationRequired);
  await test('Invalid API Key Rejection', testInvalidApiKey);
  
  // Rate limiting tests
  await test('Rate Limiting', () => testRateLimiting(apiKey));
  
  // Agent functionality tests
  await test('Agent Selection Logic', () => testAgentSelection(apiKey));
  
  // Performance tests
  await test('Response Performance', () => testPerformance(apiKey));
  
  // Error handling tests
  await test('Error Handling', () => testErrorHandling(apiKey));
  
  // Individual agent tests
  console.log('\n🤖 Testing Individual Agents...');
  for (const [agentName, agentUrl] of Object.entries(CONFIG.agentUrls)) {
    await test(`${agentName} Health Check`, () => testAgentHealth(agentName, agentUrl));
    await test(`${agentName} Chat Functionality`, () => testAgentChat(agentName, agentUrl, apiKey));
  }
  
  // Test summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach(error => {
      console.log(`   • ${error.name}: ${error.error}`);
    });
  }
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The Formul8 system is working correctly.');
  } else {
    console.log(`\n⚠️  ${testResults.failed} tests failed. Please review the errors above.`);
    process.exit(1);
  }
};

// Run the tests
runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});