#!/usr/bin/env node

/**
 * Generate evaluation criteria for baseline questions
 * 
 * This script:
 * 1. Reads baseline.json
 * 2. For each question, generates evaluation criteria using OpenRouter
 * 3. Adds criteria to the baseline.json
 * 4. Saves updated baseline.json with _with_criteria suffix
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const BATCH_SIZE = 10; // Process in batches to avoid rate limits
const DELAY_MS = 2000; // Delay between batches

if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY environment variable not set');
  process.exit(1);
}

// Load baseline
const baselinePath = path.join(__dirname, '..', 'baseline.json');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║     📋 BASELINE EVALUATION CRITERIA GENERATOR                     ║');
console.log('╚══════════════════════════════════════════════════════════════════╝');
console.log('');
console.log(`Total questions: ${baseline.baseline.length}`);
console.log('');

// Function to call OpenRouter API
function generateCriteria(question, category) {
  return new Promise((resolve, reject) => {
    const prompt = `You are creating evaluation criteria for assessing AI responses to cannabis industry questions.

Question: "${question}"
Category: ${category}

Generate evaluation criteria in JSON format with these fields:
{
  "mustInclude": ["concept1", "concept2"],  // Key concepts that MUST be in the response
  "keywords": ["keyword1", "keyword2"],      // Important keywords to look for
  "qualityIndicators": ["indicator1"],       // What makes a high-quality answer
  "commonMistakes": ["mistake1"],            // Common errors to penalize
  "minLength": 150,                          // Minimum reasonable response length
  "expectedDepth": "basic|intermediate|advanced"  // Expected depth of response
}

Be specific and relevant to the cannabis industry and the question category.`;

    const postData = JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
        'HTTP-Referer': 'https://f8ai.github.io',
        'X-Title': 'F8 Baseline Criteria Generator'
      },
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0].message.content;
          const criteria = JSON.parse(content);
          resolve(criteria);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Process questions in batches
async function processQuestions() {
  const questions = baseline.baseline;
  const results = [];
  
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(questions.length / BATCH_SIZE);
    
    console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (questions ${i + 1}-${Math.min(i + BATCH_SIZE, questions.length)})`);
    
    const batchPromises = batch.map(async (q, idx) => {
      const globalIdx = i + idx;
      try {
        console.log(`   [${globalIdx + 1}/${questions.length}] ${q.question.substring(0, 60)}...`);
        const criteria = await generateCriteria(q.question, q.category);
        return {
          ...q,
          evaluationCriteria: criteria
        };
      } catch (error) {
        console.error(`   ❌ Error processing question ${globalIdx + 1}: ${error.message}`);
        return {
          ...q,
          evaluationCriteria: {
            error: error.message,
            mustInclude: [],
            keywords: [],
            qualityIndicators: [],
            commonMistakes: [],
            minLength: 100,
            expectedDepth: 'basic'
          }
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Delay between batches to avoid rate limits
    if (i + BATCH_SIZE < questions.length) {
      console.log(`   ⏳ Waiting ${DELAY_MS}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  
  return results;
}

// Main execution
(async () => {
  try {
    const questionsWithCriteria = await processQuestions();
    
    // Create updated baseline
    const updatedBaseline = {
      ...baseline,
      baseline: questionsWithCriteria,
      metadata: {
        ...baseline.metadata,
        lastUpdated: new Date().toISOString(),
        criteriaGenerated: true,
        criteriaVersion: '1.0'
      }
    };
    
    // Save to new file
    const outputPath = path.join(__dirname, '..', 'baseline-with-criteria.json');
    fs.writeFileSync(outputPath, JSON.stringify(updatedBaseline, null, 2));
    
    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║     ✅ EVALUATION CRITERIA GENERATION COMPLETE                    ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📁 Output file: ${outputPath}`);
    console.log(`📊 Questions processed: ${questionsWithCriteria.length}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Review the generated criteria');
    console.log('2. Update test-baseline-e2e.spec.js to use evaluationCriteria');
    console.log('3. Replace baseline.json with baseline-with-criteria.json when ready');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
})();




