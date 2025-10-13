/**
 * Security Configuration
 * Centralized configuration for all Formul8 security features
 */

const SECURITY_CONFIG = {
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // max requests per window per IP
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    }
  },
  
  // Input validation
  input: {
    maxMessageLength: 2000,
    maxUsernameLength: 50,
    maxPlanLength: 50
  },
  
  // CORS configuration
  cors: {
    allowedOrigins: [
      'https://f8.syzygyx.com',
      'https://f8ai.github.io',
      'https://formul8.ai'
    ],
    credentials: true,
    optionsSuccessStatus: 200
  },
  
  // Security headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  },
  
  // Request logging
  logging: {
    level: 'info', // 'debug', 'info', 'warn', 'error'
    logRequestBody: false, // Set to true for debugging
    logResponseBody: false
  },
  
  // API key authentication
  apiKey: {
    required: false, // Set to true for production
    headerName: 'X-API-Key',
    validKeys: [] // Will be populated from environment
  },
  
  // Plan validation
  plans: {
    valid: ['free', 'standard', 'micro', 'operator', 'enterprise', 'beta', 'admin', 'future4200'],
    default: 'standard'
  },
  
  // Agent access control
  agentAccess: {
    restricted: {
      'editor_agent': ['admin'],
      'ad_agent': ['free', 'standard', 'micro', 'operator', 'enterprise', 'beta', 'admin', 'future4200']
    }
  },
  
  // XSS protection patterns
  xssPatterns: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi
  ],
  
  // Content filtering
  contentFilter: {
    enabled: true,
    patterns: [
      // Add additional content filtering patterns here
    ]
  }
};

/**
 * Get security configuration
 * @param {string} key - Configuration key (optional)
 * @returns {Object} Security configuration
 */
function getConfig(key = null) {
  if (key) {
    return SECURITY_CONFIG[key] || null;
  }
  return SECURITY_CONFIG;
}

/**
 * Update security configuration
 * @param {string} key - Configuration key
 * @param {*} value - New value
 */
function updateConfig(key, value) {
  if (SECURITY_CONFIG.hasOwnProperty(key)) {
    SECURITY_CONFIG[key] = value;
  } else {
    throw new Error(`Invalid configuration key: ${key}`);
  }
}

/**
 * Load configuration from environment variables
 */
function loadFromEnvironment() {
  // Load API keys from environment
  if (process.env.VALID_API_KEYS) {
    SECURITY_CONFIG.apiKey.validKeys = process.env.VALID_API_KEYS.split(',');
  }
  
  // Load logging level from environment
  if (process.env.SECURITY_LOG_LEVEL) {
    SECURITY_CONFIG.logging.level = process.env.SECURITY_LOG_LEVEL;
  }
  
  // Load API key requirement from environment
  if (process.env.REQUIRE_API_KEY === 'true') {
    SECURITY_CONFIG.apiKey.required = true;
  }
  
  // Load rate limit from environment
  if (process.env.RATE_LIMIT_MAX) {
    SECURITY_CONFIG.rateLimit.max = parseInt(process.env.RATE_LIMIT_MAX);
  }
  
  if (process.env.RATE_LIMIT_WINDOW) {
    SECURITY_CONFIG.rateLimit.windowMs = parseInt(process.env.RATE_LIMIT_WINDOW);
  }
}

// Load configuration from environment on module load
loadFromEnvironment();

module.exports = {
  getConfig,
  updateConfig,
  loadFromEnvironment,
  SECURITY_CONFIG
};