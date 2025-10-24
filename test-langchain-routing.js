#!/usr/bin/env node
require('dotenv').config();
const LangChainService = require('./services/langchain-service');

const testMessages = [
  { text: 'Can you make me a compliant SOP for Cannabis Transport in New Jersey?', expected: 'compliance' },
  { text: 'Can you help me create a batch tracker sheet for employees to log production data?', expected: 'operations' },
  { text: 'What makes our cannabis brand stand out compared to competitors?', expected: 'marketing' }
];

(async () => {
  try {
    console.log('Initializing LangChain service...');
    const service = new LangChainService();
    
    console.log('\n🧪 Testing LangChain Routing:\n');
    
    let correct = 0;
    for (const { text, expected } of testMessages) {
      try {
        const result = await service.routeToAgent(text);
        const match = result === expected ? '✅' : '❌';
        console.log(`${match} "${text.substring(0, 60)}..."`);
        console.log(`   Got: ${result} | Expected: ${expected}\n`);
        if (result === expected) correct++;
      } catch (error) {
        console.error(`❌ Error routing: ${error.message}\n`);
      }
    }
    
    console.log(`\n📊 Result: ${correct}/${testMessages.length} correct (${Math.round(correct/testMessages.length*100)}%)`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
  }
})();

