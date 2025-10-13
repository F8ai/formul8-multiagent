/**
 * Rate Limiter
 * In-memory rate limiting for Formul8 agents
 * In production, consider using Redis for distributed rate limiting
 */

const { getConfig } = require('./SecurityConfig');

// In-memory storage for rate limiting
const requestCounts = new Map();

/**
 * Rate Limiter Class
 */
class RateLimiter {
  constructor(options = {}) {
    this.config = { ...getConfig('rateLimit'), ...options };
    this.requestCounts = requestCounts;
  }

  /**
   * Get client IP address
   * @param {Object} req - Express request object
   * @returns {string} Client IP address
   */
  getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           'unknown';
  }

  /**
   * Check if request is within rate limit
   * @param {string} ip - Client IP address
   * @returns {Object} Rate limit status
   */
  checkRateLimit(ip) {
    const now = Date.now();
    
    if (!this.requestCounts.has(ip)) {
      this.requestCounts.set(ip, { 
        count: 1, 
        resetTime: now + this.config.windowMs 
      });
      return { allowed: true, remaining: this.config.max - 1 };
    }
    
    const ipData = this.requestCounts.get(ip);
    
    if (now > ipData.resetTime) {
      // Reset the counter
      this.requestCounts.set(ip, { 
        count: 1, 
        resetTime: now + this.config.windowMs 
      });
      return { allowed: true, remaining: this.config.max - 1 };
    }
    
    if (ipData.count >= this.config.max) {
      return { 
        allowed: false, 
        remaining: 0,
        resetTime: ipData.resetTime,
        retryAfter: Math.ceil((ipData.resetTime - now) / 1000)
      };
    }
    
    ipData.count++;
    return { 
      allowed: true, 
      remaining: this.config.max - ipData.count 
    };
  }

  /**
   * Express middleware for rate limiting
   * @returns {Function} Express middleware function
   */
  middleware() {
    return (req, res, next) => {
      const ip = this.getClientIP(req);
      const rateLimitStatus = this.checkRateLimit(ip);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', this.config.max);
      res.setHeader('X-RateLimit-Remaining', rateLimitStatus.remaining);
      
      if (rateLimitStatus.resetTime) {
        res.setHeader('X-RateLimit-Reset', new Date(rateLimitStatus.resetTime).toISOString());
      }
      
      if (!rateLimitStatus.allowed) {
        return res.status(429).json({
          error: this.config.message.error,
          retryAfter: rateLimitStatus.retryAfter,
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }
      
      next();
    };
  }

  /**
   * Reset rate limit for specific IP
   * @param {string} ip - Client IP address
   */
  reset(ip) {
    this.requestCounts.delete(ip);
  }

  /**
   * Get rate limit status for specific IP
   * @param {string} ip - Client IP address
   * @returns {Object} Rate limit status
   */
  getStatus(ip) {
    const now = Date.now();
    const ipData = this.requestCounts.get(ip);
    
    if (!ipData) {
      return { count: 0, remaining: this.config.max, resetTime: null };
    }
    
    if (now > ipData.resetTime) {
      return { count: 0, remaining: this.config.max, resetTime: null };
    }
    
    return {
      count: ipData.count,
      remaining: this.config.max - ipData.count,
      resetTime: ipData.resetTime
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [ip, data] of this.requestCounts.entries()) {
      if (now > data.resetTime) {
        this.requestCounts.delete(ip);
      }
    }
  }
}

/**
 * Create rate limiter instance
 * @param {Object} options - Rate limiter options
 * @returns {RateLimiter} Rate limiter instance
 */
function createRateLimiter(options = {}) {
  return new RateLimiter(options);
}

module.exports = {
  RateLimiter,
  createRateLimiter
};