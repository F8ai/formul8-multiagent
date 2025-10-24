#!/usr/bin/env node
const https = require('https');
const fs = require('fs');

const baseline = JSON.parse(fs.readFileSync('baseline.json', 'utf8'));
const complianceQuestions = baseline.questions.filter(q => q.sourceAgent === 'compliance-agent');

console.log(`🧪 Testing Compliance Agent Routing`);
console.log(`Found ${complianceQuestions.length} compliance questions\n`);

let correct = 0;

async function testQuestion(q) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ message: q.question });
    const req = https.request({
      hostname: 'chat.formul8.ai',
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ agent: response.agent, success: true });
        } catch (e) {
          resolve({ agent: null, success: false });
        }
      });
    });
    req.on('error', () => resolve({ agent: null, success: false }));
    req.write(postData);
    req.end();
  });
}

async function run() {
  for (let i = 0; i < Math.min(5, complianceQuestions.length); i++) {
    const q = complianceQuestions[i];
    console.log(`[${i+1}] "${q.question}"`);
    
    const result = await testQuestion(q);
    const isCorrect = result.agent === 'compliance';
    if (isCorrect) correct++;
    
    console.log(`    ${isCorrect ? '✅' : '❌'} Got: ${result.agent || 'ERROR'}`);
    console.log('');
    
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`\n📊 Result: ${correct}/5 compliance questions routed correctly`);
  console.log(correct >= 4 ? '✅ PASS' : '❌ FAIL');
}

run().catch(console.error);
