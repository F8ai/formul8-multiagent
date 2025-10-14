#!/usr/bin/env node

/**
 * ChatGPT Comparison Test Runner
 * Runs comprehensive tests to ensure F8 chat interface mirrors ChatGPT exactly
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
  logSection('Checking Prerequisites for ChatGPT Comparison');
  
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
    'tests/chatgpt-comparison.spec.js',
    'tests/visual-chatgpt-comparison.spec.js',
    'tests/chatgpt-functionality-mirror.spec.js'
  ];
  
  for (const file of testFiles) {
    if (fs.existsSync(file)) {
      logSuccess(`Test file exists: ${file}`);
    } else {
      logError(`Test file missing: ${file}`);
    }
  }
  
  // Check if chat.html exists
  if (fs.existsSync('lambda-package/public/chat.html')) {
    logSuccess('Chat interface exists: lambda-package/public/chat.html');
  } else {
    logError('Chat interface missing: lambda-package/public/chat.html');
  }
}

async function runChatGPTComparisonTests() {
  logSection('Running ChatGPT Comparison Tests');
  
  const testSuites = [
    { 
      file: 'tests/chatgpt-comparison.spec.js', 
      name: 'ChatGPT Interface Comparison',
      description: 'Tests basic ChatGPT-like interface elements and behavior'
    },
    { 
      file: 'tests/visual-chatgpt-comparison.spec.js', 
      name: 'Visual ChatGPT Comparison',
      description: 'Tests visual design and layout against ChatGPT standards'
    },
    { 
      file: 'tests/chatgpt-functionality-mirror.spec.js', 
      name: 'ChatGPT Functionality Mirror',
      description: 'Tests exact functionality mirroring of ChatGPT behavior'
    }
  ];
  
  const results = [];
  
  for (const suite of testSuites) {
    if (fs.existsSync(suite.file)) {
      logInfo(`Running ${suite.name}...`);
      log(`Description: ${suite.description}`, 'white');
      
      const result = await runCommand(
        `npx playwright test ${suite.file} --reporter=json`,
        `${suite.name} tests`
      );
      
      results.push({ 
        ...result, 
        suite: suite.name,
        description: suite.description
      });
      
      if (result.success) {
        logSuccess(`${suite.name} passed`);
      } else {
        logError(`${suite.name} failed`);
      }
    } else {
      logWarning(`Skipping ${suite.name} - file not found`);
    }
  }
  
  return results;
}

async function runVisualRegressionTests() {
  logSection('Running Visual Regression Tests');
  
  // Create test-results directory if it doesn't exist
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results');
    logInfo('Created test-results directory');
  }
  
  const visualTests = [
    'tests/visual-chatgpt-comparison.spec.js'
  ];
  
  const results = [];
  
  for (const testFile of visualTests) {
    if (fs.existsSync(testFile)) {
      const result = await runCommand(
        `npx playwright test ${testFile} --reporter=json`,
        `Visual regression tests for ${testFile}`
      );
      
      results.push({ ...result, testFile });
    }
  }
  
  return results;
}

async function generateComparisonReport(testResults) {
  logSection('Generating ChatGPT Comparison Report');
  
  const report = {
    timestamp: new Date().toISOString(),
    testType: 'ChatGPT Comparison',
    summary: {
      total: testResults.length,
      passed: testResults.filter(r => r.success).length,
      failed: testResults.filter(r => !r.success).length
    },
    results: testResults,
    recommendations: []
  };
  
  // Add recommendations based on results
  if (report.summary.failed > 0) {
    report.recommendations.push('Review failed tests and update F8 chat interface to better match ChatGPT');
    report.recommendations.push('Check visual regression screenshots in test-results/ directory');
  }
  
  if (report.summary.passed === report.summary.total) {
    report.recommendations.push('Excellent! F8 chat interface successfully mirrors ChatGPT');
    report.recommendations.push('Consider adding more advanced ChatGPT features like conversation history');
  }
  
  // Save JSON report
  const reportPath = 'test-results/chatgpt-comparison-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logSuccess(`ChatGPT comparison report saved to ${reportPath}`);
  
  // Generate HTML report
  await runCommand(
    'npx playwright show-report',
    'Opening HTML test report'
  );
  
  return report;
}

async function checkChatInterfaceFeatures() {
  logSection('Checking F8 Chat Interface Features');
  
  const features = [
    {
      name: 'ChatGPT-like Layout',
      check: () => fs.existsSync('lambda-package/public/chat.html'),
      description: 'Main chat interface file exists'
    },
    {
      name: 'Responsive Design',
      check: () => {
        const content = fs.readFileSync('lambda-package/public/chat.html', 'utf8');
        return content.includes('@media') || content.includes('viewport');
      },
      description: 'Responsive CSS media queries present'
    },
    {
      name: 'Message Styling',
      check: () => {
        const content = fs.readFileSync('lambda-package/public/chat.html', 'utf8');
        return content.includes('message-content') && content.includes('border-radius');
      },
      description: 'ChatGPT-like message styling implemented'
    },
    {
      name: 'Typing Indicators',
      check: () => {
        const content = fs.readFileSync('lambda-package/public/chat.html', 'utf8');
        return content.includes('typing-indicator') && content.includes('typing-dots');
      },
      description: 'Typing animation indicators present'
    },
    {
      name: 'API Integration',
      check: () => {
        const content = fs.readFileSync('lambda-package/public/chat.html', 'utf8');
        return content.includes('/api/chat') && content.includes('X-API-Key');
      },
      description: 'API integration for chat functionality'
    },
    {
      name: 'Error Handling',
      check: () => {
        const content = fs.readFileSync('lambda-package/public/chat.html', 'utf8');
        return content.includes('error-message') && content.includes('catch');
      },
      description: 'Error handling and display implemented'
    }
  ];
  
  const featureResults = [];
  
  for (const feature of features) {
    try {
      const passed = feature.check();
      if (passed) {
        logSuccess(`${feature.name}: ${feature.description}`);
        featureResults.push({ name: feature.name, passed: true });
      } else {
        logWarning(`${feature.name}: ${feature.description} - NOT FOUND`);
        featureResults.push({ name: feature.name, passed: false });
      }
    } catch (error) {
      logError(`${feature.name}: Error checking - ${error.message}`);
      featureResults.push({ name: feature.name, passed: false, error: error.message });
    }
  }
  
  return featureResults;
}

async function main() {
  log('🤖 F8 ChatGPT Comparison Test Runner', 'magenta');
  log('=====================================', 'magenta');
  
  try {
    // Check prerequisites
    await checkPrerequisites();
    
    // Check chat interface features
    const featureResults = await checkChatInterfaceFeatures();
    
    // Run ChatGPT comparison tests
    const testResults = await runChatGPTComparisonTests();
    
    // Run visual regression tests
    const visualResults = await runVisualRegressionTests();
    
    // Combine all results
    const allResults = [...testResults, ...visualResults];
    
    // Generate comprehensive report
    const report = await generateComparisonReport(allResults);
    
    // Summary
    logSection('ChatGPT Comparison Summary');
    log(`Total test suites: ${report.summary.total}`, 'white');
    log(`Passed: ${report.summary.passed}`, 'green');
    log(`Failed: ${report.summary.failed}`, 'red');
    
    log('\nFeature Check Results:', 'yellow');
    featureResults.forEach(feature => {
      if (feature.passed) {
        log(`  ✅ ${feature.name}`, 'green');
      } else {
        log(`  ❌ ${feature.name}`, 'red');
      }
    });
    
    if (report.summary.failed > 0) {
      log('\nFailed test suites:', 'red');
      allResults
        .filter(r => !r.success)
        .forEach(r => log(`  - ${r.suite || r.testFile}`, 'red'));
    }
    
    log('\nRecommendations:', 'blue');
    report.recommendations.forEach(rec => {
      log(`  • ${rec}`, 'white');
    });
    
    // Exit with appropriate code
    process.exit(report.summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    logError(`ChatGPT comparison test runner failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, runChatGPTComparisonTests, checkChatInterfaceFeatures };