/**
 * User API Key Middleware
 * Injects user-specific OpenRouter API keys into requests
 */

import { getUserApiKey, checkUserUsageLimit, logApiUsage } from '../services/user-api-key-service.js';

/**
 * Middleware to inject user-specific OpenRouter API key
 */
export function injectUserApiKey(req, res, next) {
  // Skip if no user is authenticated
  if (!req.user || !req.user.id) {
    return next();
  }

  // Skip if already has OpenRouter key (from system config)
  if (req.headers['x-openrouter-api-key']) {
    return next();
  }

  // Get user's API key asynchronously
  getUserApiKey(req.user.id)
    .then(userApiKey => {
      if (userApiKey) {
        // Inject user's API key into request headers
        req.headers['x-openrouter-api-key'] = userApiKey.openrouter_key_id;
        req.userApiKey = userApiKey;
        
        // Check usage limit
        return checkUserUsageLimit(req.user.id);
      }
      return true; // No key found, continue without user-specific key
    })
    .then(withinLimit => {
      if (req.userApiKey && !withinLimit) {
        return res.status(429).json({
          error: 'Monthly usage limit exceeded',
          message: 'You have exceeded your monthly API usage limit. Please upgrade your plan or wait for the next billing cycle.',
          limit: req.userApiKey.monthly_limit,
          currentUsage: req.userApiKey.current_usage
        });
      }
      next();
    })
    .catch(error => {
      console.error('Error in user API key middleware:', error);
      // Continue without user-specific key on error
      next();
    });
}

/**
 * Middleware to log API usage after request completion
 */
export function logUserApiUsage(req, res, next) {
  // Store original res.end to intercept response
  const originalEnd = res.end;
  
  res.end = function(chunk, encoding) {
    // Log usage if this was an OpenRouter API call
    if (req.userApiKey && req.openrouterUsage) {
      logApiUsage(
        req.user.id,
        req.userApiKey.id,
        req.openrouterUsage
      ).catch(error => {
        console.error('Error logging API usage:', error);
      });
    }
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
}

/**
 * Middleware to track OpenRouter API calls
 */
export function trackOpenRouterUsage(req, res, next) {
  // Check if this is an OpenRouter API call
  if (req.headers['x-openrouter-api-key'] || req.headers['authorization']?.includes('sk-or-v1-')) {
    const startTime = Date.now();
    
    // Store usage data in request
    req.openrouterUsage = {
      model: req.body?.model || 'unknown',
      requestTokens: req.body?.messages ? 
        JSON.stringify(req.body.messages).length / 4 : 0, // Rough estimate
      endpoint: req.path,
      agentName: req.headers['x-agent-name'] || 'unknown',
      startTime
    };
    
    // Override res.json to capture response data
    const originalJson = res.json;
    res.json = function(data) {
      const duration = Date.now() - startTime;
      
      // Update usage data with response info
      if (req.openrouterUsage) {
        req.openrouterUsage.responseTokens = data?.usage?.completion_tokens || 0;
        req.openrouterUsage.totalTokens = data?.usage?.total_tokens || 0;
        req.openrouterUsage.durationMs = duration;
        
        // Calculate cost (rough estimate - you'd want to use actual OpenRouter pricing)
        const costPerToken = 0.00001; // Example rate
        req.openrouterUsage.costUsd = (req.openrouterUsage.totalTokens * costPerToken);
      }
      
      return originalJson.call(this, data);
    };
  }
  
  next();
}

/**
 * Middleware to handle OpenRouter API errors
 */
export function handleOpenRouterErrors(req, res, next) {
  // Override res.status to handle specific OpenRouter errors
  const originalStatus = res.status;
  
  res.status = function(code) {
    // Handle OpenRouter-specific error codes
    if (code === 401 && req.headers['x-openrouter-api-key']) {
      // API key invalid or expired
      return res.json({
        error: 'Invalid API key',
        message: 'Your API key is invalid or has expired. Please contact support.',
        code: 'INVALID_API_KEY'
      });
    }
    
    if (code === 429 && req.headers['x-openrouter-api-key']) {
      // Rate limit exceeded
      return res.json({
        error: 'Rate limit exceeded',
        message: 'You have exceeded the rate limit for your API key. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
    
    return originalStatus.call(this, code);
  };
  
  next();
}

/**
 * Combined middleware for user API key management
 */
export function userApiKeyMiddleware() {
  return [
    injectUserApiKey,
    trackOpenRouterUsage,
    logUserApiUsage,
    handleOpenRouterErrors
  ];
}

/**
 * Express.js integration helper
 */
export function setupUserApiKeyMiddleware(app) {
  // Apply middleware to all routes
  app.use(userApiKeyMiddleware());
  
  // Add health check endpoint
  app.get('/api/user-api-key/status', async (req, res) => {
    try {
      if (!req.user) {
        return res.json({ status: 'not_authenticated' });
      }
      
      const userApiKey = await getUserApiKey(req.user.id);
      const withinLimit = await checkUserUsageLimit(req.user.id);
      
      res.json({
        status: 'authenticated',
        hasApiKey: !!userApiKey,
        withinLimit,
        monthlyLimit: userApiKey?.monthly_limit,
        currentUsage: userApiKey?.current_usage
      });
    } catch (error) {
      console.error('Error checking user API key status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}

export default {
  injectUserApiKey,
  logUserApiUsage,
  trackOpenRouterUsage,
  handleOpenRouterErrors,
  userApiKeyMiddleware,
  setupUserApiKeyMiddleware
};

