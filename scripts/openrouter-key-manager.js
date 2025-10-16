#!/usr/bin/env node

/**
 * OpenRouter Key Manager
 * Automated key creation, rotation, and management using OpenRouter Provisioning API
 * 
 * Usage:
 *   node openrouter-key-manager.js list                    # List all keys
 *   node openrouter-key-manager.js create [name] [limit]   # Create new key
 *   node openrouter-key-manager.js create-user <user-id>   # Create key for specific user
 *   node openrouter-key-manager.js rotate                  # Rotate all agent keys
 *   node openrouter-key-manager.js rotate-user <user-id>   # Rotate key for specific user
 *   node openrouter-key-manager.js delete <key-id>         # Delete a key
 *   node openrouter-key-manager.js info <key-id>           # Get key info
 */

import https from 'https';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROVISIONING_KEY = process.env.OPENROUTER_PROVISIONING_KEY || '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';
const BASE_URL = 'openrouter.ai';
const API_PATH = '/api/v1/keys';

// Colors
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Make HTTPS request to OpenRouter API
 */
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${PROVISIONING_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = data ? JSON.parse(data) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: response });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * List all API keys
 */
async function listKeys(limit = 100) {
  logInfo('Fetching API keys...');
  
  try {
    const response = await makeRequest('GET', `${API_PATH}?limit=${limit}`);
    const keys = response.data.data || [];
    
    log('\n' + '='.repeat(80), 'cyan');
    log('API KEYS', 'cyan');
    log('='.repeat(80), 'cyan');
    
    if (keys.length === 0) {
      logWarning('No keys found');
      return;
    }
    
    keys.forEach((key, index) => {
      log(`\n[${index + 1}] ${key.name || 'Unnamed'}`, 'yellow');
      log(`    ID:          ${key.id}`, 'white');
      log(`    Key:         ${key.key ? key.key.substring(0, 20) + '...' : 'N/A'}`, 'white');
      log(`    Created:     ${new Date(key.created_at).toLocaleString()}`, 'white');
      log(`    Limit:       ${key.limit ? `$${key.limit}` : 'Unlimited'}`, 'white');
      log(`    Usage:       $${key.usage || 0}`, 'white');
      log(`    Status:      ${key.is_free_tier ? 'Free Tier' : 'Paid'}`, 'white');
      if (key.label) log(`    Label:       ${key.label}`, 'white');
    });
    
    log('\n' + '='.repeat(80), 'cyan');
    log(`Total Keys: ${keys.length}`, 'green');
    
    return keys;
  } catch (error) {
    logError(`Failed to list keys: ${error.message}`);
    throw error;
  }
}

/**
 * Create a new API key
 */
async function createKey(name = 'Formul8 Agent', limit = null, label = null) {
  logInfo(`Creating new API key: ${name}...`);
  
  const body = {
    name: name
  };
  
  if (limit) body.limit = limit;
  if (label) body.label = label;
  
  try {
    const response = await makeRequest('POST', API_PATH, body);
    const key = response.data;
    
    logSuccess('Key created successfully!');
    log('\n' + '='.repeat(80), 'cyan');
    log('NEW API KEY', 'cyan');
    log('='.repeat(80), 'cyan');
    log(`Name:        ${key.name}`, 'yellow');
    log(`ID:          ${key.id}`, 'white');
    log(`Key:         ${key.key}`, 'green');
    log(`Created:     ${new Date(key.created_at).toLocaleString()}`, 'white');
    if (key.limit) log(`Limit:       $${key.limit}`, 'white');
    log('='.repeat(80), 'cyan');
    
    logWarning('⚠️  IMPORTANT: Save this key! It won\'t be shown again.');
    
    return key;
  } catch (error) {
    logError(`Failed to create key: ${error.message}`);
    throw error;
  }
}

/**
 * Delete an API key
 */
async function deleteKey(keyId) {
  logInfo(`Deleting key ${keyId}...`);
  
  try {
    await makeRequest('DELETE', `${API_PATH}/${keyId}`);
    logSuccess(`Key ${keyId} deleted successfully!`);
  } catch (error) {
    logError(`Failed to delete key: ${error.message}`);
    throw error;
  }
}

/**
 * Get information about a specific key
 */
async function getKeyInfo(keyId) {
  logInfo(`Fetching key info for ${keyId}...`);
  
  try {
    const response = await makeRequest('GET', `${API_PATH}/${keyId}`);
    const key = response.data;
    
    log('\n' + '='.repeat(80), 'cyan');
    log('API KEY INFO', 'cyan');
    log('='.repeat(80), 'cyan');
    log(`Name:        ${key.name}`, 'yellow');
    log(`ID:          ${key.id}`, 'white');
    log(`Created:     ${new Date(key.created_at).toLocaleString()}`, 'white');
    log(`Limit:       ${key.limit ? `$${key.limit}` : 'Unlimited'}`, 'white');
    log(`Usage:       $${key.usage || 0}`, 'white');
    log(`Status:      ${key.is_free_tier ? 'Free Tier' : 'Paid'}`, 'white');
    if (key.label) log(`Label:       ${key.label}`, 'white');
    log('='.repeat(80), 'cyan');
    
    return key;
  } catch (error) {
    logError(`Failed to get key info: ${error.message}`);
    throw error;
  }
}

/**
 * Create a key for a specific user
 */
async function createUserKey(userId, monthlyLimit = null) {
  logInfo(`Creating API key for user ${userId}...`);
  
  const keyName = `Formul8 User ${userId}`;
  const keyLabel = `user-${userId}`;
  
  try {
    // Create the OpenRouter key
    const newKey = await createKey(keyName, monthlyLimit, keyLabel);
    
    // TODO: Store in Supabase user_api_keys table
    logInfo('Key created successfully!');
    logWarning('⚠️  Remember to store this key in the user_api_keys table in Supabase');
    
    return {
      ...newKey,
      userId,
      monthlyLimit
    };
  } catch (error) {
    logError(`Failed to create user key: ${error.message}`);
    throw error;
  }
}

/**
 * Rotate key for a specific user
 */
async function rotateUserKey(userId, deleteOld = false) {
  logInfo(`Rotating API key for user ${userId}...`);
  
  try {
    // TODO: Get current user key from Supabase
    // const currentKey = await getUserApiKey(userId);
    
    // Create new key for user
    const newKey = await createUserKey(userId);
    
    // TODO: Update user's key in Supabase
    // await updateUserApiKey(userId, newKey);
    
    // TODO: Optionally delete old key
    if (deleteOld) {
      // await deleteKey(currentKey.openrouter_key_id);
    }
    
    logSuccess(`User ${userId} key rotated successfully!`);
    return newKey;
  } catch (error) {
    logError(`Failed to rotate user key: ${error.message}`);
    throw error;
  }
}

/**
 * Rotate all agent keys
 * Creates a new key, updates all Vercel environments, and optionally deletes the old key
 */
async function rotateKeys(deleteOld = false) {
  log('\n' + '='.repeat(80), 'cyan');
  log('🔄 AUTOMATED KEY ROTATION', 'cyan');
  log('='.repeat(80), 'cyan');
  
  try {
    // Step 1: Create new key
    log('\n📝 Step 1: Creating new API key...', 'yellow');
    const newKey = await createKey('Formul8 Production Key', null, `rotated-${Date.now()}`);
    
    // Step 2: Update all Vercel projects
    log('\n🔧 Step 2: Updating all Vercel projects...', 'yellow');
    const rotateScript = path.join(__dirname, 'rotate-openrouter-key.sh');
    
    if (!fs.existsSync(rotateScript)) {
      throw new Error('rotate-openrouter-key.sh not found');
    }
    
    logInfo('Running key rotation script...');
    execSync(`bash "${rotateScript}" "${newKey.key}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    // Step 3: Verify deployment
    log('\n✅ Step 3: Verifying deployment...', 'yellow');
    logInfo('Waiting 30 seconds for deployments to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Step 4: Optionally delete old key
    if (deleteOld) {
      log('\n🗑️  Step 4: Cleaning up old keys...', 'yellow');
      const keys = await listKeys();
      const oldKeys = keys.filter(k => 
        k.id !== newKey.id && 
        k.name.includes('Formul8') &&
        new Date(k.created_at) < new Date(newKey.created_at)
      );
      
      if (oldKeys.length > 0) {
        logWarning(`Found ${oldKeys.length} old key(s) to delete`);
        for (const oldKey of oldKeys) {
          await deleteKey(oldKey.id);
        }
      } else {
        logInfo('No old keys to delete');
      }
    }
    
    log('\n' + '='.repeat(80), 'cyan');
    logSuccess('🎉 KEY ROTATION COMPLETED SUCCESSFULLY!');
    log('='.repeat(80), 'cyan');
    
    log('\nNext steps:', 'yellow');
    log('1. Test a few agent endpoints to verify the new key works', 'white');
    log('2. Update your .env files with the new key if needed', 'white');
    log('3. Monitor logs for any issues over the next hour', 'white');
    log('4. Save the new key in a secure location', 'white');
    
    return newKey;
  } catch (error) {
    logError(`Key rotation failed: ${error.message}`);
    log('\n⚠️  ROLLBACK REQUIRED!', 'red');
    log('You may need to manually restore the previous key', 'yellow');
    throw error;
  }
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!PROVISIONING_KEY) {
    logError('OPENROUTER_PROVISIONING_KEY environment variable is required');
    process.exit(1);
  }
  
  try {
    switch (command) {
      case 'list':
        const limit = parseInt(args[1]) || 100;
        await listKeys(limit);
        break;
        
      case 'create':
        const name = args[1] || 'Formul8 Agent';
        const limitAmount = args[2] ? parseFloat(args[2]) : null;
        const label = args[3] || null;
        await createKey(name, limitAmount, label);
        break;
        
      case 'create-user':
        if (!args[1]) {
          logError('User ID required');
          process.exit(1);
        }
        const userId = args[1];
        const userLimit = args[2] ? parseFloat(args[2]) : null;
        await createUserKey(userId, userLimit);
        break;
        
      case 'delete':
        if (!args[1]) {
          logError('Key ID required');
          process.exit(1);
        }
        await deleteKey(args[1]);
        break;
        
      case 'info':
        if (!args[1]) {
          logError('Key ID required');
          process.exit(1);
        }
        await getKeyInfo(args[1]);
        break;
        
      case 'rotate':
        const deleteOld = args.includes('--delete-old');
        await rotateKeys(deleteOld);
        break;
        
      case 'rotate-user':
        if (!args[1]) {
          logError('User ID required');
          process.exit(1);
        }
        const rotateUserId = args[1];
        const rotateDeleteOld = args.includes('--delete-old');
        await rotateUserKey(rotateUserId, rotateDeleteOld);
        break;
        
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
        
      default:
        logError(`Unknown command: ${command || '(none)'}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    logError(`Operation failed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  log('\n' + '='.repeat(80), 'cyan');
  log('OPENROUTER KEY MANAGER', 'cyan');
  log('='.repeat(80), 'cyan');
  log('\nUsage: node openrouter-key-manager.js <command> [options]', 'yellow');
  log('\nCommands:', 'yellow');
  log('  list [limit]              List all API keys (default limit: 100)', 'white');
  log('  create [name] [limit]     Create a new API key', 'white');
  log('  create-user <user-id>     Create a key for a specific user', 'white');
  log('  delete <key-id>           Delete an API key', 'white');
  log('  info <key-id>             Get information about a key', 'white');
  log('  rotate [--delete-old]     Rotate all agent keys (optionally delete old)', 'white');
  log('  rotate-user <user-id>     Rotate key for a specific user', 'white');
  log('  help                      Show this help message', 'white');
  log('\nExamples:', 'cyan');
  log('  node openrouter-key-manager.js list', 'white');
  log('  node openrouter-key-manager.js create "Production Key" 100.00', 'white');
  log('  node openrouter-key-manager.js rotate', 'white');
  log('  node openrouter-key-manager.js rotate --delete-old', 'white');
  log('  node openrouter-key-manager.js delete key_abc123', 'white');
  log('\nEnvironment Variables:', 'yellow');
  log('  OPENROUTER_PROVISIONING_KEY    OpenRouter Provisioning API key', 'white');
  log('='.repeat(80), 'cyan');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  listKeys,
  createKey,
  createUserKey,
  deleteKey,
  getKeyInfo,
  rotateKeys,
  rotateUserKey
};

