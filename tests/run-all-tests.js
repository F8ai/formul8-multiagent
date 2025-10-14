#!/usr/bin/env node

/**
 * Comprehensive test runner for F8 Multiagent System
 * Runs all Playwright tests and provides detailed reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(title, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

async function runCommand(command, description) {
  try {
    logInfo(`Running: ${description}`);
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    logSuccess(`${description} completed`);
    return { success: true, output };
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    return { success: false, error: error.message, output: error.stdout };
  }
}

async function checkPrerequisites() {
  logSection('Checking Prerequisites');
  
  // Check if Playwright is installed
  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
    logSuccess('Playwright is installed');
  } catch (error) {
    logError('Playwright not found. Installing...');
    await runCommand('npm install @playwright/test', 'Installing Playwright');
    await runCommand('npx playwright install', 'Installing Playwright browsers');
  }
  
  // Check if test files exist
  const testFiles = [
    'tests/f8-domain.spec.js',
    'tests/main-agent.spec.js',
    'tests/individual-agents.spec.js',
    'tests/future-agent.spec.js',
    'tests/integration.spec.js',
    'tests/performance.spec.js'
  ];
  
  for (const file of testFiles) {
    if (fs.existsSync(file)) {
      logSuccess(`Test file exists: ${file}`);
    } else {
      logError(`Test file missing: ${file}`);
    }
  }
}

async function runSystemValidation() {
  logSection('Running System Validation');
  
  const result = await runCommand(
    'node tests/validate-system.js',
    'System validation tests'
  );
  
  if (result.success) {
    logSuccess('System validation passed');
  } else {
    logError('System validation failed');
    log(result.output, 'red');
  }
  
  return result.success;
}

async function runPlaywrightTests() {
  logSection('Running Playwright Tests');
  
  const testSuites = [
    { file: 'tests/f8-domain.spec.js', name: 'Domain Validation' },
    { file: 'tests/main-agent.spec.js', name: 'Main Agent API' },
    { file: 'tests/individual-agents.spec.js', name: 'Individual Agents' },
    { file: 'tests/future-agent.spec.js', name: 'Future Agent' },
    { file: 'tests/integration.spec.js', name: 'Integration Tests' },
    { file: 'tests/performance.spec.js', name: 'Performance Tests' }
  ];
  
  const results = [];
  
  for (const suite of testSuites) {
    if (fs.existsSync(suite.file)) {
      const result = await runCommand(
        `npx playwright test ${suite.file} --reporter=json`,
        `${suite.name} tests`
      );
      results.push({ ...result, suite: suite.name });
    } else {
      logWarning(`Skipping ${suite.name} - file not found`);
    }
  }
  
  return results;
}

async function generateReport(testResults) {
  logSection('Generating Test Report');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.length,
      passed: testResults.filter(r => r.success).length,
      failed: testResults.filter(r => !r.success).length
    },
    results: testResults
  };
  
  // Save JSON report
  const reportPath = 'test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logSuccess(`Test report saved to ${reportPath}`);
  
  // Generate HTML report
  await runCommand(
    'npx playwright show-report',
    'Opening HTML test report'
  );
  
  return report;
}

async function main() {
  log('🚀 F8 Multiagent System Test Runner', 'magenta');
  log('=====================================', 'magenta');
  
  try {
    // Check prerequisites
    await checkPrerequisites();
    
    // Run system validation
    const systemValid = await runSystemValidation();
    if (!systemValid) {
      logError('System validation failed. Aborting test run.');
      process.exit(1);
    }
    
    // Run Playwright tests
    const testResults = await runPlaywrightTests();
    
    // Generate report
    const report = await generateReport(testResults);
    
    // Summary
    logSection('Test Summary');
    log(`Total test suites: ${report.summary.total}`, 'white');
    log(`Passed: ${report.summary.passed}`, 'green');
    log(`Failed: ${report.summary.failed}`, 'red');
    
    if (report.summary.failed > 0) {
      log('\nFailed test suites:', 'red');
      testResults
        .filter(r => !r.success)
        .forEach(r => log(`  - ${r.suite}`, 'red'));
    }
    
    // Exit with appropriate code
    process.exit(report.summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    logError(`Test runner failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, runCommand, checkPrerequisites };