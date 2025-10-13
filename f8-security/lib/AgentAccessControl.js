/**
 * Agent Access Control
 * Plan-based access control for Formul8 agents
 */

const { getConfig } = require('./SecurityConfig');

/**
 * Agent Access Control Class
 */
class AgentAccessControl {
  constructor(options = {}) {
    this.config = { ...getConfig('agentAccess'), ...options };
  }

  /**
   * Validate agent access for plan
   * @param {string} agentName - Agent name
   * @param {string} plan - User plan
   * @returns {boolean} Whether access is allowed
   */
  validateAccess(agentName, plan) {
    // Normalize agent name
    const normalizedAgentName = agentName.toLowerCase().replace(/\s+/g, '_');
    
    // Check if agent has restrictions
    if (this.config.restricted[normalizedAgentName]) {
      return this.config.restricted[normalizedAgentName].includes(plan);
    }
    
    // Default to allowing access for unrestricted agents
    return true;
  }

  /**
   * Get allowed plans for agent
   * @param {string} agentName - Agent name
   * @returns {Array} List of allowed plans
   */
  getAllowedPlans(agentName) {
    const normalizedAgentName = agentName.toLowerCase().replace(/\s+/g, '_');
    
    if (this.config.restricted[normalizedAgentName]) {
      return [...this.config.restricted[normalizedAgentName]];
    }
    
    // Return all plans for unrestricted agents
    return getConfig('plans').valid;
  }

  /**
   * Check if agent is restricted
   * @param {string} agentName - Agent name
   * @returns {boolean} Whether agent is restricted
   */
  isAgentRestricted(agentName) {
    const normalizedAgentName = agentName.toLowerCase().replace(/\s+/g, '_');
    return !!this.config.restricted[normalizedAgentName];
  }

  /**
   * Add agent restriction
   * @param {string} agentName - Agent name
   * @param {Array} allowedPlans - Allowed plans
   */
  addAgentRestriction(agentName, allowedPlans) {
    const normalizedAgentName = agentName.toLowerCase().replace(/\s+/g, '_');
    this.config.restricted[normalizedAgentName] = [...allowedPlans];
  }

  /**
   * Remove agent restriction
   * @param {string} agentName - Agent name
   */
  removeAgentRestriction(agentName) {
    const normalizedAgentName = agentName.toLowerCase().replace(/\s+/g, '_');
    delete this.config.restricted[normalizedAgentName];
  }

  /**
   * Get all restricted agents
   * @returns {Object} Map of restricted agents and their allowed plans
   */
  getRestrictedAgents() {
    return { ...this.config.restricted };
  }

  /**
   * Express middleware for agent access control
   * @param {string} agentName - Agent name
   * @returns {Function} Express middleware function
   */
  middleware(agentName) {
    return (req, res, next) => {
      const plan = req.body.plan || 'standard';
      
      if (!this.validateAccess(agentName, plan)) {
        return res.status(403).json({
          error: 'Access denied for this plan',
          code: 'PLAN_ACCESS_DENIED',
          message: `Plan '${plan}' does not have access to this agent`,
          allowedPlans: this.getAllowedPlans(agentName)
        });
      }
      
      next();
    };
  }

  /**
   * Create access control error
   * @param {string} agentName - Agent name
   * @param {string} plan - User plan
   * @returns {Error} Access control error
   */
  createAccessError(agentName, plan) {
    const error = new Error(`Access denied for plan '${plan}' to agent '${agentName}'`);
    error.code = 'PLAN_ACCESS_DENIED';
    error.statusCode = 403;
    error.allowedPlans = this.getAllowedPlans(agentName);
    return error;
  }
}

/**
 * Create agent access control instance
 * @param {Object} options - Access control options
 * @returns {AgentAccessControl} Agent access control instance
 */
function createAgentAccessControl(options = {}) {
  return new AgentAccessControl(options);
}

module.exports = {
  AgentAccessControl,
  createAgentAccessControl
};