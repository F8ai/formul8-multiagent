/**
 * Request Logger
 * Request logging middleware for Formul8 agents
 */

const { getConfig } = require('./SecurityConfig');

/**
 * Request Logger Class
 */
class RequestLogger {
  constructor(options = {}) {
    this.config = { ...getConfig('logging'), ...options };
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
   * Format log message
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} duration - Request duration in ms
   * @returns {string} Formatted log message
   */
  formatLogMessage(req, res, duration) {
    const timestamp = new Date().toISOString();
    const ip = this.getClientIP(req);
    const method = req.method;
    const path = req.path;
    const status = res.statusCode;
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    return `${timestamp} - ${method} ${path} - IP: ${ip} - Status: ${status} - Duration: ${duration}ms - User-Agent: ${userAgent}`;
  }

  /**
   * Log request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} duration - Request duration in ms
   */
  logRequest(req, res, duration) {
    const message = this.formatLogMessage(req, res, duration);
    
    // Log based on level
    switch (this.config.level) {
      case 'debug':
        console.log(`[DEBUG] ${message}`);
        if (this.config.logRequestBody && req.body) {
          console.log(`[DEBUG] Request body: ${JSON.stringify(req.body)}`);
        }
        break;
      case 'info':
        console.log(`[INFO] ${message}`);
        break;
      case 'warn':
        if (res.statusCode >= 400) {
          console.warn(`[WARN] ${message}`);
        }
        break;
      case 'error':
        if (res.statusCode >= 500) {
          console.error(`[ERROR] ${message}`);
        }
        break;
      default:
        console.log(message);
    }
  }

  /**
   * Express middleware for request logging
   * @returns {Function} Express middleware function
   */
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Override res.end to log after response
      const originalEnd = res.end;
      res.end = function(...args) {
        const duration = Date.now() - startTime;
        this.logRequest(req, res, duration);
        originalEnd.apply(this, args);
      }.bind(this);
      
      next();
    };
  }

  /**
   * Log security event
   * @param {string} event - Security event type
   * @param {Object} details - Event details
   */
  logSecurityEvent(event, details) {
    const timestamp = new Date().toISOString();
    const message = `[SECURITY] ${timestamp} - ${event}: ${JSON.stringify(details)}`;
    
    switch (event) {
      case 'RATE_LIMIT_EXCEEDED':
      case 'INVALID_INPUT':
      case 'CORS_VIOLATION':
        console.warn(message);
        break;
      case 'SUSPICIOUS_ACTIVITY':
      case 'UNAUTHORIZED_ACCESS':
        console.error(message);
        break;
      default:
        console.log(message);
    }
  }
}

/**
 * Create request logger instance
 * @param {Object} options - Logger options
 * @returns {RequestLogger} Request logger instance
 */
function createRequestLogger(options = {}) {
  return new RequestLogger(options);
}

module.exports = {
  RequestLogger,
  createRequestLogger
};