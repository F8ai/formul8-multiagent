const ConfigLoader = require('../config/loader');
const fs = require('fs');
const path = require('path');

/**
 * Consolidated Chat Service
 * Handles all /chat endpoint logic with optional LangChain integration and ad-agent support
 */
class ChatService {
  constructor() {
    this.configLoader = new ConfigLoader();
    this.langChainService = null;
    this.initialize();
  }

  initialize() {
    try {
      // Try to initialize LangChain service for agent handling
      // This is optional and will gracefully fallback if not available
      try {
        const LangChainService = require('./langchain-service');
        this.langChainService = new LangChainService();
        console.log('✅ Chat service initialized with LangChain');
      } catch (error) {
        console.log('ℹ️  LangChain service not available, using fallback routing');
      }
    } catch (error) {
      console.error('⚠️  Error initializing chat service:', error);
    }
  }

  /**
   * Process a chat request
   * @param {Object} params - Request parameters
   * @param {string} params.message - User message
   * @param {string} params.plan - User's pricing plan (default: 'free')
   * @param {string} params.username - Username (optional)
   * @param {string} params.agent - Specific agent to use (optional)
   * @returns {Promise<Object>} Chat response
   */
  async processChat({ message, plan = 'free', username = 'anonymous', agent = null }) {
    try {
      // Validate input
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw new Error('Message is required');
      }

      // Sanitize inputs
      const sanitizedMessage = this.sanitizeInput(message);
      const sanitizedPlan = this.validatePlan(plan);
      const sanitizedUsername = this.sanitizeInput(username) || 'anonymous';

      console.log(`💬 Chat request - User: ${sanitizedUsername}, Plan: ${sanitizedPlan}, Agent: ${agent || 'auto'}`);

      // Load plan configuration to get available agents
      const planConfig = this.getPlanConfig(sanitizedPlan);
      const availableAgents = this.getAvailableAgents(sanitizedPlan, planConfig);

      // Determine which agent to use
      let selectedAgent = agent;
      if (!selectedAgent || !availableAgents.includes(selectedAgent)) {
        // Use LangChain for intelligent routing or fallback to keyword matching
        selectedAgent = await this.routeToAgent(sanitizedMessage, availableAgents);
      }

      console.log(`🤖 Using agent: ${selectedAgent}`);

      // Get agent response
      const agentResponse = await this.getAgentResponse(selectedAgent, sanitizedMessage);

      // Apply ad-agent for free tier
      const finalResponse = this.applyAdAgent(agentResponse, sanitizedPlan, planConfig);

      // Prepare response
      const response = {
        success: true,
        response: finalResponse,
        agent: selectedAgent,
        plan: sanitizedPlan,
        planName: planConfig.name || sanitizedPlan,
        timestamp: new Date().toISOString(),
        model: 'langchain-router',
        usage: {
          total_tokens: Math.ceil((sanitizedMessage.length + finalResponse.length) / 4),
          cost: 0, // Free tier
          model: 'langchain-router'
        }
      };

      return response;
    } catch (error) {
      console.error('❌ Error in chat service:', error);
      throw error;
    }
  }

  /**
   * Route message to appropriate agent using LangChain or fallback
   * @param {string} message - User message
   * @param {string[]} availableAgents - List of available agent IDs
   * @returns {Promise<string>} Selected agent ID
   */
  async routeToAgent(message, availableAgents) {
    try {
      if (this.langChainService) {
        const agentId = await this.langChainService.routeToAgent(message);
        // Verify the selected agent is available for this plan
        if (availableAgents.includes(agentId)) {
          return agentId;
        }
      }
    } catch (error) {
      console.error('LangChain routing failed, using fallback:', error);
    }

    // Fallback to keyword-based routing
    return this.fallbackRouting(message, availableAgents);
  }

  /**
   * Fallback routing using keyword matching
   * @param {string} message - User message
   * @param {string[]} availableAgents - List of available agent IDs
   * @returns {string} Selected agent ID
   */
  fallbackRouting(message, availableAgents) {
    const allAgents = this.configLoader.getAllAgents();
    const messageLower = message.toLowerCase();

    // Try to match keywords with available agents
    for (const agentId of availableAgents) {
      const agent = allAgents[agentId];
      if (agent && agent.keywords) {
        const hasMatch = agent.keywords.some(keyword =>
          messageLower.includes(keyword.toLowerCase())
        );
        if (hasMatch) {
          console.log(`🔍 Fallback routing to: ${agentId}`);
          return agentId;
        }
      }
    }

    // Default to f8_agent if available, otherwise first available agent
    if (availableAgents.includes('f8_agent')) {
      return 'f8_agent';
    }
    return availableAgents[0] || 'f8_agent';
  }

  /**
   * Get response from agent using LangChain or direct agent call
   * @param {string} agentId - Agent ID
   * @param {string} message - User message
   * @returns {Promise<string>} Agent response
   */
  async getAgentResponse(agentId, message) {
    try {
      if (this.langChainService) {
        return await this.langChainService.getAgentResponse(agentId, message);
      }
    } catch (error) {
      // Safely log error without using user input in format string
      console.error('Error getting LangChain response:', { agentId, error: error.message });
    }

    // Fallback to basic response
    return this.getFallbackResponse(agentId, message);
  }

  /**
   * Get fallback response when LangChain is not available
   * @param {string} agentId - Agent ID
   * @param {string} message - User message
   * @returns {string} Basic agent response
   */
  getFallbackResponse(agentId, message) {
    const agent = this.configLoader.getAgent(agentId);
    if (!agent) {
      return `I'm sorry, I couldn't find the ${agentId} agent. Please try again.`;
    }

    return `Hello! I'm the ${agent.name}. I specialize in ${agent.description}. I can help you with your question about: "${message}". However, I'm currently in basic mode. For full functionality, please check the system configuration.`;
  }

  /**
   * Apply ad-agent for free tier users
   * @param {string} response - Agent response
   * @param {string} plan - User plan
   * @param {Object} planConfig - Plan configuration
   * @returns {string} Response with ad content if applicable
   */
  applyAdAgent(response, plan, planConfig) {
    // Check if plan should have ads
    if (plan !== 'free') {
      return response;
    }

    // Load langchain config for free tier
    const langchainConfig = this.configLoader.getLangChainTierConfig('free');
    const adConfig = langchainConfig?.ad_delivery;

    if (!adConfig || !adConfig.enabled) {
      return response;
    }

    // Select ad template based on rotation
    const adTemplates = adConfig.templates || {};
    const adTypes = adConfig.ad_types || ['upgrade_promotion'];
    
    // Rotate ads based on timestamp
    const adIndex = Math.floor(Date.now() / 60000) % adTypes.length;
    const selectedAdType = adTypes[adIndex];
    const adTemplate = adTemplates[selectedAdType];

    if (!adTemplate) {
      // Default ad if template not found
      return `${response}\n\n---\n💡 **Upgrade to unlock more features!** Visit https://formul8.ai/plans to see our pricing options.`;
    }

    // Add ad to response
    return `${response}\n\n---\n💡 ${adTemplate}`;
  }

  /**
   * Get plan configuration from plans.json
   * @param {string} plan - Plan name
   * @returns {Object} Plan configuration
   */
  getPlanConfig(plan) {
    try {
      const plansPath = path.join(__dirname, '../config/plans.json');
      const plansData = JSON.parse(fs.readFileSync(plansPath, 'utf8'));
      return plansData.plans[plan] || plansData.plans.free || {};
    } catch (error) {
      console.error('Error loading plans.json:', error);
      return { name: plan, agents: {} };
    }
  }

  /**
   * Get list of available agents for a plan
   * @param {string} plan - Plan name
   * @param {Object} planConfig - Plan configuration
   * @returns {string[]} List of available agent IDs
   */
  getAvailableAgents(plan, planConfig) {
    const agents = planConfig.agents || {};
    const availableAgents = Object.entries(agents)
      .filter(([agentId, enabled]) => enabled === true)
      .map(([agentId]) => agentId);

    // Ensure at least f8_agent is available
    if (availableAgents.length === 0) {
      return ['f8_agent', 'compliance', 'formulation', 'science'];
    }

    return availableAgents;
  }

  /**
   * Validate and sanitize plan name
   * @param {string} plan - Plan name
   * @returns {string} Validated plan name
   */
  validatePlan(plan) {
    const validPlans = ['free', 'standard', 'micro', 'operator', 'enterprise', 'admin'];
    return validPlans.includes(plan) ? plan : 'free';
  }

  /**
   * Sanitize input string using a proper HTML entity encoder
   * @param {string} input - Input string
   * @returns {string} Sanitized string
   */
  sanitizeInput(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Trim and limit length
    let sanitized = input.trim();
    if (sanitized.length > 2000) {
      sanitized = sanitized.substring(0, 2000);
    }

    // Escape HTML entities to prevent XSS
    // This is safer than regex-based tag removal which can be bypassed
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized;
  }

  /**
   * Get service health status
   * @returns {Object} Health status
   */
  getHealth() {
    return {
      status: 'healthy',
      langchain: this.langChainService !== null,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ChatService;
