const EditorService = require('./editor-service');
const ConfigLoader = require('../config/loader');

class CommandProcessor {
  constructor() {
    this.editorService = new EditorService();
    this.config = new ConfigLoader();
  }

  // Process natural language commands for editor-agent
  async processCommand(command) {
    try {
      const parsedCommand = this.parseCommand(command);
      const result = await this.executeCommand(parsedCommand);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        command: command
      };
    }
  }

  // Parse natural language command into structured action
  parseCommand(command) {
    const lowerCommand = command.toLowerCase();
    
    // Pattern matching for different command types
    const patterns = [
      // Agent access patterns
      {
        pattern: /allow\s+(\w+)\s+to\s+use\s+(\w+)-?agent/i,
        type: 'add_agent_to_tier',
        extract: (match) => ({
          tier: match[1],
          agent: match[2] + (match[2].endsWith('agent') ? '' : '_agent')
        })
      },
      {
        pattern: /remove\s+(\w+)-?agent\s+from\s+(\w+)\s+tier/i,
        type: 'remove_agent_from_tier',
        extract: (match) => ({
          tier: match[2],
          agent: match[1] + (match[1].endsWith('agent') ? '' : '_agent')
        })
      },
      {
        pattern: /add\s+(\w+)-?agent\s+to\s+(\w+)\s+tier/i,
        type: 'add_agent_to_tier',
        extract: (match) => ({
          tier: match[2],
          agent: match[1] + (match[1].endsWith('agent') ? '' : '_agent')
        })
      },
      
      // Feature management patterns
      {
        pattern: /enable\s+(\w+)\s+for\s+(\w+)\s+tier/i,
        type: 'enable_feature_for_tier',
        extract: (match) => ({
          tier: match[2],
          feature: match[1]
        })
      },
      {
        pattern: /disable\s+(\w+)\s+for\s+(\w+)\s+tier/i,
        type: 'disable_feature_for_tier',
        extract: (match) => ({
          tier: match[2],
          feature: match[1]
        })
      },
      {
        pattern: /add\s+(\w+)\s+features?\s+to\s+(\w+)\s+tier/i,
        type: 'add_features_to_tier',
        extract: (match) => ({
          tier: match[2],
          features: match[1]
        })
      },
      
      // Model configuration patterns
      {
        pattern: /update\s+(\w+)-?agent\s+temperature\s+to\s+([\d.]+)/i,
        type: 'update_agent_temperature',
        extract: (match) => ({
          agent: match[1] + (match[1].endsWith('agent') ? '' : '_agent'),
          temperature: parseFloat(match[2])
        })
      },
      {
        pattern: /set\s+(\w+)-?agent\s+max\s+tokens?\s+to\s+(\d+)/i,
        type: 'update_agent_max_tokens',
        extract: (match) => ({
          agent: match[1] + (match[1].endsWith('agent') ? '' : '_agent'),
          maxTokens: parseInt(match[2])
        })
      },
      
      // Rate limiting patterns
      {
        pattern: /set\s+(\w+)\s+tier\s+rate\s+limit\s+to\s+(\d+)\s+requests?\s+per\s+(\w+)/i,
        type: 'update_rate_limit',
        extract: (match) => ({
          tier: match[1],
          limit: parseInt(match[2]),
          period: match[3]
        })
      },
      
      // Pricing patterns
      {
        pattern: /update\s+(\w+)\s+tier\s+price\s+to\s+\$?([\d,]+)/i,
        type: 'update_tier_price',
        extract: (match) => ({
          tier: match[1],
          price: parseInt(match[2].replace(',', ''))
        })
      }
    ];

    // Find matching pattern
    for (const pattern of patterns) {
      const match = command.match(pattern.pattern);
      if (match) {
        return {
          type: pattern.type,
          ...pattern.extract(match),
          originalCommand: command
        };
      }
    }

    throw new Error(`Could not parse command: "${command}"`);
  }

  // Execute parsed command
  async executeCommand(parsedCommand) {
    const { type, ...params } = parsedCommand;

    switch (type) {
      case 'add_agent_to_tier':
        return await this.addAgentToTier(params.tier, params.agent);
      
      case 'remove_agent_from_tier':
        return await this.removeAgentFromTier(params.tier, params.agent);
      
      case 'enable_feature_for_tier':
        return await this.enableFeatureForTier(params.tier, params.feature);
      
      case 'disable_feature_for_tier':
        return await this.disableFeatureForTier(params.tier, params.feature);
      
      case 'add_features_to_tier':
        return await this.addFeaturesToTier(params.tier, params.features);
      
      case 'update_agent_temperature':
        return await this.updateAgentTemperature(params.agent, params.temperature);
      
      case 'update_agent_max_tokens':
        return await this.updateAgentMaxTokens(params.agent, params.maxTokens);
      
      case 'update_rate_limit':
        return await this.updateRateLimit(params.tier, params.limit, params.period);
      
      case 'update_tier_price':
        return await this.updateTierPrice(params.tier, params.price);
      
      default:
        throw new Error(`Unknown command type: ${type}`);
    }
  }

  // Command implementations
  async addAgentToTier(tier, agentId) {
    try {
      // Validate agent exists
      const agent = this.config.getAgent(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      // Add agent to tier configuration
      const result = await this.editorService.addAgentToTier(tier, agentId);
      
      return {
        success: true,
        message: `Successfully added ${agent.name} to ${tier} tier`,
        changes: {
          tier: tier,
          agent: agentId,
          action: 'added'
        }
      };
    } catch (error) {
      throw new Error(`Failed to add agent to tier: ${error.message}`);
    }
  }

  async removeAgentFromTier(tier, agentId) {
    try {
      const result = await this.editorService.removeAgentFromTier(tier, agentId);
      
      return {
        success: true,
        message: `Successfully removed ${agentId} from ${tier} tier`,
        changes: {
          tier: tier,
          agent: agentId,
          action: 'removed'
        }
      };
    } catch (error) {
      throw new Error(`Failed to remove agent from tier: ${error.message}`);
    }
  }

  async enableFeatureForTier(tier, feature) {
    try {
      const filePath = `config/langchain-${tier}.json`;
      const config = this.editorService.readConfigFile(filePath);
      
      if (!config.parsed.langchain.features) {
        config.parsed.langchain.features = {};
      }
      
      config.parsed.langchain.features[feature] = true;
      
      const updatedContent = JSON.stringify(config.parsed, null, 2);
      await this.editorService.writeConfigFile(filePath, updatedContent);
      
      return {
        success: true,
        message: `Successfully enabled ${feature} for ${tier} tier`,
        changes: {
          tier: tier,
          feature: feature,
          action: 'enabled'
        }
      };
    } catch (error) {
      throw new Error(`Failed to enable feature: ${error.message}`);
    }
  }

  async disableFeatureForTier(tier, feature) {
    try {
      const filePath = `config/langchain-${tier}.json`;
      const config = this.editorService.readConfigFile(filePath);
      
      if (config.parsed.langchain.features) {
        delete config.parsed.langchain.features[feature];
      }
      
      const updatedContent = JSON.stringify(config.parsed, null, 2);
      await this.editorService.writeConfigFile(filePath, updatedContent);
      
      return {
        success: true,
        message: `Successfully disabled ${feature} for ${tier} tier`,
        changes: {
          tier: tier,
          feature: feature,
          action: 'disabled'
        }
      };
    } catch (error) {
      throw new Error(`Failed to disable feature: ${error.message}`);
    }
  }

  async updateAgentTemperature(agentId, temperature) {
    try {
      // Update temperature for all tiers that have this agent
      const tiers = ['free', 'standard', 'micro', 'operator', 'enterprise', 'admin'];
      const results = [];
      
      for (const tier of tiers) {
        try {
          const filePath = `config/langchain-${tier}.json`;
          const config = this.editorService.readConfigFile(filePath);
          
          if (config.parsed.langchain.models && config.parsed.langchain.models[agentId]) {
            config.parsed.langchain.models[agentId].temperature = temperature;
            
            const updatedContent = JSON.stringify(config.parsed, null, 2);
            await this.editorService.writeConfigFile(filePath, updatedContent);
            
            results.push(tier);
          }
        } catch (error) {
          // Tier doesn't have this agent, skip
        }
      }
      
      return {
        success: true,
        message: `Successfully updated ${agentId} temperature to ${temperature} for tiers: ${results.join(', ')}`,
        changes: {
          agent: agentId,
          temperature: temperature,
          tiers: results
        }
      };
    } catch (error) {
      throw new Error(`Failed to update agent temperature: ${error.message}`);
    }
  }

  async updateAgentMaxTokens(agentId, maxTokens) {
    try {
      const tiers = ['free', 'standard', 'micro', 'operator', 'enterprise', 'admin'];
      const results = [];
      
      for (const tier of tiers) {
        try {
          const filePath = `config/langchain-${tier}.json`;
          const config = this.editorService.readConfigFile(filePath);
          
          if (config.parsed.langchain.models && config.parsed.langchain.models[agentId]) {
            config.parsed.langchain.models[agentId].maxTokens = maxTokens;
            
            const updatedContent = JSON.stringify(config.parsed, null, 2);
            await this.editorService.writeConfigFile(filePath, updatedContent);
            
            results.push(tier);
          }
        } catch (error) {
          // Tier doesn't have this agent, skip
        }
      }
      
      return {
        success: true,
        message: `Successfully updated ${agentId} max tokens to ${maxTokens} for tiers: ${results.join(', ')}`,
        changes: {
          agent: agentId,
          maxTokens: maxTokens,
          tiers: results
        }
      };
    } catch (error) {
      throw new Error(`Failed to update agent max tokens: ${error.message}`);
    }
  }

  async updateRateLimit(tier, limit, period) {
    try {
      const filePath = `config/langchain-${tier}.json`;
      const config = this.editorService.readConfigFile(filePath);
      
      if (!config.parsed.langchain.rate_limiting) {
        config.parsed.langchain.rate_limiting = {};
      }
      
      const rateLimitKey = period === 'minute' ? 'requests_per_minute' : 'requests_per_hour';
      config.parsed.langchain.rate_limiting[rateLimitKey] = limit;
      
      const updatedContent = JSON.stringify(config.parsed, null, 2);
      await this.editorService.writeConfigFile(filePath, updatedContent);
      
      return {
        success: true,
        message: `Successfully updated ${tier} tier rate limit to ${limit} requests per ${period}`,
        changes: {
          tier: tier,
          limit: limit,
          period: period
        }
      };
    } catch (error) {
      throw new Error(`Failed to update rate limit: ${error.message}`);
    }
  }

  async updateTierPrice(tier, price) {
    try {
      const filePath = 'config/pricing-tiers.json';
      const config = this.editorService.readConfigFile(filePath);
      
      if (!config.parsed.pricing_tiers[tier]) {
        throw new Error(`Tier ${tier} not found`);
      }
      
      config.parsed.pricing_tiers[tier].price = price;
      
      const updatedContent = JSON.stringify(config.parsed, null, 2);
      await this.editorService.writeConfigFile(filePath, updatedContent);
      
      return {
        success: true,
        message: `Successfully updated ${tier} tier price to $${price}`,
        changes: {
          tier: tier,
          price: price
        }
      };
    } catch (error) {
      throw new Error(`Failed to update tier price: ${error.message}`);
    }
  }

  // Get available commands help
  getAvailableCommands() {
    return [
      {
        category: 'Agent Access',
        commands: [
          'allow {tier} to use {agent}-agent',
          'remove {agent}-agent from {tier} tier',
          'add {agent}-agent to {tier} tier'
        ]
      },
      {
        category: 'Feature Management',
        commands: [
          'enable {feature} for {tier} tier',
          'disable {feature} for {tier} tier',
          'add {features} features to {tier} tier'
        ]
      },
      {
        category: 'Model Configuration',
        commands: [
          'update {agent}-agent temperature to {value}',
          'set {agent}-agent max tokens to {value}'
        ]
      },
      {
        category: 'Rate Limiting',
        commands: [
          'set {tier} tier rate limit to {number} requests per {period}'
        ]
      },
      {
        category: 'Pricing',
        commands: [
          'update {tier} tier price to ${amount}'
        ]
      }
    ];
  }
}

module.exports = CommandProcessor;