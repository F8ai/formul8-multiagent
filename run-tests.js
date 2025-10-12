#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  baseUrl: 'https://f8.syzygyx.com/chat',
  testSuites: [
    {
      name: 'Smoke Tests',
      file: 'tests/chat-smoke.spec.js',
      description: 'Basic functionality validation'
    },
    {
      name: 'Comprehensive Tests',
      file: 'tests/chat-comprehensive.spec.js',
      description: 'Full test suite across all tiers and scenarios'
    }
  ],
  browsers: ['chromium', 'firefox', 'webkit'],
  mobileDevices: ['Mobile Chrome', 'Mobile Safari']
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.cyan}▶ ${description}${colors.reset}`);
  log(`${colors.yellow}Running: ${command}${colors.reset}`);
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 300000 // 5 minutes timeout
    });
    
    if (output) {
      console.log(output);
    }
    
    log(`${colors.green}✅ ${description} completed successfully${colors.reset}`);
    return true;
  } catch (error) {
    log(`${colors.red}❌ ${description} failed:${colors.reset}`);
    console.error(error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    return false;
  }
}

function checkPrerequisites() {
  log(`${colors.bright}Checking prerequisites...${colors.reset}`);
  
  // Check if Node.js is available
  try {
    execSync('node --version', { stdio: 'pipe' });
    log(`${colors.green}✅ Node.js is available${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ Node.js not found. Please install Node.js first.${colors.reset}`);
    process.exit(1);
  }

  // Check if npm is available
  try {
    execSync('npm --version', { stdio: 'pipe' });
    log(`${colors.green}✅ npm is available${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ npm not found. Please install npm first.${colors.reset}`);
    process.exit(1);
  }
}

function installDependencies() {
  log(`${colors.bright}Installing dependencies...${colors.reset}`);
  
  if (!fs.existsSync('node_modules')) {
    runCommand('npm install', 'Installing npm packages');
  } else {
    log(`${colors.yellow}Dependencies already installed${colors.reset}`);
  }
}

function installPlaywright() {
  log(`${colors.bright}Installing Playwright browsers...${colors.reset}`);
  runCommand('npx playwright install', 'Installing Playwright browsers');
  runCommand('npx playwright install-deps', 'Installing Playwright system dependencies');
}

function createDirectories() {
  const dirs = ['test-results', 'playwright-report'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`${colors.green}✅ Created directory: ${dir}${colors.reset}`);
    }
  });
}

function runSmokeTests() {
  log(`${colors.bright}Running Smoke Tests...${colors.reset}`);
  return runCommand(
    'npx playwright test tests/chat-smoke.spec.js --reporter=line',
    'Smoke Tests'
  );
}

function runComprehensiveTests() {
  log(`${colors.bright}Running Comprehensive Tests...${colors.reset}`);
  
  const results = [];
  
  // Run tests for each browser
  config.browsers.forEach(browser => {
    const success = runCommand(
      `npx playwright test tests/chat-comprehensive.spec.js --project=${browser} --reporter=line`,
      `Comprehensive Tests on ${browser}`
    );
    results.push({ browser, success });
  });
  
  // Run mobile tests
  config.mobileDevices.forEach(device => {
    const success = runCommand(
      `npx playwright test tests/chat-comprehensive.spec.js --project="${device}" --reporter=line`,
      `Comprehensive Tests on ${device}`
    );
    results.push({ device, success });
  });
  
  return results;
}

function generateReport() {
  log(`${colors.bright}Generating test report...${colors.reset}`);
  
  // Generate HTML report
  runCommand('npx playwright show-report --host 0.0.0.0 --port 9323 &', 'Starting HTML report server');
  
  // Wait for report to generate
  setTimeout(() => {
    log(`${colors.green}📊 Test report available at: http://localhost:9323${colors.reset}`);
  }, 3000);
}

function printSummary(results) {
  log(`\n${colors.bright}${'='.repeat(60)}${colors.reset}`);
  log(`${colors.bright}TEST EXECUTION SUMMARY${colors.reset}`);
  log(`${colors.bright}${'='.repeat(60)}${colors.reset}`);
  
  log(`\n${colors.cyan}Target System: ${config.baseUrl}${colors.reset}`);
  log(`${colors.cyan}Test Suites: ${config.testSuites.length}${colors.reset}`);
  log(`${colors.cyan}Browsers Tested: ${config.browsers.join(', ')}${colors.reset}`);
  log(`${colors.cyan}Mobile Devices: ${config.mobileDevices.join(', ')}${colors.reset}`);
  
  if (results && results.length > 0) {
    log(`\n${colors.bright}Results:${colors.reset}`);
    results.forEach(result => {
      const status = result.success ? 
        `${colors.green}✅ PASSED${colors.reset}` : 
        `${colors.red}❌ FAILED${colors.reset}`;
      const name = result.browser || result.device;
      log(`  ${name}: ${status}`);
    });
  }
  
  log(`\n${colors.bright}Test Artifacts:${colors.reset}`);
  log(`  📊 HTML Report: playwright-report/index.html`);
  log(`  📄 JSON Results: test-results/results.json`);
  log(`  📋 JUnit Results: test-results/results.xml`);
  
  log(`\n${colors.bright}${'='.repeat(60)}${colors.reset}`);
}

// Main execution
async function main() {
  log(`${colors.bright}🚀 Formul8 Multiagent Chat - Comprehensive Test Runner${colors.reset}`);
  log(`${colors.bright}${'='.repeat(60)}${colors.reset}`);
  
  try {
    // Setup
    checkPrerequisites();
    installDependencies();
    installPlaywright();
    createDirectories();
    
    // Run tests
    log(`\n${colors.bright}Starting test execution...${colors.reset}`);
    
    const smokeSuccess = runSmokeTests();
    if (!smokeSuccess) {
      log(`${colors.red}❌ Smoke tests failed. Stopping execution.${colors.reset}`);
      process.exit(1);
    }
    
    const comprehensiveResults = runComprehensiveTests();
    
    // Generate report
    generateReport();
    
    // Print summary
    printSummary(comprehensiveResults);
    
    log(`\n${colors.green}🎉 Test execution completed!${colors.reset}`);
    
  } catch (error) {
    log(`${colors.red}❌ Test execution failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log(`${colors.bright}Formul8 Chat Test Runner${colors.reset}`);
  log(`Usage: node run-tests.js [options]`);
  log(`\nOptions:`);
  log(`  --help, -h     Show this help message`);
  log(`  --smoke-only   Run only smoke tests`);
  log(`  --no-mobile    Skip mobile device tests`);
  log(`  --browser <b>  Run tests only on specified browser`);
  log(`\nExamples:`);
  log(`  node run-tests.js                    # Run all tests`);
  log(`  node run-tests.js --smoke-only       # Run only smoke tests`);
  log(`  node run-tests.js --browser chromium # Run only on Chrome`);
  process.exit(0);
}

// Execute main function
main().catch(error => {
  log(`${colors.red}❌ Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});