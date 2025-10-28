const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Load baseline questions
const baseline = JSON.parse(fs.readFileSync('./baseline.json', 'utf8'));

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://chat.formul8.ai';
const RESULTS_DIR = './baseline-results';
const TIMEOUT_PER_QUESTION = 60000; // 60 seconds per question

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Extract questions from baseline
function extractQuestions(baselineData) {
  const questions = [];
  
  if (baselineData.questions && Array.isArray(baselineData.questions)) {
    baselineData.questions.forEach(q => {
      questions.push({
        question: q.question,
        category: q.category || 'uncategorized',
        expectedAnswer: q.expectedAnswer || q.expected_answer || '',
        expectedKeywords: q.expectedKeywords || q.expected_keywords || [],
        agent: q.agent || 'unknown'
      });
    });
  }
  
  return questions;
}

// Grading function
function gradeResponse(response, expected) {
  const score = {
    total: 0,
    details: {}
  };
  
  const responseLower = response.toLowerCase();
  const expectedLower = (expected.expectedAnswer || '').toLowerCase();
  
  // 1. Length check (10 points)
  if (response.length > 100) {
    score.total += 10;
    score.details.length = 'Pass';
  } else {
    score.details.length = 'Fail - too short';
  }
  
  // 2. Keyword matching (40 points)
  const keywords = expected.expectedKeywords || [];
  if (keywords.length > 0) {
    const matchedKeywords = keywords.filter(kw => 
      responseLower.includes(kw.toLowerCase())
    );
    const keywordScore = (matchedKeywords.length / keywords.length) * 40;
    score.total += keywordScore;
    score.details.keywords = `${matchedKeywords.length}/${keywords.length} matched`;
  }
  
  // 3. No error messages (20 points)
  const errorPatterns = ['error', 'sorry', 'cannot', 'unable', 'don\'t know'];
  const hasError = errorPatterns.some(pattern => 
    responseLower.includes(pattern) && response.length < 200
  );
  if (!hasError) {
    score.total += 20;
    score.details.noErrors = 'Pass';
  } else {
    score.details.noErrors = 'Fail - error detected';
  }
  
  // 4. Contains structured content (15 points)
  const hasStructure = /[\n•\-\d\.]\s/.test(response) || 
                       response.includes('**') ||
                       response.includes('\n\n');
  if (hasStructure) {
    score.total += 15;
    score.details.structure = 'Pass';
  } else {
    score.details.structure = 'Fail - no structure';
  }
  
  // 5. Relevance to question (15 points)
  const questionWords = expected.question.toLowerCase().split(' ')
    .filter(w => w.length > 4)
    .slice(0, 5);
  const matchedWords = questionWords.filter(word => 
    responseLower.includes(word)
  );
  const relevanceScore = (matchedWords.length / Math.max(questionWords.length, 1)) * 15;
  score.total += relevanceScore;
  score.details.relevance = `${matchedWords.length}/${questionWords.length} key words`;
  
  return score;
}

function getLetterGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// Function to get full response and agent info from API
async function getResponseFromAPI(question) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ message: question });
    
    const options = {
      hostname: 'chat.formul8.ai',
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      },
      timeout: 30000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            response: parsed.response || parsed.message || '',
            agent: parsed.agent || 'unknown',
            agentName: parsed.agentName || 'Unknown Agent',
            success: true
          });
        } catch (e) {
          resolve({ 
            response: '',
            agent: 'error', 
            agentName: 'Error parsing response',
            success: false,
            error: e.message
          });
        }
      });
    });
    
    req.on('error', (e) => {
      resolve({ 
        response: '',
        agent: 'error', 
        agentName: `Error: ${e.message}`,
        success: false,
        error: e.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ 
        response: '',
        agent: 'timeout', 
        agentName: 'Request timeout',
        success: false,
        error: 'timeout'
      });
    });
    
    req.write(postData);
    req.end();
  });
}

// Map categories to expected agents
function getExpectedAgent(category) {
  const categoryAgentMap = {
    'sop-generation-compliance-documentation': 'compliance_agent',
    'product-testing-infusion-rules': 'compliance_agent',
    'labeling-packaging-compliance': 'compliance_agent',
    'facility-setup-operational-procedures': 'compliance_agent',
    'inventory-repackaging-tracking': 'compliance_agent',
    'recordkeeping-logs': 'compliance_agent',
    'waste-management-compliance': 'compliance_agent',
    'employee-training-operational-roles': 'compliance_agent',
    'transport-transfer-regulations': 'compliance_agent',
    'edibles-potency-formulation': 'formulation_agent',
    'formulation-ingredient-compliance': 'formulation_agent',
    'production-&-process-optimization': 'formulation_agent',
    'extraction-&-processing-crosscutting': 'extraction_agent',
    'hydrocarbon-extraction-bhopho': 'extraction_agent',
    'ethanol-extraction': 'extraction_agent',
    'co-extraction': 'extraction_agent',
    'solventless-ice-water-hash-&-rosin': 'extraction_agent'
  };
  
  return categoryAgentMap[category] || 'f8_agent';
}

test.describe('Baseline E2E Testing - chat.formul8.ai', () => {
  let questions = extractQuestions(baseline);
  
  // For testing, limit to first N questions if TEST_SAMPLE environment variable is set
  const sampleSize = process.env.TEST_SAMPLE ? parseInt(process.env.TEST_SAMPLE) : questions.length;
  questions = questions.slice(0, sampleSize);
  
  const results = [];
  
  test.setTimeout(questions.length * TIMEOUT_PER_QUESTION);
  
  test('Run all baseline questions', async ({ page }) => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 BASELINE E2E TEST - chat.formul8.ai`);
    console.log(`${'='.repeat(70)}`);
    console.log(`Total Questions: ${questions.length}`);
    console.log(`Estimated Time: ${Math.round(questions.length * 10 / 60)} minutes`);
    console.log(`${'='.repeat(70)}\n`);
    
    // Navigate to chat.formul8.ai
    console.log(`🌐 Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Wait for chat interface to load
    await page.waitForSelector('textarea, input[type="text"]', { timeout: 10000 });
    console.log('✅ Chat interface loaded\n');
    
    let passCount = 0;
    let failCount = 0;
    let totalScore = 0;
    
    // Process each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const questionNum = i + 1;
      
      console.log(`\n[${questionNum}/${questions.length}] ${q.question.substring(0, 70)}${q.question.length > 70 ? '...' : ''}`);
      console.log(`   Category: ${q.category}`);
      
      try {
        const startTime = Date.now();
        
        // Get response directly from API (more reliable than UI scraping)
        const apiResult = await getResponseFromAPI(q.question);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (!apiResult.success || !apiResult.response) {
          console.log(`   ❌ API Error: ${apiResult.error || 'No response'}`);
          results.push({
            questionNum,
            question: q.question,
            category: q.category,
            response: null,
            error: apiResult.error || 'No response from API',
            duration,
            grade: 'F',
            score: 0,
            actualAgent: apiResult.agent,
            actualAgentName: apiResult.agentName,
            expectedAgent: getExpectedAgent(q.category),
            agentMatch: false
          });
          failCount++;
          continue;
        }
        
        const response = apiResult.response;
        const expectedAgent = getExpectedAgent(q.category);
        const agentMatch = apiResult.agent === expectedAgent;
        
        // Grade the response
        const grading = gradeResponse(response, q);
        const grade = getLetterGrade(grading.total);
        
        totalScore += grading.total;
        if (grading.total >= 60) {
          passCount++;
        } else {
          failCount++;
        }
        
        console.log(`   ✅ Grade: ${grade} (${grading.total.toFixed(1)}%) - ${duration}ms`);
        console.log(`      Agent: ${apiResult.agentName} ${agentMatch ? '✅' : '❌ (expected: ' + expectedAgent + ')'}`);
        console.log(`      ${response.substring(0, 80)}${response.length > 80 ? '...' : ''}`);
        
        results.push({
          questionNum,
          question: q.question,
          category: q.category,
          agent: q.agent,
          actualAgent: apiResult.agent,
          actualAgentName: apiResult.agentName,
          expectedAgent: expectedAgent,
          agentMatch: agentMatch,
          response,
          duration,
          grade,
          score: grading.total,
          grading: grading.details,
          expectedKeywords: q.expectedKeywords
        });
        
        // Save incremental results every 10 questions for real-time dashboard updates
        if (i > 0 && (i + 1) % 10 === 0) {
          const incrementalSummary = {
            timestamp: new Date().toISOString(),
            url: BASE_URL,
            totalQuestions: questions.length,
            completed: i + 1,
            passed: passCount,
            failed: failCount,
            averageScore: (totalScore / (i + 1)).toFixed(2),
            averageGrade: getLetterGrade(totalScore / (i + 1)),
            results: results.slice(0, i + 1),
            status: `In Progress: ${i + 1}/${questions.length} questions completed`
          };
          
          const docsDir = path.join(process.cwd(), 'docs', 'baseline-results');
          if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
          }
          fs.writeFileSync(path.join(docsDir, 'latest.json'), JSON.stringify(incrementalSummary, null, 2));
        }
        
        // Brief pause between questions to avoid rate limiting
        await page.waitForTimeout(500);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.push({
          questionNum,
          question: q.question,
          category: q.category,
          response: null,
          error: error.message,
          duration: 0,
          grade: 'F',
          score: 0
        });
        failCount++;
      }
    }
    
    // Calculate summary stats
    const avgScore = totalScore / questions.length;
    const avgGrade = getLetterGrade(avgScore);
    
    // Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      url: BASE_URL,
      totalQuestions: questions.length,
      passed: passCount,
      failed: failCount,
      averageScore: avgScore.toFixed(2),
      averageGrade: avgGrade,
      results
    };
    
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(RESULTS_DIR, `baseline-e2e-${timestamp}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(summary, null, 2));
    
    // Also save to docs/baseline-results/latest.json for GitHub Pages
    const docsDir = path.join(process.cwd(), 'docs', 'baseline-results');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(docsDir, 'latest.json'), JSON.stringify(summary, null, 2));
    
    // Generate markdown report
    const mdReport = generateMarkdownReport(summary);
    const mdFile = path.join(RESULTS_DIR, `baseline-e2e-${timestamp}.md`);
    fs.writeFileSync(mdFile, mdReport);
    
    // Print summary
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 BASELINE TEST COMPLETE`);
    console.log(`${'='.repeat(70)}`);
    console.log(`Total Questions: ${questions.length}`);
    console.log(`Passed: ${passCount} (${((passCount/questions.length)*100).toFixed(1)}%)`);
    console.log(`Failed: ${failCount} (${((failCount/questions.length)*100).toFixed(1)}%)`);
    console.log(`Average Score: ${avgScore.toFixed(2)}%`);
    console.log(`Average Grade: ${avgGrade}`);
    console.log(`\nResults saved to:`);
    console.log(`  - ${resultsFile}`);
    console.log(`  - ${mdFile}`);
    console.log(`${'='.repeat(70)}\n`);
    
    // Assert that at least 50% passed
    expect(passCount / questions.length).toBeGreaterThan(0.5);
  });
});

function generateMarkdownReport(summary) {
  let md = `# Baseline E2E Test Report - chat.formul8.ai\n\n`;
  md += `**Date:** ${new Date(summary.timestamp).toLocaleString()}\n\n`;
  md += `**URL:** ${summary.url}\n\n`;
  
  md += `## Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Questions | ${summary.totalQuestions} |\n`;
  md += `| Passed (≥60%) | ${summary.passed} (${((summary.passed/summary.totalQuestions)*100).toFixed(1)}%) |\n`;
  md += `| Failed (<60%) | ${summary.failed} (${((summary.failed/summary.totalQuestions)*100).toFixed(1)}%) |\n`;
  md += `| Average Score | ${summary.averageScore}% |\n`;
  md += `| Average Grade | ${summary.averageGrade} |\n\n`;
  
  md += `## Grade Distribution\n\n`;
  const gradeCount = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  summary.results.forEach(r => gradeCount[r.grade]++);
  
  md += `| Grade | Count | Percentage |\n`;
  md += `|-------|-------|------------|\n`;
  Object.entries(gradeCount).forEach(([grade, count]) => {
    const pct = ((count/summary.totalQuestions)*100).toFixed(1);
    md += `| ${grade} | ${count} | ${pct}% |\n`;
  });
  md += `\n`;
  
  md += `## Category Performance\n\n`;
  const categoryStats = {};
  summary.results.forEach(r => {
    if (!categoryStats[r.category]) {
      categoryStats[r.category] = { total: 0, sum: 0 };
    }
    categoryStats[r.category].total++;
    categoryStats[r.category].sum += r.score;
  });
  
  md += `| Category | Avg Score | Grade | Count |\n`;
  md += `|----------|-----------|-------|-------|\n`;
  Object.entries(categoryStats)
    .sort((a, b) => (b[1].sum/b[1].total) - (a[1].sum/a[1].total))
    .forEach(([cat, stats]) => {
      const avg = stats.sum / stats.total;
      const grade = getLetterGrade(avg);
      md += `| ${cat} | ${avg.toFixed(1)}% | ${grade} | ${stats.total} |\n`;
    });
  md += `\n`;
  
  md += `## Detailed Results\n\n`;
  summary.results.forEach(r => {
    md += `### ${r.questionNum}. ${r.question}\n\n`;
    md += `- **Category:** ${r.category}\n`;
    if (r.agent) md += `- **Expected Agent:** ${r.agent}\n`;
    md += `- **Grade:** ${r.grade} (${r.score.toFixed(1)}%)\n`;
    md += `- **Duration:** ${r.duration}ms\n\n`;
    
    if (r.grading) {
      md += `**Grading Details:**\n`;
      Object.entries(r.grading).forEach(([key, value]) => {
        md += `- ${key}: ${value}\n`;
      });
      md += `\n`;
    }
    
    if (r.response) {
      md += `**Response:**\n\`\`\`\n${r.response.substring(0, 500)}${r.response.length > 500 ? '...' : ''}\n\`\`\`\n\n`;
    } else {
      md += `**Error:** ${r.error}\n\n`;
    }
    
    md += `---\n\n`;
  });
  
  return md;
}

