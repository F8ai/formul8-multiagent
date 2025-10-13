/**
 * Security Headers
 * Security headers middleware for Formul8 agents
 */

const { getConfig } = require('./SecurityConfig');

/**
 * Security Headers Class
 */
class SecurityHeaders {
  constructor(options = {}) {
    this.headers = { ...getConfig('headers'), ...options };
  }

  /**
   * Set security header
   * @param {string} name - Header name
   * @param {string} value - Header value
   */
  setHeader(name, value) {
    this.headers[name] = value;
  }

  /**
   * Get security headers
   * @returns {Object} Security headers
   */
  getHeaders() {
    return { ...this.headers };
  }

  /**
   * Express middleware for security headers
   * @returns {Function} Express middleware function
   */
  middleware() {
    return (req, res, next) => {
      // Set all security headers
      Object.entries(this.headers).forEach(([name, value]) => {
        res.setHeader(name, value);
      });
      
      next();
    };
  }

  /**
   * Add custom security header
   * @param {string} name - Header name
   * @param {string} value - Header value
   */
  addHeader(name, value) {
    this.headers[name] = value;
  }

  /**
   * Remove security header
   * @param {string} name - Header name to remove
   */
  removeHeader(name) {
    delete this.headers[name];
  }
}

/**
 * Create security headers instance
 * @param {Object} options - Header options
 * @returns {SecurityHeaders} Security headers instance
 */
function createSecurityHeaders(options = {}) {
  return new SecurityHeaders(options);
}

module.exports = {
  SecurityHeaders,
  createSecurityHeaders
};