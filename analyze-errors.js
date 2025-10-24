const fs = require('fs');

// Parse the log file
const log = fs.readFileSync('baseline-test-output.log', 'utf8');
const lines = log.split('\n');

const results = {
  compliance: { correct: 0, total: 0, errors: [] },
  operations: { correct: 0, total: 0, errors: [] }
};

let currentAgent = null;
let currentQuestion = null;
let expectedAgent = null;

for (const line of lines) {
  if (line.includes('Testing: compliance-q')) {
    currentAgent = 'compliance';
    currentQuestion = line.match(/Question: "(.*?)"/)?.[1];
  } else if (line.includes('Testing: operations-q')) {
    currentAgent = 'operations';
    currentQuestion = line.match(/Question: "(.*?)"/)?.[1];
  }
  
  if (line.includes('Expected Agent:')) {
    expectedAgent = line.match(/Expected Agent: (\w+)/)?.[1];
  }
  
  if (line.includes('✅ CORRECT')) {
    if (currentAgent) {
      results[currentAgent].correct++;
      results[currentAgent].total++;
    }
  } else if (line.includes('❌ INCORRECT')) {
    if (currentAgent) {
      results[currentAgent].total++;
      const gotAgent = line.match(/got (\w+)/)?.[1];
      if (gotAgent && gotAgent !== 'ERROR') {
        results[currentAgent].errors.push({
          question: currentQuestion,
          expected: expectedAgent,
          got: gotAgent
        });
      }
    }
  }
}

console.log('📊 Routing Analysis\n');
console.log('='.repeat(80));
console.log(`\nCompliance: ${results.compliance.correct}/${results.compliance.total} correct (${Math.round(results.compliance.correct/results.compliance.total*100)}%)`);
console.log(`Operations: ${results.operations.correct}/${results.operations.total} correct (${Math.round(results.operations.correct/results.operations.total*100)}%)\n`);

console.log('❌ Compliance Misrouting Patterns:\n');
const complianceMisroutes = {};
results.compliance.errors.forEach(e => {
  complianceMisroutes[e.got] = (complianceMisroutes[e.got] || 0) + 1;
});

Object.entries(complianceMisroutes).sort((a,b) => b[1] - a[1]).forEach(([agent, count]) => {
  console.log(`  ${agent}: ${count} questions`);
});

console.log('\n🔍 Sample Misrouted Questions:\n');
results.compliance.errors.slice(0, 10).forEach((e, i) => {
  console.log(`${i+1}. "${e.question?.substring(0, 60)}..."`);
  console.log(`   Expected: ${e.expected} | Got: ${e.got}\n`);
});
