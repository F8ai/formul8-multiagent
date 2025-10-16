#!/usr/bin/env node

/**
 * Comprehensive Test Suite for F8 Slackbot Agent
 * Tests Slack integration, team collaboration, notifications, and workflow automation capabilities
 * Tests through the main F8 gateway at f8.syzygyx.com
 */

const https = require('https');
const fs = require('fs');

// F8 Main Gateway Endpoint
const F8_URL = 'f8.syzygyx.com';
const F8_PATH = '/api/chat';

// Comprehensive test questions covering all slackbot specialties
const slackbotTestQuestions = {
  'Slack Integration & Automation': [
    'How do I set up a Slack bot for my cannabis business?',
    'What are the best practices for Slack integration in a team environment?',
    'How can I automate Slack notifications for order updates?',
    'What Slack commands should I create for my team?',
    'How do I integrate Slack with our inventory management system?'
  ],
  'Team Collaboration Tools': [
    'How can we improve team collaboration using Slack?',
    'What are the best Slack channels to set up for a cannabis operations team?',
    'How do I organize Slack channels for different departments?',
    'What collaboration features in Slack are most useful for remote teams?',
    'How can we use Slack to coordinate between production and compliance teams?'
  ],
  'Notification & Alert Systems': [
    'How do I set up alerts for compliance violations in Slack?',
    'What kind of notifications should I configure for production milestones?',
    'How can I create custom alert systems in Slack?',
    'What are the best practices for Slack notification management?',
    'How do I prevent notification fatigue in my team?'
  ],
  'Workflow Automation': [
    'How can I automate our approval workflows in Slack?',
    'What workflows can be automated using Slack bots?',
    'How do I create a workflow for new employee onboarding in Slack?',
    'What are the best Slack workflow automation tools?',
    'How can I integrate our production schedule with Slack workflows?'
  ],
  'Communication Optimization': [
    'How can we improve internal communication using Slack?',
    'What are best practices for Slack communication in a cannabis company?',
    'How do I reduce noise in Slack channels?',
    'What communication guidelines should we establish for Slack?',
    'How can we ensure important messages don\'t get lost in Slack?'
  ],
  'Team Productivity Tools': [
    'What Slack integrations boost team productivity?',
    'How can we track team tasks and deadlines in Slack?',
    'What are the best productivity bots for Slack?',
    'How do I measure team productivity using Slack analytics?',
    'What Slack features help with project management?'
  ]
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Get a free API key from F8
 */
function getFreeApiKey() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ username: 'slackbot-test-user' });
    
    const options = {
      hostname: F8_URL,
      port: 443,
      path: '/api/free-key',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.apiKey) {
            resolve(response.apiKey);
          } else {
            reject(new Error('No API key returned'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('API key request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Make HTTPS request to F8 main gateway
 */
function makeRequest(question, plan = 'standard', apiKey = null) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ 
      message: question,
      plan: plan,
      username: 'test-user'
    });
    
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'F8-Slackbot-Test/1.0'
    };
    
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    
    const options = {
      hostname: F8_URL,
      port: 443,
      path: F8_PATH,
      method: 'POST',
      headers: headers,
      rejectUnauthorized: false
    };

    const startTime = Date.now();
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        try {
          const response = JSON.parse(data);
          resolve({
            question,
            status: res.statusCode,
            response: response,
            responseTime: responseTime,
            success: res.statusCode === 200,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            question,
            status: res.statusCode,
            response: data,
            responseTime: responseTime,
            success: false,
            error: error.message,
            parseError: true
          });
        }
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      reject({
        question,
        error: error.message,
        responseTime: responseTime,
        success: false,
        networkError: true
      });
    });

    req.setTimeout(45000, () => {
      req.destroy();
      reject({
        question,
        error: 'Request timeout (45s)',
        responseTime: 45000,
        success: false,
        timeout: true
      });
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test health endpoint
 */
function testHealthEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: F8_URL,
      port: 443,
      path: '/health',
      method: 'GET',
      rejectUnauthorized: false
    };

    const startTime = Date.now();
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            response: response,
            responseTime: responseTime,
            success: res.statusCode === 200
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            response: data,
            responseTime: responseTime,
            success: false,
            error: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        error: error.message,
        success: false
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject({
        error: 'Health check timeout',
        success: false
      });
    });

    req.end();
  });
}

/**
 * Run tests for a specific category
 */
async function runCategoryTests(categoryName, questions, apiKey) {
  console.log(`\n${colors.bright}${colors.cyan}🧪 Testing Category: ${categoryName}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.yellow}Questions: ${questions.length}${colors.reset}\n`);
  
  const results = [];
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    console.log(`${colors.bright}[${i + 1}/${questions.length}]${colors.reset} ${question}`);
    
    try {
      const result = await makeRequest(question, 'standard', apiKey);
      results.push(result);
      
      if (result.success) {
        const responseText = result.response.response || result.response;
        const tokenInfo = result.response.usage ? 
          `${result.response.usage.total_tokens} (${result.response.usage.prompt_tokens}→${result.response.usage.completion_tokens})` : 
          'N/A';
        const cost = result.response.usage ? `$${result.response.usage.cost.toFixed(6)}` : 'N/A';
        const model = result.response.model || 'Unknown';
        const agent = result.response.agent || 'Unknown';
        
        console.log(`${colors.green}✅ Success${colors.reset} (${result.responseTime}ms)`);
        console.log(`   ${colors.cyan}Agent:${colors.reset} ${agent}`);
        console.log(`   ${colors.cyan}Model:${colors.reset} ${model}`);
        console.log(`   ${colors.cyan}Tokens:${colors.reset} ${tokenInfo} | ${colors.cyan}Cost:${colors.reset} ${cost}`);
        
        // Show first 200 characters of response
        const preview = responseText.substring(0, 200).replace(/\n/g, ' ');
        console.log(`   ${colors.cyan}Response:${colors.reset} ${preview}${responseText.length > 200 ? '...' : ''}`);
      } else {
        console.log(`${colors.red}❌ Failed${colors.reset} (${result.responseTime}ms)`);
        console.log(`   ${colors.red}Status:${colors.reset} ${result.status}`);
        console.log(`   ${colors.red}Error:${colors.reset} ${result.error || 'Unknown error'}`);
        
        if (result.parseError) {
          console.log(`   ${colors.red}Response:${colors.reset} ${result.response.substring(0, 200)}`);
        }
      }
    } catch (error) {
      console.log(`${colors.red}💥 Exception:${colors.reset} ${error.error || error.message}`);
      results.push(error);
    }
    
    console.log(''); // Empty line for readability
    
    // Delay between requests to avoid rate limiting
    if (i < questions.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  return results;
}

/**
 * Calculate statistics for results
 */
function calculateStats(results) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const responseTimes = results.map(r => r.responseTime || 0);
  
  const stats = {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    successRate: results.length > 0 ? (successful.length / results.length * 100).toFixed(2) : 0,
    avgResponseTime: responseTimes.length > 0 ? 
      (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(0) : 0,
    minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
    maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
    medianResponseTime: responseTimes.length > 0 ? 
      responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)] : 0
  };
  
  // Token usage statistics
  const tokenUsage = successful
    .filter(r => r.response.usage)
    .map(r => r.response.usage);
  
  if (tokenUsage.length > 0) {
    stats.totalTokens = tokenUsage.reduce((sum, u) => sum + (u.total_tokens || 0), 0);
    stats.avgTokens = (stats.totalTokens / tokenUsage.length).toFixed(0);
    stats.totalCost = tokenUsage.reduce((sum, u) => sum + (u.cost || 0), 0);
  }
  
  // Check which agent responded
  const agents = successful.map(r => r.response.agent).filter(Boolean);
  stats.agents = [...new Set(agents)];
  
  return stats;
}

/**
 * Print summary table
 */
function printSummaryTable(categoryResults) {
  console.log(`\n${colors.bright}${colors.magenta}📊 CATEGORY SUMMARY${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(100)}${colors.reset}`);
  console.log(`${colors.bright}Category                          | Success Rate | Avg Time  | Min/Max     | Total${colors.reset}`);
  console.log(`${colors.blue}${'-'.repeat(100)}${colors.reset}`);
  
  for (const [category, { stats }] of Object.entries(categoryResults)) {
    const categoryName = category.substring(0, 32).padEnd(32);
    const successRate = `${stats.successRate}%`.padStart(12);
    const avgTime = `${stats.avgResponseTime}ms`.padStart(9);
    const minMax = `${stats.minResponseTime}/${stats.maxResponseTime}ms`.padStart(11);
    const total = `${stats.successful}/${stats.total}`.padStart(8);
    
    const color = stats.successRate >= 90 ? colors.green : 
                  stats.successRate >= 70 ? colors.yellow : colors.red;
    
    console.log(`${categoryName} | ${color}${successRate}${colors.reset} | ${avgTime} | ${minMax} | ${total}`);
  }
  
  console.log(`${colors.blue}${'='.repeat(100)}${colors.reset}`);
}

/**
 * Main test execution
 */
async function runComprehensiveTests() {
  console.log(`${colors.bright}${colors.magenta}🚀 F8 SLACKBOT COMPREHENSIVE TEST SUITE${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.cyan}📅 Timestamp:${colors.reset} ${new Date().toISOString()}`);
  console.log(`${colors.cyan}🎯 Target:${colors.reset} https://${F8_URL}${F8_PATH}`);
  console.log(`${colors.cyan}🔧 Testing:${colors.reset} F8 Slackbot functionality through main gateway`);
  
  // Test health endpoint first
  console.log(`\n${colors.bright}${colors.yellow}🏥 Health Check${colors.reset}`);
  console.log(`${colors.blue}${'-'.repeat(80)}${colors.reset}`);
  
  try {
    const healthResult = await testHealthEndpoint();
    if (healthResult.success) {
      console.log(`${colors.green}✅ Health check passed${colors.reset} (${healthResult.responseTime}ms)`);
      console.log(`${colors.cyan}Service:${colors.reset} ${healthResult.response.service || 'Unknown'}`);
      console.log(`${colors.cyan}Version:${colors.reset} ${healthResult.response.version || 'Unknown'}`);
      console.log(`${colors.cyan}Status:${colors.reset} ${healthResult.response.status || 'Unknown'}`);
    } else {
      console.log(`${colors.red}❌ Health check failed${colors.reset}`);
      console.log(`${colors.red}Error:${colors.reset} ${healthResult.error}`);
    }
  } catch (error) {
    console.log(`${colors.red}💥 Health check error:${colors.reset} ${error.error || error.message}`);
  }
  
  // Get free API key for testing
  console.log(`\n${colors.bright}${colors.yellow}🔑 Getting Free API Key${colors.reset}`);
  console.log(`${colors.blue}${'-'.repeat(80)}${colors.reset}`);
  
  let apiKey;
  try {
    apiKey = await getFreeApiKey();
    console.log(`${colors.green}✅ API key obtained${colors.reset}: ${apiKey.substring(0, 20)}...`);
  } catch (error) {
    console.log(`${colors.red}❌ Failed to get API key:${colors.reset} ${error.message}`);
    console.log(`${colors.red}Cannot continue tests without API key${colors.reset}`);
    process.exit(1);
  }
  
  // Run all category tests
  const categoryResults = {};
  const overallStats = {
    totalQuestions: 0,
    totalSuccessful: 0,
    totalFailed: 0,
    totalResponseTime: 0,
    totalTokens: 0,
    totalCost: 0,
    agentsUsed: new Set()
  };
  
  for (const [category, questions] of Object.entries(slackbotTestQuestions)) {
    const results = await runCategoryTests(category, questions, apiKey);
    const stats = calculateStats(results);
    
    categoryResults[category] = { results, stats };
    
    overallStats.totalQuestions += stats.total;
    overallStats.totalSuccessful += stats.successful;
    overallStats.totalFailed += stats.failed;
    overallStats.totalResponseTime += parseInt(stats.avgResponseTime) * stats.successful;
    overallStats.totalTokens += stats.totalTokens || 0;
    overallStats.totalCost += stats.totalCost || 0;
    
    // Track which agents were used
    if (stats.agents) {
      stats.agents.forEach(agent => overallStats.agentsUsed.add(agent));
    }
    
    // Delay between categories
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Print summary table
  printSummaryTable(categoryResults);
  
  // Overall summary
  console.log(`\n${colors.bright}${colors.magenta}📊 OVERALL TEST SUMMARY${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(80)}${colors.reset}`);
  
  const overallSuccessRate = overallStats.totalQuestions > 0 ? 
    (overallStats.totalSuccessful / overallStats.totalQuestions * 100).toFixed(2) : 0;
  const overallAvgResponseTime = overallStats.totalSuccessful > 0 ? 
    (overallStats.totalResponseTime / overallStats.totalSuccessful).toFixed(0) : 0;
  
  const successColor = overallSuccessRate >= 90 ? colors.green : 
                       overallSuccessRate >= 70 ? colors.yellow : colors.red;
  
  console.log(`${colors.cyan}Total Questions:${colors.reset} ${overallStats.totalQuestions}`);
  console.log(`${colors.green}Successful:${colors.reset} ${overallStats.totalSuccessful}`);
  console.log(`${colors.red}Failed:${colors.reset} ${overallStats.totalFailed}`);
  console.log(`${colors.cyan}Overall Success Rate:${colors.reset} ${successColor}${overallSuccessRate}%${colors.reset}`);
  console.log(`${colors.cyan}Overall Avg Response Time:${colors.reset} ${overallAvgResponseTime}ms`);
  console.log(`${colors.cyan}Agents Used:${colors.reset} ${Array.from(overallStats.agentsUsed).join(', ') || 'None detected'}`);
  
  if (overallStats.totalTokens > 0) {
    console.log(`${colors.cyan}Total Tokens Used:${colors.reset} ${overallStats.totalTokens.toLocaleString()}`);
    console.log(`${colors.cyan}Average Tokens per Request:${colors.reset} ${(overallStats.totalTokens / overallStats.totalSuccessful).toFixed(0)}`);
    console.log(`${colors.cyan}Total Cost:${colors.reset} $${overallStats.totalCost.toFixed(6)}`);
  }
  
  // Save detailed results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `test-results/f8-slackbot-comprehensive-${timestamp}.json`;
  
  // Ensure test-results directory exists
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results', { recursive: true });
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    testType: 'f8-slackbot-comprehensive',
    endpoint: `https://${F8_URL}${F8_PATH}`,
    overallStats: {
      ...overallStats,
      agentsUsed: Array.from(overallStats.agentsUsed),
      successRate: overallSuccessRate,
      avgResponseTime: overallAvgResponseTime
    },
    categoryResults
  };
  
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`\n${colors.cyan}💾 Detailed results saved to:${colors.reset} ${filename}`);
  
  // Print test verdict
  console.log(`\n${colors.bright}${colors.magenta}🎯 TEST VERDICT${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(80)}${colors.reset}`);
  
  if (overallSuccessRate >= 95) {
    console.log(`${colors.green}${colors.bright}✅ EXCELLENT${colors.reset} - F8 Slackbot functionality is performing exceptionally well!`);
  } else if (overallSuccessRate >= 90) {
    console.log(`${colors.green}✅ GOOD${colors.reset} - F8 Slackbot functionality is performing well with minor issues.`);
  } else if (overallSuccessRate >= 80) {
    console.log(`${colors.yellow}⚠️  ACCEPTABLE${colors.reset} - F8 Slackbot functionality is working but needs improvement.`);
  } else if (overallSuccessRate >= 70) {
    console.log(`${colors.yellow}⚠️  CONCERNING${colors.reset} - F8 Slackbot functionality has significant issues that need attention.`);
  } else {
    console.log(`${colors.red}❌ CRITICAL${colors.reset} - F8 Slackbot functionality has major problems that require immediate attention!`);
  }
  
  console.log(`\n${colors.bright}${colors.green}✅ Comprehensive test suite completed!${colors.reset}\n`);
  
  // Exit with appropriate code
  process.exit(overallSuccessRate >= 80 ? 0 : 1);
}

// Run the tests
if (require.main === module) {
  runComprehensiveTests().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = { 
  runComprehensiveTests, 
  slackbotTestQuestions,
  testHealthEndpoint,
  makeRequest
};
