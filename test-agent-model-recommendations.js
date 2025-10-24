#!/usr/bin/env node

/**
 * Agent Model Recommendation Script
 * Tests each agent with different models and recommends the best one
 */

const https = require('https');
const fs = require('fs');

// Models to test for each agent
const MODELS_TO_TEST = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    model: 'openai/gpt-4o',
    costPer1k: { input: 0.0025, output: 0.01 },
    strengths: ['accuracy', 'reasoning', 'compliance', 'complex tasks']
  },
  {
    id: 'gpt-oss-120b',
    name: 'Qwen 2.5 Coder 32B',
    model: 'openai/gpt-oss-120b',
    costPer1k: { input: 0.0001, output: 0.0002 },
    strengths: ['cost-effective', 'fast', 'good quality', 'coding']
  },
  {
    id: 'llama-405b',
    name: 'Llama 3.1 405B',
    model: 'meta-llama/llama-3.1-405b-instruct',
    costPer1k: { input: 0.0005, output: 0.0015 },
    strengths: ['reasoning', 'analysis', 'balance', 'open source']
  },
  {
    id: 'llama-70b',
    name: 'Llama 3.1 70B',
    model: 'meta-llama/llama-3.1-70b-instruct',
    costPer1k: { input: 0.0002, output: 0.0006 },
    strengths: ['cost-effective', 'fast', 'good reasoning']
  }
];

// Agent priorities and what matters most for each
const AGENT_PRIORITIES = {
  'compliance': {
    priority: 'accuracy',
    weights: { accuracy: 0.6, cost: 0.2, speed: 0.2 },
    description: 'Needs highest accuracy for regulatory compliance'
  },
  'operations': {
    priority: 'balance',
    weights: { accuracy: 0.4, cost: 0.3, speed: 0.3 },
    description: 'Needs practical accuracy with good cost/speed balance'
  },
  'marketing': {
    priority: 'creativity',
    weights: { accuracy: 0.5, cost: 0.3, speed: 0.2 },
    description: 'Needs creative responses with good accuracy'
  },
  'formulation': {
    priority: 'accuracy',
    weights: { accuracy: 0.6, cost: 0.2, speed: 0.2 },
    description: 'Needs scientific accuracy for recipes and dosing'
  },
  'science': {
    priority: 'accuracy',
    weights: { accuracy: 0.7, cost: 0.2, speed: 0.1 },
    description: 'Needs highest scientific accuracy'
  },
  'sourcing': {
    priority: 'cost',
    weights: { accuracy: 0.3, cost: 0.5, speed: 0.2 },
    description: 'Simpler queries, cost-effectiveness matters'
  },
  'patent': {
    priority: 'accuracy',
    weights: { accuracy: 0.6, cost: 0.2, speed: 0.2 },
    description: 'Needs accuracy for legal/patent information'
  },
  'spectra': {
    priority: 'accuracy',
    weights: { accuracy: 0.6, cost: 0.2, speed: 0.2 },
    description: 'Needs scientific accuracy for spectral analysis'
  },
  'customer_success': {
    priority: 'balance',
    weights: { accuracy: 0.4, cost: 0.3, speed: 0.3 },
    description: 'Needs helpful responses with quick turnaround'
  },
  'f8_slackbot': {
    priority: 'speed',
    weights: { accuracy: 0.3, cost: 0.3, speed: 0.4 },
    description: 'Needs fast responses for Slack interactions'
  },
  'mcr': {
    priority: 'balance',
    weights: { accuracy: 0.4, cost: 0.3, speed: 0.3 },
    description: 'Balanced needs for MCR queries'
  },
  'ad': {
    priority: 'cost',
    weights: { accuracy: 0.3, cost: 0.5, speed: 0.2 },
    description: 'High volume, cost-effectiveness critical'
  },
  'editor': {
    priority: 'balance',
    weights: { accuracy: 0.4, cost: 0.3, speed: 0.3 },
    description: 'Balanced needs for content editing'
  }
};

// Load baseline questions
let baseline;
try {
  baseline = JSON.parse(fs.readFileSync('./baseline.json', 'utf8'));
} catch (error) {
  console.error('❌ Could not load baseline.json');
  process.exit(1);
}

// Group questions by agent
const questionsByAgent = {};
baseline.forEach(q => {
  const agent = q.expectedAgent || 'f8_agent';
  if (!questionsByAgent[agent]) {
    questionsByAgent[agent] = [];
  }
  questionsByAgent[agent].push(q);
});

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  agentRecommendations: {},
  detailedResults: {}
};

// Function to make API request
function makeRequest(url, question, model) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ 
      message: question,
      model: model
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

// Simple grading function
function gradeResponse(response, expectedKeywords, expectedTopics) {
  const responseLower = response.toLowerCase();
  
  const keywordMatches = expectedKeywords.filter(kw => 
    responseLower.includes(kw.toLowerCase())
  );
  const keywordScore = (keywordMatches.length / (expectedKeywords.length || 1)) * 100;
  
  const topicMatches = expectedTopics.filter(topic =>
    responseLower.includes(topic.toLowerCase())
  );
  const topicScore = (topicMatches.length / (expectedTopics.length || 1)) * 100;
  
  return {
    score: Math.round((keywordScore * 0.6) + (topicScore * 0.4)),
    keywordScore: Math.round(keywordScore),
    topicScore: Math.round(topicScore)
  };
}

// Test a single agent with all models
async function testAgentWithModels(agentId) {
  const questions = questionsByAgent[agentId] || [];
  
  if (questions.length === 0) {
    console.log(`⚠️  No baseline questions for ${agentId}, skipping...`);
    return null;
  }
  
  // Sample up to 10 questions per agent to keep tests manageable
  const sampleQuestions = questions.slice(0, Math.min(10, questions.length));
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Testing ${agentId} (${sampleQuestions.length} questions)`);
  console.log(`Priority: ${AGENT_PRIORITIES[agentId]?.priority || 'balance'}`);
  console.log(`${AGENT_PRIORITIES[agentId]?.description || ''}`);
  console.log('='.repeat(80));
  
  const agentResults = {
    agent: agentId,
    priority: AGENT_PRIORITIES[agentId]?.priority || 'balance',
    weights: AGENT_PRIORITIES[agentId]?.weights || { accuracy: 0.33, cost: 0.33, speed: 0.33 },
    modelResults: {}
  };
  
  // Test each model
  for (const modelConfig of MODELS_TO_TEST) {
    console.log(`\n  📊 Testing ${modelConfig.name}...`);
    
    const modelScores = [];
    let totalTokens = 0;
    
    for (let i = 0; i < sampleQuestions.length; i++) {
      const q = sampleQuestions[i];
      process.stdout.write(`    [${i + 1}/${sampleQuestions.length}] `);
      
      try {
        const startTime = Date.now();
        const apiResponse = await makeRequest(
          'https://chat.formul8.ai',
          q.question,
          modelConfig.model
        );
        const responseTime = Date.now() - startTime;
        
        const grade = gradeResponse(
          apiResponse.response || '',
          q.expectedKeywords || [],
          q.expectedTopics || []
        );
        
        modelScores.push(grade.score);
        totalTokens += (apiResponse.usage?.totalTokens || 500);
        
        console.log(`✓ Score: ${grade.score}% (${responseTime}ms)`);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.log(`✗ Error: ${error.message}`);
        modelScores.push(0);
      }
    }
    
    const avgScore = Math.round(modelScores.reduce((a, b) => a + b, 0) / modelScores.length);
    const avgTokens = Math.round(totalTokens / sampleQuestions.length);
    const estimatedCost = (avgTokens / 1000) * (modelConfig.costPer1k.input + modelConfig.costPer1k.output);
    
    agentResults.modelResults[modelConfig.id] = {
      model: modelConfig.name,
      modelId: modelConfig.model,
      avgScore: avgScore,
      avgTokens: avgTokens,
      costPerQuery: estimatedCost,
      strengths: modelConfig.strengths
    };
    
    console.log(`  ✅ Average: ${avgScore}% | Tokens: ${avgTokens} | Cost: $${estimatedCost.toFixed(6)}/query`);
  }
  
  // Calculate weighted recommendation
  const weights = agentResults.weights;
  let bestModel = null;
  let bestScore = 0;
  
  Object.entries(agentResults.modelResults).forEach(([modelId, result]) => {
    // Normalize scores (0-1 range)
    const accuracyNorm = result.avgScore / 100;
    const costNorm = 1 - Math.min(result.costPerQuery / 0.01, 1); // Lower cost = higher score
    const speedNorm = 0.7; // Assume reasonable speed for all (would need actual timing data)
    
    const weightedScore = 
      (accuracyNorm * weights.accuracy) +
      (costNorm * weights.cost) +
      (speedNorm * weights.speed);
    
    if (weightedScore > bestScore) {
      bestScore = weightedScore;
      bestModel = {
        modelId: modelId,
        ...result,
        weightedScore: Math.round(weightedScore * 100)
      };
    }
  });
  
  agentResults.recommendation = bestModel;
  
  console.log(`\n  🏆 RECOMMENDED: ${bestModel.model}`);
  console.log(`     Score: ${bestModel.avgScore}% | Cost: $${bestModel.costPerQuery.toFixed(6)}/query`);
  console.log(`     Weighted Score: ${bestModel.weightedScore}%`);
  
  return agentResults;
}

// Main execution
async function runAllTests() {
  console.log('🚀 Agent Model Recommendation Analysis\n');
  console.log(`Testing ${Object.keys(questionsByAgent).length} agents with ${MODELS_TO_TEST.length} models each\n`);
  
  const agents = Object.keys(questionsByAgent).sort();
  
  for (const agentId of agents) {
    const result = await testAgentWithModels(agentId);
    if (result) {
      results.agentRecommendations[agentId] = result.recommendation;
      results.detailedResults[agentId] = result;
    }
  }
  
  // Generate summary report
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 FINAL RECOMMENDATIONS');
  console.log('='.repeat(80));
  
  let report = `# Agent Model Recommendations\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += `---\n\n`;
  report += `## Executive Summary\n\n`;
  report += `Tested ${Object.keys(results.agentRecommendations).length} agents with ${MODELS_TO_TEST.length} different models.\n\n`;
  
  // Model usage summary
  const modelUsage = {};
  Object.values(results.agentRecommendations).forEach(rec => {
    modelUsage[rec.model] = (modelUsage[rec.model] || 0) + 1;
  });
  
  report += `### Recommended Model Distribution\n\n`;
  Object.entries(modelUsage).sort((a, b) => b[1] - a[1]).forEach(([model, count]) => {
    report += `- **${model}**: ${count} agents\n`;
  });
  
  report += `\n---\n\n`;
  report += `## Individual Agent Recommendations\n\n`;
  
  Object.entries(results.agentRecommendations).sort().forEach(([agent, rec]) => {
    const agentInfo = AGENT_PRIORITIES[agent] || {};
    
    console.log(`\n${agent}:`);
    console.log(`  Model: ${rec.model} (${rec.modelId})`);
    console.log(`  Score: ${rec.avgScore}%`);
    console.log(`  Cost: $${rec.costPerQuery.toFixed(6)}/query`);
    
    report += `### ${agent}\n\n`;
    report += `**Priority:** ${agentInfo.priority || 'balance'}\n\n`;
    report += `**Recommended Model:** ${rec.model} (\`${rec.modelId}\`)\n\n`;
    report += `**Performance:**\n`;
    report += `- Average Score: ${rec.avgScore}%\n`;
    report += `- Cost per Query: $${rec.costPerQuery.toFixed(6)}\n`;
    report += `- Average Tokens: ${rec.avgTokens}\n`;
    report += `- Weighted Score: ${rec.weightedScore}%\n\n`;
    report += `**Reasoning:** ${agentInfo.description || 'Balanced performance across metrics'}\n\n`;
    report += `**Model Strengths:** ${rec.strengths.join(', ')}\n\n`;
    
    // Show comparison with other models
    const details = results.detailedResults[agent];
    if (details) {
      report += `**Other Models Tested:**\n`;
      Object.entries(details.modelResults)
        .filter(([id]) => id !== rec.modelId)
        .forEach(([id, result]) => {
          report += `- ${result.model}: ${result.avgScore}% (cost: $${result.costPerQuery.toFixed(6)})\n`;
        });
      report += `\n`;
    }
    
    report += `---\n\n`;
  });
  
  // Cost analysis
  report += `## Monthly Cost Estimates\n\n`;
  report += `Based on estimated query volumes:\n\n`;
  report += `| Agent | Model | Queries/Month | Monthly Cost |\n`;
  report += `|-------|-------|---------------|-------------|\n`;
  
  const volumeEstimates = {
    compliance: 5000,
    operations: 8000,
    marketing: 3000,
    formulation: 2000,
    science: 1500,
    sourcing: 1000,
    patent: 500,
    spectra: 500,
    customer_success: 4000,
    f8_slackbot: 10000,
    mcr: 2000,
    ad: 50000,
    editor: 1000
  };
  
  let totalMonthlyCost = 0;
  Object.entries(results.agentRecommendations).sort().forEach(([agent, rec]) => {
    const volume = volumeEstimates[agent] || 1000;
    const monthlyCost = rec.costPerQuery * volume;
    totalMonthlyCost += monthlyCost;
    
    report += `| ${agent} | ${rec.model} | ${volume.toLocaleString()} | $${monthlyCost.toFixed(2)} |\n`;
  });
  
  report += `| **TOTAL** | | | **$${totalMonthlyCost.toFixed(2)}** |\n\n`;
  
  console.log(`\n💰 Estimated Monthly Cost: $${totalMonthlyCost.toFixed(2)}`);
  
  // Save results
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  fs.writeFileSync(`agent-model-recommendations-${timestamp}.json`, JSON.stringify(results, null, 2));
  fs.writeFileSync('AGENT_MODEL_RECOMMENDATIONS.md', report);
  
  console.log(`\n✅ Results saved:`);
  console.log(`   - agent-model-recommendations-${timestamp}.json`);
  console.log(`   - AGENT_MODEL_RECOMMENDATIONS.md`);
  console.log('\n');
}

runAllTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

