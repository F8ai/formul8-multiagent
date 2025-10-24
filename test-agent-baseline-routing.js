#!/usr/bin/env node

/**
 * Test Agent Baseline Routing Validation
 * 
 * This test validates that each agent's baseline questions
 * actually route to the correct agent.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CHAT_ENDPOINT = 'https://chat.formul8.ai';
const DELAY_BETWEEN_REQUESTS = 2000;

// Load compiled baseline
const baselinePath = path.join(__dirname, 'baseline.json');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

console.log('🧪 Testing Agent Baseline Routing Validation');
console.log('='.repeat(80));
console.log(`📅 ${new Date().toISOString()}`);
console.log(`🎯 Endpoint: ${CHAT_ENDPOINT}`);
console.log(`📊 Total questions: ${baseline.questions.length}`);
console.log('='.repeat(80));

// Function to test a single question
async function testQuestion(question) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ message: question.question });
    
    const startTime = Date.now();
    const req = https.request({
      hostname: 'chat.formul8.ai',
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => { data += chunk; });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        try {
          const response = JSON.parse(data);
          resolve({
            success: res.statusCode === 200,
            actualAgent: response.agent,
            expectedAgent: question.expectedAgent,
            responseTime: responseTime,
            isCorrect: response.agent === question.expectedAgent
          });
        } catch (error) {
          resolve({
            success: false,
            error: error.message,
            expectedAgent: question.expectedAgent,
            responseTime: responseTime,
            isCorrect: false
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        expectedAgent: question.expectedAgent,
        responseTime: Date.now() - startTime,
        isCorrect: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout',
        expectedAgent: question.expectedAgent,
        responseTime: Date.now() - startTime,
        isCorrect: false
      });
    });

    req.write(postData);
    req.end();
  });
}

// Main test function
async function runTests() {
  const results = {
    total: baseline.questions.length,
    correct: 0,
    incorrect: 0,
    byAgent: {},
    incorrectRouting: []
  };

  for (let i = 0; i < baseline.questions.length; i++) {
    const question = baseline.questions[i];
    const expectedAgent = question.expectedAgent || question.sourceAgent;
    
    console.log(`\n[${i + 1}/${baseline.questions.length}] Testing: ${question.id}`);
    console.log(`   Question: "${question.question}"`);
    console.log(`   Expected Agent: ${expectedAgent}`);
    
    // Initialize agent tracking
    if (!results.byAgent[expectedAgent]) {
      results.byAgent[expectedAgent] = {
        total: 0,
        correct: 0,
        incorrect: 0,
        accuracy: 0
      };
    }
    results.byAgent[expectedAgent].total++;

    try {
      const result = await testQuestion({
        ...question,
        expectedAgent: expectedAgent
      });

      if (result.isCorrect) {
        results.correct++;
        results.byAgent[expectedAgent].correct++;
        console.log(`   ✅ CORRECT: Routed to ${result.actualAgent} (${result.responseTime}ms)`);
      } else {
        results.incorrect++;
        results.byAgent[expectedAgent].incorrect++;
        console.log(`   ❌ INCORRECT: Expected ${expectedAgent}, got ${result.actualAgent || 'ERROR'} (${result.responseTime}ms)`);
        results.incorrectRouting.push({
          id: question.id,
          question: question.question,
          expected: expectedAgent,
          actual: result.actualAgent || 'ERROR',
          error: result.error
        });
      }

      // Delay between requests
      if (i < baseline.questions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      }
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
      results.incorrect++;
      results.byAgent[expectedAgent].incorrect++;
    }
  }

  // Calculate agent accuracies
  Object.keys(results.byAgent).forEach(agent => {
    const stats = results.byAgent[agent];
    stats.accuracy = ((stats.correct / stats.total) * 100).toFixed(1);
  });

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 ROUTING VALIDATION RESULTS');
  console.log('='.repeat(80));
  
  const overallAccuracy = ((results.correct / results.total) * 100).toFixed(2);
  console.log(`\nOverall Routing Accuracy: ${results.correct}/${results.total} (${overallAccuracy}%)`);
  
  console.log('\n📋 By Agent:');
  console.log('─'.repeat(80));
  console.log('Agent'.padEnd(20) + ' | Questions | Correct | Accuracy | Status');
  console.log('─'.repeat(80));
  
  // Sort by accuracy (ascending) to show worst first
  const sortedAgents = Object.entries(results.byAgent)
    .sort((a, b) => parseFloat(a[1].accuracy) - parseFloat(b[1].accuracy));
  
  for (const [agent, stats] of sortedAgents) {
    const status = parseFloat(stats.accuracy) >= 80 ? '✅' : 
                   parseFloat(stats.accuracy) >= 60 ? '⚠️' : '🔴';
    console.log(
      agent.padEnd(20) + ' | ' +
      stats.total.toString().padStart(9) + ' | ' +
      stats.correct.toString().padStart(7) + ' | ' +
      (stats.accuracy + '%').padStart(8) + ' | ' +
      status
    );
  }
  
  console.log('─'.repeat(80));
  
  // Show incorrect routing details
  if (results.incorrectRouting.length > 0) {
    console.log('\n❌ INCORRECT ROUTING DETAILS:');
    console.log('─'.repeat(80));
    results.incorrectRouting.forEach((item, idx) => {
      console.log(`\n${idx + 1}. ${item.id}`);
      console.log(`   Question: "${item.question}"`);
      console.log(`   Expected: ${item.expected}`);
      console.log(`   Got: ${item.actual}`);
      if (item.error) console.log(`   Error: ${item.error}`);
    });
  }
  
  // Overall assessment
  console.log('\n' + '='.repeat(80));
  console.log('🎯 ASSESSMENT');
  console.log('='.repeat(80));
  
  if (overallAccuracy >= 90) {
    console.log('✅ EXCELLENT: Routing is working well! (90%+ accuracy)');
  } else if (overallAccuracy >= 70) {
    console.log('⚠️  GOOD: Routing is working but needs improvement. (70-89% accuracy)');
  } else if (overallAccuracy >= 50) {
    console.log('🟡 FAIR: Routing needs significant improvement. (50-69% accuracy)');
  } else {
    console.log('🔴 CRITICAL: Routing is broken and needs immediate attention! (<50% accuracy)');
  }
  
  console.log(`\nCurrent: ${overallAccuracy}%`);
  console.log('Target: 85%+ for production readiness');
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `agent-baseline-routing-results-${timestamp}.json`;
  
  const report = {
    timestamp: new Date().toISOString(),
    endpoint: CHAT_ENDPOINT,
    summary: {
      total: results.total,
      correct: results.correct,
      incorrect: results.incorrect,
      accuracy: overallAccuracy
    },
    byAgent: results.byAgent,
    incorrectRouting: results.incorrectRouting
  };
  
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`\n💾 Results saved to: ${filename}`);
  
  console.log('\n✅ Testing complete!');
  
  // Exit with error code if accuracy is too low
  if (parseFloat(overallAccuracy) < 50) {
    console.log('\n🔴 Exiting with error code due to low accuracy');
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };

