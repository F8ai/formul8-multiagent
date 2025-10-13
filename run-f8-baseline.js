#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Load composite baseline from baseline.json
const baselineConfig = JSON.parse(fs.readFileSync('baseline.json', 'utf8'));
const agents = baselineConfig.agents;

// Function to make API request to F8 main agent
function makeF8Request(question, agentName) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ 
      message: question,
      plan: 'standard',
      username: 'baseline-tester'
    });
    
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

// Function to test F8 agent with all baseline questions
async function testF8Agent() {
  console.log('🚀 Starting F8 Agent Composite Baseline Test');
  console.log(`📅 ${new Date().toISOString()}`);
  
  const allQuestions = [];
  
  // Collect all questions from all agents
  for (const [agentKey, agentConfig] of Object.entries(agents)) {
    for (const question of agentConfig.baseline_questions) {
      allQuestions.push({
        agent: agentKey,
        agentName: agentConfig.name,
        question: question,
        expectedSpecialty: agentConfig.specialties[0] // First specialty as expected focus
      });
    }
  }
  
  console.log(`🎯 Testing ${allQuestions.length} questions across ${Object.keys(agents).length} agent specialties`);
  
  const results = [];
  let successCount = 0;
  let totalResponseTime = 0;
  
  for (let i = 0; i < allQuestions.length; i++) {
    const { agent, agentName, question, expectedSpecialty } = allQuestions[i];
    
    console.log(`\n[${i + 1}/${allQuestions.length}] Testing ${agentName} specialty`);
    console.log(`❓ ${question}`);
    console.log(`🎯 Expected focus: ${expectedSpecialty}`);
    
    try {
      const result = await makeF8Request(question, agent);
      results.push(result);
      
      if (result.success) {
        successCount++;
        console.log(`✅ Success (${result.responseTime}ms)`);
        
        if (result.response && result.response.usage) {
          console.log(`📊 Tokens: ${result.response.usage.total_tokens}, Cost: $${result.response.usage.cost.toFixed(6)}`);
        }
        
        if (result.response && result.response.response) {
          // Show first 100 characters of response
          const preview = result.response.response.substring(0, 100).replace(/\n/g, ' ');
          console.log(`💬 Response: ${preview}...`);
        }
      } else {
        console.log(`❌ Failed: ${result.error || 'Unknown error'}`);
      }
      
      totalResponseTime += result.responseTime || 0;
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      results.push({
        agent: agent,
        question: question,
        success: false,
        error: error.message,
        responseTime: 0
      });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Calculate summary
  const successRate = (successCount / allQuestions.length) * 100;
  const avgResponseTime = totalResponseTime / allQuestions.length;
  
  // Display summary
  console.log('\n📊 F8 AGENT COMPOSITE BASELINE TEST SUMMARY');
  console.log('============================================');
  console.log(`🎯 Total Questions: ${allQuestions.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${allQuestions.length - successCount}`);
  console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`⏱️  Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  
  // Group results by agent
  console.log('\n📋 RESULTS BY AGENT SPECIALTY');
  console.log('==============================');
  const agentResults = {};
  
  for (const result of results) {
    if (!agentResults[result.agent]) {
      agentResults[result.agent] = { total: 0, successful: 0 };
    }
    agentResults[result.agent].total++;
    if (result.success) {
      agentResults[result.agent].successful++;
    }
  }
  
  for (const [agentKey, stats] of Object.entries(agentResults)) {
    const agentName = agents[agentKey]?.name || agentKey;
    const rate = (stats.successful / stats.total) * 100;
    console.log(`${agentName}: ${rate.toFixed(1)}% (${stats.successful}/${stats.total})`);
  }
  
  // Save detailed results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = `f8-baseline-results-${timestamp}.json`;
  
  const detailedResults = {
    timestamp: new Date().toISOString(),
    summary: {
      total_questions: allQuestions.length,
      successful_questions: successCount,
      failed_questions: allQuestions.length - successCount,
      success_rate: successRate,
      avg_response_time: avgResponseTime
    },
    agent_results: agentResults,
    baseline_config: baselineConfig,
    detailed_results: results
  };
  
  fs.writeFileSync(resultsFile, JSON.stringify(detailedResults, null, 2));
  console.log(`\n💾 Detailed results saved to: ${resultsFile}`);
  
  return successRate >= 80; // Consider 80%+ success rate as passing
}

// Run the tests
if (require.main === module) {
  testF8Agent()
    .then(success => {
      if (success) {
        console.log('\n🎉 F8 Agent baseline tests PASSED!');
        process.exit(0);
      } else {
        console.log('\n💥 F8 Agent baseline tests FAILED!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testF8Agent };