#!/usr/bin/env node

const https = require('https');

// Key agent baseline questions for testing
const keyAgentTests = {
  'f8_agent': [
    'What are the benefits of cannabis?',
    'How do I scale up my cannabis production?',
    'I want to start a cannabis business'
  ],
  'compliance': [
    'What are the compliance requirements for cannabis businesses in California?'
  ],
  'formulation': [
    'How do I calculate THC dosage?',
    'How do I make cannabis edibles?'
  ],
  'science': [
    'What is THC?',
    'What extraction method is best for high-CBD products?'
  ],
  'operations': [
    'How do I optimize my cannabis facility operations?'
  ],
  'marketing': [
    'How should I market my cannabis brand on social media?'
  ]
};

// Function to make API request
function makeRequest(question) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ message: question });
    
    const options = {
      hostname: 'f8.syzygyx.com',
      port: 443,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            question,
            status: res.statusCode,
            response: response,
            success: res.statusCode === 200
          });
        } catch (error) {
          resolve({
            question,
            status: res.statusCode,
            response: data,
            success: false,
            error: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        question,
        error: error.message,
        success: false
      });
    });

    req.write(postData);
    req.end();
  });
}

// Function to run tests for a specific agent
async function runAgentTests(agentName, questions) {
  console.log(`\n🧪 Testing ${agentName} Agent (${questions.length} questions)`);
  console.log('='.repeat(60));
  
  const results = [];
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    console.log(`\n[${i + 1}/${questions.length}] ${question}`);
    
    try {
      const startTime = Date.now();
      const result = await makeRequest(question);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      result.responseTime = responseTime;
      results.push(result);
      
      if (result.success) {
        const responseText = result.response.response || result.response;
        const tokenInfo = result.response.usage ? 
          `Tokens: ${result.response.usage.total_tokens} (${result.response.usage.prompt_tokens}→${result.response.usage.completion_tokens})` : 
          'No token info';
        const cost = result.response.usage ? `Cost: $${result.response.usage.cost}` : 'No cost info';
        const model = result.response.model || 'Unknown model';
        
        console.log(`✅ Success (${responseTime}ms)`);
        console.log(`🤖 Model: ${model}`);
        console.log(`📊 ${tokenInfo} | ${cost}`);
        console.log(`💬 Response: ${responseText.substring(0, 150)}${responseText.length > 150 ? '...' : ''}`);
      } else {
        console.log(`❌ Failed (${responseTime}ms)`);
        console.log(`Status: ${result.status}`);
        console.log(`Error: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`💥 Error: ${error.message}`);
      results.push({
        question,
        success: false,
        error: error.message,
        responseTime: 0
      });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}

// Function to calculate statistics
function calculateStats(results) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const responseTimes = successful.map(r => r.responseTime);
  
  const stats = {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    successRate: (successful.length / results.length * 100).toFixed(2),
    avgResponseTime: responseTimes.length > 0 ? 
      (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(0) : 0,
    minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
    maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0
  };
  
  return stats;
}

// Main execution function
async function runKeyAgentTests() {
  console.log('🚀 Starting Formul8 Key Agent Baseline Tests');
  console.log('='.repeat(60));
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🎯 Testing against: https://f8.syzygyx.com/api/chat`);
  
  const allResults = {};
  const overallStats = {
    totalQuestions: 0,
    totalSuccessful: 0,
    totalFailed: 0,
    totalResponseTime: 0
  };
  
  // Test each agent
  for (const [agentName, questions] of Object.entries(keyAgentTests)) {
    if (questions.length === 0) continue;
    
    const results = await runAgentTests(agentName, questions);
    const stats = calculateStats(results);
    
    allResults[agentName] = { results, stats };
    
    overallStats.totalQuestions += stats.total;
    overallStats.totalSuccessful += stats.successful;
    overallStats.totalFailed += stats.failed;
    overallStats.totalResponseTime += stats.avgResponseTime * stats.successful;
    
    console.log(`\n📊 ${agentName} Summary:`);
    console.log(`   Success Rate: ${stats.successRate}% (${stats.successful}/${stats.total})`);
    console.log(`   Avg Response Time: ${stats.avgResponseTime}ms`);
    console.log(`   Response Time Range: ${stats.minResponseTime}ms - ${stats.maxResponseTime}ms`);
  }
  
  // Overall summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 OVERALL TEST SUMMARY');
  console.log('='.repeat(60));
  
  const overallSuccessRate = (overallStats.totalSuccessful / overallStats.totalQuestions * 100).toFixed(2);
  const overallAvgResponseTime = overallStats.totalSuccessful > 0 ? 
    (overallStats.totalResponseTime / overallStats.totalSuccessful).toFixed(0) : 0;
  
  console.log(`Total Questions: ${overallStats.totalQuestions}`);
  console.log(`Successful: ${overallStats.totalSuccessful}`);
  console.log(`Failed: ${overallStats.totalFailed}`);
  console.log(`Overall Success Rate: ${overallSuccessRate}%`);
  console.log(`Overall Avg Response Time: ${overallAvgResponseTime}ms`);
  
  // Agent-specific summary
  console.log('\n📋 AGENT-SPECIFIC RESULTS:');
  console.log('-'.repeat(60));
  
  for (const [agentName, { stats }] of Object.entries(allResults)) {
    console.log(`${agentName.padEnd(20)} | ${stats.successRate.padStart(6)}% | ${stats.avgResponseTime.padStart(6)}ms | ${stats.successful}/${stats.total}`);
  }
  
  // Save results to file
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `key-agent-test-results-${timestamp}.json`;
  
  const report = {
    timestamp: new Date().toISOString(),
    endpoint: 'https://f8.syzygyx.com/api/chat',
    overallStats,
    agentResults: allResults
  };
  
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`\n💾 Detailed results saved to: ${filename}`);
  
  console.log('\n✅ Key agent baseline testing completed!');
}

// Run the tests
if (require.main === module) {
  runKeyAgentTests().catch(console.error);
}

module.exports = { runKeyAgentTests, keyAgentTests };