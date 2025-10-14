#!/usr/bin/env node

/**
 * Script to trigger API key distribution workflow
 * This can be run manually or integrated with other processes
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = 'F8ai';
const GITHUB_REPO = 'formul8-multiagent';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dispatches`;

// Colors for console output
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

function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, data: responseData });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
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

async function triggerWorkflow(apiKey, forceUpdate = false) {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }
  
  if (!apiKey) {
    throw new Error('API key is required');
  }
  
  const payload = {
    event_type: 'update-api-key',
    client_payload: {
      api_key: apiKey,
      force_update: forceUpdate,
      timestamp: new Date().toISOString()
    }
  };
  
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'F8-Key-Distribution-Script',
      'Content-Type': 'application/json'
    }
  };
  
  logInfo('Triggering API key distribution workflow...');
  log(`Repository: ${GITHUB_OWNER}/${GITHUB_REPO}`, 'cyan');
  log(`API Key: ${apiKey.substring(0, 20)}...`, 'cyan');
  log(`Force Update: ${forceUpdate}`, 'cyan');
  
  try {
    const response = await makeRequest(GITHUB_API_URL, options, payload);
    logSuccess('Workflow triggered successfully!');
    log(`Response: ${response.statusCode}`, 'green');
    return response;
  } catch (error) {
    logError(`Failed to trigger workflow: ${error.message}`);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const apiKey = args[0];
  const forceUpdate = args.includes('--force') || args.includes('-f');
  
  if (!apiKey) {
    logError('Usage: node trigger-key-distribution.js <api-key> [--force]');
    log('', 'white');
    log('Options:', 'yellow');
    log('  --force, -f    Force update even if key appears to be the same', 'white');
    log('', 'white');
    log('Environment Variables:', 'yellow');
    log('  GITHUB_TOKEN   GitHub personal access token with repo scope', 'white');
    log('', 'white');
    log('Example:', 'cyan');
    log('  GITHUB_TOKEN=ghp_xxx node trigger-key-distribution.js sk-or-v1-abc123...', 'white');
    process.exit(1);
  }
  
  try {
    await triggerWorkflow(apiKey, forceUpdate);
    logSuccess('API key distribution workflow has been triggered!');
    log('', 'white');
    log('You can monitor the progress at:', 'blue');
    log(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions`, 'cyan');
  } catch (error) {
    logError(`Script failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { triggerWorkflow };