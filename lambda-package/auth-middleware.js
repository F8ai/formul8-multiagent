/**
 * Formul8 Authentication Middleware
 * Handles free mode and paid authentication
 */

const jwt = require('jsonwebtoken');

// Plan hierarchy for access control
const PLAN_HIERARCHY = {
  'free': 0,
  'standard': 1,
  'enterprise': 2,
  'admin': 3
};

// Agent permissions by plan
const AGENT_PERMISSIONS = {
  free: ['compliance', 'formulation', 'science'],
  standard: ['compliance', 'formulation', 'science', 'operations', 'marketing'],
  enterprise: ['compliance', 'formulation', 'science', 'operations', 'marketing', 'sourcing', 'patent', 'spectra'],
  admin: ['compliance', 'formulation', 'science', 'operations', 'marketing', 'sourcing', 'patent', 'spectra', 'customer-success', 'f8-slackbot', 'mcr', 'ad', 'editor']
};

// Rate limits by plan (requests per hour)
const RATE_LIMITS = {
  free: 10,
  standard: 100,
  enterprise: 1000,
  admin: Infinity
};

// In-memory rate limiting (for demo - use Redis in production)
const rateLimitStore = new Map();

/**
 * Authentication middleware
 * Supports both free mode (API key) and paid mode (JWT)
 */
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];
  
  // Free mode authentication
  if (apiKey === process.env.FREE_MODE_API_KEY) {
    req.user = {
      id: 'anonymous',
      plan: 'free',
      type: 'free'
    };
    return next();
  }
  
  // Paid mode authentication (JWT)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.userId,
        plan: decoded.plan || 'standard',
        type: 'paid'
      };
      return next();
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid authentication token',
        code: 'INVALID_TOKEN'
      });
    }
  }
  
  // No authentication provided
  return res.status(401).json({
    error: 'Authentication required',
    code: 'AUTH_REQUIRED',
    message: 'Please provide either an API key (free mode) or JWT token (paid mode)'
  });
};

/**
 * Rate limiting middleware
 */
const rateLimiter = (req, res, next) => {
  const user = req.user;
  if (!user) return next();
  
  const identifier = user.id || req.ip;
  const plan = user.plan || 'free';
  const limit = RATE_LIMITS[plan];
  
  if (limit === Infinity) {
    return next(); // Admin users have no limits
  }
  
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const window = 60 * 60 * 1000; // 1 hour
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + window });
    return next();
  }
  
  const data = rateLimitStore.get(key);
  
  // Reset if window expired
  if (now > data.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + window });
    return next();
  }
  
  // Check if limit exceeded
  if (data.count >= limit) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      limit: limit,
      resetTime: new Date(data.resetTime).toISOString(),
      plan: plan
    });
  }
  
  // Increment counter
  data.count++;
  rateLimitStore.set(key, data);
  
  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': limit,
    'X-RateLimit-Remaining': Math.max(0, limit - data.count),
    'X-RateLimit-Reset': new Date(data.resetTime).toISOString()
  });
  
  next();
};

/**
 * Plan-based access control
 */
const checkPlanAccess = (requiredPlan) => {
  return (req, res, next) => {
    const userPlan = req.user?.plan || 'free';
    const userLevel = PLAN_HIERARCHY[userPlan] || 0;
    const requiredLevel = PLAN_HIERARCHY[requiredPlan] || 0;
    
    if (userLevel >= requiredLevel) {
      return next();
    }
    
    return res.status(403).json({
      error: 'Insufficient plan access',
      code: 'PLAN_ACCESS_DENIED',
      required: requiredPlan,
      current: userPlan,
      upgradeUrl: 'https://formul8.ai/pricing'
    });
  };
};

/**
 * Agent access control
 */
const checkAgentAccess = (agentName) => {
  return (req, res, next) => {
    const userPlan = req.user?.plan || 'free';
    const availableAgents = AGENT_PERMISSIONS[userPlan] || AGENT_PERMISSIONS.free;
    
    if (availableAgents.includes(agentName)) {
      return next();
    }
    
    return res.status(403).json({
      error: 'Agent not available in your plan',
      code: 'AGENT_ACCESS_DENIED',
      agent: agentName,
      plan: userPlan,
      availableAgents: availableAgents,
      upgradeUrl: 'https://formul8.ai/pricing'
    });
  };
};

/**
 * Select appropriate agent based on message and user plan
 */
const selectAgent = (message, userPlan) => {
  const availableAgents = AGENT_PERMISSIONS[userPlan] || AGENT_PERMISSIONS.free;
  const messageLower = message.toLowerCase();
  
  // Agent keyword mapping
  const agentKeywords = {
    'compliance': ['compliance', 'regulation', 'license', 'legal', 'audit', 'inspection', 'permit', 'regulatory'],
    'formulation': ['formulation', 'recipe', 'dosage', 'extraction', 'ingredient', 'thc', 'cbd', 'concentrate', 'edible', 'tincture'],
    'science': ['science', 'research', 'cannabinoid', 'terpene', 'lab', 'testing', 'coa', 'analysis', 'study', 'clinical'],
    'operations': ['operations', 'facility', 'management', 'production', 'quality', 'control', 'logistics', 'manufacturing'],
    'marketing': ['marketing', 'brand', 'advertising', 'promotion', 'customer', 'acquisition', 'strategy', 'campaign'],
    'sourcing': ['sourcing', 'supply', 'chain', 'procurement', 'vendor', 'inventory', 'supplier', 'purchasing'],
    'patent': ['patent', 'intellectual', 'property', 'ip', 'research', 'legal', 'innovation', 'invention'],
    'spectra': ['spectra', 'analysis', 'testing', 'lab', 'equipment', 'chemistry', 'spectroscopy', 'quality'],
    'customer-success': ['customer', 'success', 'retention', 'support', 'satisfaction', 'onboarding', 'service'],
    'f8-slackbot': ['slack', 'integration', 'team', 'collaboration', 'notification', 'workflow', 'communication'],
    'mcr': ['mcr', 'master', 'control', 'record', 'documentation', 'compliance', 'tracking'],
    'ad': ['advertising', 'ad', 'promotional', 'campaign', 'media', 'strategy', 'creative', 'content'],
    'editor': ['edit', 'editor', 'content', 'document', 'review', 'modify', 'update', 'version']
  };
  
  // Find best matching agent
  for (const agent of availableAgents) {
    if (agentKeywords[agent]) {
      const hasKeyword = agentKeywords[agent].some(keyword => 
        messageLower.includes(keyword.toLowerCase())
      );
      if (hasKeyword) {
        return agent;
      }
    }
  }
  
  // Default to first available agent
  return availableAgents[0] || 'compliance';
};

/**
 * Generate free mode API key
 */
const generateFreeApiKey = () => {
  return `f8_free_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Generate JWT token for paid users
 */
const generateJWT = (userId, plan = 'standard') => {
  return jwt.sign(
    { userId, plan },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = {
  authenticate,
  rateLimiter,
  checkPlanAccess,
  checkAgentAccess,
  selectAgent,
  generateFreeApiKey,
  generateJWT,
  AGENT_PERMISSIONS,
  RATE_LIMITS
};