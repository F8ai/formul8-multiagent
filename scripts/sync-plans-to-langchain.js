#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load plans configuration
const plansConfigPath = path.join(__dirname, '..', 'config', 'plans.json');
const plansConfig = JSON.parse(fs.readFileSync(plansConfigPath, 'utf8'));

console.log('🔄 Syncing plans.json to langchain-{plan}.json files...');

// Update each langchain-{plan}.json file based on plans.json
Object.entries(plansConfig.plans).forEach(([planKey, planData]) => {
  const langchainFile = path.join(__dirname, '..', 'config', `langchain-${planKey}.json`);
  
  try {
    // Read existing langchain config
    const langchainConfig = JSON.parse(fs.readFileSync(langchainFile, 'utf8'));
    
    // Update agent access based on plans.json
    if (langchainConfig.langchain && langchainConfig.langchain.agents) {
      // Reset all agents to false first
      Object.keys(langchainConfig.langchain.agents).forEach(agentKey => {
        langchainConfig.langchain.agents[agentKey].enabled = false;
      });
      
      // Enable agents based on plans.json
      Object.entries(planData.agents).forEach(([agentKey, enabled]) => {
        if (langchainConfig.langchain.agents[agentKey]) {
          langchainConfig.langchain.agents[agentKey].enabled = enabled;
          console.log(`  ✅ ${planKey}: ${agentKey} = ${enabled}`);
        } else {
          console.log(`  ⚠️  ${planKey}: ${agentKey} not found in langchain config`);
        }
      });
    }
    
    // Write updated langchain config
    fs.writeFileSync(langchainFile, JSON.stringify(langchainConfig, null, 2));
    console.log(`  📝 Updated ${langchainFile}`);
    
  } catch (error) {
    console.error(`  ❌ Error updating ${langchainFile}:`, error.message);
  }
});

console.log('✅ Sync completed!');
console.log('\n📋 Summary:');
console.log('- plans.json is the source of truth for agent access');
console.log('- langchain-{plan}.json files updated with agent enabled/disabled states');
console.log('- Ready to commit and push changes');