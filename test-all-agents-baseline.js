#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Load agents from agents.json
const agentsConfig = JSON.parse(fs.readFileSync('config/agents.json', 'utf8'));
const agents = agentsConfig.agents;

// Baseline questions for each agent type based on their specialties
const agentBaselineQuestions = {
  'f8_agent': [
    'What are the benefits of cannabis?',
    'How do I scale up my cannabis production?',
    'I want to start a cannabis business',
    'What is the meaning of life?',
    'I need help with something completely unrelated to cannabis or business'
  ],
  'compliance': [
    'What are the compliance requirements for cannabis businesses in California?',
    'What are the multi-state compliance challenges for cannabis?',
    'How do I maintain compliance records for cannabis cultivation?',
    'What are the testing requirements for cannabis products?'
  ],
  'formulation': [
    'How do I calculate THC dosage?',
    'How do I make cannabis edibles?',
    'Create a recipe for cannabis gummies with 10mg THC each',
    'What extraction method is best for high-CBD products?'
  ],
  'science': [
    'What is THC?',
    'What are terpenes?',
    'How do I test cannabis potency?',
    'What is the difference between indica and sativa?'
  ],
  'operations': [
    'How do I optimize my cannabis facility operations?',
    'What are the best practices for cannabis cultivation?',
    'How do I manage cannabis inventory?'
  ],
  'marketing': [
    'How should I market my cannabis brand on social media?',
    'What are the best practices for cannabis advertising?',
    'How do I build brand awareness for cannabis products?'
  ],
  'sourcing': [
    'Where can I source high-quality cannabis seeds?',
    'How do I evaluate cannabis suppliers?',
    'What are the best practices for cannabis supply chain management?'
  ],
  'patent': [
    'Can I patent my cannabis extraction process?',
    'How do I conduct patent research for cannabis innovations?',
    'What are the IP considerations for cannabis businesses?'
  ],
  'spectra': [
    'How do I analyze cannabis potency using spectroscopy?',
    'What equipment is needed for cannabis testing?',
    'How do I interpret cannabis lab results?'
  ],
  'customer_success': [
    'What strategies improve customer retention in cannabis retail?',
    'How do I optimize customer onboarding for cannabis products?',
    'What are the best practices for cannabis customer support?'
  ],
  'f8_slackbot': [
    'How do I integrate Slack notifications for my cannabis team?',
    'How do I set up automated workflows for cannabis operations?'
  ],
  'mcr': [
    'What are the MCR requirements for cannabis facilities?',
    'How do I maintain master control records for cannabis?'
  ],
  'ad': [
    'How do I create effective cannabis advertising campaigns?',
    'What are the compliance requirements for cannabis advertising?'
  ],
  'editor_agent': [
    'How do I configure agent routing for new users?',
    'Update the micro tier to include patent research capabilities'
  ]
};

// Function to make API request
function makeRequest(url, question) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ message: question });
    
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
            question,
            status: res.statusCode,
            response: response,
            success: res.statusCode === 200,
            url: url
          });
        } catch (error) {
          resolve({
            question,
            status: res.statusCode,
            response: data,
            success: false,
            error: error.message,
            url: url
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        question,
        error: error.message,
        success: false,
        url: url
      });
    });

    req.write(postData);
    req.end();
  });
}

// Function to test agent health
function testAgentHealth(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + '/health',
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          url: url,
          status: res.statusCode,
          healthy: res.statusCode === 200,
          response: data
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        url: url,
        status: 0,
        healthy: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url: url,
        status: 0,
        healthy: false,
        error: 'Timeout'
      });
    });

    req.end();
  });
}

// Function to run tests for a specific agent
async function runAgentTests(agentKey, agentConfig, questions) {
  console.log(`\n🧪 Testing ${agentConfig.name} (${agentKey})`);
  console.log(`📍 URL: ${agentConfig.url}`);
  console.log(`📝 Type: ${agentConfig.type}`);
  console.log(`🔑 Keywords: ${agentConfig.keywords.join(', ')}`);
  console.log('='.repeat(80));
  
  // First test health
  console.log(`\n🏥 Health Check:`);
  const healthResult = await testAgentHealth(agentConfig.url);
  if (healthResult.healthy) {
    console.log(`✅ Agent is healthy (${healthResult.status})`);
  } else {
    console.log(`❌ Agent is not healthy (${healthResult.status}): ${healthResult.error || 'Unknown error'}`);
    return {
      agentKey,
      agentConfig,
      health: healthResult,
      results: [],
      stats: { total: 0, successful: 0, failed: 0, successRate: '0.00', avgResponseTime: 0 }
    };
  }
  
  const results = [];
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    console.log(`\n[${i + 1}/${questions.length}] ${question}`);
    
    try {
      const startTime = Date.now();
      const result = await makeRequest(agentConfig.url, question);
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
        responseTime: 0,
        url: agentConfig.url
      });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return {
    agentKey,
    agentConfig,
    health: healthResult,
    results,
    stats: calculateStats(results)
  };
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
async function runAllAgentBaselineTests() {
  console.log('🚀 Starting Formul8 All Agents Baseline Tests');
  console.log('='.repeat(80));
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🎯 Testing all agents from agents.json`);
  console.log(`📊 Total agents found: ${Object.keys(agents).length}`);
  
  const allResults = {};
  const overallStats = {
    totalAgents: Object.keys(agents).length,
    healthyAgents: 0,
    unhealthyAgents: 0,
    totalQuestions: 0,
    totalSuccessful: 0,
    totalFailed: 0,
    totalResponseTime: 0
  };
  
  // Test each agent
  for (const [agentKey, agentConfig] of Object.entries(agents)) {
    const questions = agentBaselineQuestions[agentKey] || [];
    
    if (questions.length === 0) {
      console.log(`\n⚠️  No baseline questions defined for ${agentKey}, skipping...`);
      continue;
    }
    
    const agentResult = await runAgentTests(agentKey, agentConfig, questions);
    allResults[agentKey] = agentResult;
    
    // Update overall stats
    if (agentResult.health.healthy) {
      overallStats.healthyAgents++;
    } else {
      overallStats.unhealthyAgents++;
    }
    
    overallStats.totalQuestions += agentResult.stats.total;
    overallStats.totalSuccessful += agentResult.stats.successful;
    overallStats.totalFailed += agentResult.stats.failed;
    overallStats.totalResponseTime += agentResult.stats.avgResponseTime * agentResult.stats.successful;
    
    console.log(`\n📊 ${agentKey} Summary:`);
    console.log(`   Health: ${agentResult.health.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`   Success Rate: ${agentResult.stats.successRate}% (${agentResult.stats.successful}/${agentResult.stats.total})`);
    console.log(`   Avg Response Time: ${agentResult.stats.avgResponseTime}ms`);
    console.log(`   Response Time Range: ${agentResult.stats.minResponseTime}ms - ${agentResult.stats.maxResponseTime}ms`);
  }
  
  // Overall summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 OVERALL TEST SUMMARY');
  console.log('='.repeat(80));
  
  const overallSuccessRate = (overallStats.totalSuccessful / overallStats.totalQuestions * 100).toFixed(2);
  const overallAvgResponseTime = overallStats.totalSuccessful > 0 ? 
    (overallStats.totalResponseTime / overallStats.totalSuccessful).toFixed(0) : 0;
  
  console.log(`Total Agents: ${overallStats.totalAgents}`);
  console.log(`Healthy Agents: ${overallStats.healthyAgents}`);
  console.log(`Unhealthy Agents: ${overallStats.unhealthyAgents}`);
  console.log(`Total Questions: ${overallStats.totalQuestions}`);
  console.log(`Successful: ${overallStats.totalSuccessful}`);
  console.log(`Failed: ${overallStats.totalFailed}`);
  console.log(`Overall Success Rate: ${overallSuccessRate}%`);
  console.log(`Overall Avg Response Time: ${overallAvgResponseTime}ms`);
  
  // Agent-specific summary
  console.log('\n📋 AGENT-SPECIFIC RESULTS:');
  console.log('-'.repeat(80));
  console.log('Agent'.padEnd(20) + ' | Health | Success | Avg Time | Questions');
  console.log('-'.repeat(80));
  
  for (const [agentKey, result] of Object.entries(allResults)) {
    const healthStatus = result.health.healthy ? '✅' : '❌';
    const successRate = result.stats.successRate + '%';
    const avgTime = result.stats.avgResponseTime + 'ms';
    const questions = `${result.stats.successful}/${result.stats.total}`;
    
    console.log(
      agentKey.padEnd(20) + ' | ' +
      healthStatus.padEnd(6) + ' | ' +
      successRate.padStart(7) + ' | ' +
      avgTime.padStart(8) + ' | ' +
      questions
    );
  }
  
  // Save results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `all-agents-baseline-results-${timestamp}.json`;
  
  const report = {
    timestamp: new Date().toISOString(),
    agentsConfig: agents,
    overallStats,
    agentResults: allResults
  };
  
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`\n💾 Detailed results saved to: ${filename}`);
  
  console.log('\n✅ All agents baseline testing completed!');
}

// Run the tests
if (require.main === module) {
  runAllAgentBaselineTests().catch(console.error);
}

module.exports = { runAllAgentBaselineTests, agents, agentBaselineQuestions };