const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ConfigLoader = require('../config/loader');

class EditorService {
  constructor() {
    this.config = new ConfigLoader();
    this.allowedPaths = [
      'config/langchain-*.json',
      'config/agents.json',
      'config/pricing-tiers.json',
      'config/routing.json',
      'config/microservices.json'
    ];
  }

  // Check if file path is allowed for editing
  isPathAllowed(filePath) {
    return this.allowedPaths.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(filePath);
      }
      return filePath === pattern;
    });
  }

  // Read configuration file
  readConfigFile(filePath) {
    if (!this.isPathAllowed(filePath)) {
      throw new Error(`File path not allowed: ${filePath}`);
    }

    try {
      const fullPath = path.resolve(filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      return {
        content: content,
        parsed: JSON.parse(content),
        path: fullPath
      };
    } catch (error) {
      throw new Error(`Error reading file ${filePath}: ${error.message}`);
    }
  }

  // Write configuration file
  writeConfigFile(filePath, content, options = {}) {
    if (!this.isPathAllowed(filePath)) {
      throw new Error(`File path not allowed: ${filePath}`);
    }

    try {
      const fullPath = path.resolve(filePath);
      
      // Create backup if enabled
      if (options.backup !== false) {
        this.createBackup(fullPath);
      }

      // Write the new content
      fs.writeFileSync(fullPath, content, 'utf8');
      
      // Validate JSON if it's a JSON file
      if (filePath.endsWith('.json')) {
        JSON.parse(content);
      }

      return {
        success: true,
        path: fullPath,
        message: `File ${filePath} updated successfully`
      };
    } catch (error) {
      throw new Error(`Error writing file ${filePath}: ${error.message}`);
    }
  }

  // Create backup of file
  createBackup(filePath) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${filePath}.backup.${timestamp}`;
      fs.copyFileSync(filePath, backupPath);
      return backupPath;
    } catch (error) {
      console.warn(`Could not create backup for ${filePath}:`, error.message);
    }
  }

  // Update agent access for a tier
  updateAgentAccess(tier, agentId, enabled) {
    const filePath = `config/langchain-${tier}.json`;
    
    try {
      const config = this.readConfigFile(filePath);
      const langchainConfig = config.parsed.langchain;
      
      if (!langchainConfig.features) {
        langchainConfig.features = {};
      }

      // Update features
      if (enabled) {
        langchainConfig.features[`${agentId}_access`] = true;
      } else {
        delete langchainConfig.features[`${agentId}_access`];
      }

      // Update models if needed
      if (enabled && !langchainConfig.models[agentId]) {
        langchainConfig.models[agentId] = {
          model: "meta-llama/llama-3.1-8b-instruct",
          temperature: 0.7,
          maxTokens: 1000,
          timeout: 30000
        };
      }

      // Update chains if needed
      if (enabled && !langchainConfig.chains[agentId]) {
        langchainConfig.chains[agentId] = {
          type: "prompt_chain",
          enabled: true,
          specialized: true
        };
      }

      // Update prompts if needed
      if (enabled && !langchainConfig.prompts[agentId]) {
        const agent = this.config.getAgent(agentId);
        if (agent) {
          langchainConfig.prompts[agentId] = {
            template: `You are the ${agent.name}, a ${agent.description} specializing in:\n${agent.specialties.map(s => `- ${s}`).join('\n')}\n\nUser question: {message}\n\nProvide detailed guidance:`,
            inputVariables: ["message"]
          };
        }
      }

      // Write updated config
      const updatedContent = JSON.stringify(config.parsed, null, 2);
      return this.writeConfigFile(filePath, updatedContent);
    } catch (error) {
      throw new Error(`Error updating agent access: ${error.message}`);
    }
  }

  // Update pricing tier configuration
  updatePricingTier(tierName, updates) {
    const filePath = 'config/pricing-tiers.json';
    
    try {
      const config = this.readConfigFile(filePath);
      const pricingTiers = config.parsed.pricing_tiers;
      
      if (!pricingTiers[tierName]) {
        throw new Error(`Tier ${tierName} not found`);
      }

      // Update tier configuration
      Object.assign(pricingTiers[tierName], updates);

      // Write updated config
      const updatedContent = JSON.stringify(config.parsed, null, 2);
      return this.writeConfigFile(filePath, updatedContent);
    } catch (error) {
      throw new Error(`Error updating pricing tier: ${error.message}`);
    }
  }

  // Add agent to tier
  addAgentToTier(tier, agentId) {
    return this.updateAgentAccess(tier, agentId, true);
  }

  // Remove agent from tier
  removeAgentFromTier(tier, agentId) {
    return this.updateAgentAccess(tier, agentId, false);
  }

  // Create Git commit for changes
  createGitCommit(message, files) {
    try {
      // Add files to git
      files.forEach(file => {
        execSync(`git add ${file}`, { stdio: 'pipe' });
      });

      // Create commit
      execSync(`git commit -m "${message}"`, { stdio: 'pipe' });

      return {
        success: true,
        message: 'Git commit created successfully',
        files: files
      };
    } catch (error) {
      throw new Error(`Error creating git commit: ${error.message}`);
    }
  }

  // Create pull request
  createPullRequest(title, description, branchName) {
    try {
      // Create new branch
      execSync(`git checkout -b ${branchName}`, { stdio: 'pipe' });

      // Push branch
      execSync(`git push origin ${branchName}`, { stdio: 'pipe' });

      // Create pull request (this would use GitHub API in real implementation)
      const prData = {
        title: title,
        body: description,
        head: branchName,
        base: 'main'
      };

      return {
        success: true,
        message: 'Pull request created successfully',
        branch: branchName,
        prData: prData
      };
    } catch (error) {
      throw new Error(`Error creating pull request: ${error.message}`);
    }
  }

  // Get file diff
  getFileDiff(filePath) {
    try {
      const diff = execSync(`git diff ${filePath}`, { encoding: 'utf8' });
      return diff;
    } catch (error) {
      return 'No changes detected';
    }
  }

  // Validate configuration
  validateConfig(filePath) {
    try {
      const config = this.readConfigFile(filePath);
      
      // Basic JSON validation
      JSON.parse(config.content);
      
      // Additional validation based on file type
      if (filePath.includes('langchain-')) {
        this.validateLangChainConfig(config.parsed);
      } else if (filePath.includes('pricing-tiers')) {
        this.validatePricingConfig(config.parsed);
      }

      return {
        valid: true,
        message: 'Configuration is valid'
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message
      };
    }
  }

  validateLangChainConfig(config) {
    const requiredFields = ['tier', 'version', 'providers', 'models', 'chains'];
    const missingFields = requiredFields.filter(field => !config.langchain[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  validatePricingConfig(config) {
    if (!config.pricing_tiers) {
      throw new Error('Missing pricing_tiers section');
    }
  }

  // Get configuration summary
  getConfigSummary() {
    const summary = {};
    
    this.allowedPaths.forEach(pattern => {
      if (pattern.includes('langchain-')) {
        const files = fs.readdirSync('config').filter(f => f.startsWith('langchain-') && f.endsWith('.json'));
        files.forEach(file => {
          const tier = file.replace('langchain-', '').replace('.json', '');
          try {
            const config = this.readConfigFile(`config/${file}`);
            summary[tier] = {
              agents: Object.keys(config.parsed.langchain.models || {}),
              features: Object.keys(config.parsed.langchain.features || {}),
              lastModified: fs.statSync(`config/${file}`).mtime
            };
          } catch (error) {
            summary[tier] = { error: error.message };
          }
        });
      }
    });

    return summary;
  }
}

module.exports = EditorService;