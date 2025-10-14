#!/usr/bin/env node

/**
 * Script to add Vercel secret using the Vercel API
 */

const https = require('https');
const fs = require('fs');

// Read API key from ~/.env
const envContent = fs.readFileSync(require('os').homedir() + '/.env', 'utf8');
const apiKey = envContent.match(/OPENROUTER_API_KEY=(.+)/)?.[1];

if (!apiKey) {
  console.error('❌ OPENROUTER_API_KEY not found in ~/.env');
  process.exit(1);
}

console.log('✅ Found OpenRouter API key in ~/.env');

// Get Vercel token from CLI
const { execSync } = require('child_process');
let vercelToken;
try {
  vercelToken = execSync('vercel whoami --token', { encoding: 'utf8' }).trim();
} catch (error) {
  console.error('❌ Failed to get Vercel token. Please run: vercel login');
  process.exit(1);
}

console.log('✅ Got Vercel token');

// Add secret using Vercel API
const postData = JSON.stringify({
  name: 'openrouter_api_key',
  value: apiKey
});

const options = {
  hostname: 'api.vercel.com',
  port: 443,
  path: '/v1/secrets',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${vercelToken}`,
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
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Vercel secret "openrouter_api_key" added successfully');
      console.log('🚀 Now deploying all projects...');
      
      // Deploy main project
      try {
        console.log('Deploying lambda-package...');
        execSync('cd lambda-package && vercel --prod --yes', { stdio: 'inherit' });
        console.log('✅ lambda-package deployed');
      } catch (error) {
        console.error('❌ Failed to deploy lambda-package:', error.message);
      }
      
      // Test the endpoints
      setTimeout(() => {
        console.log('\n🧪 Testing endpoints...');
        
        const testEndpoint = (url, name) => {
          const https = require('https');
          const req = https.request(url, { method: 'HEAD' }, (res) => {
            if (res.statusCode === 200) {
              console.log(`✅ ${name}: ${url}`);
            } else {
              console.log(`⚠️  ${name}: ${url} (Status: ${res.statusCode})`);
            }
          });
          req.on('error', () => {
            console.log(`❌ ${name}: ${url} (Connection failed)`);
          });
          req.end();
        };
        
        testEndpoint('https://f8.syzygyx.com/chat.html', 'Chat Interface');
        testEndpoint('https://f8.syzygyx.com/api/health', 'API Health');
        
        console.log('\n🎉 Setup complete!');
        console.log('Test your chat interface at: https://f8.syzygyx.com/chat.html');
      }, 5000);
      
    } else {
      console.error('❌ Failed to add Vercel secret:', res.statusCode, data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(postData);
req.end();