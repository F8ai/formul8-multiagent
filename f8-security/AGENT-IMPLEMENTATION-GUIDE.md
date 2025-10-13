# Agent Implementation Guide

This guide shows how to implement the Formul8 Security SDK in your agent repository.

## 🚀 Quick Implementation

### 1. Install the Security SDK

```bash
npm install @formul8/security-sdk
```

### 2. Update your `lambda.js`

```javascript
const express = require('express');
const { createAgentSecurity } = require('@formul8/security-sdk');

// Agent configuration
const AGENT_CONFIG = {
  name: 'Your Agent Name',
  description: 'Your agent description',
  keywords: ['keyword1', 'keyword2'],
  specialties: ['specialty1', 'specialty2']
};

// Create security instance
const security = createAgentSecurity(AGENT_CONFIG);

// Create Express app
const app = express();

// Apply security middleware
app.use(security.rateLimiter.middleware());
app.use(security.inputValidator.middleware());
app.use(security.corsManager.middleware());
app.use(security.securityHeaders.middleware());
app.use(security.requestLogger.middleware());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: AGENT_CONFIG.name.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    security: security.getSecurityStatus()
  });
});

// Secure chat endpoint
app.post('/api/chat', security.createSecureEndpoint('/api/chat', async (req, res) => {
  try {
    // User context is automatically extracted and validated
    const userContext = req.userContext; // Contains username, plan, ip, etc.
    const { message } = req.body;
    
    // Create personalized system prompt
    const systemPrompt = userContext.createSystemPrompt(
      `You are a ${AGENT_CONFIG.name} specializing in ${AGENT_CONFIG.description}. 
      Your specialties include: ${AGENT_CONFIG.specialties.join(', ')}. 
      You are part of the Formul8 Multiagent system.`
    );
    
    // Your agent logic here with user context
    const response = await processMessage(message, userContext);
    
    res.json({
      success: true,
      response: response,
      agent: AGENT_CONFIG.name.toLowerCase().replace(/\s+/g, '_'),
      timestamp: new Date().toISOString(),
      model: 'openai/gpt-oss-120b',
      user: userContext.toAPIResponse(),
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        cost: 0
      }
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      response: 'I apologize, but I encountered an error processing your request.'
    });
  }
}));

// Error handling
app.use(security.errorHandler.middleware());

// Lambda handler
exports.handler = async (event, context) => {
  // Your Lambda handler logic here
  // Convert Lambda event to Express request
  // Process through Express app
  // Return Lambda response
};
```

### 3. Update `package.json`

```json
{
  "name": "your-agent-name",
  "version": "1.0.0",
  "description": "Your agent description",
  "main": "lambda.js",
  "dependencies": {
    "express": "^5.1.0",
    "cors": "^2.8.5",
    "@formul8/security-sdk": "^1.0.0"
  }
}
```

## 🔧 Advanced Configuration

### Custom Security Settings

```javascript
const { createAgentSecurity, SecurityConfig } = require('@formul8/security-sdk');

// Update security configuration
SecurityConfig.updateConfig('rateLimit', {
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // 100 requests per window
});

// Create security with custom options
const security = createAgentSecurity(AGENT_CONFIG, {
  rateLimit: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 25 // 25 requests per window
  }
});
```

### Environment Variables

```bash
# .env file
REQUIRE_API_KEY=true
VALID_API_KEYS=your-api-key-1,your-api-key-2
RATE_LIMIT_MAX=50
RATE_LIMIT_WINDOW=900000
SECURITY_LOG_LEVEL=info
```

### User Context Usage

```javascript
const { UserContext } = require('@formul8/security-sdk');

// In your chat endpoint
app.post('/api/chat', security.createSecureEndpoint('/api/chat', async (req, res) => {
  const userContext = req.userContext; // Automatically provided
  
  // Access user information
  console.log(`User: ${userContext.username}, Plan: ${userContext.plan}`);
  
  // Check user permissions
  if (userContext.isAdmin()) {
    // Admin-only features
  }
  
  if (userContext.hasBetaAccess()) {
    // Beta features
  }
  
  // Create personalized responses
  const greeting = userContext.getGreeting();
  const features = userContext.getAvailableFeatures();
  
  // Create system prompt with user context
  const systemPrompt = userContext.createSystemPrompt(basePrompt);
  
  // Your agent logic here
}));
```

### Custom Error Handling

```javascript
// Custom error handler
app.use((err, req, res, next) => {
  // Your custom error handling
  console.error('Custom error:', err);
  
  // Call the security error handler
  security.errorHandler.middleware()(err, req, res, next);
});
```

## 🧪 Testing

### Test Security Features

```javascript
const request = require('supertest');
const app = require('./lambda');

describe('Security Features', () => {
  test('Rate limiting works', async () => {
    // Send multiple requests quickly
    for (let i = 0; i < 60; i++) {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'test' });
      
      if (i < 50) {
        expect(response.status).not.toBe(429);
      } else {
        expect(response.status).toBe(429);
      }
    }
  });

  test('Input validation works', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({ message: '<script>alert(1)</script>' });
    
    expect(response.body.response).not.toContain('<script>');
  });

  test('CORS protection works', async () => {
    const response = await request(app)
      .post('/api/chat')
      .set('Origin', 'https://malicious-site.com')
      .send({ message: 'test' });
    
    expect(response.status).toBe(403);
  });
});
```

## 📋 Security Checklist

- [ ] Security SDK installed
- [ ] Agent configuration defined
- [ ] Security middleware applied
- [ ] Health endpoint secured
- [ ] Chat endpoint secured
- [ ] Error handling implemented
- [ ] Environment variables configured
- [ ] Tests written and passing
- [ ] Lambda function deployed
- [ ] API Gateway configured
- [ ] Security monitoring enabled

## 🚨 Security Best Practices

1. **Never commit API keys** to your repository
2. **Use environment variables** for sensitive configuration
3. **Regularly update dependencies** for security patches
4. **Monitor security logs** for suspicious activity
5. **Test security features** after each deployment
6. **Keep security SDK updated** to latest version
7. **Implement proper error handling** for all endpoints
8. **Use HTTPS** for all communications
9. **Validate all inputs** before processing
10. **Log security events** for monitoring

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/formul8/f8-security/wiki)
- **Issues**: [GitHub Issues](https://github.com/formul8/f8-security/issues)
- **Email**: security@formul8.ai

---

**Made with ❤️ by the Formul8 Team**