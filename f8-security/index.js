/**
 * @formul8/security-sdk
 * Formul8 Multiagent Security SDK
 * 
 * Comprehensive security middleware for all Formul8 agents
 * Provides rate limiting, input validation, CORS protection, and more
 */

const SecurityMiddleware = require('./lib/SecurityMiddleware');
const RateLimiter = require('./lib/RateLimiter');
const InputValidator = require('./lib/InputValidator');
const CORSManager = require('./lib/CORSManager');
const SecurityHeaders = require('./lib/SecurityHeaders');
const RequestLogger = require('./lib/RequestLogger');
const ErrorHandler = require('./lib/ErrorHandler');
const AgentAccessControl = require('./lib/AgentAccessControl');
const SecurityConfig = require('./lib/SecurityConfig');
const UserContext = require('./lib/UserContext');

module.exports = {
  // Main security middleware
  SecurityMiddleware,
  
  // Individual components
  RateLimiter,
  InputValidator,
  CORSManager,
  SecurityHeaders,
  RequestLogger,
  ErrorHandler,
  AgentAccessControl,
  SecurityConfig,
  UserContext,
  
  // Quick setup functions
  createSecureApp: SecurityMiddleware.createSecureApp,
  createAgentSecurity: SecurityMiddleware.createAgentSecurity,
  
  // Version
  version: require('./package.json').version
};