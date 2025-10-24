#!/usr/bin/env node

/**
 * Model Comparison Test Script
 * Runs baseline tests against different models and generates comparative reports
 */

const https = require('https');
const fs = require('fs');

// Test configuration
const MODEL_CONFIGS = {
  'gpt-4o': {
    name: 'GPT-4o',
    model: 'openai/gpt-4o',
    usePromptEngineering: true,
    description: 'OpenAI GPT-4o with full prompt engineering'
  },
  'gpt-4o-raw': {
    name: 'GPT-4o (Raw)',
    model: 'openai/gpt-4o',
    usePromptEngineering: false,
    description: 'OpenAI GPT-4o without prompt engineering'
  },
  'gpt-oss-120b': {
    name: 'GPT-OSS-120B (Qwen 2.5 Coder 32B)',
    model: 'openai/gpt-oss-120b',
    usePromptEngineering: true,
    description: 'Current production model (Qwen 2.5 Coder 32B Instruct)'
  },
  'llama-405b': {
    name: 'Llama 3.1 405B',
    model: 'meta-llama/llama-3.1-405b-instruct',
    usePromptEngineering: true,
    description: 'Meta\'s largest Llama model'
  },
  'voiceflow': {
    name: 'Voiceflow (Legacy)',
    model: null,
    useVoiceflow: true,
    description: 'Previous Voiceflow-based system'
  }
};

// Get model to test from command line argument
const modelKey = process.argv[2] || 'gpt-oss-120b';
const config = MODEL_CONFIGS[modelKey];

if (!config) {
  console.error(`❌ Unknown model: ${modelKey}`);
  console.error(`Available models: ${Object.keys(MODEL_CONFIGS).join(', ')}`);
  process.exit(1);
}

console.log(`\n🧪 Testing Model: ${config.name}`);
console.log(`📝 Description: ${config.description}`);
console.log(`🔧 Prompt Engineering: ${config.usePromptEngineering ? 'Enabled' : 'Disabled'}`);
console.log('='.repeat(80));

// Load baseline questions
const baselineQuestions = require('./baseline.json');

// Test results
const results = {
  model: config.name,
  modelKey: modelKey,
  timestamp: new Date().toISOString(),
  totalQuestions: 0,
  responses: [],
  summary: {}
};

// Function to make API request to chat.formul8.ai
function makeRequest(url, question, model, usePromptEngineering) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ 
      message: question,
      model: model,
      usePromptEngineering: usePromptEngineering
    });
    
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
      timeout: 90000 // 90 second timeout for slower models
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${data.substring(0, 100)}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Function to make Voiceflow API request
function makeVoiceflowRequest(question) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      action: {
        type: 'text',
        payload: question
      },
      config: {
        tts: false,
        stripSSML: true
      }
    });

    const options = {
      hostname: 'general-runtime.voiceflow.com',
      path: '/state/user/test-user/interact',
      method: 'POST',
      headers: {
        'Authorization': process.env.VOICEFLOW_API_KEY || '',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 60000
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          // Extract text from Voiceflow response
          const textResponse = jsonData
            .filter(item => item.type === 'text')
            .map(item => item.payload.message)
            .join(' ');
          
          resolve({
            response: textResponse,
            agent: 'voiceflow',
            model: 'voiceflow-legacy'
          });
        } catch (error) {
          reject(new Error(`Invalid Voiceflow response: ${data.substring(0, 100)}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Simple keyword matching for grading
function gradeResponse(response, expectedKeywords, expectedTopics, expectedAgent, actualAgent) {
  const responseLower = response.toLowerCase();
  
  // Keyword matching
  const keywordMatches = expectedKeywords.filter(kw => 
    responseLower.includes(kw.toLowerCase())
  );
  const keywordScore = (keywordMatches.length / expectedKeywords.length) * 100;
  
  // Topic coverage
  const topicMatches = expectedTopics.filter(topic =>
    responseLower.includes(topic.toLowerCase())
  );
  const topicScore = (topicMatches.length / expectedTopics.length) * 100;
  
  // Routing accuracy
  const routingScore = (actualAgent === expectedAgent) ? 100 : 0;
  
  // Overall grade (weighted average)
  const overallScore = (keywordScore * 0.4) + (topicScore * 0.3) + (routingScore * 0.3);
  
  return {
    overallScore: Math.round(overallScore),
    keywordScore: Math.round(keywordScore),
    topicScore: Math.round(topicScore),
    routingScore: Math.round(routingScore),
    keywordMatches,
    topicMatches
  };
}

// Main test function
async function runTests() {
  const testUrl = 'https://chat.formul8.ai';
  
  results.totalQuestions = baselineQuestions.length;
  
  console.log(`\n📊 Running ${results.totalQuestions} baseline questions...\n`);
  
  for (let i = 0; i < baselineQuestions.length; i++) {
    const q = baselineQuestions[i];
    const questionNum = i + 1;
    
    process.stdout.write(`[${questionNum}/${results.totalQuestions}] Testing: "${q.question.substring(0, 50)}..." `);
    
    try {
      let apiResponse;
      
      if (config.useVoiceflow) {
        apiResponse = await makeVoiceflowRequest(q.question);
      } else {
        apiResponse = await makeRequest(
          testUrl, 
          q.question, 
          config.model,
          config.usePromptEngineering
        );
      }
      
      const grade = gradeResponse(
        apiResponse.response || '',
        q.expectedKeywords || [],
        q.expectedTopics || [],
        q.expectedAgent || 'f8_agent',
        apiResponse.agent || 'unknown'
      );
      
      results.responses.push({
        question: q.question,
        expectedAgent: q.expectedAgent,
        actualAgent: apiResponse.agent,
        response: apiResponse.response,
        grade: grade,
        category: q.category
      });
      
      console.log(`✓ Score: ${grade.overallScore}% (Routing: ${grade.routingScore}%)`);
      
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
      results.responses.push({
        question: q.question,
        expectedAgent: q.expectedAgent,
        error: error.message,
        grade: { overallScore: 0 }
      });
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Calculate summary statistics
  const scores = results.responses.map(r => r.grade.overallScore);
  const routingScores = results.responses.map(r => r.grade?.routingScore || 0);
  
  results.summary = {
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    routingAccuracy: Math.round(routingScores.reduce((a, b) => a + b, 0) / routingScores.length),
    highScores: scores.filter(s => s >= 80).length,
    mediumScores: scores.filter(s => s >= 50 && s < 80).length,
    lowScores: scores.filter(s => s < 50).length,
    errors: results.responses.filter(r => r.error).length
  };
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Results for ${config.name}:`);
  console.log(`   Average Score: ${results.summary.averageScore}%`);
  console.log(`   Routing Accuracy: ${results.summary.routingAccuracy}%`);
  console.log(`   High Scores (≥80%): ${results.summary.highScores}`);
  console.log(`   Medium Scores (50-79%): ${results.summary.mediumScores}`);
  console.log(`   Low Scores (<50%): ${results.summary.lowScores}`);
  console.log(`   Errors: ${results.summary.errors}`);
  
  // Save results to file
  const filename = `model-comparison-${modelKey}-${new Date().toISOString().replace(/:/g, '-')}.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${filename}\n`);
  
  return results;
}

// Run the tests
runTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

