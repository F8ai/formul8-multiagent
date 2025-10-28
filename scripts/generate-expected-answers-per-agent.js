#!/usr/bin/env node

/**
 * Generate Expected Answers by Querying Each Agent Directly
 * 
 * This script:
 * 1. Reads baseline.json
 * 2. For each question, determines the correct agent
 * 3. Queries that agent directly using their RAG/KB
 * 4. Uses GPT-5 to analyze the response and create evaluation criteria
 * 5. Saves the actual response as expectedAnswer
 * 6. Adds evaluation criteria for grading
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const BATCH_SIZE = 5; // Process in batches
const DELAY_MS = 3000; // Delay between batches
const AGENT_TIMEOUT = 90000; // 90 seconds for agent responses (RAG can be slow)

if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY environment variable not set');
  process.exit(1);
}

// Load baseline
const baselinePath = path.join(__dirname, '..', 'baseline.json');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║     🤖 GENERATE EXPECTED ANSWERS PER AGENT (with GPT-5)          ║');
console.log('╚══════════════════════════════════════════════════════════════════╝');
console.log('');
console.log(`Total questions: ${baseline.questions.length}`);
console.log('');

// Agent mapping based on category
const AGENT_MAP = {
  'sop-generation-compliance-documentation': 'compliance_agent',
  'regulatory-compliance': 'compliance_agent',
  'compliance': 'compliance_agent',
  'formulation': 'formulation_agent',
  'formulation-science': 'formulation_agent',
  'patent': 'patent_agent',
  'market-research': 'research_agent',
  'research': 'research_agent',
  'market-analysis': 'research_agent',
  'general': 'chat_formul8',
  'chat': 'chat_formul8'
};

// Get agent for a question
function getAgentForQuestion(question) {
  const category = question.category || 'general';
  return AGENT_MAP[category] || 'chat_formul8';
}

// Query the agent directly through the routing API
function queryAgent(question, agent) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      message: question,
      forceAgent: agent // Force routing to specific agent
    });

    const options = {
      hostname: 'chat.formul8.ai',
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      },
      timeout: AGENT_TIMEOUT
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error));
          } else {
            resolve({
              response: parsed.response,
              agent: parsed.agent || agent,
              metadata: parsed.metadata || {}
            });
          }
        } catch (e) {
          reject(new Error(`Failed to parse agent response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Agent request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Use GPT-5 to analyze the agent's response and create evaluation criteria
function generateCriteriaFromResponse(question, agentResponse, category, agent) {
  return new Promise((resolve, reject) => {
    const prompt = `You are creating evaluation criteria for assessing AI responses.

Original Question: "${question}"
Category: ${category}
Agent: ${agent}

Expected Answer from Agent (with RAG/KB):
"""
${agentResponse}
"""

Based on this expected answer, generate evaluation criteria in JSON format:
{
  "expectedKeywords": ["keyword1", "keyword2"],  // Key terms from the response
  "mustIncludeConcepts": ["concept1", "concept2"],  // Core concepts that must be present
  "qualityIndicators": ["indicator1"],  // What makes this a good answer
  "minLength": 150,  // Minimum reasonable length
  "expectedDepth": "basic|intermediate|advanced",  // Depth level of this response
  "keyPoints": ["point1", "point2"]  // Main points that should be covered
}

Extract these from the actual agent response above.`;

    const postData = JSON.stringify({
      model: 'openai/gpt-4o',  // GPT-5 on OpenRouter
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
        'X-Title': 'F8 Expected Answer Generator'
      },
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error.message || 'OpenRouter API error'));
            return;
          }
          const content = parsed.choices[0].message.content;
          const criteria = JSON.parse(content);
          resolve(criteria);
        } catch (e) {
          reject(new Error(`Failed to parse GPT-5 response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('GPT-5 request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Process a single question
async function processQuestion(question, index, total) {
  const agent = getAgentForQuestion(question);
  
  try {
    console.log(`   [${index + 1}/${total}] ${question.question.substring(0, 70)}...`);
    console.log(`      Agent: ${agent}`);
    
    // Step 1: Query the agent to get the actual response
    console.log(`      🔍 Querying ${agent}...`);
    const agentResult = await queryAgent(question.question, agent);
    
    console.log(`      ✅ Got response (${agentResult.response.length} chars)`);
    
    // Step 2: Use GPT-5 to analyze the response and create criteria
    console.log(`      🧠 Analyzing with GPT-5...`);
    const criteria = await generateCriteriaFromResponse(
      question.question,
      agentResult.response,
      question.category,
      agent
    );
    
    console.log(`      ✅ Criteria generated`);
    
    return {
      ...question,
      expectedAnswer: agentResult.response,
      expectedAgent: agent,
      evaluationCriteria: criteria,
      metadata: {
        ...question.metadata,
        generatedAt: new Date().toISOString(),
        actualAgent: agentResult.agent,
        generatedBy: 'gpt-4o'
      }
    };
    
  } catch (error) {
    console.error(`      ❌ Error: ${error.message}`);
    return {
      ...question,
      expectedAnswer: null,
      expectedAgent: agent,
      evaluationCriteria: null,
      metadata: {
        ...question.metadata,
        error: error.message,
        failedAt: new Date().toISOString()
      }
    };
  }
}

// Process questions in batches
async function processQuestions() {
  const questions = baseline.questions;
  const results = [];
  const outputPath = path.join(__dirname, '..', 'baseline-with-expected-answers.json');
  
  // Start from where we left off if file exists
  let startIndex = 0;
  if (fs.existsSync(outputPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      const completed = existing.questions.filter(q => q.expectedAnswer).length;
      if (completed > 0) {
        console.log(`\n📝 Resuming from question ${completed + 1} (${completed} already completed)\n`);
        startIndex = completed;
        results.push(...existing.questions.slice(0, completed));
      }
    } catch (e) {
      console.log('⚠️  Could not resume from previous run, starting fresh');
    }
  }
  
  for (let i = startIndex; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil((questions.length - startIndex) / BATCH_SIZE);
    
    console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (questions ${i + 1}-${Math.min(i + BATCH_SIZE, questions.length)})`);
    
    // Process batch sequentially to avoid overwhelming agents
    for (let j = 0; j < batch.length; j++) {
      const result = await processQuestion(batch[j], i + j, questions.length);
      results.push(result);
      
      // Save progress after each question
      const progressBaseline = {
        ...baseline,
        questions: [...results, ...questions.slice(results.length)],
        metadata: {
          ...baseline.metadata,
          lastUpdated: new Date().toISOString(),
          expectedAnswersGenerated: true,
          progressCount: results.length,
          totalCount: questions.length
        }
      };
      
      fs.writeFileSync(outputPath, JSON.stringify(progressBaseline, null, 2));
      
      // Small delay between questions in batch
      if (j < batch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Delay between batches
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
    const questionsWithAnswers = await processQuestions();
    
    // Create final baseline
    const updatedBaseline = {
      ...baseline,
      questions: questionsWithAnswers,
      metadata: {
        ...baseline.metadata,
        lastUpdated: new Date().toISOString(),
        expectedAnswersGenerated: true,
        expectedAnswersVersion: '1.0',
        generatedBy: 'gpt-4o',
        totalQuestions: questionsWithAnswers.length,
        successfulQuestions: questionsWithAnswers.filter(q => q.expectedAnswer).length
      }
    };
    
    // Save final file
    const outputPath = path.join(__dirname, '..', 'baseline-with-expected-answers.json');
    fs.writeFileSync(outputPath, JSON.stringify(updatedBaseline, null, 2));
    
    const successful = questionsWithAnswers.filter(q => q.expectedAnswer).length;
    const failed = questionsWithAnswers.length - successful;
    
    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║     ✅ EXPECTED ANSWERS GENERATION COMPLETE                       ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📁 Output file: ${outputPath}`);
    console.log(`📊 Questions processed: ${questionsWithAnswers.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Review the generated expected answers');
    console.log('2. Update test-baseline-e2e.spec.js to use the new criteria');
    console.log('3. Replace baseline.json with baseline-with-expected-answers.json');
    console.log('4. Run baseline tests to validate');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();

