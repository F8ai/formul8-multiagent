const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const ConfigLoader = require('../config/loader');
const CommandProcessor = require('./command-processor');

class LangChainService {
  constructor() {
    this.config = new ConfigLoader();
    this.commandProcessor = new CommandProcessor();
    this.llm = null;
    this.routingChain = null;
    this.agentChains = {};
    this.initialize();
  }

  initialize() {
    try {
      // Initialize LLM with configuration
      const langchainConfig = this.config.getLangChainConfig();
      const openrouterConfig = langchainConfig.providers?.openrouter;
      
      // Check for API key in environment first, then config
      const apiKey = process.env.OPENROUTER_API_KEY || openrouterConfig?.apiKey;
      if (!apiKey || apiKey.includes('${')) {
        console.error('❌ OPENROUTER_API_KEY not found in environment variables');
        throw new Error('OpenRouter API key not found. Set OPENROUTER_API_KEY environment variable.');
      }

      // Get routing model from config
      const routingConfig = this.config.getRoutingConfig();
      const routingModel = routingConfig.routing?.strategies?.langchain_semantic?.model || 'meta-llama/llama-3.1-405b-instruct';
      
      this.llm = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: routingModel,
        temperature: 0.1,
        maxTokens: 20,
        configuration: {
          baseURL: openrouterConfig?.baseURL || 'https://openrouter.ai/api/v1',
          defaultHeaders: openrouterConfig?.defaultHeaders || {
            'HTTP-Referer': 'https://f8.syzygyx.com',
            'X-Title': 'Formul8 Multiagent Chat'
          }
        }
      });

      // Initialize routing chain
      this.initializeRoutingChain();
      
      // Initialize agent chains
      this.initializeAgentChains();

      console.log('✅ LangChain service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing LangChain service:', error);
      throw error;
    }
  }

  initializeRoutingChain() {
    const routingConfig = this.config.getRoutingConfig();
    const langchainConfig = this.config.getLangChainConfig();
    
    const routingModel = this.llm;
    const routingPrompt = PromptTemplate.fromTemplate(
      langchainConfig.prompts?.routing?.template || 
      'You are an intelligent agent router for the Formul8 cannabis industry AI system. Your job is to analyze user messages and route them to the most appropriate specialized agent.\n\nAvailable agents:\n{agents_list}\n\nUser message: {message}\n\nAnalyze the message and respond with ONLY the agent name from the list above.\nDo not include any other text or explanation.'
    );

    this.routingChain = routingPrompt
      .pipe(routingModel)
      .pipe(new StringOutputParser());
  }

  initializeAgentChains() {
    const langchainConfig = this.config.getLangChainConfig();
    const agents = this.config.getAllAgents();

    Object.entries(agents).forEach(([agentId, agent]) => {
      if (agent.type === 'main') {
        // Main agent uses direct LLM calls
        this.agentChains[agentId] = this.llm;
      } else {
        // Microservice agents use custom prompts
        const agentPrompt = PromptTemplate.fromTemplate(
          langchainConfig.prompts?.agent_system?.template ||
          'You are the {agent_name}, a {agent_description} specializing in:\n{agent_specialties}\n\nProvide helpful, accurate, and professional responses about cannabis industry topics.\n\nUser question: {message}\n\nProvide a comprehensive response:'
        );

        this.agentChains[agentId] = agentPrompt
          .pipe(this.llm)
          .pipe(new StringOutputParser());
      }
    });
  }

  async routeToAgent(message) {
    try {
      const routingConfig = this.config.getRoutingConfig();
      const routingPrompt = routingConfig.routing?.prompts?.routing_prompt || '';
      const model = routingConfig.routing?.strategies?.langchain_semantic?.model || 'meta-llama/llama-3.1-405b-instruct';
      
      // Call OpenRouter directly
      const prompt = routingPrompt.replace('{message}', message);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://f8.syzygyx.com',
          'X-Title': 'Formul8 Multiagent Chat'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 20,
          temperature: 0.1,
          reasoning: {
            effort: "low",
            exclude: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.choices?.[0]?.message?.content || '';

      // Clean up the result and validate
      let agentId = result.trim().toLowerCase();
      
      // Remove common prefixes/suffixes that might appear in responses
      agentId = agentId.replace(/^(the|agent|route to|use)\s+/i, '');
      agentId = agentId.replace(/\s+(agent|is|will|should|can)$/i, '');
      agentId = agentId.split(/[,\s\.]/)[0]; // Take first word
      
      const validAgents = Object.keys(this.config.getAllAgents());
      
      // Also check for agent name variations
      const agentNameMap = {
        'compliance_agent': 'compliance',
        'formulation_agent': 'formulation',
        'operations_agent': 'operations',
        'marketing_agent': 'marketing',
        'sourcing_agent': 'sourcing',
        'patent_agent': 'patent',
        'spectra_agent': 'spectra',
        'customer_success_agent': 'customer_success',
        'ad_agent': 'ad',
        'mcr_agent': 'mcr',
        'science': 'formulation', // Map science to formulation
        'science_agent': 'formulation'
      };
      
      // Check if it's a mapped name
      if (agentNameMap[agentId]) {
        agentId = agentNameMap[agentId];
      }
      
      if (validAgents.includes(agentId) && agentId !== 'f8_agent') {
        console.log(`🧠 LangChain routed to: ${agentId}`);
        return agentId;
      } else {
        console.log(`⚠️ Invalid agent from LangChain: "${result}" -> "${agentId}", using fallback`);
        return this.fallbackRouting(message);
      }
    } catch (error) {
      console.error('LangChain routing error:', error.message);
      return this.fallbackRouting(message);
    }
  }

  fallbackRouting(message) {
    const agents = this.config.getAllAgents();
    const lower = message.toLowerCase();
    
    // Simple keyword matching fallback
    for (const [agentId, agent] of Object.entries(agents)) {
      if (agent.keywords && agent.keywords.some(keyword => lower.includes(keyword))) {
        console.log(`🔍 Fallback routing to: ${agentId}`);
        return agentId;
      }
    }
    
    console.log(`🔍 Fallback routing to: f8_agent`);
    return 'f8_agent';
  }

  async getAgentResponse(agentId, message) {
    try {
      const agent = this.config.getAgent(agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      // Special handling for editor-agent commands
      if (agentId === 'editor_agent') {
        return await this.handleEditorCommand(message);
      }

      if (agent.type === 'main') {
        // Use direct LLM call for main agent
        const response = await this.llm.invoke(message);
        return response.content;
      } else {
        // Use agent-specific chain for microservices
        const chain = this.agentChains[agentId];
        if (!chain) {
          throw new Error(`Chain not found for agent: ${agentId}`);
        }

        const agentSpecialties = this.config.getAgentSpecialties(agentId);
        const response = await chain.invoke({
          agent_name: agent.name,
          agent_description: agent.description,
          agent_specialties: agentSpecialties,
          message: message
        });

        return response;
      }
    } catch (error) {
      console.error(`Error getting response from ${agentId}:`, error);
      throw error;
    }
  }

  // Handle editor-agent commands
  async handleEditorCommand(message) {
    try {
      // First, try to process as a direct command
      const commandResult = await this.commandProcessor.processCommand(message);
      
      if (commandResult.success) {
        return `✅ Command executed successfully!\n\n${commandResult.message}\n\nChanges made:\n${JSON.stringify(commandResult.changes, null, 2)}`;
      } else {
        // If not a direct command, use LLM to generate response
        const chain = this.agentChains['editor_agent'];
        if (chain) {
          const response = await chain.invoke({
            agent_name: 'Editor Agent',
            agent_description: 'Content editing and document management specialist',
            agent_specialties: 'Document editing, system configuration, agent management',
            message: message
          });
          return response;
        } else {
          return `❌ Error processing command: ${commandResult.error}`;
        }
      }
    } catch (error) {
      console.error('Error handling editor command:', error);
      return `❌ Error processing editor command: ${error.message}`;
    }
  }

  async callMicroservice(agentId, message) {
    try {
      const microserviceConfig = this.config.getMicroserviceConfig(agentId);
      if (!microserviceConfig) {
        throw new Error(`Microservice config not found for: ${agentId}`);
      }

      const response = await fetch(`${microserviceConfig.url}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Formul8-Multiagent-Router/1.0'
        },
        body: JSON.stringify({
          message: message,
          agent: agentId
        }),
        signal: AbortSignal.timeout(microserviceConfig.timeout || 30000)
      });

      if (!response.ok) {
        throw new Error(`Microservice ${agentId} returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.response;
      } else {
        throw new Error(`Microservice ${agentId} error: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error calling microservice ${agentId}:`, error);
      throw error;
    }
  }

  // Health check for all microservices
  async checkMicroserviceHealth(agentId) {
    try {
      const microserviceConfig = this.config.getMicroserviceConfig(agentId);
      if (!microserviceConfig) {
        return { status: 'error', message: 'Config not found' };
      }

      const response = await fetch(`${microserviceConfig.url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        statusCode: response.status,
        url: microserviceConfig.url
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
        url: microserviceConfig?.url || 'unknown'
      };
    }
  }

  // Get all microservice health status
  async getAllMicroserviceHealth() {
    const agents = this.config.getAllAgents();
    const healthChecks = [];

    for (const [agentId, agent] of Object.entries(agents)) {
      if (agent.type === 'microservice') {
        const health = await this.checkMicroserviceHealth(agentId);
        healthChecks.push({
          name: agentId,
          ...health,
          type: 'microservice'
        });
      } else {
        healthChecks.push({
          name: agentId,
          status: 'healthy',
          type: 'lambda',
          url: agent.url
        });
      }
    }

    return healthChecks;
  }

  // Validate configuration
  validateConfig() {
    return this.config.validate();
  }

  // Get configuration summary
  getConfigSummary() {
    const agents = this.config.getAllAgents();
    const microservices = this.config.getAllMicroservices();
    const routingConfig = this.config.getRoutingConfig();
    const langchainConfig = this.config.getLangChainConfig();

    return {
      agents: {
        total: Object.keys(agents).length,
        main: Object.values(agents).filter(a => a.type === 'main').length,
        microservices: Object.values(agents).filter(a => a.type === 'microservice').length
      },
      microservices: {
        total: Object.keys(microservices).length,
        configured: Object.keys(microservices).length
      },
      routing: {
        strategy: routingConfig.strategy,
        fallback: routingConfig.fallback,
        timeout: routingConfig.timeout
      },
      langchain: {
        version: langchainConfig.version,
        providers: Object.keys(langchainConfig.providers || {}),
        chains: Object.keys(langchainConfig.chains || {})
      }
    };
  }
}

module.exports = LangChainService;