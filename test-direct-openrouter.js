#!/usr/bin/env node
const https = require('https');

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  console.error('❌ OPENROUTER_API_KEY not set');
  process.exit(1);
}

const testMessage = 'Can you make me a compliant SOP for Cannabis Transport in New Jersey?';

const postData = JSON.stringify({
  model: 'meta-llama/llama-3.1-405b-instruct',
  messages: [
    {
      role: 'system',
      content: 'You are a router. Respond with ONLY one word: compliance, operations, marketing, formulation, or science.'
    },
    {
      role: 'user',
      content: testMessage
    }
  ],
  max_tokens: 10,
  temperature: 0.1
});

const options = {
  hostname: 'openrouter.ai',
  port: 443,
  path: '/api/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://f8.syzygyx.com',
    'X-Title': 'Formul8 Multiagent Chat',
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
      const json = JSON.parse(data);
      const result = json.choices?.[0]?.message?.content;
      console.log(`✅ OpenRouter response: "${result}"`);
      console.log(`Status: ${res.statusCode}`);
    } catch (error) {
      console.error('❌ Parse error:', error.message);
      console.error('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.write(postData);
req.end();
