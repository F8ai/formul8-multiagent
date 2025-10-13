/**
 * Security Middleware
 * Main security middleware for Formul8 agents
 */

const express = require('express');
const cors = require('cors');
const { getConfig } = require('./SecurityConfig');
const RateLimiter = require('./RateLimiter');
const InputValidator = require('./InputValidator');
const CORSManager = require('./CORSManager');
const SecurityHeaders = require('./SecurityHeaders');
const RequestLogger = require('./RequestLogger');
const ErrorHandler = require('./ErrorHandler');
const AgentAccessControl = require('./AgentAccessControl');

/**
 * Security Middleware Class
 */
class SecurityMiddleware {
  constructor(options = {}) {
    this.options = options;
    this.rateLimiter = new RateLimiter();
    this.inputValidator = new InputValidator();
    this.corsManager = new CORSManager();
    this.securityHeaders = new SecurityHeaders();
    this.requestLogger = new RequestLogger();
    this.errorHandler = new ErrorHandler();
    this.agentAccessControl = new AgentAccessControl();
  }

  /**
   * Create a secure Express app
   * @param {Object} appOptions - Express app options
   * @returns {Object} Configured Express app
   */
  createSecureApp(appOptions = {}) {
    const app = express();
    
    // Apply security middleware in correct order
    this.applySecurityMiddleware(app);
    
    return app;
  }

  /**
   * Apply all security middleware to Express app
   * @param {Object} app - Express app instance
   */
  applySecurityMiddleware(app) {
    // Security headers (first)
    app.use(this.securityHeaders.middleware());
    
    // CORS (second)
    app.use(this.corsManager.middleware());
    
    // Body parsing (third)
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging (fourth)
    app.use(this.requestLogger.middleware());
    
    // Rate limiting (fifth)
    app.use('/api/', this.rateLimiter.middleware());
    
    // Input validation (sixth)
    app.use(this.inputValidator.middleware());
    
    // Error handling (last)
    app.use(this.errorHandler.middleware());
  }

  /**
   * Create agent-specific security configuration
   * @param {Object} agentConfig - Agent configuration
   * @returns {Object} Security configuration for agent
   */
  createAgentSecurity(agentConfig) {
    return {
      agentConfig,
      rateLimiter: this.rateLimiter,
      inputValidator: this.inputValidator,
      corsManager: this.corsManager,
      securityHeaders: this.securityHeaders,
      requestLogger: this.requestLogger,
      errorHandler: this.errorHandler,
      agentAccessControl: this.agentAccessControl,
      
      // Agent-specific methods
      validateAgentAccess: (plan) => {
        return this.agentAccessControl.validateAccess(agentConfig.name, plan);
      },
      
      createSecureEndpoint: (endpointPath, handler) => {
        return (req, res, next) => {
          // Extract and validate user context
          const userContext = this.extractUserContext(req);
          
          // Check agent access
          if (!this.agentAccessControl.validateAccess(agentConfig.name, userContext.plan)) {
            return res.status(403).json({
              error: 'Access denied for this plan',
              code: 'PLAN_ACCESS_DENIED',
              message: `Plan '${userContext.plan}' does not have access to this agent`,
              allowedPlans: this.agentAccessControl.getAllowedPlans(agentConfig.name)
            });
          }
          
          // Add user context to request
          req.userContext = userContext;
          
          // Call the handler
          handler(req, res, next);
        };
      },
      
      // Extract user context from request
      extractUserContext: (req) => {
        const { username = 'anonymous', plan = 'standard' } = req.body || {};
        
        return {
          username: this.inputValidator.validateUsername(username),
          plan: this.inputValidator.validatePlan(plan),
          timestamp: new Date().toISOString(),
          ip: this.getClientIP(req),
          userAgent: req.headers['user-agent'] || 'unknown'
        };
      },
      
      // Get client IP
      getClientIP: (req) => {
        return req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               'unknown';
      }
    };
  }

  /**
   * Get security status
   * @returns {Object} Security status information
   */
  getSecurityStatus() {
    return {
      rateLimiting: {
        enabled: true,
        windowMs: getConfig('rateLimit').windowMs,
        maxRequests: getConfig('rateLimit').max
      },
      inputValidation: {
        enabled: true,
        maxMessageLength: getConfig('input').maxMessageLength,
        maxUsernameLength: getConfig('input').maxUsernameLength
      },
      cors: {
        enabled: true,
        allowedOrigins: getConfig('cors').allowedOrigins
      },
      securityHeaders: {
        enabled: true,
        headers: Object.keys(getConfig('headers'))
      },
      logging: {
        enabled: true,
        level: getConfig('logging').level
      }
    };
  }
}

/**
 * Create security middleware instance
 * @param {Object} options - Security options
 * @returns {SecurityMiddleware} Security middleware instance
 */
function createSecurityMiddleware(options = {}) {
  return new SecurityMiddleware(options);
}

/**
 * Quick setup function for agents
 * @param {Object} agentConfig - Agent configuration
 * @returns {Object} Configured security for agent
 */
function createAgentSecurity(agentConfig) {
  const security = new SecurityMiddleware();
  return security.createAgentSecurity(agentConfig);
}

/**
 * Create secure Express app
 * @param {Object} options - App options
 * @returns {Object} Secure Express app
 */
function createSecureApp(options = {}) {
  const security = new SecurityMiddleware();
  return security.createSecureApp(options);
}

module.exports = {
  SecurityMiddleware,
  createSecurityMiddleware,
  createAgentSecurity,
  createSecureApp
};