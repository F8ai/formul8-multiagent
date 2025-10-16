/**
 * Test script to verify Basic Authentication works locally
 * Run with: node test-auth-local.js
 */

const http = require('http');

const testAuth = async () => {
  console.log('🔒 Testing Basic Authentication...\n');

  const username = process.env.AUTH_USERNAME || 'admin';
  const password = process.env.AUTH_PASSWORD || 'changeme';

  // Test 1: No credentials
  console.log('Test 1: Request without credentials');
  try {
    const res = await fetch('http://localhost:3000/', {
      headers: {},
    });
    console.log(`  Status: ${res.status} ${res.statusText}`);
    console.log(`  Expected: 401 Unauthorized`);
    console.log(`  Result: ${res.status === 401 ? '✅ PASS' : '❌ FAIL'}\n`);
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}\n`);
  }

  // Test 2: Wrong credentials
  console.log('Test 2: Request with wrong credentials');
  const wrongAuth = Buffer.from('wrong:credentials').toString('base64');
  try {
    const res = await fetch('http://localhost:3000/', {
      headers: {
        'Authorization': `Basic ${wrongAuth}`,
      },
    });
    console.log(`  Status: ${res.status} ${res.statusText}`);
    console.log(`  Expected: 401 Unauthorized`);
    console.log(`  Result: ${res.status === 401 ? '✅ PASS' : '❌ FAIL'}\n`);
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}\n`);
  }

  // Test 3: Correct credentials
  console.log('Test 3: Request with correct credentials');
  const correctAuth = Buffer.from(`${username}:${password}`).toString('base64');
  try {
    const res = await fetch('http://localhost:3000/', {
      headers: {
        'Authorization': `Basic ${correctAuth}`,
      },
    });
    console.log(`  Status: ${res.status} ${res.statusText}`);
    console.log(`  Expected: 200 OK`);
    console.log(`  Result: ${res.status === 200 ? '✅ PASS' : '❌ FAIL'}\n`);
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}\n`);
  }

  console.log('Authentication tests completed!');
  console.log('\nNote: Make sure vercel dev is running before running this test.');
  console.log('Run: vercel dev');
};

// Check if server is running
const checkServer = () => {
  const req = http.get('http://localhost:3000/', (res) => {
    testAuth();
  });

  req.on('error', (error) => {
    console.log('❌ Cannot connect to local server.');
    console.log('Please run: vercel dev\n');
    console.log('Then run this test again.');
  });
};

checkServer();

