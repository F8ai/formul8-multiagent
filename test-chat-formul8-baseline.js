#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Configuration
const CHAT_ENDPOINT = 'https://chat.formul8.ai';
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds

// Load all baseline questions from test-all-agents-baseline.js structure
const baselineQuestions = [
  // F8 Agent Questions
  {
    question: 'What are the benefits of cannabis?',
    category: 'general',
    expectedKeywords: ['therapeutic', 'medical', 'pain', 'chronic', 'cbd', 'thc', 'treatment'],
    expectedTopics: ['medical benefits', 'therapeutic uses', 'pain management'],
    agentContext: 'f8_agent'
  },
  {
    question: 'How do I scale up my cannabis production?',
    category: 'operations',
    expectedKeywords: ['cultivation', 'facility', 'license', 'production', 'automation', 'staff', 'capacity', 'compliance'],
    expectedTopics: ['facility planning', 'licensing', 'workflow', 'scaling strategies'],
    agentContext: 'f8_agent'
  },
  {
    question: 'I want to start a cannabis business',
    category: 'business',
    expectedKeywords: ['license', 'business plan', 'compliance', 'regulation', 'jurisdiction', 'capital', 'funding'],
    expectedTopics: ['business planning', 'licensing', 'compliance', 'funding'],
    agentContext: 'f8_agent'
  },
  {
    question: 'What is the meaning of life?',
    category: 'off_topic',
    expectedKeywords: ['purpose', 'philosophical', 'meaning', 'existential'],
    expectedTopics: ['philosophy', 'meaning', 'purpose'],
    agentContext: 'f8_agent',
    shouldRedirect: false // Should handle gracefully
  },
  {
    question: 'I need help with something completely unrelated to cannabis or business',
    category: 'off_topic',
    expectedKeywords: ['cannabis', 'focused', 'industry', 'scope'],
    expectedTopics: ['scope limitation', 'cannabis focus'],
    agentContext: 'f8_agent',
    shouldRedirect: false
  },
  // Compliance Questions
  {
    question: 'What are the compliance requirements for cannabis businesses in California?',
    category: 'compliance',
    expectedKeywords: ['california', 'license', 'regulation', 'compliance', 'dcc', 'metrc', 'testing', 'track'],
    expectedTopics: ['state regulations', 'licensing', 'tracking systems'],
    agentContext: 'compliance'
  },
  {
    question: 'What are the multi-state compliance challenges for cannabis?',
    category: 'compliance',
    expectedKeywords: ['multi-state', 'compliance', 'regulation', 'state', 'federal', 'challenge', 'jurisdiction'],
    expectedTopics: ['multi-state operations', 'regulatory differences', 'challenges'],
    agentContext: 'compliance'
  },
  {
    question: 'How do I maintain compliance records for cannabis cultivation?',
    category: 'compliance',
    expectedKeywords: ['records', 'documentation', 'cultivation', 'track', 'audit', 'compliance', 'metrc'],
    expectedTopics: ['record keeping', 'cultivation tracking', 'audit preparation'],
    agentContext: 'compliance'
  },
  {
    question: 'What are the testing requirements for cannabis products?',
    category: 'compliance',
    expectedKeywords: ['testing', 'lab', 'potency', 'contaminant', 'pesticide', 'microbial', 'coa', 'compliance'],
    expectedTopics: ['lab testing', 'safety testing', 'potency analysis'],
    agentContext: 'compliance'
  },
  // Formulation Questions
  {
    question: 'How do I calculate THC dosage?',
    category: 'formulation',
    expectedKeywords: ['thc', 'dosage', 'calculate', 'milligram', 'mg', 'potency', 'concentration'],
    expectedTopics: ['dosage calculation', 'THC measurement', 'formulation math'],
    agentContext: 'formulation'
  },
  {
    question: 'How do I make cannabis edibles?',
    category: 'formulation',
    expectedKeywords: ['edible', 'infusion', 'decarboxylation', 'butter', 'oil', 'recipe', 'temperature'],
    expectedTopics: ['edible preparation', 'infusion process', 'decarboxylation'],
    agentContext: 'formulation'
  },
  {
    question: 'Create a recipe for cannabis gummies with 10mg THC each',
    category: 'formulation',
    expectedKeywords: ['gummies', '10mg', 'thc', 'recipe', 'gelatin', 'dosage', 'mold', 'infusion'],
    expectedTopics: ['gummy recipe', 'precise dosing', 'infusion method'],
    agentContext: 'formulation'
  },
  {
    question: 'What extraction method is best for high-CBD products?',
    category: 'formulation',
    expectedKeywords: ['extraction', 'cbd', 'co2', 'ethanol', 'solvent', 'method', 'purity'],
    expectedTopics: ['extraction methods', 'CBD isolation', 'purity considerations'],
    agentContext: 'formulation'
  },
  // Science Questions
  {
    question: 'What is THC?',
    category: 'science',
    expectedKeywords: ['thc', 'tetrahydrocannabinol', 'cannabinoid', 'psychoactive', 'compound', 'cannabis'],
    expectedTopics: ['cannabinoid definition', 'chemical properties', 'effects'],
    agentContext: 'science'
  },
  {
    question: 'What are terpenes?',
    category: 'science',
    expectedKeywords: ['terpene', 'aromatic', 'compound', 'flavor', 'aroma', 'myrcene', 'limonene', 'pinene'],
    expectedTopics: ['terpene definition', 'aromatic compounds', 'effects'],
    agentContext: 'science'
  },
  {
    question: 'How do I test cannabis potency?',
    category: 'science',
    expectedKeywords: ['potency', 'test', 'hplc', 'chromatography', 'lab', 'thc', 'cbd', 'analysis'],
    expectedTopics: ['potency testing', 'lab methods', 'analytical techniques'],
    agentContext: 'science'
  },
  {
    question: 'What is the difference between indica and sativa?',
    category: 'science',
    expectedKeywords: ['indica', 'sativa', 'difference', 'effect', 'morphology', 'cannabinoid', 'terpene'],
    expectedTopics: ['strain types', 'morphological differences', 'effect profiles'],
    agentContext: 'science'
  },
  // Operations Questions
  {
    question: 'How do I optimize my cannabis facility operations?',
    category: 'operations',
    expectedKeywords: ['optimize', 'facility', 'operations', 'efficiency', 'workflow', 'automation', 'production'],
    expectedTopics: ['operational efficiency', 'workflow optimization', 'facility management'],
    agentContext: 'operations'
  },
  {
    question: 'What are the best practices for cannabis cultivation?',
    category: 'operations',
    expectedKeywords: ['cultivation', 'best practices', 'growing', 'environment', 'nutrient', 'lighting', 'climate'],
    expectedTopics: ['cultivation techniques', 'environmental control', 'best practices'],
    agentContext: 'operations'
  },
  {
    question: 'How do I manage cannabis inventory?',
    category: 'operations',
    expectedKeywords: ['inventory', 'management', 'track', 'metrc', 'stock', 'supply', 'control'],
    expectedTopics: ['inventory tracking', 'stock management', 'seed-to-sale'],
    agentContext: 'operations'
  },
  // Marketing Questions
  {
    question: 'How should I market my cannabis brand on social media?',
    category: 'marketing',
    expectedKeywords: ['marketing', 'social media', 'brand', 'advertising', 'compliance', 'platform', 'content'],
    expectedTopics: ['social media strategy', 'compliant marketing', 'brand building'],
    agentContext: 'marketing'
  },
  {
    question: 'What are the best practices for cannabis advertising?',
    category: 'marketing',
    expectedKeywords: ['advertising', 'cannabis', 'compliance', 'regulation', 'marketing', 'restriction'],
    expectedTopics: ['advertising compliance', 'marketing restrictions', 'best practices'],
    agentContext: 'marketing'
  },
  {
    question: 'How do I build brand awareness for cannabis products?',
    category: 'marketing',
    expectedKeywords: ['brand', 'awareness', 'marketing', 'cannabis', 'strategy', 'customer', 'visibility'],
    expectedTopics: ['brand building', 'awareness strategies', 'customer engagement'],
    agentContext: 'marketing'
  }
];

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
        error: apiResponse.error || 'No response received'
      }
    };
  }

  // Keyword matching (40 points max)
  const keywordsFound = questionData.expectedKeywords.filter(keyword => 
    responseText.includes(keyword.toLowerCase())
  );
  const keywordScore = Math.min(40, (keywordsFound.length / questionData.expectedKeywords.length) * 40);

  // Topic coverage (40 points max)
  const topicsFound = questionData.expectedTopics.filter(topic => 
    responseText.includes(topic.toLowerCase().replace(/\s+/g, ''))
  );
  const topicScore = Math.min(40, (topicsFound.length / questionData.expectedTopics.length) * 40);

  // Response quality metrics (20 points max)
  let lengthScore = 0;
  const wordCount = responseText.split(/\s+/).length;
  if (wordCount >= 50) lengthScore += 10; // Sufficient detail
  if (wordCount >= 100) lengthScore += 5; // Good detail
  if (responseText.includes('|') || responseText.includes('##')) lengthScore += 5; // Formatted response

  const totalScore = keywordScore + topicScore + lengthScore;
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
  console.log('🚀 Starting chat.formul8.ai Baseline Testing & Grading');
  console.log('='.repeat(80));
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🎯 Endpoint: ${CHAT_ENDPOINT}`);
  console.log(`📊 Total questions: ${baselineQuestions.length}`);
  console.log('='.repeat(80));

  const results = [];
  const categoryResults = {};

  for (let i = 0; i < baselineQuestions.length; i++) {
    const questionData = baselineQuestions[i];
    console.log(`\n[${i + 1}/${baselineQuestions.length}] Question: ${questionData.question}`);
    console.log(`   Category: ${questionData.category} | Expected Agent Context: ${questionData.agentContext}`);
    
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

      // Display result
      if (apiResponse.success) {
        console.log(`   ✅ Response received (${apiResponse.responseTime}ms)`);
        console.log(`   📊 Grade: ${gradeLetter} (${grade.percentage}%)`);
        console.log(`   📈 Breakdown: Keywords=${grade.details.keywordScore} | Topics=${grade.details.topicScore} | Quality=${grade.details.lengthScore}`);
        console.log(`   🔍 Keywords found: ${grade.details.keywordsFound}/${grade.details.keywordsTotal}`);
        console.log(`   📝 Topics covered: ${grade.details.topicsFound}/${grade.details.topicsTotal}`);
        console.log(`   📏 Word count: ${grade.details.wordCount}`);
        
        if (apiResponse.response?.agent) {
          console.log(`   🤖 Agent: ${apiResponse.response.agent}`);
        }
        if (apiResponse.response?.model) {
          console.log(`   🧠 Model: ${apiResponse.response.model}`);
        }
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
  const filename = `chat-formul8-baseline-results-${timestamp}.json`;
  
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
      gradeDistribution: gradeDistribution
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

  // Save summary markdown
  const mdFilename = `chat-formul8-baseline-summary-${timestamp}.md`;
  const markdown = generateMarkdownReport(report);
  fs.writeFileSync(mdFilename, markdown);
  console.log(`📄 Summary report saved to: ${mdFilename}`);

  console.log('\n✅ Testing and grading completed!');
}

// Function to generate markdown report
function generateMarkdownReport(report) {
  let md = `# chat.formul8.ai Baseline Test Results\n\n`;
  md += `**Test Date:** ${report.timestamp}\n\n`;
  md += `**Endpoint:** ${report.endpoint}\n\n`;
  
  md += `## Overall Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Questions | ${report.summary.totalQuestions} |\n`;
  md += `| Successful Responses | ${report.summary.successfulResponses} |\n`;
  md += `| Failed Responses | ${report.summary.failedResponses} |\n`;
  md += `| Success Rate | ${report.summary.successRate}% |\n`;
  md += `| Average Score | ${report.summary.averageScore}% |\n`;
  md += `| Overall Grade | **${report.summary.overallGrade}** |\n\n`;
  
  md += `## Grade Distribution\n\n`;
  md += `| Grade | Count | Percentage |\n`;
  md += `|-------|-------|------------|\n`;
  for (const [grade, count] of Object.entries(report.summary.gradeDistribution)) {
    const pct = (count / report.summary.totalQuestions * 100).toFixed(1);
    md += `| ${grade} | ${count} | ${pct}% |\n`;
  }
  md += `\n`;
  
  md += `## Results by Category\n\n`;
  md += `| Category | Questions | Avg Score | Grade |\n`;
  md += `|----------|-----------|-----------|-------|\n`;
  for (const cat of report.categoryResults) {
    md += `| ${cat.category} | ${cat.questions} | ${cat.averageScore}% | ${cat.grade} |\n`;
  }
  md += `\n`;
  
  md += `## Detailed Results\n\n`;
  for (const result of report.detailedResults) {
    md += `### Question ${result.questionNumber}: ${result.question}\n\n`;
    md += `- **Category:** ${result.category}\n`;
    md += `- **Expected Agent:** ${result.agentContext}\n`;
    md += `- **Grade:** ${result.gradeLetter} (${result.grade.percentage}%)\n`;
    
    if (result.apiResponse?.success) {
      md += `- **Status:** ✅ Success\n`;
      md += `- **Response Time:** ${result.apiResponse.responseTime}ms\n`;
      if (result.apiResponse.response?.agent) {
        md += `- **Agent Used:** ${result.apiResponse.response.agent}\n`;
      }
      if (result.apiResponse.response?.model) {
        md += `- **Model:** ${result.apiResponse.response.model}\n`;
      }
      md += `\n**Score Breakdown:**\n`;
      md += `- Keywords: ${result.grade.details.keywordScore} (${result.grade.details.keywordsFound}/${result.grade.details.keywordsTotal})\n`;
      md += `- Topics: ${result.grade.details.topicScore} (${result.grade.details.topicsFound}/${result.grade.details.topicsTotal})\n`;
      md += `- Quality: ${result.grade.details.lengthScore} (${result.grade.details.wordCount} words)\n`;
    } else {
      md += `- **Status:** ❌ Failed\n`;
      md += `- **Error:** ${result.apiResponse?.error || result.error || 'Unknown error'}\n`;
    }
    md += `\n---\n\n`;
  }
  
  return md;
}

// Run the tests
if (require.main === module) {
  testChatFormul8().catch(console.error);
}

module.exports = { testChatFormul8, baselineQuestions };

