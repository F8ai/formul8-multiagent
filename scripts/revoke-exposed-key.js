#!/usr/bin/env node

/**
 * Revoke an exposed OpenRouter API key
 * Usage: node scripts/revoke-exposed-key.js <exposed-key>
 */

const https = require('https');

const PROVISIONING_KEY = process.env.OPENROUTER_PROVISIONING_KEY;
const EXPOSED_KEY = process.argv[2];

// Colors
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'openrouter.ai',
      path: `/api/v1${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${PROVISIONING_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${JSON.stringify(json)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function listKeys() {
  const response = await makeRequest('GET', '/keys');
  return response.data || [];
}

async function deleteKey(keyId) {
  await makeRequest('DELETE', `/keys/${keyId}`);
}

async function findAndRevokeKey(exposedKey) {
  log('\n🔍 OpenRouter Key Revocation Tool', 'blue');
  log('='.repeat(60), 'blue');
  log('');

  if (!PROVISIONING_KEY) {
    log('❌ Error: OPENROUTER_PROVISIONING_KEY not set', 'red');
    log('', 'reset');
    log('Please set the environment variable:', 'yellow');
    log('  export OPENROUTER_PROVISIONING_KEY="sk-or-v1-..."', 'cyan');
    log('');
    log('Get your provisioning key at:', 'yellow');
    log('  https://openrouter.ai/settings/keys', 'cyan');
    process.exit(1);
  }

  if (!exposedKey) {
    log('❌ Error: No key provided', 'red');
    log('', 'reset');
    log('Usage:', 'yellow');
    log('  node scripts/revoke-exposed-key.js sk-or-v1-xxx...', 'cyan');
    process.exit(1);
  }

  try {
    log(`🔑 Looking for key: ${exposedKey.substring(0, 20)}...${exposedKey.slice(-4)}`, 'cyan');
    log('');

    // List all keys
    log('📋 Fetching all API keys...', 'yellow');
    const keys = await listKeys();
    
    if (keys.length === 0) {
      log('⚠️  No keys found', 'yellow');
      process.exit(0);
    }

    log(`Found ${keys.length} key(s)`, 'green');
    log('');

    // Display all keys
    log('Available keys:', 'cyan');
    keys.forEach((key, index) => {
      const preview = key.key ? `...${key.key.slice(-4)}` : 'hidden';
      log(`  ${index + 1}. ${key.name || 'Unnamed'} (${key.id}) - ${preview}`, 'reset');
      log(`     Created: ${key.created_at || 'unknown'}`, 'reset');
    });
    log('');

    // Try to find the key
    // Note: OpenRouter API may not return full keys, so we match by last 4 chars
    const exposedLast4 = exposedKey.slice(-4);
    let matchedKey = null;

    for (const key of keys) {
      if (key.key && key.key.slice(-4) === exposedLast4) {
        matchedKey = key;
        break;
      }
    }

    if (matchedKey) {
      log(`✅ Found matching key: ${matchedKey.name || 'Unnamed'} (${matchedKey.id})`, 'green');
      log('');
      log(`⚠️  About to REVOKE this key!`, 'yellow');
      log('   This action cannot be undone.', 'red');
      log('');
      
      // In a real scenario, you'd want confirmation
      // For automation, we'll proceed
      log('🗑️  Revoking key...', 'yellow');
      await deleteKey(matchedKey.id);
      log('');
      log('✅ Key successfully revoked!', 'green');
      log('');
      log('Next steps:', 'yellow');
      log('  1. Generate a new key', 'cyan');
      log('  2. Update GitHub Secrets: OPENROUTER_API_KEY', 'cyan');
      log('  3. Update Vercel environment variables', 'cyan');
      log('');
    } else {
      log('⚠️  Could not automatically match the key', 'yellow');
      log('');
      log('Please manually revoke using:', 'yellow');
      log(`  node scripts/openrouter-key-manager.js delete --key-id=<id>`, 'cyan');
      log('');
      log('Or visit:', 'yellow');
      log('  https://openrouter.ai/settings/keys', 'cyan');
      log('');
      log(`Look for key ending in: ...${exposedLast4}`, 'yellow');
    }

  } catch (error) {
    log('');
    log('❌ Error: ' + error.message, 'red');
    log('');
    log('Manual revocation required:', 'yellow');
    log('  1. Go to: https://openrouter.ai/settings/keys', 'cyan');
    log(`  2. Find key ending in: ...${exposedKey.slice(-4)}`, 'cyan');
    log('  3. Click "Revoke" or delete the key', 'cyan');
    process.exit(1);
  }
}

// Run
findAndRevokeKey(EXPOSED_KEY);

