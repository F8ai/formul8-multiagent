/**
 * Error Handler
 * Centralized error handling for Formul8 agents
 */

const { getConfig } = require('./SecurityConfig');

/**
 * Error Handler Class
 */
class ErrorHandler {
  constructor(options = {}) {
    this.config = options;
  }

  /**
   * Handle CORS errors
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  handleCORSError(err, req, res, next) {
    if (err.message === 'Not allowed by CORS') {
      return res.status(403).json({
        error: 'CORS policy violation',
        code: 'CORS_ERROR',
        message: 'Request origin not allowed'
      });
    }
    next(err);
  }

  /**
   * Handle validation errors
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  handleValidationError(err, req, res, next) {
    if (err.code === 'INPUT_VALIDATION_ERROR') {
      return res.status(400).json({
        error: 'Input validation failed',
        code: 'VALIDATION_ERROR',
        message: err.message
      });
    }
    next(err);
  }

  /**
   * Handle rate limit errors
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  handleRateLimitError(err, req, res, next) {
    if (err.code === 'RATE_LIMIT_EXCEEDED') {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_ERROR',
        message: 'Too many requests, please try again later'
      });
    }
    next(err);
  }

  /**
   * Handle authentication errors
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  handleAuthError(err, req, res, next) {
    if (err.code === 'MISSING_API_KEY' || err.code === 'INVALID_API_KEY') {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_ERROR',
        message: 'Valid API key required'
      });
    }
    next(err);
  }

  /**
   * Handle access control errors
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  handleAccessControlError(err, req, res, next) {
    if (err.code === 'PLAN_ACCESS_DENIED') {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED',
        message: 'Insufficient permissions for this plan'
      });
    }
    next(err);
  }

  /**
   * Handle generic errors
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  handleGenericError(err, req, res, next) {
    console.error('Unhandled error:', err);
    
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    });
  }

  /**
   * Express middleware for error handling
   * @returns {Function} Express error middleware function
   */
  middleware() {
    return (err, req, res, next) => {
      // Handle specific error types
      this.handleCORSError(err, req, res, next);
      this.handleValidationError(err, req, res, next);
      this.handleRateLimitError(err, req, res, next);
      this.handleAuthError(err, req, res, next);
      this.handleAccessControlError(err, req, res, next);
      this.handleGenericError(err, req, res, next);
    };
  }

  /**
   * Create custom error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {number} statusCode - HTTP status code
   * @returns {Error} Custom error object
   */
  createError(message, code, statusCode = 500) {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    return error;
  }

  /**
   * Log error
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   */
  logError(err, req) {
    const timestamp = new Date().toISOString();
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    console.error(`[ERROR] ${timestamp} - IP: ${ip} - User-Agent: ${userAgent} - ${err.message}`);
    console.error(err.stack);
  }
}

/**
 * Create error handler instance
 * @param {Object} options - Error handler options
 * @returns {ErrorHandler} Error handler instance
 */
function createErrorHandler(options = {}) {
  return new ErrorHandler(options);
}

module.exports = {
  ErrorHandler,
  createErrorHandler
};