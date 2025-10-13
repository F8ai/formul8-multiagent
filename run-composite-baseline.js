#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Load composite baseline from baseline.json
const baselineConfig = JSON.parse(fs.readFileSync('baseline.json', 'utf8'));
const agents = baselineConfig.agents;

// Function to make API request
function makeRequest(url, question, agentName) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ 
      message: question,
      plan: 'standard',
      username: 'baseline-tester'
    });
    
    // Parse URL to get hostname and path
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + '/api/chat',
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
            agent: agentName,
            question: question,
            success: res.statusCode === 200,
            statusCode: res.statusCode,
            response: response,
            responseTime: Date.now() - startTime
          });
        } catch (error) {
          resolve({
            agent: agentName,
            question: question,
            success: false,
            statusCode: res.statusCode,
            error: 'Failed to parse response',
            responseTime: Date.now() - startTime
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        agent: agentName,
        question: question,
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      });
    });

    const startTime = Date.now();
    req.write(postData);
    req.end();
  });
}

// Function to test a single agent
async function testAgent(agentKey, agentConfig) {
  console.log(`\n🧪 Testing ${agentConfig.name} (${agentKey})...`);
  console.log(`📍 URL: ${agentConfig.url}`);
  
  const results = [];
  
  for (const question of agentConfig.baseline_questions) {
    console.log(`  ❓ ${question}`);
    
    try {
      const result = await makeRequest(agentConfig.url, question, agentKey);
      results.push(result);
      
      if (result.success) {
        console.log(`  ✅ Success (${result.responseTime}ms)`);
        if (result.response && result.response.usage) {
          console.log(`     📊 Tokens: ${result.response.usage.total_tokens}, Cost: $${result.response.usage.cost.toFixed(6)}`);
        }
      } else {
        console.log(`  ❌ Failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      results.push({
        agent: agentKey,
        question: question,
        success: false,
        error: error.message,
        responseTime: 0
      });
    }
  }
  
  return results;
}

// Function to run all baseline tests
async function runAllBaselineTests() {
  console.log('🚀 Starting Formul8 Composite Baseline Tests');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🎯 Testing ${Object.keys(agents).length} agents`);
  
  const allResults = [];
  const summary = {
    total_agents: Object.keys(agents).length,
    total_questions: 0,
    successful_questions: 0,
    failed_questions: 0,
    total_response_time: 0,
    agents: {}
  };
  
  for (const [agentKey, agentConfig] of Object.entries(agents)) {
    const agentResults = await testAgent(agentKey, agentConfig);
    allResults.push(...agentResults);
    
    // Calculate agent summary
    const agentSummary = {
      name: agentConfig.name,
      total_questions: agentResults.length,
      successful_questions: agentResults.filter(r => r.success).length,
      failed_questions: agentResults.filter(r => !r.success).length,
      avg_response_time: agentResults.reduce((sum, r) => sum + (r.responseTime || 0), 0) / agentResults.length,
      success_rate: (agentResults.filter(r => r.success).length / agentResults.length) * 100
    };
    
    summary.agents[agentKey] = agentSummary;
    summary.total_questions += agentSummary.total_questions;
    summary.successful_questions += agentSummary.successful_questions;
    summary.failed_questions += agentSummary.failed_questions;
    summary.total_response_time += agentResults.reduce((sum, r) => sum + (r.responseTime || 0), 0);
    
    console.log(`  📈 Success Rate: ${agentSummary.success_rate.toFixed(1)}% (${agentSummary.successful_questions}/${agentSummary.total_questions})`);
  }
  
  // Calculate overall summary
  summary.overall_success_rate = (summary.successful_questions / summary.total_questions) * 100;
  summary.avg_response_time = summary.total_response_time / summary.total_questions;
  
  // Display overall summary
  console.log('\n📊 COMPOSITE BASELINE TEST SUMMARY');
  console.log('=====================================');
  console.log(`🎯 Total Agents: ${summary.total_agents}`);
  console.log(`❓ Total Questions: ${summary.total_questions}`);
  console.log(`✅ Successful: ${summary.successful_questions}`);
  console.log(`❌ Failed: ${summary.failed_questions}`);
  console.log(`📈 Overall Success Rate: ${summary.overall_success_rate.toFixed(1)}%`);
  console.log(`⏱️  Average Response Time: ${summary.avg_response_time.toFixed(0)}ms`);
  
  // Display per-agent summary
  console.log('\n📋 PER-AGENT RESULTS');
  console.log('====================');
  for (const [agentKey, agentSummary] of Object.entries(summary.agents)) {
    console.log(`${agentSummary.name}: ${agentSummary.success_rate.toFixed(1)}% (${agentSummary.successful_questions}/${agentSummary.total_questions}) - ${agentSummary.avg_response_time.toFixed(0)}ms avg`);
  }
  
  // Save detailed results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = `composite-baseline-results-${timestamp}.json`;
  
  const detailedResults = {
    timestamp: new Date().toISOString(),
    summary: summary,
    baseline_config: baselineConfig,
    detailed_results: allResults
  };
  
  fs.writeFileSync(resultsFile, JSON.stringify(detailedResults, null, 2));
  console.log(`\n💾 Detailed results saved to: ${resultsFile}`);
  
  // Return success status
  return summary.overall_success_rate >= 80; // Consider 80%+ success rate as passing
}

// Run the tests
if (require.main === module) {
  runAllBaselineTests()
    .then(success => {
      if (success) {
        console.log('\n🎉 Composite baseline tests PASSED!');
        process.exit(0);
      } else {
        console.log('\n💥 Composite baseline tests FAILED!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllBaselineTests, testAgent };