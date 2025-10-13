/**
 * Input Validator
 * Comprehensive input validation and sanitization for Formul8 agents
 */

const { getConfig } = require('./SecurityConfig');

/**
 * Input Validator Class
 */
class InputValidator {
  constructor(options = {}) {
    this.config = { ...getConfig('input'), ...options };
    this.xssPatterns = getConfig('xssPatterns');
    this.contentFilterPatterns = getConfig('contentFilter').patterns;
  }

  /**
   * Validate and sanitize input
   * @param {string} input - Input to validate
   * @param {string} fieldName - Field name for error messages
   * @returns {string|null} Sanitized input or null if invalid
   */
  validateAndSanitize(input, fieldName = 'input') {
    if (!input || typeof input !== 'string') {
      return null;
    }
    
    // Trim whitespace
    let sanitized = input.trim();
    
    // Check if empty after trimming
    if (sanitized.length === 0) {
      return null;
    }
    
    // Check length limits
    const maxLength = this.getMaxLength(fieldName);
    if (sanitized.length > maxLength) {
      throw new Error(`${fieldName} too long. Maximum ${maxLength} characters allowed.`);
    }
    
    // Apply XSS protection
    sanitized = this.applyXSSProtection(sanitized);
    
    // Apply content filtering
    sanitized = this.applyContentFiltering(sanitized);
    
    return sanitized;
  }

  /**
   * Get maximum length for field
   * @param {string} fieldName - Field name
   * @returns {number} Maximum length
   */
  getMaxLength(fieldName) {
    switch (fieldName.toLowerCase()) {
      case 'username':
        return this.config.maxUsernameLength;
      case 'plan':
        return this.config.maxPlanLength;
      case 'message':
      default:
        return this.config.maxMessageLength;
    }
  }

  /**
   * Apply XSS protection
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized input
   */
  applyXSSProtection(input) {
    let sanitized = input;
    
    // Remove XSS patterns
    this.xssPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized;
  }

  /**
   * Apply content filtering
   * @param {string} input - Input to filter
   * @returns {string} Filtered input
   */
  applyContentFiltering(input) {
    let filtered = input;
    
    // Apply content filter patterns
    this.contentFilterPatterns.forEach(pattern => {
      filtered = filtered.replace(pattern, '');
    });
    
    return filtered;
  }

  /**
   * Validate message input
   * @param {string} message - Message to validate
   * @returns {string|null} Validated message or null if invalid
   */
  validateMessage(message) {
    return this.validateAndSanitize(message, 'message');
  }

  /**
   * Validate username input
   * @param {string} username - Username to validate
   * @returns {string} Validated username or 'anonymous' if invalid
   */
  validateUsername(username) {
    const validated = this.validateAndSanitize(username, 'username');
    return validated || 'anonymous';
  }

  /**
   * Validate plan input
   * @param {string} plan - Plan to validate
   * @returns {string} Valid plan or default plan
   */
  validatePlan(plan) {
    const validPlans = getConfig('plans').valid;
    return validPlans.includes(plan) ? plan : getConfig('plans').default;
  }

  /**
   * Validate request body
   * @param {Object} body - Request body to validate
   * @returns {Object} Validated request body
   */
  validateRequestBody(body) {
    const validated = { ...body };
    
    // Validate message
    if (validated.message) {
      try {
        validated.message = this.validateMessage(validated.message);
        if (!validated.message) {
          throw new Error('Invalid message content');
        }
      } catch (error) {
        throw new Error(`Message validation failed: ${error.message}`);
      }
    }
    
    // Validate username
    if (validated.username) {
      validated.username = this.validateUsername(validated.username);
    }
    
    // Validate plan
    if (validated.plan) {
      validated.plan = this.validatePlan(validated.plan);
    }
    
    return validated;
  }

  /**
   * Express middleware for input validation
   * @returns {Function} Express middleware function
   */
  middleware() {
    return (req, res, next) => {
      try {
        if (req.body) {
          req.body = this.validateRequestBody(req.body);
        }
        next();
      } catch (error) {
        return res.status(400).json({
          error: error.message,
          code: 'INPUT_VALIDATION_ERROR'
        });
      }
    };
  }
}

/**
 * Create input validator instance
 * @param {Object} options - Validator options
 * @returns {InputValidator} Input validator instance
 */
function createInputValidator(options = {}) {
  return new InputValidator(options);
}

module.exports = {
  InputValidator,
  createInputValidator
};