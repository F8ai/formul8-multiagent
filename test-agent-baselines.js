#!/usr/bin/env node

const https = require('https');

// Agent baseline questions extracted from the comprehensive test suite
const agentBaselines = {
  'f8_agent': [
    'What are the benefits of cannabis?',
    'How do I scale up my cannabis production?',
    'I want to start a cannabis business',
    'What is the meaning of life?',
    'I need help with something completely unrelated to cannabis or business'
  ],
  'compliance': [
    'What are the compliance requirements for cannabis businesses in California?',
    'What are the multi-state compliance challenges for cannabis?'
  ],
  'formulation': [
    'How do I calculate THC dosage?',
    'Create a recipe for cannabis gummies with 10mg THC each',
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
  ],
  'sourcing': [
    'Where can I source high-quality cannabis seeds?'
  ],
  'patent': [
    'Can I patent my cannabis extraction process?'
  ],
  'spectra': [
    'How do I analyze cannabis potency using spectroscopy?'
  ],
  'customer_success': [
    'What strategies improve customer retention in cannabis retail?'
  ],
  'f8_slackbot': [
    'How do I integrate Slack notifications for my cannabis team?'
  ],
  'mcr': [
    'What are the MCR requirements for cannabis facilities?'
  ],
  'ad': [
    'How do I create effective cannabis advertising campaigns?'
  ],
  'editor_agent': [
    'How do I configure agent routing for new users?',
    'Update the micro tier to include patent research capabilities'
  ]
};

// Performance test questions
const performanceQuestions = [
  'What is CBD?',
  'How do I extract THC?',
  'What are terpenes?',
  'How do I test cannabis potency?',
  'What is the difference between indica and sativa?'
];

// Long form questions
const longFormQuestions = [
  'I am planning to open a cannabis dispensary in California and need comprehensive guidance on all aspects including licensing, compliance, product sourcing, marketing, operations, and customer management. Can you provide detailed step-by-step advice for each area?',
  'I have a cannabis cultivation facility and want to expand into manufacturing edibles. I need help with formulation, compliance, equipment, processes, testing, packaging, and distribution. Please provide detailed guidance for each step.',
  'I am a cannabis researcher working on developing new extraction methods and need assistance with patent research, scientific analysis, regulatory compliance, and commercial viability assessment. Can you help me with all these aspects?'
];

// Edge case questions
const edgeCaseQuestions = [
  'asdfghjklqwertyuiop',
  'What is the meaning of life?',
  'I need help with something completely unrelated to cannabis or business'
];

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
        
        console.log(`✅ Success (${responseTime}ms)`);
        console.log(`📊 ${tokenInfo} | ${cost}`);
        console.log(`💬 Response: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
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
    await new Promise(resolve => setTimeout(resolve, 1000));
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
async function runAllBaselineTests() {
  console.log('🚀 Starting Formul8 Agent Baseline Tests');
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
  for (const [agentName, questions] of Object.entries(agentBaselines)) {
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
  
  // Test performance questions
  console.log(`\n⚡ Testing Performance Questions (${performanceQuestions.length} questions)`);
  console.log('='.repeat(60));
  
  const perfResults = await runAgentTests('performance', performanceQuestions);
  const perfStats = calculateStats(perfResults);
  allResults.performance = { results: perfResults, stats: perfStats };
  
  overallStats.totalQuestions += perfStats.total;
  overallStats.totalSuccessful += perfStats.successful;
  overallStats.totalFailed += perfStats.failed;
  overallStats.totalResponseTime += perfStats.avgResponseTime * perfStats.successful;
  
  // Test long form questions
  console.log(`\n📝 Testing Long Form Questions (${longFormQuestions.length} questions)`);
  console.log('='.repeat(60));
  
  const longFormResults = await runAgentTests('long_form', longFormQuestions);
  const longFormStats = calculateStats(longFormResults);
  allResults.long_form = { results: longFormResults, stats: longFormStats };
  
  overallStats.totalQuestions += longFormStats.total;
  overallStats.totalSuccessful += longFormStats.successful;
  overallStats.totalFailed += longFormStats.failed;
  overallStats.totalResponseTime += longFormStats.avgResponseTime * longFormStats.successful;
  
  // Test edge cases
  console.log(`\n🔍 Testing Edge Cases (${edgeCaseQuestions.length} questions)`);
  console.log('='.repeat(60));
  
  const edgeResults = await runAgentTests('edge_cases', edgeCaseQuestions);
  const edgeStats = calculateStats(edgeResults);
  allResults.edge_cases = { results: edgeResults, stats: edgeStats };
  
  overallStats.totalQuestions += edgeStats.total;
  overallStats.totalSuccessful += edgeStats.successful;
  overallStats.totalFailed += edgeStats.failed;
  overallStats.totalResponseTime += edgeStats.avgResponseTime * edgeStats.successful;
  
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
  const filename = `baseline-test-results-${timestamp}.json`;
  
  const report = {
    timestamp: new Date().toISOString(),
    endpoint: 'https://f8.syzygyx.com/api/chat',
    overallStats,
    agentResults: allResults
  };
  
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`\n💾 Detailed results saved to: ${filename}`);
  
  console.log('\n✅ Baseline testing completed!');
}

// Run the tests
if (require.main === module) {
  runAllBaselineTests().catch(console.error);
}

module.exports = { runAllBaselineTests, agentBaselines };