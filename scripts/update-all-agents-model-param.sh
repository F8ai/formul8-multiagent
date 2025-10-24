#!/bin/bash

# Script to update all agent lambda.js files to support model parameter

AGENTS=(
  "compliance-agent"
  "operations-agent"
  "marketing-agent"
  "formulation-agent"
  "science-agent"
  "sourcing-agent"
  "patent-agent"
  "spectra-agent"
  "customer-success-agent"
  "f8-slackbot"
  "mcr-agent"
  "ad-agent"
  "editor-agent"
)

echo "🔧 Updating all agent lambda.js files to support model parameter..."
echo ""

for agent in "${AGENTS[@]}"; do
  AGENT_PATH="agents/${agent}/lambda.js"
  
  if [ ! -f "$AGENT_PATH" ]; then
    echo "⚠️  Skipping ${agent} - lambda.js not found"
    continue
  fi
  
  echo "📝 Updating ${agent}..."
  
  # Create a temporary Node.js script to do the replacements
  cat > /tmp/update_agent.js << 'NODEJS'
const fs = require('fs');
const agentPath = process.argv[2];

let content = fs.readFileSync(agentPath, 'utf8');

// Replacement 1: Parse model and usePromptEngineering from request
const oldParse = "    const { message } = JSON.parse(event.body || '{}');";
const newParse = `    // Parse message and optional model parameter from request body
    const { message, model: requestModel, usePromptEngineering = true } = JSON.parse(event.body || '{}');`;

if (content.includes(oldParse)) {
  content = content.replace(oldParse, newParse);
}

// Replacement 2: Add selectedModel variable
const oldMessageCheck = `    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }`;

const newMessageCheck = `    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Use requested model or fall back to default
    const selectedModel = requestModel || 'openai/gpt-oss-120b';`;

if (content.includes(oldMessageCheck)) {
  content = content.replace(oldMessageCheck, newMessageCheck);
}

// Replacement 3: Update model in API call
content = content.replace(
  /model: ['"]openai\/gpt-oss-120b['"]/g,
  'model: selectedModel'
);

// Replacement 4: Add model to response (if not already there)
if (!content.includes('model: aiData.model')) {
  content = content.replace(
    /model: ['"]openai\/gpt-oss-120b['"]/g,
    'model: aiData.model || selectedModel'
  );
}

// Replacement 5: Add usePromptEngineering to response
if (!content.includes('usePromptEngineering:')) {
  const oldResponse = `      timestamp: new Date().toISOString()
    });`;
  
  const newResponse = `      usePromptEngineering: usePromptEngineering,
      timestamp: new Date().toISOString()
    });`;
  
  if (content.includes(oldResponse)) {
    content = content.replace(oldResponse, newResponse);
  }
}

// Replacement 6: Update system prompt to support raw mode
const systemPromptPattern = /const systemPrompt = `[^`]+`;/s;
if (systemPromptPattern.test(content)) {
  content = content.replace(
    systemPromptPattern,
    `let systemPrompt;
    if (usePromptEngineering) {
      systemPrompt = \`You are a specialized cannabis industry AI assistant. Provide helpful, accurate, and professional responses.\`;
    } else {
      // Raw mode: minimal prompt engineering
      systemPrompt = \`You are a helpful AI assistant specializing in the cannabis industry.\`;
    }`
  );
}

fs.writeFileSync(agentPath, content, 'utf8');
console.log('✅ Updated successfully');
NODEJS

  node /tmp/update_agent.js "$AGENT_PATH"
  
done

rm /tmp/update_agent.js

echo ""
echo "✅ All agent lambda.js files updated!"
echo ""
echo "Changes made:"
echo "  - Added model parameter parsing from request body"
echo "  - Added usePromptEngineering parameter for raw vs engineered prompts"
echo "  - Updated OpenRouter API call to use dynamic model"
echo "  - Added model and usePromptEngineering to response"
echo ""
echo "Test with:"
echo '  curl -X POST https://your-agent.com/api/chat -H "Content-Type: application/json" \'
echo '       -d {"message": "test", "model": "openai/gpt-4o", "usePromptEngineering": false}'

