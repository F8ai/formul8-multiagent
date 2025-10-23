#!/usr/bin/env node
const https = require('https');
const fs = require('fs');

const baseline = JSON.parse(fs.readFileSync('baseline.json', 'utf8'));

// Sample questions from each agent
const samples = [
  baseline.questions.find(q => q.expectedAgent === 'compliance'),
  baseline.questions.find(q => q.expectedAgent === 'operations'),
  baseline.questions.find(q => q.expectedAgent === 'marketing'),
].filter(Boolean);

console.log(`🧪 Testing Baseline Routing Sample\n`);
console.log(`Total questions in baseline: ${baseline.questions.length}`);
console.log(`Testing ${samples.length} sample questions\n`);

let correct = 0;

async function testQuestion(q) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ message: q.question });
    const req = https.request({
      hostname: 'chat.formul8.ai',
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
      timeout: 30000
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
    req.on('timeout', () => { req.destroy(); resolve({ agent: null, success: false }); });
    req.write(postData);
    req.end();
  });
}

async function run() {
  for (let i = 0; i < samples.length; i++) {
    const q = samples[i];
    console.log(`[${i+1}/${samples.length}] ${q.expectedAgent}`);
    console.log(`    Q: "${q.question.substring(0, 80)}..."`);
    
    const result = await testQuestion(q);
    const isCorrect = result.agent === q.expectedAgent;
    if (isCorrect) correct++;
    
    console.log(`    ${isCorrect ? '✅' : '❌'} Got: ${result.agent || 'ERROR'} | Expected: ${q.expectedAgent}`);
    console.log('');
    
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`\n📊 Result: ${correct}/${samples.length} questions routed correctly (${Math.round(correct/samples.length*100)}%)`);
  console.log(correct >= 2 ? '✅ PASS' : '❌ FAIL');
}

run().catch(console.error);
