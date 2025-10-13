# @formul8/security-sdk

[![npm version](https://badge.fury.io/js/%40formul8%2Fsecurity-sdk.svg)](https://badge.fury.io/js/%40formul8%2Fsecurity-sdk)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

**Formul8 Multiagent Security SDK** - Comprehensive security middleware for all Formul8 agents.

## 🚀 Quick Start

```bash
npm install @formul8/security-sdk
```

```javascript
const { createSecureApp, createAgentSecurity } = require('@formul8/security-sdk');

// Create a secure Express app
const app = createSecureApp();

// Or create agent-specific security
const security = createAgentSecurity({
  name: 'Compliance Agent',
  description: 'Cannabis regulatory compliance expert',
  keywords: ['compliance', 'regulation', 'legal'],
  specialties: ['State regulations', 'Licensing', 'Audits']
});
```

## 🔒 Security Features

### ✅ Rate Limiting
- 50 requests per 15 minutes per IP
- Customizable limits and windows
- Proper error responses with retry information

### ✅ Input Validation & Sanitization
- Message length limits (2000 characters)
- Username length limits (50 characters)
- XSS protection (script tag removal, event handler removal)
- Content filtering for malicious patterns

### ✅ CORS Protection
- Restricted to trusted origins:
  - `https://f8.syzygyx.com`
  - `https://f8ai.github.io`
  - `https://formul8.ai`

### ✅ Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### ✅ Request Logging & Monitoring
- IP address tracking
- User agent logging
- Request timestamp logging
- Error logging with context

### ✅ Plan-Based Access Control
- Validate plan parameters
- Restrict agent access based on user plan
- Proper error responses for access denied

### ✅ User Context Management
- Automatic user context extraction and validation
- Plan-based feature access control
- Personalized responses based on user plan
- User activity logging and monitoring

## 📖 Usage

### Basic Setup

```javascript
const express = require('express');
const { createSecureApp } = require('@formul8/security-sdk');

const app = createSecureApp();

// Your routes here
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.post('/api/chat', (req, res) => {
  // Your chat logic here
  res.json({ success: true, response: 'Hello!' });
});
```

### Agent-Specific Security

```javascript
const { createAgentSecurity } = require('@formul8/security-sdk');

const security = createAgentSecurity({
  name: 'Compliance Agent',
  description: 'Cannabis regulatory compliance expert',
  keywords: ['compliance', 'regulation', 'legal'],
  specialties: ['State regulations', 'Licensing', 'Audits']
});

// Use security middleware
app.use(security.rateLimiter.middleware());
app.use(security.inputValidator.middleware());

// Create secure endpoint
app.post('/api/chat', security.createSecureEndpoint('/api/chat', (req, res) => {
  // User context is automatically available
  const userContext = req.userContext;
  
  // Create personalized response
  const greeting = userContext.getGreeting();
  const features = userContext.getAvailableFeatures();
  
  res.json({ 
    success: true, 
    response: `${greeting} Available features: ${features.join(', ')}`,
    user: userContext.toAPIResponse()
  });
}));
```

### Individual Components

```javascript
const { 
  RateLimiter, 
  InputValidator, 
  CORSManager,
  SecurityHeaders 
} = require('@formul8/security-sdk');

// Use individual components
const rateLimiter = new RateLimiter();
const inputValidator = new InputValidator();
const corsManager = new CORSManager();
const securityHeaders = new SecurityHeaders();

app.use(securityHeaders.middleware());
app.use(corsManager.middleware());
app.use(rateLimiter.middleware());
app.use(inputValidator.middleware());
```

## ⚙️ Configuration

### Environment Variables

```bash
# API Key Authentication
REQUIRE_API_KEY=true
VALID_API_KEYS=key1,key2,key3

# Rate Limiting
RATE_LIMIT_MAX=50
RATE_LIMIT_WINDOW=900000

# Logging
SECURITY_LOG_LEVEL=info
```

### Custom Configuration

```javascript
const { SecurityConfig } = require('@formul8/security-sdk');

// Update configuration
SecurityConfig.updateConfig('rateLimit', {
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // 100 requests per window
});

// Get configuration
const config = SecurityConfig.getConfig('rateLimit');
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📚 API Reference

### SecurityMiddleware

Main security middleware class.

#### Methods

- `createSecureApp(options)` - Create a secure Express app
- `createAgentSecurity(agentConfig)` - Create agent-specific security
- `applySecurityMiddleware(app)` - Apply all security middleware
- `getSecurityStatus()` - Get current security status

### RateLimiter

Rate limiting functionality.

#### Methods

- `checkRateLimit(ip)` - Check if IP is within rate limit
- `middleware()` - Express middleware for rate limiting
- `reset(ip)` - Reset rate limit for IP
- `getStatus(ip)` - Get rate limit status for IP

### InputValidator

Input validation and sanitization.

#### Methods

- `validateAndSanitize(input, fieldName)` - Validate and sanitize input
- `validateMessage(message)` - Validate message input
- `validateUsername(username)` - Validate username input
- `validatePlan(plan)` - Validate plan input
- `middleware()` - Express middleware for input validation

### CORSManager

CORS configuration and management.

#### Methods

- `isOriginAllowed(origin)` - Check if origin is allowed
- `addAllowedOrigin(origin)` - Add allowed origin
- `removeAllowedOrigin(origin)` - Remove allowed origin
- `middleware()` - Express middleware for CORS

## 🔧 Development

### Setup

```bash
git clone https://github.com/formul8/f8-security.git
cd f8-security
npm install
```

### Scripts

```bash
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm test              # Run tests
npm run build         # Build and test
```

## 📄 License

**PROPRIETARY LICENSE** - This software is proprietary and confidential to Formul8, Inc.

**RESTRICTED USE**: This software is licensed for internal use only within the Formul8 ecosystem. 
Unauthorized copying, distribution, or modification is strictly prohibited.

See [LICENSE](LICENSE) file for complete terms and conditions.

**For licensing questions, contact: legal@formul8.ai**

## 🤝 Contributing

This is a proprietary Formul8 internal project. 

**For internal Formul8 team members:**
1. Create a feature branch from main
2. Make your changes
3. Add tests
4. Submit a pull request for review

**For external contributors:**
This software is proprietary and not open for external contributions. 
For security research or collaboration opportunities, contact: security@formul8.ai

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/formul8/f8-security/wiki)
- **Issues**: [GitHub Issues](https://github.com/formul8/f8-security/issues)
- **Email**: security@formul8.ai

## 🔄 Changelog

### v1.0.0
- Initial release
- Rate limiting
- Input validation
- CORS protection
- Security headers
- Request logging
- Plan-based access control
- Comprehensive error handling

---

**Made with ❤️ by the Formul8 Team**