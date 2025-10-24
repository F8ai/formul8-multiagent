#!/usr/bin/env node

const https = require('https');

const testQuestions = [
  { question: 'How do I optimize my cannabis facility operations?', expected: 'operations' },
  { question: 'How should I market my cannabis brand on social media?', expected: 'marketing' },
  { question: 'Where can I source high-quality cannabis seeds?', expected: 'sourcing' },
  { question: 'How do I calculate THC dosage?', expected: 'formulation' },
  { question: 'What is THC?', expected: 'science' }
];

async function testRouting() {
  console.log('🧪 Testing Routing Improvements\n');
  
  let correct = 0;
  let total = testQuestions.length;
  
  for (const test of testQuestions) {
    const postData = JSON.stringify({ message: test.question });
    
    const result = await new Promise((resolve) => {
      const req = https.request({
        hostname: 'chat.formul8.ai',
        path: '/api/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({ success: true, agent: response.agent });
          } catch (e) {
            resolve({ success: false, error: e.message });
          }
        });
      });
      
      req.on('error', (e) => resolve({ success: false, error: e.message }));
      req.write(postData);
      req.end();
    });
    
    const status = result.agent === test.expected ? '✅' : '❌';
    if (result.agent === test.expected) correct++;
    
    console.log(`${status} "${test.question}"`);
    console.log(`   Expected: ${test.expected}, Got: ${result.agent || 'ERROR'}\n`);
    
    await new Promise(r => setTimeout(r, 2000));
  }
  
  const accuracy = ((correct / total) * 100).toFixed(1);
  console.log('─'.repeat(60));
  console.log(`\n📊 Results: ${correct}/${total} correct (${accuracy}%)`);
  console.log(accuracy >= 60 ? '✅ PASS' : '❌ FAIL - needs more work');
}

testRouting().catch(console.error);
