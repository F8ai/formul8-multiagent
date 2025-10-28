#!/usr/bin/env node
require('dotenv').config();

const LangChainService = require('./services/langchain-service');

const testQuestions = [
  {
    question: 'Can you make me a compliant SOP for Cannabis Transport in New Jersey?',
    expected: 'compliance'
  },
  {
    question: 'How do I troubleshoot my CO2 extraction system?',
    expected: 'operations'
  },
  {
    question: 'What are the best social media strategies for cannabis brands?',
    expected: 'marketing'
  },
  {
    question: 'How do I calculate THC dosage for gummy formulations?',
    expected: 'formulation'
  },
  {
    question: 'What terpenes are found in this COA?',
    expected: 'science'
  }
];

(async () => {
  console.log('🧪 Testing improved routing locally...\n');
  
  const service = new LangChainService();
  let correct = 0;
  
  for (const test of testQuestions) {
    try {
      const result = await service.routeToAgent(test.question);
      const isCorrect = result === test.expected;
      correct += isCorrect ? 1 : 0;
      
      const icon = isCorrect ? '✅' : '❌';
      console.log(`${icon} "${test.question.substring(0, 60)}..."`);
      console.log(`   Expected: ${test.expected} | Got: ${result}\n`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }
  
  console.log(`\n📊 Accuracy: ${correct}/${testQuestions.length} (${Math.round(correct/testQuestions.length*100)}%)`);
})();
