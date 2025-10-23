#!/usr/bin/env node

/**
 * Test Routing Improvements
 * 
 * This script tests the improved LangChain routing to verify:
 * 1. Compliance agent is not over-utilized
 * 2. Questions are routed to the correct specialized agents
 * 3. Routing accuracy has improved
 */

const LangChainService = require('./services/langchain-service');

// Test cases with expected routing
const routingTestCases = [
  // Operations - should route to operations agent
  {
    message: 'How do I optimize my cannabis facility operations?',
    expected: 'operations',
    category: 'operations'
  },
  {
    message: 'What are the best practices for cannabis cultivation?',
    expected: 'operations',
    category: 'operations'
  },
  {
    message: 'How do I manage cannabis inventory?',
    expected: 'operations',
    category: 'operations'
  },
  
  // Marketing - should route to marketing agent
  {
    message: 'How should I market my cannabis brand on social media?',
    expected: 'marketing',
    category: 'marketing'
  },
  {
    message: 'What are the best practices for cannabis advertising?',
    expected: 'marketing',
    category: 'marketing'
  },
  {
    message: 'How do I build brand awareness for cannabis products?',
    expected: 'marketing',
    category: 'marketing'
  },
  
  // Formulation - should route to formulation agent
  {
    message: 'How do I calculate THC dosage?',
    expected: 'formulation',
    category: 'formulation'
  },
  {
    message: 'How do I make cannabis edibles?',
    expected: 'formulation',
    category: 'formulation'
  },
  {
    message: 'Create a recipe for cannabis gummies with 10mg THC each',
    expected: 'formulation',
    category: 'formulation'
  },
  {
    message: 'What extraction method is best for high-CBD products?',
    expected: 'formulation',
    category: 'formulation'
  },
  
  // Science - should route to science agent
  {
    message: 'What is THC?',
    expected: 'science',
    category: 'science'
  },
  {
    message: 'What are terpenes?',
    expected: 'science',
    category: 'science'
  },
  {
    message: 'How do I test cannabis potency?',
    expected: 'science',
    category: 'science'
  },
  {
    message: 'What is the difference between indica and sativa?',
    expected: 'science',
    category: 'science'
  },
  
  // Compliance - should route to compliance agent
  {
    message: 'What are the compliance requirements for cannabis businesses in California?',
    expected: 'compliance',
    category: 'compliance'
  },
  {
    message: 'What are the multi-state compliance challenges for cannabis?',
    expected: 'compliance',
    category: 'compliance'
  },
  {
    message: 'How do I maintain compliance records for cannabis cultivation?',
    expected: 'compliance',
    category: 'compliance'
  },
  {
    message: 'What are the testing requirements for cannabis products?',
    expected: 'compliance',
    category: 'compliance'
  },
  
  // F8 Agent - general questions
  {
    message: 'What are the benefits of cannabis?',
    expected: 'f8_agent',
    category: 'general'
  },
  {
    message: 'I want to start a cannabis business',
    expected: 'f8_agent',
    category: 'business'
  },
  {
    message: 'How do I scale up my cannabis production?',
    expected: 'f8_agent',
    category: 'business'
  },
  
  // Sourcing
  {
    message: 'Where can I source high-quality cannabis seeds?',
    expected: 'sourcing',
    category: 'sourcing'
  },
  {
    message: 'How do I evaluate cannabis suppliers?',
    expected: 'sourcing',
    category: 'sourcing'
  },
  
  // Patent
  {
    message: 'Can I patent my cannabis extraction process?',
    expected: 'patent',
    category: 'patent'
  },
  {
    message: 'How do I conduct patent research for cannabis innovations?',
    expected: 'patent',
    category: 'patent'
  }
];

async function testRouting() {
  console.log('🧪 Testing Improved LangChain Routing');
  console.log('='.repeat(80));
  console.log(`Total test cases: ${routingTestCases.length}\n`);

  const langchainService = new LangChainService();
  
  const results = {
    total: routingTestCases.length,
    correct: 0,
    incorrect: 0,
    byCategory: {},
    incorrectCases: [],
    agentUsage: {}
  };

  for (let i = 0; i < routingTestCases.length; i++) {
    const testCase = routingTestCases[i];
    console.log(`[${i + 1}/${routingTestCases.length}] Testing: "${testCase.message.substring(0, 60)}..."`);
    
    try {
      const routedAgent = await langchainService.routeToAgent(testCase.message);
      const isCorrect = routedAgent === testCase.expected;
      
      // Track category stats
      if (!results.byCategory[testCase.category]) {
        results.byCategory[testCase.category] = { total: 0, correct: 0, incorrect: 0 };
      }
      results.byCategory[testCase.category].total++;
      
      // Track agent usage
      results.agentUsage[routedAgent] = (results.agentUsage[routedAgent] || 0) + 1;
      
      if (isCorrect) {
        results.correct++;
        results.byCategory[testCase.category].correct++;
        console.log(`   ✅ Correct: ${routedAgent}\n`);
      } else {
        results.incorrect++;
        results.byCategory[testCase.category].incorrect++;
        console.log(`   ❌ Incorrect: Expected ${testCase.expected}, got ${routedAgent}\n`);
        results.incorrectCases.push({
          message: testCase.message,
          expected: testCase.expected,
          actual: routedAgent,
          category: testCase.category
        });
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`   💥 Error: ${error.message}\n`);
      results.incorrect++;
    }
  }

  // Calculate overall accuracy
  const accuracy = ((results.correct / results.total) * 100).toFixed(2);
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 ROUTING TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Correct: ${results.correct} (${accuracy}%)`);
  console.log(`Incorrect: ${results.incorrect} (${(100 - accuracy).toFixed(2)}%)`);
  
  console.log('\n📂 Results by Category:');
  Object.entries(results.byCategory).forEach(([category, stats]) => {
    const catAccuracy = ((stats.correct / stats.total) * 100).toFixed(2);
    console.log(`  ${category}: ${stats.correct}/${stats.total} correct (${catAccuracy}%)`);
  });
  
  console.log('\n🤖 Agent Usage Distribution:');
  const sortedAgents = Object.entries(results.agentUsage)
    .sort((a, b) => b[1] - a[1]);
  sortedAgents.forEach(([agent, count]) => {
    const percentage = ((count / results.total) * 100).toFixed(1);
    console.log(`  ${agent}: ${count} times (${percentage}%)`);
  });
  
  if (results.incorrectCases.length > 0) {
    console.log('\n❌ Incorrect Routing Cases:');
    results.incorrectCases.forEach((testCase, idx) => {
      console.log(`\n${idx + 1}. Message: "${testCase.message}"`);
      console.log(`   Expected: ${testCase.expected}`);
      console.log(`   Got: ${testCase.actual}`);
      console.log(`   Category: ${testCase.category}`);
    });
  }
  
  // Comparison with baseline
  console.log('\n' + '='.repeat(80));
  console.log('📈 COMPARISON WITH BASELINE');
  console.log('='.repeat(80));
  console.log('Baseline Issues (from test results):');
  console.log('  - Compliance agent handling: ~60% of questions');
  console.log('  - Operations routing accuracy: 0%');
  console.log('  - Marketing routing accuracy: 0%');
  console.log('');
  console.log('After Improvements:');
  const complianceUsage = results.agentUsage['compliance'] || 0;
  const compliancePercentage = ((complianceUsage / results.total) * 100).toFixed(1);
  console.log(`  - Compliance agent handling: ${compliancePercentage}% of questions`);
  
  const opsStats = results.byCategory['operations'];
  const opsAccuracy = opsStats ? ((opsStats.correct / opsStats.total) * 100).toFixed(1) : 'N/A';
  console.log(`  - Operations routing accuracy: ${opsAccuracy}%`);
  
  const mktStats = results.byCategory['marketing'];
  const mktAccuracy = mktStats ? ((mktStats.correct / mktStats.total) * 100).toFixed(1) : 'N/A';
  console.log(`  - Marketing routing accuracy: ${mktAccuracy}%`);
  
  console.log('\n✨ Improvements:');
  console.log(`  - Overall routing accuracy: ${accuracy}%`);
  console.log(`  - Compliance over-utilization reduced: ${60 - parseFloat(compliancePercentage)}% reduction`);
  if (opsAccuracy !== 'N/A') {
    console.log(`  - Operations routing improved: +${opsAccuracy}%`);
  }
  if (mktAccuracy !== 'N/A') {
    console.log(`  - Marketing routing improved: +${mktAccuracy}%`);
  }
  
  // Grade the routing system
  let grade;
  if (parseFloat(accuracy) >= 90) grade = 'A';
  else if (parseFloat(accuracy) >= 80) grade = 'B';
  else if (parseFloat(accuracy) >= 70) grade = 'C';
  else if (parseFloat(accuracy) >= 60) grade = 'D';
  else grade = 'F';
  
  console.log('\n' + '='.repeat(80));
  console.log(`🎯 ROUTING SYSTEM GRADE: ${grade} (${accuracy}%)`);
  console.log('='.repeat(80));
  
  if (parseFloat(accuracy) < 80) {
    console.log('\n⚠️  Routing accuracy below 80%. Consider further improvements:');
    console.log('  1. Fine-tune routing prompt with more specific examples');
    console.log('  2. Adjust agent keywords and specialties');
    console.log('  3. Consider using a more powerful routing model');
    console.log('  4. Add routing confidence scores and fallback logic');
  } else {
    console.log('\n✅ Routing system performing well!');
  }
}

// Run the test
if (require.main === module) {
  testRouting().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testRouting, routingTestCases };

