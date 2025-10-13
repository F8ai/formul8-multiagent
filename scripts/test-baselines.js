#!/usr/bin/env node

/**
 * Test merged baseline.json questions against the /api/chat endpoint
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASELINE_FILE = path.join(process.cwd(), 'baseline.json');
const RESULTS_FILE = path.join(process.cwd(), 'baseline-results.json');
const API_ENDPOINT = process.env.API_ENDPOINT || 'https://f8.syzygyx.com/api/chat';

/**
 * Make API request to test a question
 */
function testQuestion(question) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ message: question });
    
    const url = new URL(API_ENDPOINT);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const startTime = Date.now();
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            success: res.statusCode === 200,
            response: response,
            responseTime
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            success: false,
            response: data,
            responseTime,
            error: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      const endTime = Date.now();
      resolve({
        status: 0,
        success: false,
        error: error.message,
        responseTime: endTime - startTime
      });
    });

    req.setTimeout(30000, () => {
      req.destroy();
      const endTime = Date.now();
      resolve({
        status: 0,
        success: false,
        error: 'Request timeout',
        responseTime: endTime - startTime
      });
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Compare response with expected answer
 */
function compareWithExpected(response, expectedAnswer) {
  if (!expectedAnswer || expectedAnswer.trim() === '') {
    return { matched: null, score: null };
  }

  if (!response || typeof response !== 'object') {
    return { matched: false, score: 0 };
  }

  const responseText = (response.response || response.message || '').toLowerCase();
  const expectedText = expectedAnswer.toLowerCase();

  // Simple keyword matching - check if key terms from expected answer appear in response
  const expectedKeywords = expectedText
    .split(/\s+/)
    .filter(word => word.length > 3); // Filter out short words

  if (expectedKeywords.length === 0) {
    return { matched: null, score: null };
  }

  const matchedKeywords = expectedKeywords.filter(keyword => 
    responseText.includes(keyword)
  );

  const matchScore = (matchedKeywords.length / expectedKeywords.length * 100).toFixed(2);
  const matched = parseFloat(matchScore) >= 50; // 50% keyword match threshold

  return {
    matched,
    score: parseFloat(matchScore),
    matchedKeywords: matchedKeywords.length,
    totalKeywords: expectedKeywords.length
  };
}

/**
 * Load baseline file
 */
function loadBaseline() {
  console.log(`📂 Loading baseline from: ${BASELINE_FILE}`);
  
  if (!fs.existsSync(BASELINE_FILE)) {
    console.error(`❌ Baseline file not found: ${BASELINE_FILE}`);
    process.exit(1);
  }

  const content = fs.readFileSync(BASELINE_FILE, 'utf8');
  const baseline = JSON.parse(content);
  
  let questions = [];
  
  if (baseline.questions && Array.isArray(baseline.questions)) {
    questions = baseline.questions;
  } else if (Array.isArray(baseline)) {
    questions = baseline;
  }

  console.log(`✅ Loaded ${questions.length} questions from baseline`);
  return { baseline, questions };
}

/**
 * Test all questions
 */
async function testAllQuestions(questions) {
  console.log(`\n🧪 Testing ${questions.length} questions against ${API_ENDPOINT}`);
  console.log('='.repeat(80));

  const results = [];
  const categoryResults = {};

  for (let i = 0; i < questions.length; i++) {
    const item = questions[i];
    const question = typeof item === 'string' ? item : item.question;
    const expectedAnswer = typeof item === 'object' ? item.expected_answer : '';
    const category = typeof item === 'object' ? item.category : 'general';
    
    console.log(`\n[${i + 1}/${questions.length}] ${question.substring(0, 80)}${question.length > 80 ? '...' : ''}`);
    console.log(`   Category: ${category}`);

    try {
      const testResult = await testQuestion(question);
      
      // Compare with expected answer if available
      const comparison = compareWithExpected(testResult.response, expectedAnswer);
      
      const result = {
        question,
        category,
        expectedAnswer: expectedAnswer || null,
        status: testResult.status,
        success: testResult.success,
        responseTime: testResult.responseTime,
        response: testResult.success ? (testResult.response.response || testResult.response.message || '') : null,
        error: testResult.error || null,
        comparison: comparison,
        passedValidation: testResult.success && (comparison.matched === null || comparison.matched === true)
      };

      results.push(result);

      // Track by category
      if (!categoryResults[category]) {
        categoryResults[category] = {
          total: 0,
          successful: 0,
          failed: 0,
          validated: 0,
          totalResponseTime: 0
        };
      }
      categoryResults[category].total++;
      if (result.success) {
        categoryResults[category].successful++;
        categoryResults[category].totalResponseTime += result.responseTime;
      } else {
        categoryResults[category].failed++;
      }
      if (result.passedValidation) {
        categoryResults[category].validated++;
      }

      // Log result
      if (result.success) {
        console.log(`   ✅ Success (${result.responseTime}ms)`);
        if (comparison.matched !== null) {
          console.log(`   📊 Match score: ${comparison.score}% (${comparison.matchedKeywords}/${comparison.totalKeywords} keywords)`);
          console.log(`   ${result.passedValidation ? '✅' : '❌'} Validation: ${result.passedValidation ? 'PASSED' : 'FAILED'}`);
        }
      } else {
        console.log(`   ❌ Failed (${result.responseTime}ms): ${result.error || 'Unknown error'}`);
      }

    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
      results.push({
        question,
        category,
        expectedAnswer: expectedAnswer || null,
        success: false,
        error: error.message,
        responseTime: 0,
        passedValidation: false
      });
    }

    // Small delay between requests to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return { results, categoryResults };
}

/**
 * Calculate overall statistics
 */
function calculateStats(results, categoryResults) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const validated = results.filter(r => r.passedValidation);
  const responseTimes = successful.map(r => r.responseTime);

  const overallStats = {
    totalQuestions: results.length,
    totalSuccessful: successful.length,
    totalFailed: failed.length,
    totalValidated: validated.length,
    successRate: (successful.length / results.length * 100).toFixed(2),
    validationRate: (validated.length / results.length * 100).toFixed(2),
    avgResponseTime: responseTimes.length > 0 ? 
      Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0,
    minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
    maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0
  };

  // Calculate category stats
  const categoryStats = {};
  for (const [category, stats] of Object.entries(categoryResults)) {
    categoryStats[category] = {
      total: stats.total,
      successful: stats.successful,
      failed: stats.failed,
      validated: stats.validated,
      successRate: (stats.successful / stats.total * 100).toFixed(2),
      validationRate: (stats.validated / stats.total * 100).toFixed(2),
      avgResponseTime: stats.successful > 0 ? 
        Math.round(stats.totalResponseTime / stats.successful) : 0
    };
  }

  return { overallStats, categoryStats };
}

/**
 * Print summary
 */
function printSummary(overallStats, categoryStats) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 OVERALL TEST SUMMARY');
  console.log('='.repeat(80));
  
  console.log(`Total Questions: ${overallStats.totalQuestions}`);
  console.log(`Successful: ${overallStats.totalSuccessful}`);
  console.log(`Failed: ${overallStats.totalFailed}`);
  console.log(`Validated: ${overallStats.totalValidated}`);
  console.log(`Success Rate: ${overallStats.successRate}%`);
  console.log(`Validation Rate: ${overallStats.validationRate}%`);
  console.log(`Average Response Time: ${overallStats.avgResponseTime}ms`);
  console.log(`Response Time Range: ${overallStats.minResponseTime}ms - ${overallStats.maxResponseTime}ms`);

  // Grade the performance
  const successRate = parseFloat(overallStats.successRate);
  let grade, emoji;
  if (successRate >= 95) {
    grade = 'A+';
    emoji = '🏆';
  } else if (successRate >= 90) {
    grade = 'A';
    emoji = '🌟';
  } else if (successRate >= 85) {
    grade = 'B+';
    emoji = '✅';
  } else if (successRate >= 80) {
    grade = 'B';
    emoji = '👍';
  } else if (successRate >= 75) {
    grade = 'C+';
    emoji = '⚠️';
  } else if (successRate >= 70) {
    grade = 'C';
    emoji = '⚠️';
  } else {
    grade = 'F';
    emoji = '❌';
  }

  console.log(`\n${emoji} Overall Grade: ${grade}`);

  console.log('\n📋 CATEGORY-SPECIFIC RESULTS:');
  console.log('-'.repeat(80));
  console.log('Category'.padEnd(25) + 'Success Rate'.padStart(15) + 'Avg Time'.padStart(15) + 'Tests'.padStart(15));
  console.log('-'.repeat(80));
  
  for (const [category, stats] of Object.entries(categoryStats).sort((a, b) => b[1].successful - a[1].successful)) {
    console.log(
      category.padEnd(25) +
      `${stats.successRate}%`.padStart(15) +
      `${stats.avgResponseTime}ms`.padStart(15) +
      `${stats.successful}/${stats.total}`.padStart(15)
    );
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting baseline testing');
  console.log('='.repeat(80));
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🎯 Testing against: ${API_ENDPOINT}`);

  // Load baseline
  const { baseline, questions } = loadBaseline();

  // Test all questions
  const { results, categoryResults } = await testAllQuestions(questions);

  // Calculate statistics
  const { overallStats, categoryStats } = calculateStats(results, categoryResults);

  // Print summary
  printSummary(overallStats, categoryStats);

  // Save results
  const report = {
    timestamp: new Date().toISOString(),
    endpoint: API_ENDPOINT,
    baselineMetadata: baseline.metadata || {},
    overallStats,
    categoryStats,
    results
  };

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(report, null, 2));
  console.log(`\n💾 Detailed results saved to: ${RESULTS_FILE}`);

  console.log('\n✅ Baseline testing completed!');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main, testQuestion, compareWithExpected };
