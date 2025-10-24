#!/usr/bin/env node

/**
 * Apply model recommendations to agent lambda.js files
 * Updates the default model based on recommendation results
 */

const fs = require('fs');
const path = require('path');

// Check for recommendations file
const recommendationsFile = process.argv[2] || 'AGENT_MODEL_RECOMMENDATIONS.json';

if (!fs.existsSync(recommendationsFile)) {
  console.error(`❌ Recommendations file not found: ${recommendationsFile}`);
  console.error('Run test-agent-model-recommendations.js first to generate recommendations');
  process.exit(1);
}

const recommendations = JSON.parse(fs.readFileSync(recommendationsFile, 'utf8'));

console.log('🔧 Applying model recommendations to agent files\n');

Object.entries(recommendations.agentRecommendations).forEach(([agentId, rec]) => {
  const agentPath = path.join(__dirname, '..', 'agents', `${agentId}-agent`, 'lambda.js');
  
  // Handle special cases
  const agentDir = agentId === 'f8_slackbot' ? 'f8-slackbot' : 
                   agentId === 'mcr' ? 'mcr-agent' :
                   agentId === 'ad' ? 'ad-agent' :
                   agentId === 'editor' ? 'editor-agent' :
                   `${agentId}-agent`;
  
  const fullPath = path.join(__dirname, '..', 'agents', agentDir, 'lambda.js');
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${agentId} - lambda.js not found at ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace the default model
  const oldDefault = `const selectedModel = requestModel || 'openai/gpt-oss-120b';`;
  const newDefault = `const selectedModel = requestModel || '${rec.modelId}';`;
  
  if (content.includes(oldDefault)) {
    content = content.replace(oldDefault, newDefault);
    fs.writeFileSync(fullPath, content, 'utf8');
    
    console.log(`✅ ${agentId}: ${rec.model}`);
    console.log(`   Model: ${rec.modelId}`);
    console.log(`   Score: ${rec.avgScore}% | Cost: $${rec.costPerQuery.toFixed(6)}/query\n`);
  } else {
    console.log(`⚠️  ${agentId}: Pattern not found, may already be updated\n`);
  }
});

console.log('✅ All agent defaults updated!');
console.log('\nNext steps:');
console.log('1. Review changes: git diff');
console.log('2. Test the changes locally');
console.log('3. Commit: git add -A && git commit -m "feat: Apply model recommendations to agents"');
console.log('4. Deploy agents to production');

