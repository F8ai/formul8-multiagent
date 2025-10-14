#!/usr/bin/env node

/**
 * Validate Agent Configurations
 * Ensures all agent configurations are valid before deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating agent configurations...');

// Load agent configurations
const agentsDir = path.join(__dirname, '../agents');
const configDir = path.join(__dirname, '../lambda-package/config');

// Required configuration files
const requiredConfigs = [
  'agents.json',
  'plans.json',
  'microservices.json'
];

// Validate configuration files exist
console.log('📋 Checking configuration files...');
for (const config of requiredConfigs) {
  const configPath = path.join(configDir, config);
  if (fs.existsSync(configPath)) {
    console.log(`✅ Found ${config}`);
  } else {
    console.error(`❌ Missing ${config}`);
    process.exit(1);
  }
}

// Load and validate agents.json
console.log('🤖 Validating agents.json...');
const agentsConfig = JSON.parse(fs.readFileSync(path.join(configDir, 'agents.json'), 'utf8'));

if (!agentsConfig.agents) {
  console.error('❌ agents.json missing "agents" property');
  process.exit(1);
}

const agentNames = Object.keys(agentsConfig.agents);
console.log(`✅ Found ${agentNames.length} agents in configuration`);

// Validate each agent has required properties
for (const [agentKey, agent] of Object.entries(agentsConfig.agents)) {
  const requiredProps = ['name', 'description', 'type', 'url', 'keywords', 'specialties'];
  
  for (const prop of requiredProps) {
    if (!agent[prop]) {
      console.error(`❌ Agent ${agentKey} missing required property: ${prop}`);
      process.exit(1);
    }
  }
  
  console.log(`✅ Agent ${agentKey} configuration valid`);
}

// Validate agent directories exist
console.log('📁 Checking agent directories...');
for (const agentKey of agentNames) {
  const agentDir = path.join(agentsDir, agentKey);
  if (fs.existsSync(agentDir)) {
    console.log(`✅ Directory exists: ${agentKey}`);
    
    // Check for required files
    const requiredFiles = ['lambda.js', 'package.json'];
    for (const file of requiredFiles) {
      const filePath = path.join(agentDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`  ✅ Found ${file}`);
      } else {
        console.error(`  ❌ Missing ${file} in ${agentKey}`);
        process.exit(1);
      }
    }
  } else {
    console.error(`❌ Directory missing: ${agentKey}`);
    process.exit(1);
  }
}

// Validate plans.json
console.log('💳 Validating plans.json...');
const plansConfig = JSON.parse(fs.readFileSync(path.join(configDir, 'plans.json'), 'utf8'));

if (!plansConfig.plans) {
  console.error('❌ plans.json missing "plans" property');
  process.exit(1);
}

const planNames = Object.keys(plansConfig.plans);
console.log(`✅ Found ${planNames.length} plans in configuration`);

// Validate each plan has required properties
for (const [planKey, plan] of Object.entries(plansConfig.plans)) {
  const requiredProps = ['name', 'description', 'price', 'agents'];
  
  for (const prop of requiredProps) {
    if (!plan[prop]) {
      console.error(`❌ Plan ${planKey} missing required property: ${prop}`);
      process.exit(1);
    }
  }
  
  // Validate agent permissions
  if (typeof plan.agents !== 'object') {
    console.error(`❌ Plan ${planKey} agents must be an object`);
    process.exit(1);
  }
  
  console.log(`✅ Plan ${planKey} configuration valid`);
}

// Validate microservices.json
console.log('🔗 Validating microservices.json...');
const microservicesConfig = JSON.parse(fs.readFileSync(path.join(configDir, 'microservices.json'), 'utf8'));

if (!microservicesConfig.microservices) {
  console.error('❌ microservices.json missing "microservices" property');
  process.exit(1);
}

if (!microservicesConfig.microservices.services) {
  console.error('❌ microservices.json missing "services" property');
  process.exit(1);
}

const serviceNames = Object.keys(microservicesConfig.microservices.services);
console.log(`✅ Found ${serviceNames.length} services in configuration`);

// Validate each service has required properties
for (const [serviceKey, service] of Object.entries(microservicesConfig.microservices.services)) {
  const requiredProps = ['url', 'type', 'timeout', 'retries', 'healthCheck'];
  
  for (const prop of requiredProps) {
    if (service[prop] === undefined) {
      console.error(`❌ Service ${serviceKey} missing required property: ${prop}`);
      process.exit(1);
    }
  }
  
  console.log(`✅ Service ${serviceKey} configuration valid`);
}

console.log('🎉 All agent configurations are valid!');