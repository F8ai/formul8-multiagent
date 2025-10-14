# Formul8 Authentication System

## Overview

The Formul8 Multiagent system implements a tiered authentication system that allows:
- **Free Mode**: Limited access without authentication (rate limited, basic features)
- **Paid Modes**: Full access with authentication (standard, enterprise, etc.)
- **Secure Endpoints**: All endpoints protected, no public access

## Authentication Architecture

### 1. Access Tiers

```
┌─────────────────────────────────────────────────────────────┐
│                    ACCESS TIERS                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   FREE MODE     │    │   PAID MODES    │                │
│  │                 │    │                 │                │
│  │ • No Auth       │    │ • JWT Required  │                │
│  │ • Rate Limited  │    │ • Full Access   │                │
│  │ • Basic Agents  │    │ • All Agents    │                │
│  │ • 10 req/hour   │    │ • Higher Limits │                │
│  │ • No Analytics  │    │ • Analytics     │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Frontend      │    │   Backend       │                │
│  │                 │    │                 │                │
│  │ 1. Check Auth   │───►│ 2. Validate     │                │
│  │ 2. Send Request │    │ 3. Check Plan   │                │
│  │ 3. Handle Resp  │◄───│ 4. Route Agent  │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Security Implementation

#### API Key System
- **Free Mode**: IP-based rate limiting + basic API key
- **Paid Modes**: JWT tokens + user-specific API keys
- **Agent Access**: Plan-based permissions

#### Rate Limiting Strategy
```javascript
// Free Mode: 10 requests/hour per IP
// Standard: 100 requests/hour per user
// Enterprise: 1000 requests/hour per user
// Admin: Unlimited
```

## Implementation

### 1. Environment Variables

```bash
# Authentication
AUTH_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret
FREE_MODE_API_KEY=free-access-key

# Rate Limiting
REDIS_URL=redis://localhost:6379
RATE_LIMIT_FREE=10
RATE_LIMIT_STANDARD=100
RATE_LIMIT_ENTERPRISE=1000

# Plan Configuration
DEFAULT_PLAN=free
PLAN_CONFIG_URL=https://formul8-platform.vercel.app/api/plans
```

### 2. Middleware Implementation

```javascript
// Authentication middleware
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const authToken = req.headers['authorization'];
  
  if (apiKey === process.env.FREE_MODE_API_KEY) {
    req.user = { plan: 'free', id: 'anonymous' };
    return next();
  }
  
  if (authToken) {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  }
  
  return res.status(401).json({ error: 'Authentication required' });
};

// Plan-based access control
const checkPlanAccess = (requiredPlan) => {
  return (req, res, next) => {
    const userPlan = req.user?.plan || 'free';
    const planHierarchy = ['free', 'standard', 'enterprise', 'admin'];
    
    if (planHierarchy.indexOf(userPlan) >= planHierarchy.indexOf(requiredPlan)) {
      return next();
    }
    
    return res.status(403).json({ 
      error: 'Insufficient plan access',
      required: requiredPlan,
      current: userPlan
    });
  };
};
```

### 3. Rate Limiting Implementation

```javascript
// Redis-based rate limiting
const rateLimiter = async (req, res, next) => {
  const identifier = req.user?.id || req.ip;
  const plan = req.user?.plan || 'free';
  
  const limits = {
    free: 10,
    standard: 100,
    enterprise: 1000,
    admin: Infinity
  };
  
  const limit = limits[plan];
  const key = `rate_limit:${identifier}`;
  
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, 3600); // 1 hour
  }
  
  if (current > limit) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      limit: limit,
      current: current
    });
  }
  
  next();
};
```

## Agent Access Control

### 1. Agent Permissions by Plan

```javascript
const AGENT_PERMISSIONS = {
  free: ['compliance', 'formulation', 'science'],
  standard: ['compliance', 'formulation', 'science', 'operations', 'marketing'],
  enterprise: ['compliance', 'formulation', 'science', 'operations', 'marketing', 'sourcing', 'patent', 'spectra'],
  admin: ['compliance', 'formulation', 'science', 'operations', 'marketing', 'sourcing', 'patent', 'spectra', 'customer-success', 'f8-slackbot', 'mcr', 'ad', 'editor']
};
```

### 2. Agent Selection Logic

```javascript
const selectAgent = (message, userPlan) => {
  const availableAgents = AGENT_PERMISSIONS[userPlan] || AGENT_PERMISSIONS.free;
  
  // Keyword-based agent selection
  for (const agent of availableAgents) {
    if (message.includes(agent.keywords)) {
      return agent;
    }
  }
  
  // Default to first available agent
  return availableAgents[0];
};
```

## Security Features

### 1. Endpoint Protection
- All endpoints require authentication
- No public access to agent APIs
- CORS configured for specific origins
- Rate limiting on all endpoints

### 2. Data Protection
- User data encrypted in transit and at rest
- API keys rotated regularly
- Audit logging for all requests
- Input validation and sanitization

### 3. Monitoring
- Real-time rate limit monitoring
- Authentication failure tracking
- Agent usage analytics
- Security incident detection

## Implementation Steps

1. **Set up Redis** for rate limiting
2. **Configure JWT** authentication
3. **Implement middleware** in all agents
4. **Update frontend** to handle authentication
5. **Configure domain** and SSL
6. **Set up monitoring** and logging

This system provides secure, tiered access while maintaining the ability to offer free access without exposing endpoints publicly.