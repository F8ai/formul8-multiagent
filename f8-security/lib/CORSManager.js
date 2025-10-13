/**
 * CORS Manager
 * CORS configuration and management for Formul8 agents
 */

const cors = require('cors');
const { getConfig } = require('./SecurityConfig');

/**
 * CORS Manager Class
 */
class CORSManager {
  constructor(options = {}) {
    this.config = { ...getConfig('cors'), ...options };
  }

  /**
   * Check if origin is allowed
   * @param {string} origin - Origin to check
   * @returns {boolean} Whether origin is allowed
   */
  isOriginAllowed(origin) {
    if (!origin) {
      return true; // Allow requests without origin (e.g., mobile apps)
    }
    
    return this.config.allowedOrigins.includes(origin);
  }

  /**
   * Get CORS options
   * @returns {Object} CORS options
   */
  getCORSOptions() {
    return {
      origin: (origin, callback) => {
        if (this.isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: this.config.credentials,
      optionsSuccessStatus: this.config.optionsSuccessStatus,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key'
      ]
    };
  }

  /**
   * Express middleware for CORS
   * @returns {Function} Express middleware function
   */
  middleware() {
    return cors(this.getCORSOptions());
  }

  /**
   * Add allowed origin
   * @param {string} origin - Origin to add
   */
  addAllowedOrigin(origin) {
    if (!this.config.allowedOrigins.includes(origin)) {
      this.config.allowedOrigins.push(origin);
    }
  }

  /**
   * Remove allowed origin
   * @param {string} origin - Origin to remove
   */
  removeAllowedOrigin(origin) {
    const index = this.config.allowedOrigins.indexOf(origin);
    if (index > -1) {
      this.config.allowedOrigins.splice(index, 1);
    }
  }

  /**
   * Get allowed origins
   * @returns {Array} List of allowed origins
   */
  getAllowedOrigins() {
    return [...this.config.allowedOrigins];
  }
}

/**
 * Create CORS manager instance
 * @param {Object} options - CORS options
 * @returns {CORSManager} CORS manager instance
 */
function createCORSManager(options = {}) {
  return new CORSManager(options);
}

module.exports = {
  CORSManager,
  createCORSManager
};