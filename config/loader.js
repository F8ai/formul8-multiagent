const fs = require('fs');
const path = require('path');

class ConfigLoader {
  constructor() {
    this.configs = {};
    this.loadAllConfigs();
  }

  loadAllConfigs() {
    const configDir = __dirname;
    const configFiles = [
      'agents.json',
      'models.json', 
      'routing.json',
      'langchain.json',
      'microservices.json',
      'pricing-tiers.json'
    ];

    configFiles.forEach(file => {
      try {
        const configPath = path.join(configDir, file);
        const configData = fs.readFileSync(configPath, 'utf8');
        const configName = file.replace('.json', '');
        this.configs[configName] = JSON.parse(configData);
      } catch (error) {
        console.error(`Error loading config ${file}:`, error.message);
        this.configs[file.replace('.json', '')] = {};
      }
    });

    // Load tier-specific LangChain configurations
    this.loadTierConfigs();
  }

  loadTierConfigs() {
    const configDir = __dirname;
    const tiers = ['free', 'standard', 'micro', 'operator', 'enterprise', 'admin'];
    
    this.configs.langchain_tiers = {};
    
    tiers.forEach(tier => {
      try {
        const configPath = path.join(configDir, `langchain-${tier}.json`);
        const configData = fs.readFileSync(configPath, 'utf8');
        this.configs.langchain_tiers[tier] = JSON.parse(configData);
      } catch (error) {
        console.error(`Error loading tier config langchain-${tier}.json:`, error.message);
        this.configs.langchain_tiers[tier] = {};
      }
    });
  }

  get(configName) {
    return this.configs[configName] || {};
  }

  getAgent(agentId) {
    return this.configs.agents?.agents?.[agentId] || null;
  }

  getAllAgents() {
    return this.configs.agents?.agents || {};
  }

  getAgentUrls() {
    const agents = this.getAllAgents();
    const urls = {};
    
    Object.entries(agents).forEach(([id, agent]) => {
      urls[id] = agent.url;
    });
    
    return urls;
  }

  getModelConfig(modelName) {
    return this.configs.models?.models?.openrouter?.models?.[modelName] || null;
  }

  getRoutingConfig() {
    return this.configs.routing?.routing || {};
  }

  getLangChainConfig() {
    return this.configs.langchain?.langchain || {};
  }

  getLangChainTierConfig(tier) {
    return this.configs.langchain_tiers?.[tier]?.langchain || {};
  }

  getPricingTiers() {
    return this.configs.pricing_tiers?.pricing_tiers || {};
  }

  getPricingTier(tierName) {
    return this.configs.pricing_tiers?.pricing_tiers?.[tierName] || null;
  }

  getMicroserviceConfig(serviceId) {
    return this.configs.microservices?.microservices?.services?.[serviceId] || null;
  }

  getAllMicroservices() {
    return this.configs.microservices?.microservices?.services || {};
  }

  // Helper method to get agent list for routing prompt
  getAgentsList() {
    const agents = this.getAllAgents();
    return Object.entries(agents)
      .map(([id, agent]) => `- ${id}: ${agent.description}`)
      .join('\n');
  }

  // Helper method to get agent specialties for prompt
  getAgentSpecialties(agentId) {
    const agent = this.getAgent(agentId);
    if (!agent) return '';
    
    return agent.specialties
      ? agent.specialties.map(s => `- ${s}`).join('\n')
      : '';
  }

  // Helper method to validate configuration
  validate() {
    const errors = [];
    
    // Check required configs
    const requiredConfigs = ['agents', 'models', 'routing', 'langchain', 'microservices'];
    requiredConfigs.forEach(configName => {
      if (!this.configs[configName]) {
        errors.push(`Missing required config: ${configName}`);
      }
    });

    // Check agent configurations
    const agents = this.getAllAgents();
    Object.entries(agents).forEach(([id, agent]) => {
      if (!agent.name || !agent.description || !agent.url) {
        errors.push(`Invalid agent config for ${id}: missing required fields`);
      }
    });

    // Check microservice configurations
    const microservices = this.getAllMicroservices();
    Object.entries(microservices).forEach(([id, service]) => {
      if (!service.url || !service.type) {
        errors.push(`Invalid microservice config for ${id}: missing required fields`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Reload configurations (useful for development)
  reload() {
    this.configs = {};
    this.loadAllConfigs();
  }
}

module.exports = ConfigLoader;