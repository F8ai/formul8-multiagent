#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of agent directories to update
const agentDirs = [
  'ad-agent',
  'compliance-agent', 
  'customer-success-agent',
  'editor-agent',
  'f8-slackbot',
  'formulation-agent',
  'marketing-agent',
  'mcr-agent',
  'patent-agent',
  'science-agent',
  'sourcing-agent',
  'spectra-agent'
];

// Function to update a single agent file
function updateAgentFile(agentPath) {
  try {
    const filePath = path.join(agentPath, 'lambda.js');
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Update the OpenRouter API call to include reasoning configuration
    const oldApiCall = `        body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })`;
    
    const newApiCall = `        body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        reasoning: {
          effort: "medium",
          exclude: false
        }
      })`;
    
    if (content.includes(oldApiCall)) {
      content = content.replace(oldApiCall, newApiCall);
      console.log(`✅ Updated API call in ${agentPath}`);
    } else {
      console.log(`⚠️  API call pattern not found in ${agentPath}`);
    }
    
    // Update response handling to preserve reasoning_details
    const oldResponseHandling = `    const aiData = await openRouterResponse.json();
    const aiResponse = aiData.choices?.[0]?.message?.content || 'I apologize, but I couldn\\'t generate a response. Please try again.';
    
    // Extract usage information`;
    
    const newResponseHandling = `    const aiData = await openRouterResponse.json();
    const message = aiData.choices?.[0]?.message;
    const aiResponse = message?.content || 'I apologize, but I couldn\\'t generate a response. Please try again.';
    const reasoningDetails = message?.reasoning_details || [];
    
    // Extract usage information`;
    
    if (content.includes(oldResponseHandling)) {
      content = content.replace(oldResponseHandling, newResponseHandling);
      console.log(`✅ Updated response handling in ${agentPath}`);
    } else {
      console.log(`⚠️  Response handling pattern not found in ${agentPath}`);
    }
    
    // Update the response JSON to include reasoning_details
    const oldResponseJson = `    res.json({
      success: true,
      response: aiResponse + footer,`;
    
    const newResponseJson = `    res.json({
      success: true,
      response: aiResponse + footer,
      reasoning_details: reasoningDetails,`;
    
    if (content.includes(oldResponseJson)) {
      content = content.replace(oldResponseJson, newResponseJson);
      console.log(`✅ Updated response JSON in ${agentPath}`);
    } else {
      console.log(`⚠️  Response JSON pattern not found in ${agentPath}`);
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Successfully updated ${agentPath}/lambda.js`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error updating ${agentPath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🚀 Starting reasoning tokens update for all agents...\n');

let successCount = 0;
let totalCount = agentDirs.length;

agentDirs.forEach(agentDir => {
  const agentPath = path.join('agents', agentDir);
  console.log(`\n📁 Processing ${agentDir}...`);
  
  if (updateAgentFile(agentPath)) {
    successCount++;
  }
});

console.log(`\n🎉 Update complete! ${successCount}/${totalCount} agents updated successfully.`);

if (successCount < totalCount) {
  console.log('\n⚠️  Some agents may need manual review. Check the logs above for details.');
}




