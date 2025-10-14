/**
 * Formul8 Multiagent Security Module
 * Shared security functions for all agents
 */

// Rate limiting storage (in production, use Redis or similar)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 50; // max requests per window per IP

// Security configuration
const SECURITY_CONFIG = {
  maxMessageLength: 2000,
  maxUsernameLength: 50,
  allowedOrigins: [
    'https://f8.syzygyx.com',
    'https://f8ai.github.io',
    'https://formul8.ai'
  ],
  validPlans: ['free', 'standard', 'micro', 'operator', 'enterprise', 'beta', 'admin', 'future4200'],
  requireApiKey: false, // Set to true for production
  logLevel: 'info' // 'debug', 'info', 'warn', 'error'
};

/**
 * Rate limiting middleware
 */
const rateLimiter = (req, res, next) => {
  const ip = getClientIP(req);
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const ipData = requestCounts.get(ip);
  
  if (now > ipData.resetTime) {
    // Reset the counter
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  if (ipData.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((ipData.resetTime - now) / 1000),
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
  
  ipData.count++;
  next();
};

/**
 * CORS configuration
 */
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || SECURITY_CONFIG.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

/**
 * Input validation and sanitization
 */
const validateAndSanitizeInput = (input, fieldName = 'input') => {
  if (!input || typeof input !== 'string') {
    return null;
  }
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Check length limits
  if (sanitized.length === 0) {
    return null;
  }
  
  const maxLength = fieldName === 'username' ? SECURITY_CONFIG.maxUsernameLength : SECURITY_CONFIG.maxMessageLength;
  if (sanitized.length > maxLength) {
    throw new Error(`${fieldName} too long. Maximum ${maxLength} characters allowed.`);
  }
  
  // Basic XSS protection
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, ''); // Remove embed tags
  
  return sanitized;
};

/**
 * Validate plan parameter
 */
const validatePlan = (plan) => {
  return SECURITY_CONFIG.validPlans.includes(plan) ? plan : 'standard';
};

/**
 * Validate API key (if required)
 */
const validateApiKey = (req, res, next) => {
  if (!SECURITY_CONFIG.requireApiKey) {
    return next();
  }
  
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      code: 'MISSING_API_KEY'
    });
  }
  
  // In production, validate against database or environment
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      error: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }
  
  next();
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${ip} - User-Agent: ${userAgent}`);
  
  // Log request body for debugging (be careful with sensitive data)
  if (SECURITY_CONFIG.logLevel === 'debug' && req.body) {
    console.log(`Request body: ${JSON.stringify(req.body)}`);
  }
  
  next();
};

/**
 * Get client IP address
 */
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         'unknown';
};

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Security error:', err);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation',
      code: 'CORS_ERROR'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * Content filtering middleware
 */
const contentFilter = (req, res, next) => {
  if (req.body && req.body.message) {
    try {
      req.body.message = validateAndSanitizeInput(req.body.message, 'message');
      if (!req.body.message) {
        return res.status(400).json({
          error: 'Invalid message content',
          code: 'INVALID_MESSAGE'
        });
      }
    } catch (error) {
      return res.status(400).json({
        error: error.message,
        code: 'MESSAGE_VALIDATION_ERROR'
      });
    }
  }
  
  if (req.body && req.body.username) {
    try {
      req.body.username = validateAndSanitizeInput(req.body.username, 'username') || 'anonymous';
    } catch (error) {
      return res.status(400).json({
        error: error.message,
        code: 'USERNAME_VALIDATION_ERROR'
      });
    }
  }
  
  if (req.body && req.body.plan) {
    req.body.plan = validatePlan(req.body.plan);
  }
  
  next();
};

/**
 * Agent-specific security validation
 */
const validateAgentAccess = (agentKey, plan) => {
  // This would typically check against a database or configuration
  // For now, we'll implement basic plan-based access control
  
  const restrictedAgents = {
    'editor_agent': ['admin'],
    'ad_agent': ['free', 'standard', 'micro', 'operator', 'enterprise', 'beta', 'admin', 'future4200']
  };
  
  if (restrictedAgents[agentKey]) {
    return restrictedAgents[agentKey].includes(plan);
  }
  
  return true; // Default to allowing access
};

/**
 * Export security functions
 */
module.exports = {
  rateLimiter,
  corsOptions,
  validateAndSanitizeInput,
  validatePlan,
  validateApiKey,
  requestLogger,
  errorHandler,
  securityHeaders,
  contentFilter,
  validateAgentAccess,
  SECURITY_CONFIG,
  getClientIP
};