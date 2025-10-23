#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Configuration
const CHAT_ENDPOINT = 'https://chat.formul8.ai';
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds

// Load all questions from test-all-agents-baseline.js
const { agentBaselineQuestions } = require('./test-all-agents-baseline.js');

// Convert to test format with expected keywords and topics
const baselineQuestions = [];

// F8 Agent Questions
agentBaselineQuestions.f8_agent.forEach(q => {
  baselineQuestions.push({
    question: q,
    category: 'general',
    agentContext: 'f8_agent',
    expectedKeywords: ['cannabis', 'business', 'industry'],
    expectedTopics: ['general information', 'business context']
  });
});

// Compliance Questions
agentBaselineQuestions.compliance.forEach(q => {
  baselineQuestions.push({
    question: q,
    category: 'compliance',
    agentContext: 'compliance',
    expectedKeywords: ['compliance', 'regulation', 'license', 'legal', 'audit'],
    expectedTopics: ['regulatory requirements', 'licensing', 'compliance procedures']
  });
});

// Formulation Questions
agentBaselineQuestions.formulation.forEach(q => {
  baselineQuestions.push({
    question: q,
    category: 'formulation',
    agentContext: 'formulation',
    expectedKeywords: ['thc', 'cbd', 'dosage', 'recipe', 'extraction', 'formulation'],
    expectedTopics: ['recipe development', 'dosage calculation', 'extraction methods']
  });
});

// Science Questions
agentBaselineQuestions.science.forEach(q => {
  baselineQuestions.push({
    question: q,
    category: 'science',
    agentContext: 'science',
    expectedKeywords: ['thc', 'cbd', 'cannabinoid', 'terpene', 'research', 'science'],
    expectedTopics: ['scientific concepts', 'chemical analysis', 'research']
  });
});

// Operations Questions
agentBaselineQuestions.operations.forEach(q => {
  baselineQuestions.push({
    question: q,
    category: 'operations',
    agentContext: 'operations',
    expectedKeywords: ['operations', 'facility', 'cultivation', 'production', 'management'],
    expectedTopics: ['facility operations', 'production management', 'best practices']
  });
});

// Marketing Questions
agentBaselineQuestions.marketing.forEach(q => {
  baselineQuestions.push({
    question: q,
    category: 'marketing',
    agentContext: 'marketing',
    expectedKeywords: ['marketing', 'brand', 'advertising', 'social media', 'customer'],
    expectedTopics: ['marketing strategy', 'brand development', 'advertising']
  });
});

// Sourcing Questions
agentBaselineQuestions.sourcing.forEach(q => {
  baselineQuestions.push({
    question: q,
    category: 'sourcing',
    agentContext: 'sourcing',
    expectedKeywords: ['sourcing', 'supply', 'vendor', 'supplier', 'procurement'],
    expectedTopics: ['supply chain', 'vendor management', 'sourcing strategies']
  });
});

// Patent Questions
agentBaselineQuestions.patent.forEach(q => {
  baselineQuestions.push({
    question: q,
    category: 'patent',
    agentContext: 'patent',
    expectedKeywords: ['patent', 'intellectual property', 'ip', 'innovation'],
    expectedTopics: ['patent research', 'IP strategy', 'legal protection']
  });
});

// Spectra Questions
agentBaselineQuestions.spectra.forEach(q => {
  baselineQuestions.push({
    question: q,
    category: 'spectra',
    agentContext: 'spectra',
    expectedKeywords: ['spectra', 'spectroscopy', 'analysis', 'testing', 'lab'],
    expectedTopics: ['spectral analysis', 'testing methods', 'lab equipment']
  });
});

// Customer Success Questions
agentBaselineQuestions.customer_success.forEach(q => {
  baselineQuestions.push({
    question: q,
    category: 'customer_success',
    agentContext: 'customer_success',
    expectedKeywords: ['customer', 'retention', 'success', 'support', 'satisfaction'],
    expectedTopics: ['customer retention', 'success strategies', 'support optimization']
  });
});

// F8 Slackbot Questions
agentBaselineQuestions.f8_slackbot.forEach(q => {
  baselineQuestions.push({
    question: q,
    category: 'f8_slackbot',
    agentContext: 'f8_slackbot',
    expectedKeywords: ['slack', 'integration', 'notification', 'workflow', 'automation'],
    expectedTopics: ['Slack integration', 'workflow automation', 'notifications']
  });
});

// MCR Questions
agentBaselineQuestions.mcr.forEach(q => {
  baselineQuestions.push({
    question: q,
    category: 'mcr',
    agentContext: 'mcr',
    expectedKeywords: ['mcr', 'master control record', 'documentation', 'compliance'],
    expectedTopics: ['MCR management', 'record keeping', 'documentation']
  });
});

// Ad Questions
agentBaselineQuestions.ad.forEach(q => {
  baselineQuestions.push({
    question: q,
    category: 'ad',
    agentContext: 'ad',
    expectedKeywords: ['advertising', 'campaign', 'ad', 'promotional', 'compliance'],
    expectedTopics: ['advertising strategy', 'campaign development', 'compliance']
  });
});

// Editor Agent Questions
agentBaselineQuestions.editor_agent.forEach(q => {
  baselineQuestions.push({
    question: q,
    category: 'editor_agent',
    agentContext: 'editor_agent',
    expectedKeywords: ['configure', 'routing', 'agent', 'tier', 'update'],
    expectedTopics: ['system configuration', 'agent management', 'routing']
  });
});

console.log(`Loaded ${baselineQuestions.length} total questions from all agents`);

// Function to make API request
function makeRequest(url, question) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ message: question });
    
    const urlObj = new URL(url);
    const pathname = urlObj.pathname === '/' ? '' : urlObj.pathname;
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: pathname + '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 60000 // 60 second timeout
    };

    const startTime = Date.now();
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            response: response,
            success: res.statusCode === 200,
            responseTime: responseTime
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            response: data,
            success: false,
            error: error.message,
            responseTime: responseTime
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 0,
        success: false,
        error: 'Request timeout',
        responseTime: Date.now() - startTime
      });
    });

    req.write(postData);
    req.end();
  });
}

// Function to grade a response
function gradeResponse(questionData, apiResponse) {
  const responseText = (apiResponse.response?.response || apiResponse.response || '').toLowerCase();
  
  if (!apiResponse.success || !responseText) {
    return {
      score: 0,
      maxScore: 100,
      percentage: 0,
      details: {
        keywordScore: 0,
        topicScore: 0,
        lengthScore: 0,
        routingScore: 0,
        error: apiResponse.error || 'No response received'
      }
    };
  }

  // Keyword matching (30 points max)
  const keywordsFound = questionData.expectedKeywords.filter(keyword => 
    responseText.includes(keyword.toLowerCase())
  );
  const keywordScore = Math.min(30, (keywordsFound.length / questionData.expectedKeywords.length) * 30);

  // Topic coverage (30 points max)
  const topicsFound = questionData.expectedTopics.filter(topic => 
    responseText.includes(topic.toLowerCase().replace(/\s+/g, ''))
  );
  const topicScore = Math.min(30, (topicsFound.length / questionData.expectedTopics.length) * 30);

  // Agent routing correctness (20 points)
  const actualAgent = apiResponse.response?.agent || '';
  const routingScore = (actualAgent === questionData.agentContext) ? 20 : 0;

  // Response quality metrics (20 points max)
  let lengthScore = 0;
  const wordCount = responseText.split(/\s+/).length;
  if (wordCount >= 50) lengthScore += 10; // Sufficient detail
  if (wordCount >= 100) lengthScore += 5; // Good detail
  if (responseText.includes('|') || responseText.includes('##')) lengthScore += 5; // Formatted response

  const totalScore = keywordScore + topicScore + routingScore + lengthScore;
  const percentage = (totalScore / 100) * 100;

  return {
    score: totalScore,
    maxScore: 100,
    percentage: percentage.toFixed(2),
    details: {
      keywordScore: keywordScore.toFixed(2),
      keywordsFound: keywordsFound.length,
      keywordsTotal: questionData.expectedKeywords.length,
      topicScore: topicScore.toFixed(2),
      topicsFound: topicsFound.length,
      topicsTotal: questionData.expectedTopics.length,
      routingScore: routingScore.toFixed(2),
      expectedAgent: questionData.agentContext,
      actualAgent: actualAgent,
      routingCorrect: actualAgent === questionData.agentContext,
      lengthScore: lengthScore.toFixed(2),
      wordCount: wordCount,
      responseLength: responseText.length
    }
  };
}

// Function to get grade letter
function getGradeLetter(percentage) {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

// Main test function
async function testChatFormul8() {
  console.log('🚀 Starting COMPREHENSIVE chat.formul8.ai Baseline Testing');
  console.log('='.repeat(80));
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🎯 Endpoint: ${CHAT_ENDPOINT}`);
  console.log(`📊 Total questions: ${baselineQuestions.length}`);
  console.log('='.repeat(80));

  const results = [];
  const categoryResults = {};
  const routingAccuracy = {
    total: 0,
    correct: 0,
    byAgent: {}
  };

  for (let i = 0; i < baselineQuestions.length; i++) {
    const questionData = baselineQuestions[i];
    console.log(`\n[${i + 1}/${baselineQuestions.length}] Question: ${questionData.question}`);
    console.log(`   Category: ${questionData.category} | Expected Agent: ${questionData.agentContext}`);
    
    try {
      const apiResponse = await makeRequest(CHAT_ENDPOINT, questionData.question);
      const grade = gradeResponse(questionData, apiResponse);
      const gradeLetter = getGradeLetter(parseFloat(grade.percentage));

      const result = {
        questionNumber: i + 1,
        question: questionData.question,
        category: questionData.category,
        agentContext: questionData.agentContext,
        apiResponse: apiResponse,
        grade: grade,
        gradeLetter: gradeLetter
      };

      results.push(result);

      // Initialize category tracking
      if (!categoryResults[questionData.category]) {
        categoryResults[questionData.category] = {
          questions: 0,
          totalScore: 0,
          grades: []
        };
      }
      categoryResults[questionData.category].questions++;
      categoryResults[questionData.category].totalScore += parseFloat(grade.percentage);
      categoryResults[questionData.category].grades.push(gradeLetter);

      // Track routing accuracy
      routingAccuracy.total++;
      if (grade.details.routingCorrect) {
        routingAccuracy.correct++;
      }
      
      const expectedAgent = questionData.agentContext;
      if (!routingAccuracy.byAgent[expectedAgent]) {
        routingAccuracy.byAgent[expectedAgent] = { total: 0, correct: 0 };
      }
      routingAccuracy.byAgent[expectedAgent].total++;
      if (grade.details.routingCorrect) {
        routingAccuracy.byAgent[expectedAgent].correct++;
      }

      // Display result
      if (apiResponse.success) {
        console.log(`   ✅ Response received (${apiResponse.responseTime}ms)`);
        console.log(`   📊 Grade: ${gradeLetter} (${grade.percentage}%)`);
        console.log(`   📈 Breakdown: Keywords=${grade.details.keywordScore} | Topics=${grade.details.topicScore} | Routing=${grade.details.routingScore} | Quality=${grade.details.lengthScore}`);
        console.log(`   🔍 Keywords: ${grade.details.keywordsFound}/${grade.details.keywordsTotal} | Topics: ${grade.details.topicsFound}/${grade.details.topicsTotal}`);
        console.log(`   🤖 Agent: ${grade.details.actualAgent} (expected: ${grade.details.expectedAgent}) ${grade.details.routingCorrect ? '✅' : '❌'}`);
        console.log(`   📏 Word count: ${grade.details.wordCount}`);
      } else {
        console.log(`   ❌ Failed: ${apiResponse.error || 'Unknown error'}`);
        console.log(`   📊 Grade: ${gradeLetter} (${grade.percentage}%)`);
      }

      // Delay between requests
      if (i < baselineQuestions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      }
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
      results.push({
        questionNumber: i + 1,
        question: questionData.question,
        category: questionData.category,
        agentContext: questionData.agentContext,
        error: error.message,
        grade: { score: 0, maxScore: 100, percentage: 0 },
        gradeLetter: 'F'
      });
    }
  }

  // Calculate overall statistics
  console.log('\n' + '='.repeat(80));
  console.log('📊 OVERALL RESULTS');
  console.log('='.repeat(80));

  const successfulResponses = results.filter(r => r.apiResponse?.success);
  const failedResponses = results.filter(r => !r.apiResponse?.success);
  const totalScore = results.reduce((sum, r) => sum + parseFloat(r.grade.percentage), 0);
  const averageScore = totalScore / results.length;
  const overallGrade = getGradeLetter(averageScore);

  console.log(`Total Questions: ${results.length}`);
  console.log(`Successful Responses: ${successfulResponses.length}`);
  console.log(`Failed Responses: ${failedResponses.length}`);
  console.log(`Success Rate: ${(successfulResponses.length / results.length * 100).toFixed(2)}%`);
  
  console.log(`\n🎯 ROUTING ACCURACY:`);
  const routingAccuracyPercent = (routingAccuracy.correct / routingAccuracy.total * 100).toFixed(2);
  console.log(`Overall: ${routingAccuracy.correct}/${routingAccuracy.total} (${routingAccuracyPercent}%)`);
  console.log(`\nBy Agent:`);
  Object.entries(routingAccuracy.byAgent).forEach(([agent, stats]) => {
    const accuracy = (stats.correct / stats.total * 100).toFixed(1);
    console.log(`  ${agent}: ${stats.correct}/${stats.total} (${accuracy}%)`);
  });
  
  console.log(`\n📈 GRADING SUMMARY:`);
  console.log(`Overall Average Score: ${averageScore.toFixed(2)}%`);
  console.log(`Overall Grade: ${overallGrade}`);

  // Grade distribution
  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  results.forEach(r => gradeDistribution[r.gradeLetter]++);
  console.log(`\n📊 Grade Distribution:`);
  console.log(`   A: ${gradeDistribution.A} (${(gradeDistribution.A / results.length * 100).toFixed(1)}%)`);
  console.log(`   B: ${gradeDistribution.B} (${(gradeDistribution.B / results.length * 100).toFixed(1)}%)`);
  console.log(`   C: ${gradeDistribution.C} (${(gradeDistribution.C / results.length * 100).toFixed(1)}%)`);
  console.log(`   D: ${gradeDistribution.D} (${(gradeDistribution.D / results.length * 100).toFixed(1)}%)`);
  console.log(`   F: ${gradeDistribution.F} (${(gradeDistribution.F / results.length * 100).toFixed(1)}%)`);

  // Category breakdown
  console.log('\n' + '='.repeat(80));
  console.log('📂 RESULTS BY CATEGORY');
  console.log('='.repeat(80));
  
  for (const [category, stats] of Object.entries(categoryResults)) {
    const avgScore = stats.totalScore / stats.questions;
    const categoryGrade = getGradeLetter(avgScore);
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`   Questions: ${stats.questions}`);
    console.log(`   Average Score: ${avgScore.toFixed(2)}%`);
    console.log(`   Grade: ${categoryGrade}`);
    console.log(`   Grades: ${stats.grades.join(', ')}`);
  }

  // Performance metrics
  const responseTimes = successfulResponses.map(r => r.apiResponse.responseTime);
  if (responseTimes.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('⏱️  PERFORMANCE METRICS');
    console.log('='.repeat(80));
    console.log(`Average Response Time: ${(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(0)}ms`);
    console.log(`Min Response Time: ${Math.min(...responseTimes)}ms`);
    console.log(`Max Response Time: ${Math.max(...responseTimes)}ms`);
  }

  // Save detailed results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `chat-formul8-comprehensive-results-${timestamp}.json`;
  
  const report = {
    timestamp: new Date().toISOString(),
    endpoint: CHAT_ENDPOINT,
    summary: {
      totalQuestions: results.length,
      successfulResponses: successfulResponses.length,
      failedResponses: failedResponses.length,
      successRate: (successfulResponses.length / results.length * 100).toFixed(2),
      averageScore: averageScore.toFixed(2),
      overallGrade: overallGrade,
      gradeDistribution: gradeDistribution,
      routingAccuracy: {
        overall: routingAccuracyPercent,
        byAgent: Object.fromEntries(
          Object.entries(routingAccuracy.byAgent).map(([agent, stats]) => [
            agent,
            { 
              accuracy: (stats.correct / stats.total * 100).toFixed(1),
              correct: stats.correct,
              total: stats.total
            }
          ])
        )
      }
    },
    categoryResults: Object.entries(categoryResults).map(([category, stats]) => ({
      category,
      questions: stats.questions,
      averageScore: (stats.totalScore / stats.questions).toFixed(2),
      grade: getGradeLetter(stats.totalScore / stats.questions),
      grades: stats.grades
    })),
    detailedResults: results
  };

  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`\n💾 Detailed results saved to: ${filename}`);

  console.log('\n✅ Comprehensive testing completed!');
  
  return report;
}

// Run the tests
if (require.main === module) {
  testChatFormul8().catch(console.error);
}

module.exports = { testChatFormul8 };

