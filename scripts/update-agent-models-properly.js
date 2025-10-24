#!/usr/bin/env node

/**
 * Script to properly update all agent lambda.js files
 * to support dynamic model parameter
 */

const fs = require('fs');
const path = require('path');

const AGENTS = [
  'compliance-agent',
  'operations-agent',
  'marketing-agent',
  'formulation-agent',
  'science-agent',
  'sourcing-agent',
  'patent-agent',
  'spectra-agent',
  'customer-success-agent',
  'f8-slackbot',
  'mcr-agent',
  'ad-agent',
  'editor-agent'
];

console.log('🔧 Updating all agent lambda.js files...\n');

AGENTS.forEach(agentName => {
  const agentPath = path.join(__dirname, '..', 'agents', agentName, 'lambda.js');
  
  if (!fs.existsSync(agentPath)) {
    console.log(`⚠️  Skipping ${agentName} - lambda.js not found`);
    return;
  }
  
  console.log(`📝 Updating ${agentName}...`);
  
  let content = fs.readFileSync(agentPath, 'utf8');
  let modified = false;
  
  // 1. Add model and usePromptEngineering to request parsing
  const oldParse1 = `const { message, plan = 'standard', username = 'anonymous' } = req.body;`;
  const newParse1 = `const { message, plan = 'standard', username = 'anonymous', model: requestModel, usePromptEngineering = true } = req.body;`;
  
  if (content.includes(oldParse1) && !content.includes('model: requestModel')) {
    content = content.replace(oldParse1, newParse1);
    modified = true;
  }
  
  // 2. Add selectedModel variable after message validation
  if (!content.includes('const selectedModel = requestModel')) {
    // Find the position right after the message validation
    const messageCheckPattern = /if \(!message\) \{[\s\S]*?\}\s*\n/;
    const match = content.match(messageCheckPattern);
    if (match) {
      const insertAfter = match[0];
      const replacement = insertAfter + `    \n    // Use requested model or fall back to default\n    const selectedModel = requestModel || 'openai/gpt-oss-120b';\n`;
      content = content.replace(insertAfter, replacement);
      modified = true;
    }
  }
  
  // 3. Replace hardcoded model with selectedModel in API call
  content = content.replace(
    /model: ['"]openai\/gpt-oss-120b['"],/g,
    'model: selectedModel,'
  );
  
  // 4. Update response to include model info
  if (!content.includes('usePromptEngineering:')) {
    // Find the response object and add fields
    const responsePattern = /(return res\.status\(200\)\.json\(\{[\s\S]*?model: [^,]+,)/;
    const match = content.match(responsePattern);
    if (match) {
      const original = match[1];
      const replacement = original + '\n      usePromptEngineering: usePromptEngineering,';
      content = content.replace(original, replacement);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(agentPath, content, 'utf8');
    console.log(`   ✅ Updated successfully`);
  } else {
    console.log(`   ℹ️  No changes needed (already up to date)`);
  }
});

console.log('\n✅ All agents processed!');

