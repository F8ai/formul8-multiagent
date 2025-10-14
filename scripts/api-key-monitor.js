#!/usr/bin/env node

/**
 * API Key Monitor Service
 * Monitors GitHub repository for changes and triggers API key distribution
 * Can be run as a service or cron job
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = 'F8ai';
const GITHUB_REPO = 'formul8-multiagent';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
const STATE_FILE = '.api-key-monitor-state.json';

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
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
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

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    logWarning(`Failed to load state file: ${error.message}`);
  }
  return { lastCheck: null, lastCommit: null };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    logError(`Failed to save state file: ${error.message}`);
  }
}

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function getLatestCommit() {
  const options = {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'F8-API-Key-Monitor'
    }
  };
  
  const response = await makeRequest(`${GITHUB_API_URL}/commits/main`, options);
  return response.data;
}

async function triggerKeyDistribution() {
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'F8-API-Key-Monitor',
      'Content-Type': 'application/json'
    }
  };
  
  const payload = {
    event_type: 'update-api-key',
    client_payload: {
      api_key: process.env.OPENROUTER_API_KEY,
      force_update: true,
      timestamp: new Date().toISOString(),
      triggered_by: 'api-key-monitor'
    }
  };
  
  const response = await makeRequest(`${GITHUB_API_URL}/dispatches`, options);
  return response;
}

async function checkForChanges() {
  logInfo('Checking for repository changes...');
  
  const state = loadState();
  const currentTime = new Date().toISOString();
  
  try {
    const latestCommit = await getLatestCommit();
    const latestCommitSha = latestCommit.sha;
    const latestCommitDate = latestCommit.commit.committer.date;
    
    // Check if this is a new commit
    if (state.lastCommit !== latestCommitSha) {
      logInfo(`New commit detected: ${latestCommitSha}`);
      logInfo(`Commit message: ${latestCommit.commit.message}`);
      logInfo(`Author: ${latestCommit.commit.author.name}`);
      
      // Check if the commit affects agent configurations
      const commitDetails = await makeRequest(`${GITHUB_API_URL}/commits/${latestCommitSha}`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'F8-API-Key-Monitor'
        }
      });
      
      const changedFiles = commitDetails.data.files.map(file => file.filename);
      const agentRelatedFiles = changedFiles.filter(file => 
        file.includes('agents/') || 
        file.includes('lambda-package/') ||
        file.includes('distribute-api-key.yml') ||
        file.includes('trigger-key-distribution.js')
      );
      
      if (agentRelatedFiles.length > 0) {
        logInfo(`Agent-related files changed: ${agentRelatedFiles.join(', ')}`);
        
        // Trigger API key distribution
        logInfo('Triggering API key distribution...');
        await triggerKeyDistribution();
        logSuccess('API key distribution triggered successfully!');
        
        // Update state
        state.lastCommit = latestCommitSha;
        state.lastDistribution = currentTime;
        saveState(state);
        
        return true;
      } else {
        logInfo('No agent-related files changed, skipping distribution');
      }
      
      // Update state
      state.lastCommit = latestCommitSha;
      state.lastCheck = currentTime;
      saveState(state);
    } else {
      logInfo('No new commits detected');
    }
    
    return false;
  } catch (error) {
    logError(`Failed to check for changes: ${error.message}`);
    return false;
  }
}

async function runOnce() {
  logInfo('Starting API key monitor (single run)...');
  
  if (!GITHUB_TOKEN) {
    logError('GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }
  
  if (!process.env.OPENROUTER_API_KEY) {
    logError('OPENROUTER_API_KEY environment variable is required');
    process.exit(1);
  }
  
  const changesDetected = await checkForChanges();
  
  if (changesDetected) {
    logSuccess('Changes detected and API key distribution triggered');
  } else {
    logInfo('No changes detected');
  }
}

async function runContinuous(intervalMinutes = 5) {
  logInfo(`Starting API key monitor (continuous, checking every ${intervalMinutes} minutes)...`);
  
  if (!GITHUB_TOKEN) {
    logError('GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }
  
  if (!process.env.OPENROUTER_API_KEY) {
    logError('OPENROUTER_API_KEY environment variable is required');
    process.exit(1);
  }
  
  const intervalMs = intervalMinutes * 60 * 1000;
  
  // Initial check
  await checkForChanges();
  
  // Set up interval
  setInterval(async () => {
    await checkForChanges();
  }, intervalMs);
  
  logInfo('Monitor started. Press Ctrl+C to stop.');
  
  // Keep the process running
  process.on('SIGINT', () => {
    logInfo('Stopping monitor...');
    process.exit(0);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'once';
  const interval = parseInt(args[1]) || 5;
  
  switch (command) {
    case 'once':
      await runOnce();
      break;
    case 'continuous':
    case 'watch':
      await runContinuous(interval);
      break;
    case 'help':
      log('Usage: node api-key-monitor.js [command] [interval]', 'cyan');
      log('', 'white');
      log('Commands:', 'yellow');
      log('  once        Run once and exit (default)', 'white');
      log('  continuous  Run continuously, checking every N minutes', 'white');
      log('  watch       Alias for continuous', 'white');
      log('  help        Show this help message', 'white');
      log('', 'white');
      log('Arguments:', 'yellow');
      log('  interval    Minutes between checks (default: 5)', 'white');
      log('', 'white');
      log('Environment Variables:', 'yellow');
      log('  GITHUB_TOKEN        GitHub personal access token with repo scope', 'white');
      log('  OPENROUTER_API_KEY  OpenRouter API key to distribute', 'white');
      log('', 'white');
      log('Examples:', 'cyan');
      log('  node api-key-monitor.js once', 'white');
      log('  node api-key-monitor.js continuous 10', 'white');
      break;
    default:
      logError(`Unknown command: ${command}`);
      log('Run "node api-key-monitor.js help" for usage information', 'yellow');
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkForChanges, triggerKeyDistribution };