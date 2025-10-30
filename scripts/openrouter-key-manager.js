#!/usr/bin/env node

/**
 * OpenRouter API Key Manager
 * Handles creation, rotation, and deletion of OpenRouter API keys
 */

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';
const PROVISIONING_KEY = process.env.OPENROUTER_PROVISIONING_KEY;

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const safeTimestamp = new Date().toISOString().replace(/[:]/g, '-');
const logFile = path.join(logsDir, `rotation-${safeTimestamp}.log`);

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

function makeRequest(method, reqPath, data = null, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, OPENROUTER_API_BASE);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${PROVISIONING_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Formul8-Key-Rotator/1.0 (+https://chat.formul8.ai)',
        'HTTP-Referer': 'https://chat.formul8.ai'
      }
    };

    const req = https.request(options, (res) => {
      // Handle redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (redirectCount > 5) {
          reject(new Error('Too many redirects'));
          return;
        }
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, OPENROUTER_API_BASE).toString();
        makeRequest(method, next, data, redirectCount + 1).then(resolve).catch(reject);
        return;
      }
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(jsonBody);
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${JSON.stringify(jsonBody)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function listKeys() {
  log('📋 Listing all API keys...');
  
  try {
    const response = await makeRequest('GET', '/keys');
    
    if (response.data && Array.isArray(response.data)) {
      log(`Found ${response.data.length} keys:`);
      response.data.forEach(key => {
        log(`  • ${key.name} (${key.id}) - Created: ${key.created_at}`);
      });
      return response.data;
    } else {
      log('No keys found or unexpected response format');
      return [];
    }
  } catch (error) {
    log(`❌ Error listing keys: ${error.message}`);
    throw error;
  }
}

async function createKey(name, limit = 10000) {
  log(`🔑 Creating new API key: ${name}`);
  
  try {
    const response = await makeRequest('POST', '/keys', {
      name: name,
      limit: limit,
      usage_limits: {
        requests_per_minute: 100
      }
    });

    if (response.key) {
      log(`✅ New key created successfully!`);
      log(`   Key ID: ${response.id}`);
      log(`   Key ends with: ...${response.key.slice(-4)}`);
      return response;
    } else {
      throw new Error('No key in response');
    }
  } catch (error) {
    log(`❌ Error creating key: ${error.message}`);
    throw error;
  }
}

async function deleteKey(keyId) {
  log(`🗑️  Deleting key: ${keyId}`);
  
  try {
    await makeRequest('DELETE', `/keys/${keyId}`);
    log(`✅ Key ${keyId} deleted successfully`);
    return true;
  } catch (error) {
    log(`❌ Error deleting key ${keyId}: ${error.message}`);
    throw error;
  }
}

async function testKey(apiKey) {
  log('🧪 Testing new API key...');
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.choices && json.choices.length > 0) {
            log('✅ New key is working correctly!');
            resolve(true);
          } else {
            log(`❌ Unexpected response: ${body}`);
            reject(new Error('Invalid response format'));
          }
        } catch (error) {
          log(`❌ Test failed: ${error.message}`);
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function updateGitHubSecret(secretName, value) {
  log(`🔐 Updating GitHub Secret: ${secretName}`);
  
  try {
    // Use GitHub CLI to update the secret
    execSync(`gh secret set ${secretName} --body "${value}"`, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, GH_TOKEN: process.env.GITHUB_TOKEN }
    });
    
    log(`✅ GitHub Secret ${secretName} updated successfully`);
    return true;
  } catch (error) {
    log(`❌ Error updating GitHub Secret: ${error.message}`);
    throw error;
  }
}

async function updateVercelEnvironment(envName, value) {
  log(`🔐 Updating Vercel Environment Variable: ${envName}`);
  
  try {
    // First try to remove existing variable (ignore errors if it doesn't exist)
    try {
      execSync(`vercel env rm ${envName} production --token=${process.env.VERCEL_TOKEN} --yes`, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
          ...process.env, 
          VERCEL_TOKEN: process.env.VERCEL_TOKEN,
          VERCEL_ORG_ID: process.env.VERCEL_ORG_ID,
          VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID
        }
      });
      log(`🗑️  Removed existing ${envName} variable`);
    } catch (removeError) {
      log(`ℹ️  No existing ${envName} variable to remove (or removal failed)`);
    }
    
    // Now add the new variable
    execSync(`echo "${value}" | vercel env add ${envName} production --token=${process.env.VERCEL_TOKEN}`, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        VERCEL_TOKEN: process.env.VERCEL_TOKEN,
        VERCEL_ORG_ID: process.env.VERCEL_ORG_ID,
        VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID
      }
    });
    
    log(`✅ Vercel Environment Variable ${envName} updated successfully`);
    return true;
  } catch (error) {
    log(`❌ Error updating Vercel Environment Variable: ${error.message}`);
    // Don't throw error - Vercel env update might fail but GitHub secret is more important
    log(`⚠️  Continuing with deployment (GitHub secret was updated)`);
    return false;
  }
}

async function rotateKey(deleteOld = false) {
  log('');
  log('='.repeat(80));
  log('🔄 STARTING KEY ROTATION');
  log('='.repeat(80));
  log('');

  if (!PROVISIONING_KEY) {
    log('❌ OPENROUTER_PROVISIONING_KEY not found in environment');
    throw new Error('OPENROUTER_PROVISIONING_KEY is required');
  }

  try {
    // Step 1: List current keys
    const currentKeys = await listKeys();
    log('');

    // Step 2: Create new key
    const keyName = `Formul8-Main-${new Date().toISOString().split('T')[0]}`;
    const newKeyData = await createKey(keyName);
    log('');

    // Step 3: Update GitHub Secret
    await updateGitHubSecret('OPENROUTER_API_KEY', newKeyData.key);
    log('');

    // Step 3.5: Update Vercel Environment Variable (if Vercel credentials available)
    if (process.env.VERCEL_TOKEN && process.env.VERCEL_ORG_ID && process.env.VERCEL_PROJECT_ID) {
      await updateVercelEnvironment('OPENROUTER_API_KEY', newKeyData.key);
      log('');
    } else {
      log('⚠️  Vercel credentials not available - skipping Vercel env update');
      log('   (GitHub Actions will handle Vercel deployment)');
      log('');
    }

    // Step 4: Test the new key
    await testKey(newKeyData.key);
    log('');

    // Step 5: Store new key ID for future rotation
    await updateGitHubSecret('OPENROUTER_CURRENT_KEY_ID', newKeyData.id);
    log('');

    // Step 6: Delete old keys if requested
    if (deleteOld && currentKeys.length > 0) {
      log('🗑️  Deleting old keys...');
      for (const key of currentKeys) {
        // Don't delete the key we just created
        if (key.id !== newKeyData.id) {
          try {
            await deleteKey(key.id);
          } catch (error) {
            log(`⚠️  Could not delete ${key.id}: ${error.message}`);
          }
        }
      }
      log('');
    }

    log('='.repeat(80));
    log('✅ KEY ROTATION COMPLETED SUCCESSFULLY');
    log('='.repeat(80));
    log('');
    log(`📊 Summary:`);
    log(`   New Key ID: ${newKeyData.id}`);
    log(`   Key ends with: ...${newKeyData.key.slice(-4)}`);
    log(`   Old keys: ${deleteOld ? 'Deleted' : 'Retained'}`);
    log('');

    return newKeyData;
  } catch (error) {
    log('');
    log('='.repeat(80));
    log('❌ KEY ROTATION FAILED');
    log('='.repeat(80));
    log(`Error: ${error.message}`);
    log('');
    throw error;
  }
}

// CLI
const command = process.argv[2];
const flags = process.argv.slice(3);

(async () => {
  try {
    if (command === 'list') {
      await listKeys();
    } else if (command === 'rotate') {
      const deleteOld = flags.includes('--delete-old');
      await rotateKey(deleteOld);
    } else if (command === 'create') {
      const name = flags.find(f => f.startsWith('--name='))?.split('=')[1] || `Formul8-${Date.now()}`;
      await createKey(name);
    } else if (command === 'delete') {
      const keyId = flags.find(f => f.startsWith('--key-id='))?.split('=')[1];
      if (!keyId) {
        console.error('Error: --key-id=<id> is required');
        process.exit(1);
      }
      await deleteKey(keyId);
    } else {
      console.log(`
OpenRouter API Key Manager

Usage:
  node openrouter-key-manager.js <command> [options]

Commands:
  list                    List all API keys
  rotate [--delete-old]   Rotate API key (create new, update secrets, optionally delete old)
  create [--name=<name>]  Create a new API key
  delete --key-id=<id>    Delete a specific key

Environment Variables:
  OPENROUTER_PROVISIONING_KEY  Required: Master key for API key management
  GITHUB_TOKEN                 Required for 'rotate': GitHub token to update secrets

Examples:
  node openrouter-key-manager.js list
  node openrouter-key-manager.js rotate
  node openrouter-key-manager.js rotate --delete-old
  node openrouter-key-manager.js create --name=Formul8-Test
  node openrouter-key-manager.js delete --key-id=abc123
      `);
      process.exit(command ? 1 : 0);
    }
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}\n`);
    process.exit(1);
  }
})();
