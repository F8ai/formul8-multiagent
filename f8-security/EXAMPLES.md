# Formul8 Security SDK Examples

This document provides comprehensive examples of how to use the Formul8 Security SDK in your agents.

## 🚀 Basic Agent Implementation

```javascript
const express = require('express');
const { createAgentSecurity } = require('@formul8/security-sdk');

// Agent configuration
const AGENT_CONFIG = {
  name: 'Compliance Agent',
  description: 'Cannabis regulatory compliance expert',
  keywords: ['compliance', 'regulation', 'legal'],
  specialties: ['State regulations', 'Licensing', 'Audits']
};

// Create security instance
const security = createAgentSecurity(AGENT_CONFIG);
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
    service: 'compliance-agent',
    version: '1.0.0',
    security: security.getSecurityStatus()
  });
});

// Secure chat endpoint
app.post('/api/chat', security.createSecureEndpoint('/api/chat', async (req, res) => {
  try {
    const userContext = req.userContext;
    const { message } = req.body;
    
    // Log user activity
    console.log(`Compliance request from ${userContext.toLogString()}`);
    
    // Create personalized system prompt
    const systemPrompt = userContext.createSystemPrompt(
      `You are a Compliance Agent specializing in cannabis regulatory compliance.
      You help users understand state-specific regulations, licensing requirements,
      and compliance best practices.`
    );
    
    // Process message with user context
    const response = await processComplianceMessage(message, userContext);
    
    res.json({
      success: true,
      response: response,
      agent: 'compliance_agent',
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
    console.error('Error in compliance chat:', error);
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
  // Lambda implementation here
};

// Helper function to process compliance messages
async function processComplianceMessage(message, userContext) {
  // Check if user has access to advanced compliance features
  if (userContext.hasMinimumTier(4)) { // Operator tier or higher
    return `Based on your ${userContext.plan} plan, I can provide comprehensive compliance assistance including:
    - State-specific regulations
    - Licensing requirements
    - Audit preparation
    - Record keeping best practices
    
    What specific compliance question do you have?`;
  } else {
    return `I can help with basic compliance questions. For advanced features like audit preparation and detailed regulatory analysis, consider upgrading to a higher plan.
    
    What compliance question can I help you with?`;
  }
}
```

## 🎯 User Context Examples

### Basic User Context Usage

```javascript
app.post('/api/chat', security.createSecureEndpoint('/api/chat', (req, res) => {
  const userContext = req.userContext;
  
  // Access user information
  console.log(`User: ${userContext.username}`);
  console.log(`Plan: ${userContext.plan}`);
  console.log(`IP: ${userContext.ip}`);
  
  // Check user permissions
  if (userContext.isAdmin()) {
    // Admin-only features
    console.log('Admin user detected');
  }
  
  if (userContext.hasBetaAccess()) {
    // Beta features
    console.log('Beta user detected');
  }
  
  // Create personalized response
  const greeting = userContext.getGreeting();
  const features = userContext.getAvailableFeatures();
  
  res.json({
    success: true,
    response: `${greeting} Available features: ${features.join(', ')}`
  });
}));
```

### Plan-Based Feature Access

```javascript
app.post('/api/chat', security.createSecureEndpoint('/api/chat', (req, res) => {
  const userContext = req.userContext;
  const { message } = req.body;
  
  // Check plan-specific features
  if (userContext.hasPlan('admin')) {
    // Admin features
    return handleAdminRequest(message, userContext);
  } else if (userContext.hasPlan('beta')) {
    // Beta features
    return handleBetaRequest(message, userContext);
  } else if (userContext.hasMinimumTier(3)) {
    // Standard features for tier 3+
    return handleStandardRequest(message, userContext);
  } else {
    // Basic features
    return handleBasicRequest(message, userContext);
  }
}));

function handleAdminRequest(message, userContext) {
  return `Admin access granted. You have full access to all features including:
  - System configuration
  - User management
  - Advanced analytics
  - Debug tools
  
  What would you like to do?`;
}

function handleBetaRequest(message, userContext) {
  return `Beta access granted. You have access to experimental features including:
  - Advanced AI models
  - Beta integrations
  - Early feature access
  
  What would you like to try?`;
}
```

### Personalized System Prompts

```javascript
app.post('/api/chat', security.createSecureEndpoint('/api/chat', async (req, res) => {
  const userContext = req.userContext;
  const { message } = req.body;
  
  // Create personalized system prompt
  const basePrompt = `You are a Formulation Agent specializing in cannabis product formulation.
  You help users create recipes, calculate dosages, and optimize formulations.`;
  
  const systemPrompt = userContext.createSystemPrompt(basePrompt);
  
  // Use the personalized prompt with your AI model
  const response = await callAI(systemPrompt, message);
  
  res.json({
    success: true,
    response: response,
    user: userContext.toAPIResponse()
  });
}));
```

### User Activity Logging

```javascript
app.post('/api/chat', security.createSecureEndpoint('/api/chat', (req, res) => {
  const userContext = req.userContext;
  const { message } = req.body;
  
  // Log user activity
  console.log(`[${userContext.timestamp}] ${userContext.toLogString()} - Message: ${message.substring(0, 100)}...`);
  
  // Track user interactions
  trackUserInteraction(userContext, message);
  
  // Your agent logic here
  const response = processMessage(message, userContext);
  
  res.json({
    success: true,
    response: response,
    user: userContext.toAPIResponse()
  });
}));

function trackUserInteraction(userContext, message) {
  // Track user interactions for analytics
  const interaction = {
    username: userContext.username,
    plan: userContext.plan,
    timestamp: userContext.timestamp,
    messageLength: message.length,
    ip: userContext.ip
  };
  
  // Send to analytics service
  console.log('User interaction tracked:', interaction);
}
```

## 🔒 Security Examples

### Rate Limiting with User Context

```javascript
app.post('/api/chat', security.createSecureEndpoint('/api/chat', (req, res) => {
  const userContext = req.userContext;
  
  // Check if user is approaching rate limit
  const rateLimitStatus = security.rateLimiter.getStatus(userContext.ip);
  
  if (rateLimitStatus.remaining < 5) {
    console.warn(`User ${userContext.username} approaching rate limit: ${rateLimitStatus.remaining} requests remaining`);
  }
  
  // Your agent logic here
  const response = processMessage(req.body.message, userContext);
  
  res.json({
    success: true,
    response: response,
    rateLimit: {
      remaining: rateLimitStatus.remaining,
      resetTime: rateLimitStatus.resetTime
    }
  });
}));
```

### Input Validation with User Context

```javascript
app.post('/api/chat', security.createSecureEndpoint('/api/chat', (req, res) => {
  const userContext = req.userContext;
  const { message } = req.body;
  
  // Additional validation based on user plan
  if (userContext.hasMinimumTier(5)) {
    // Enterprise users can send longer messages
    if (message.length > 5000) {
      return res.status(400).json({
        error: 'Message too long for your plan',
        code: 'MESSAGE_TOO_LONG',
        maxLength: 5000
      });
    }
  }
  
  // Your agent logic here
  const response = processMessage(message, userContext);
  
  res.json({
    success: true,
    response: response,
    user: userContext.toAPIResponse()
  });
}));
```

## 🧪 Testing Examples

### Test User Context

```javascript
const request = require('supertest');
const app = require('./lambda');

describe('User Context', () => {
  test('Admin user gets admin features', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({
        message: 'What can I do?',
        username: 'admin-user',
        plan: 'admin'
      });
    
    expect(response.body.user.plan).toBe('admin');
    expect(response.body.response).toContain('Admin access');
  });
  
  test('Beta user gets beta features', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({
        message: 'What features are available?',
        username: 'beta-user',
        plan: 'beta'
      });
    
    expect(response.body.user.plan).toBe('beta');
    expect(response.body.response).toContain('Beta features');
  });
  
  test('Free user gets basic features', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({
        message: 'What can I do?',
        username: 'free-user',
        plan: 'free'
      });
    
    expect(response.body.user.plan).toBe('free');
    expect(response.body.response).toContain('Basic features');
  });
});
```

### Test Plan-Based Access

```javascript
describe('Plan-Based Access', () => {
  test('Admin can access all features', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({
        message: 'Show me admin features',
        username: 'admin',
        plan: 'admin'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.response).toContain('Admin features');
  });
  
  test('Free user cannot access admin features', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({
        message: 'Show me admin features',
        username: 'free-user',
        plan: 'free'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.response).not.toContain('Admin features');
  });
});
```

## 📊 Analytics Examples

### User Analytics

```javascript
app.post('/api/chat', security.createSecureEndpoint('/api/chat', (req, res) => {
  const userContext = req.userContext;
  const { message } = req.body;
  
  // Track user analytics
  trackUserAnalytics(userContext, message);
  
  // Your agent logic here
  const response = processMessage(message, userContext);
  
  res.json({
    success: true,
    response: response,
    user: userContext.toAPIResponse()
  });
}));

function trackUserAnalytics(userContext, message) {
  const analytics = {
    event: 'chat_message',
    user: {
      username: userContext.username,
      plan: userContext.plan,
      tier: userContext.getPlanTier()
    },
    message: {
      length: message.length,
      timestamp: userContext.timestamp
    },
    context: {
      ip: userContext.ip,
      userAgent: userContext.userAgent
    }
  };
  
  // Send to analytics service
  console.log('Analytics:', analytics);
}
```

---

**For more examples and advanced usage, see the [GitHub Wiki](https://github.com/formul8/f8-security/wiki)**