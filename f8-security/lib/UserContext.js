/**
 * User Context Helper
 * Utilities for handling user context in Formul8 agents
 */

const { getConfig } = require('./SecurityConfig');

/**
 * User Context Class
 */
class UserContext {
  constructor(userContext) {
    this.username = userContext.username || 'anonymous';
    this.plan = userContext.plan || 'standard';
    this.timestamp = userContext.timestamp || new Date().toISOString();
    this.ip = userContext.ip || 'unknown';
    this.userAgent = userContext.userAgent || 'unknown';
  }

  /**
   * Get user context as object
   * @returns {Object} User context object
   */
  toObject() {
    return {
      username: this.username,
      plan: this.plan,
      timestamp: this.timestamp,
      ip: this.ip,
      userAgent: this.userAgent
    };
  }

  /**
   * Get user context for logging
   * @returns {string} Formatted log string
   */
  toLogString() {
    return `User: ${this.username}, Plan: ${this.plan}, IP: ${this.ip}`;
  }

  /**
   * Get user context for API responses
   * @returns {Object} User context for API responses
   */
  toAPIResponse() {
    return {
      username: this.username,
      plan: this.plan,
      timestamp: this.timestamp
    };
  }

  /**
   * Check if user has specific plan
   * @param {string} plan - Plan to check
   * @returns {boolean} Whether user has the plan
   */
  hasPlan(plan) {
    return this.plan === plan;
  }

  /**
   * Check if user has any of the specified plans
   * @param {Array} plans - Plans to check
   * @returns {boolean} Whether user has any of the plans
   */
  hasAnyPlan(plans) {
    return plans.includes(this.plan);
  }

  /**
   * Check if user has admin access
   * @returns {boolean} Whether user has admin access
   */
  isAdmin() {
    return this.plan === 'admin';
  }

  /**
   * Check if user has beta access
   * @returns {boolean} Whether user has beta access
   */
  hasBetaAccess() {
    return ['beta', 'admin'].includes(this.plan);
  }

  /**
   * Get plan tier level
   * @returns {number} Plan tier level (higher = more access)
   */
  getPlanTier() {
    const tierMap = {
      'free': 1,
      'standard': 2,
      'micro': 3,
      'operator': 4,
      'enterprise': 5,
      'beta': 6,
      'admin': 7,
      'future4200': 8
    };
    
    return tierMap[this.plan] || 1;
  }

  /**
   * Check if user has minimum plan tier
   * @param {number} minTier - Minimum tier required
   * @returns {boolean} Whether user meets minimum tier
   */
  hasMinimumTier(minTier) {
    return this.getPlanTier() >= minTier;
  }

  /**
   * Get personalized greeting
   * @returns {string} Personalized greeting
   */
  getGreeting() {
    const greetings = {
      'admin': `Hello ${this.username}, welcome to the admin panel!`,
      'beta': `Hello ${this.username}, thanks for being a beta tester!`,
      'enterprise': `Hello ${this.username}, welcome to enterprise features!`,
      'default': `Hello ${this.username}, how can I help you today?`
    };
    
    return greetings[this.plan] || greetings.default;
  }

  /**
   * Get plan-specific features
   * @returns {Array} List of features available to user
   */
  getAvailableFeatures() {
    const features = {
      'free': ['Basic chat', 'Standard responses'],
      'standard': ['Basic chat', 'Standard responses', 'Formulation help'],
      'micro': ['Basic chat', 'Standard responses', 'Formulation help', 'Compliance assistance'],
      'operator': ['Basic chat', 'Standard responses', 'Formulation help', 'Compliance assistance', 'Operations support'],
      'enterprise': ['Basic chat', 'Standard responses', 'Formulation help', 'Compliance assistance', 'Operations support', 'Marketing tools'],
      'beta': ['All standard features', 'Beta features', 'Advanced analytics'],
      'admin': ['All features', 'Admin tools', 'System management'],
      'future4200': ['All features', 'Future4200 integration', 'Community tools']
    };
    
    return features[this.plan] || features.free;
  }

  /**
   * Create system prompt with user context
   * @param {string} basePrompt - Base system prompt
   * @returns {string} Enhanced system prompt with user context
   */
  createSystemPrompt(basePrompt) {
    return `${basePrompt}

User Context:
- Username: ${this.username}
- Plan: ${this.plan}
- Available Features: ${this.getAvailableFeatures().join(', ')}
- Access Level: ${this.getPlanTier()}

Please provide responses appropriate for this user's plan and context.`;
  }
}

/**
 * Extract user context from request
 * @param {Object} req - Express request object
 * @returns {UserContext} User context instance
 */
function extractUserContext(req) {
  const userContext = req.userContext || {};
  return new UserContext(userContext);
}

/**
 * Create user context from data
 * @param {Object} data - User context data
 * @returns {UserContext} User context instance
 */
function createUserContext(data) {
  return new UserContext(data);
}

/**
 * Express middleware to add user context to request
 * @returns {Function} Express middleware function
 */
function userContextMiddleware() {
  return (req, res, next) => {
    if (req.userContext) {
      req.userContext = new UserContext(req.userContext);
    }
    next();
  };
}

module.exports = {
  UserContext,
  extractUserContext,
  createUserContext,
  userContextMiddleware
};