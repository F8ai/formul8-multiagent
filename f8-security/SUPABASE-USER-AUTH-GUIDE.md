# Supabase User Authentication & Authorization Guide

This guide demonstrates how to retrieve and manage user data (user ID, authorization, and subscription plan) from a front-end application and Supabase backend in the Formul8 Multiagent system.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Front-End Integration](#front-end-integration)
- [Supabase Backend Integration](#supabase-backend-integration)
- [Complete Implementation Example](#complete-implementation-example)
- [Security Best Practices](#security-best-practices)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This guide covers:
- Retrieving user authentication data from Supabase
- Fetching user subscription plans and authorization levels
- Secure API key management
- Integration with the Formul8 Security SDK
- Best practices for managing sensitive user data

## 📦 Prerequisites

### Required Dependencies

```bash
npm install @supabase/supabase-js @formul8/security-sdk express cors dotenv
```

### Environment Variables

Create a `.env` file in your project root:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security Configuration
REQUIRE_API_KEY=false
VALID_API_KEYS=your-api-key-1,your-api-key-2

# Rate Limiting
RATE_LIMIT_MAX=50
RATE_LIMIT_WINDOW=900000

# Application Configuration
NODE_ENV=development
PORT=3000
```

**⚠️ SECURITY WARNING:** Never commit the `.env` file to version control. Add it to `.gitignore`.

## 🌐 Front-End Integration

### 1. Initialize Supabase Client

```javascript
// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

/**
 * Get current authenticated user
 * @returns {Promise<Object>} User object or null
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Exception fetching user:', error);
    return null;
  }
}

/**
 * Get user session
 * @returns {Promise<Object>} Session object or null
 */
export async function getUserSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Exception fetching session:', error);
    return null;
  }
}
```

### 2. Fetch User Profile and Subscription Data

```javascript
// userService.js
import { supabase } from './supabaseClient';

/**
 * Fetch user profile including subscription plan
 * @param {string} userId - User ID from Supabase auth
 * @returns {Promise<Object>} User profile with subscription data
 */
export async function getUserProfile(userId) {
  try {
    // Fetch user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        email,
        created_at,
        updated_at,
        subscription:subscriptions (
          id,
          plan,
          status,
          started_at,
          expires_at
        )
      `)
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw profileError;
    }
    
    return profile;
  } catch (error) {
    console.error('Exception fetching user profile:', error);
    throw error;
  }
}

/**
 * Get user authorization level
 * @param {string} userId - User ID from Supabase auth
 * @returns {Promise<Object>} User authorization data
 */
export async function getUserAuthorization(userId) {
  try {
    const { data: authData, error } = await supabase
      .from('user_roles')
      .select(`
        role,
        permissions,
        granted_at
      `)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user authorization:', error);
      // Return default authorization if not found
      return {
        role: 'user',
        permissions: ['read'],
        granted_at: new Date().toISOString()
      };
    }
    
    return authData;
  } catch (error) {
    console.error('Exception fetching user authorization:', error);
    throw error;
  }
}

/**
 * Get complete user data (profile, subscription, and authorization)
 * @param {string} userId - User ID from Supabase auth
 * @returns {Promise<Object>} Complete user data
 */
export async function getCompleteUserData(userId) {
  try {
    const [profile, authorization] = await Promise.all([
      getUserProfile(userId),
      getUserAuthorization(userId)
    ]);
    
    return {
      id: userId,
      username: profile.username,
      email: profile.email,
      plan: profile.subscription?.plan || 'free',
      subscriptionStatus: profile.subscription?.status || 'inactive',
      role: authorization.role,
      permissions: authorization.permissions,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    };
  } catch (error) {
    console.error('Exception fetching complete user data:', error);
    throw error;
  }
}
```

### 3. React Component Example

```javascript
// UserDashboard.jsx
import React, { useState, useEffect } from 'react';
import { getCurrentUser, getUserSession } from './supabaseClient';
import { getCompleteUserData } from './userService';

function UserDashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);
        
        // Get current user from Supabase auth
        const user = await getCurrentUser();
        
        if (!user) {
          setError('No authenticated user found');
          setLoading(false);
          return;
        }
        
        // Get complete user data
        const completeData = await getCompleteUserData(user.id);
        setUserData(completeData);
      } catch (err) {
        console.error('Error loading user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadUserData();
  }, []);
  
  if (loading) {
    return <div>Loading user data...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  if (!userData) {
    return <div>No user data available</div>;
  }
  
  return (
    <div className="user-dashboard">
      <h1>User Dashboard</h1>
      
      <div className="user-info">
        <h2>Profile Information</h2>
        <p><strong>User ID:</strong> {userData.id}</p>
        <p><strong>Username:</strong> {userData.username}</p>
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Role:</strong> {userData.role}</p>
      </div>
      
      <div className="subscription-info">
        <h2>Subscription Details</h2>
        <p><strong>Plan:</strong> {userData.plan}</p>
        <p><strong>Status:</strong> {userData.subscriptionStatus}</p>
      </div>
      
      <div className="authorization-info">
        <h2>Authorization</h2>
        <p><strong>Permissions:</strong> {userData.permissions.join(', ')}</p>
      </div>
    </div>
  );
}

export default UserDashboard;
```

## 🔧 Supabase Backend Integration

### 1. Database Schema

Create the following tables in your Supabase project:

```sql
-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'standard', 'micro', 'operator', 'enterprise', 'beta', 'admin', 'future4200')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

-- User roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'moderator', 'admin', 'superadmin')),
  permissions TEXT[] NOT NULL DEFAULT ARRAY['read'],
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### 2. Row Level Security (RLS) Policies

Secure your tables with Row Level Security:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Admin policies (service role only)
CREATE POLICY "Service role can manage all data"
  ON profiles FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage roles"
  ON user_roles FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

### 3. Database Functions

Create helper functions for common operations:

```sql
-- Function to get user's plan
CREATE OR REPLACE FUNCTION get_user_plan(user_id UUID)
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT plan FROM subscriptions WHERE user_id = $1 AND status = 'active' LIMIT 1),
    'free'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user has minimum tier
CREATE OR REPLACE FUNCTION has_minimum_tier(user_id UUID, min_tier INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  plan_tier INTEGER;
BEGIN
  user_plan := get_user_plan(user_id);
  
  plan_tier := CASE user_plan
    WHEN 'free' THEN 1
    WHEN 'standard' THEN 2
    WHEN 'micro' THEN 3
    WHEN 'operator' THEN 4
    WHEN 'enterprise' THEN 5
    WHEN 'beta' THEN 6
    WHEN 'admin' THEN 7
    WHEN 'future4200' THEN 8
    ELSE 1
  END;
  
  RETURN plan_tier >= min_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user permission
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, permission TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM user_roles
    WHERE user_id = $1 AND permission = ANY(permissions)
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

### 4. Server-Side User Data Retrieval

```javascript
// server/supabaseService.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client with service role key for backend operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Get user data by ID (server-side with elevated privileges)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User data
 */
async function getUserDataById(userId) {
  try {
    // Use service role client to bypass RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        username,
        email,
        created_at,
        subscriptions (
          plan,
          status,
          started_at,
          expires_at
        ),
        user_roles (
          role,
          permissions
        )
      `)
      .eq('id', userId)
      .single();
    
    if (profileError) {
      throw profileError;
    }
    
    return {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      plan: profile.subscriptions?.[0]?.plan || 'free',
      subscriptionStatus: profile.subscriptions?.[0]?.status || 'inactive',
      role: profile.user_roles?.[0]?.role || 'user',
      permissions: profile.user_roles?.[0]?.permissions || ['read'],
      createdAt: profile.created_at
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}

/**
 * Verify user JWT token and get user data
 * @param {string} token - JWT token from request
 * @returns {Promise<Object>} User data
 */
async function verifyAndGetUserData(token) {
  try {
    // Verify the JWT token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      throw new Error('Invalid token');
    }
    
    // Get complete user data
    const userData = await getUserDataById(user.id);
    
    return userData;
  } catch (error) {
    console.error('Error verifying user:', error);
    throw error;
  }
}

/**
 * Update user subscription plan
 * @param {string} userId - User ID
 * @param {string} plan - New plan name
 * @returns {Promise<Object>} Updated subscription data
 */
async function updateUserPlan(userId, plan) {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan: plan,
        status: 'active',
        started_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating user plan:', error);
    throw error;
  }
}

module.exports = {
  supabaseAdmin,
  getUserDataById,
  verifyAndGetUserData,
  updateUserPlan
};
```

## 🔐 Complete Implementation Example

### Express Server with Supabase Integration

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const { createAgentSecurity } = require('@formul8/security-sdk');
const { verifyAndGetUserData, getUserDataById } = require('./supabaseService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Agent configuration
const AGENT_CONFIG = {
  name: 'User Data Agent',
  description: 'Demonstrates Supabase user data retrieval',
  keywords: ['user', 'authentication', 'authorization'],
  specialties: ['User management', 'Subscription handling']
};

// Create security instance
const security = createAgentSecurity(AGENT_CONFIG);

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(security.requestLogger.middleware());

/**
 * Middleware to extract and verify Supabase user from token
 */
async function supabaseAuthMiddleware(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header',
        code: 'UNAUTHORIZED'
      });
    }
    
    const token = authHeader.substring(7);
    
    // Verify token and get user data
    const userData = await verifyAndGetUserData(token);
    
    // Attach user data to request
    req.supabaseUser = userData;
    req.userContext = {
      username: userData.username,
      plan: userData.plan,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'user-data-agent',
    version: '1.0.0'
  });
});

// Get current user data (requires authentication)
app.get('/api/user', supabaseAuthMiddleware, async (req, res) => {
  try {
    const userData = req.supabaseUser;
    
    res.json({
      success: true,
      data: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        plan: userData.plan,
        subscriptionStatus: userData.subscriptionStatus,
        role: userData.role,
        permissions: userData.permissions
      }
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user data'
    });
  }
});

// Get user plan and features
app.get('/api/user/plan', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { plan, permissions } = req.supabaseUser;
    
    // Map plan to tier level
    const tierMap = {
      'free': 1,
      'standard': 2,
      'micro': 3,
      'operator': 4,
      'enterprise': 5,
      'beta': 6,
      'admin': 7,
      'future4200': 8
    };
    
    const tier = tierMap[plan] || 1;
    
    // Define features by plan
    const features = {
      'free': ['Basic chat', 'Standard responses'],
      'standard': ['Basic chat', 'Standard responses', 'Formulation help'],
      'micro': ['Basic chat', 'Standard responses', 'Formulation help', 'Compliance assistance'],
      'operator': ['All micro features', 'Operations support', 'Advanced analytics'],
      'enterprise': ['All operator features', 'Marketing tools', 'Custom integrations'],
      'beta': ['All standard features', 'Beta features', 'Early access'],
      'admin': ['All features', 'Admin tools', 'System management'],
      'future4200': ['All features', 'Future4200 integration', 'Community tools']
    };
    
    res.json({
      success: true,
      data: {
        plan: plan,
        tier: tier,
        features: features[plan] || features['free'],
        permissions: permissions
      }
    });
  } catch (error) {
    console.error('Error fetching plan data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plan data'
    });
  }
});

// Secure chat endpoint with user context
app.post('/api/chat', supabaseAuthMiddleware, security.createSecureEndpoint('/api/chat', async (req, res) => {
  try {
    const userContext = req.userContext;
    const userData = req.supabaseUser;
    const { message } = req.body;
    
    // Log the request with user data
    console.log(`Chat request - User: ${userData.username}, Plan: ${userData.plan}, Message: ${message.substring(0, 50)}...`);
    
    // Create personalized response based on user plan
    let response = `Hello ${userData.username}! `;
    
    if (userData.role === 'admin') {
      response += 'As an admin, you have access to all system features. ';
    } else if (userData.plan === 'enterprise') {
      response += 'With your enterprise plan, you have access to advanced features including custom integrations. ';
    } else {
      response += `With your ${userData.plan} plan, you have access to the following features: ${userData.permissions.join(', ')}. `;
    }
    
    response += 'How can I assist you today?';
    
    res.json({
      success: true,
      response: response,
      user: {
        username: userData.username,
        plan: userData.plan,
        role: userData.role
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message'
    });
  }
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
```

## 🔒 Security Best Practices

### 1. Environment Variables

**✅ DO:**
- Store all sensitive credentials in environment variables
- Use `.env` files for local development
- Use secure secret management services in production (AWS Secrets Manager, HashiCorp Vault)
- Never hardcode API keys or credentials in code

**❌ DON'T:**
- Commit `.env` files to version control
- Share API keys in chat or email
- Use the same keys across environments
- Store credentials in plain text files

### 2. API Key Management

```javascript
// secureConfig.js
const crypto = require('crypto');

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} Whether API key is valid format
 */
function isValidApiKeyFormat(apiKey) {
  // API keys should be at least 32 characters
  if (!apiKey || apiKey.length < 32) {
    return false;
  }
  
  // Check for valid characters (alphanumeric and common symbols)
  const validPattern = /^[A-Za-z0-9_\-\.]+$/;
  return validPattern.test(apiKey);
}

/**
 * Generate a secure API key
 * @returns {string} Generated API key
 */
function generateApiKey() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Hash API key for storage
 * @param {string} apiKey - API key to hash
 * @returns {string} Hashed API key
 */
function hashApiKey(apiKey) {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
}

module.exports = {
  isValidApiKeyFormat,
  generateApiKey,
  hashApiKey
};
```

### 3. Token Security

**Best Practices:**
- Use short-lived access tokens (15-60 minutes)
- Implement refresh token rotation
- Store tokens securely (HttpOnly cookies or secure storage)
- Validate tokens on every request
- Implement token revocation

```javascript
// tokenSecurity.js

/**
 * Extract token from request securely
 * @param {Object} req - Express request object
 * @returns {string|null} Token or null
 */
function extractToken(req) {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookies (if using HttpOnly cookies)
  if (req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }
  
  return null;
}

/**
 * Validate token expiration
 * @param {Object} tokenPayload - Decoded token payload
 * @returns {boolean} Whether token is still valid
 */
function isTokenExpired(tokenPayload) {
  if (!tokenPayload.exp) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return tokenPayload.exp < currentTime;
}

module.exports = {
  extractToken,
  isTokenExpired
};
```

### 4. Data Sanitization

Always sanitize user input to prevent injection attacks:

```javascript
// dataSanitizer.js

/**
 * Sanitize user input
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .substring(0, 1000); // Limit length
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
function isValidEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {boolean} Whether username is valid
 */
function isValidUsername(username) {
  // Username: 3-50 characters, alphanumeric, underscore, hyphen
  const usernamePattern = /^[a-zA-Z0-9_-]{3,50}$/;
  return usernamePattern.test(username);
}

module.exports = {
  sanitizeInput,
  isValidEmail,
  isValidUsername
};
```

### 5. Secure Database Queries

**Use parameterized queries to prevent SQL injection:**

```javascript
// secureQueries.js
const { supabaseAdmin } = require('./supabaseService');

/**
 * Safely get user by email (parameterized)
 * @param {string} email - User email
 * @returns {Promise<Object>} User data
 */
async function getUserByEmail(email) {
  try {
    // Supabase uses parameterized queries by default
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email) // Safe: parameter binding
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
}

// ❌ DON'T DO THIS (vulnerable to SQL injection):
// const query = `SELECT * FROM profiles WHERE email = '${email}'`;

// ✅ DO THIS (parameterized query):
// .eq('email', email) or .filter('email', 'eq', email)

module.exports = {
  getUserByEmail
};
```

### 6. Rate Limiting by User

Implement user-specific rate limiting:

```javascript
// userRateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Create Redis client for distributed rate limiting
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

/**
 * Create user-specific rate limiter
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Rate limiter middleware
 */
function createUserRateLimiter(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rate_limit:user:'
    }),
    windowMs: windowMs,
    max: maxRequests,
    keyGenerator: (req) => {
      // Use user ID for authenticated requests
      if (req.supabaseUser) {
        return `user:${req.supabaseUser.id}`;
      }
      // Fall back to IP for unauthenticated requests
      return `ip:${req.ip}`;
    },
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
}

module.exports = {
  createUserRateLimiter
};
```

## 🧪 Testing

### 1. Unit Tests for User Service

```javascript
// tests/userService.test.js
const { getUserProfile, getUserAuthorization, getCompleteUserData } = require('../userService');
const { supabase } = require('../supabaseClient');

// Mock Supabase client
jest.mock('../supabaseClient');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getUserProfile', () => {
    it('should fetch user profile successfully', async () => {
      const mockProfile = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        subscription: {
          plan: 'standard',
          status: 'active'
        }
      };
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          })
        })
      });
      
      const result = await getUserProfile('user-123');
      
      expect(result).toEqual(mockProfile);
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });
    
    it('should handle error when user not found', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'User not found' }
            })
          })
        })
      });
      
      await expect(getUserProfile('invalid-id')).rejects.toThrow();
    });
  });
  
  describe('getCompleteUserData', () => {
    it('should fetch complete user data', async () => {
      const mockCompleteData = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        plan: 'standard',
        role: 'user',
        permissions: ['read', 'write']
      };
      
      // Mock both getUserProfile and getUserAuthorization
      jest.spyOn(require('../userService'), 'getUserProfile').mockResolvedValue({
        username: 'testuser',
        email: 'test@example.com',
        subscription: { plan: 'standard', status: 'active' }
      });
      
      jest.spyOn(require('../userService'), 'getUserAuthorization').mockResolvedValue({
        role: 'user',
        permissions: ['read', 'write']
      });
      
      const result = await getCompleteUserData('user-123');
      
      expect(result.username).toBe('testuser');
      expect(result.plan).toBe('standard');
      expect(result.role).toBe('user');
    });
  });
});
```

### 2. Integration Tests

```javascript
// tests/integration/userAuth.test.js
const request = require('supertest');
const app = require('../../server');
const { createClient } = require('@supabase/supabase-js');

describe('User Authentication Integration', () => {
  let authToken;
  let testUserId;
  
  beforeAll(async () => {
    // Create a test user and get auth token
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test-password-123'
    });
    
    if (!error && data.session) {
      authToken = data.session.access_token;
      testUserId = data.user.id;
    }
  });
  
  describe('GET /api/user', () => {
    it('should return user data with valid token', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('username');
      expect(response.body.data).toHaveProperty('plan');
    });
    
    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/user');
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
    
    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
    });
  });
  
  describe('GET /api/user/plan', () => {
    it('should return user plan and features', async () => {
      const response = await request(app)
        .get('/api/user/plan')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('plan');
      expect(response.body.data).toHaveProperty('tier');
      expect(response.body.data).toHaveProperty('features');
      expect(Array.isArray(response.body.data.features)).toBe(true);
    });
  });
  
  describe('POST /api/chat', () => {
    it('should process chat with user context', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 'Hello, how can you help me?' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
      expect(response.body.user).toHaveProperty('username');
      expect(response.body.user).toHaveProperty('plan');
    });
  });
});
```

### 3. Mock Data for Testing

```javascript
// tests/mocks/userData.js

/**
 * Mock user data for testing
 */
const mockUsers = {
  freeUser: {
    id: 'free-user-123',
    username: 'freeuser',
    email: 'free@example.com',
    plan: 'free',
    subscriptionStatus: 'active',
    role: 'user',
    permissions: ['read']
  },
  standardUser: {
    id: 'standard-user-123',
    username: 'standarduser',
    email: 'standard@example.com',
    plan: 'standard',
    subscriptionStatus: 'active',
    role: 'user',
    permissions: ['read', 'write']
  },
  enterpriseUser: {
    id: 'enterprise-user-123',
    username: 'enterpriseuser',
    email: 'enterprise@example.com',
    plan: 'enterprise',
    subscriptionStatus: 'active',
    role: 'user',
    permissions: ['read', 'write', 'manage']
  },
  adminUser: {
    id: 'admin-user-123',
    username: 'admin',
    email: 'admin@example.com',
    plan: 'admin',
    subscriptionStatus: 'active',
    role: 'admin',
    permissions: ['read', 'write', 'manage', 'admin']
  }
};

/**
 * Generate mock JWT token for testing
 * @param {Object} user - User data
 * @returns {string} Mock JWT token
 */
function generateMockToken(user) {
  // In real tests, you'd use a proper JWT library
  // This is simplified for demonstration
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
  };
  
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

module.exports = {
  mockUsers,
  generateMockToken
};
```

### 4. Test Supabase Connection

```javascript
// tests/supabaseConnection.test.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

describe('Supabase Connection', () => {
  let supabase;
  
  beforeAll(() => {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  });
  
  it('should connect to Supabase successfully', async () => {
    expect(supabase).toBeDefined();
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_ANON_KEY).toBeDefined();
  });
  
  it('should query profiles table', async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    // Should not error (even if empty)
    expect(error).toBeNull();
  });
  
  it('should query subscriptions table', async () => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('count')
      .limit(1);
    
    expect(error).toBeNull();
  });
});
```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. "Invalid API Key" Error

**Problem:** Supabase returns "Invalid API key" error.

**Solution:**
```javascript
// Check your environment variables
console.log('Supabase URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
console.log('Anon Key:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Missing');

// Make sure .env file is loaded
require('dotenv').config();

// Verify the URL format
const urlPattern = /^https:\/\/[a-z0-9-]+\.supabase\.co$/;
if (!urlPattern.test(process.env.SUPABASE_URL)) {
  console.error('Invalid Supabase URL format');
}
```

#### 2. Row Level Security (RLS) Policy Issues

**Problem:** Cannot query data due to RLS policies.

**Solution:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- View existing policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Temporarily disable RLS for debugging (development only!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

#### 3. Token Expiration Issues

**Problem:** Token expires and user is logged out.

**Solution:**
```javascript
// Implement token refresh
async function refreshTokenIfNeeded(supabase) {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  // Check if token will expire soon (within 5 minutes)
  const expiresAt = session.expires_at;
  const now = Math.floor(Date.now() / 1000);
  const fiveMinutes = 5 * 60;
  
  if (expiresAt - now < fiveMinutes) {
    // Refresh the token
    const { data, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error('Token refresh failed:', refreshError);
      return null;
    }
    
    return data.session;
  }
  
  return session;
}
```

#### 4. CORS Errors

**Problem:** CORS errors when calling API from frontend.

**Solution:**
```javascript
// server.js
const cors = require('cors');

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://yourdomain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### 5. Database Connection Issues

**Problem:** Cannot connect to Supabase database.

**Solution:**
```javascript
// Test connection
async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection failed:', error);
      return false;
    }
    
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Exception during connection test:', error);
    return false;
  }
}

// Run test on startup
testDatabaseConnection().then(connected => {
  if (!connected) {
    console.error('Cannot start server without database connection');
    process.exit(1);
  }
});
```

## 📚 Additional Resources

### Official Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Formul8 Security SDK](./README.md)

### Code Examples
- [Complete implementation examples](./EXAMPLES.md)
- [Agent implementation guide](./AGENT-IMPLEMENTATION-GUIDE.md)
- [Repository setup](./REPOSITORY-SETUP.md)

### Best Practices
- [OWASP Security Guidelines](https://owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Need Help?**
- GitHub Issues: [Report an issue](https://github.com/formul8/f8-security/issues)
- Email: security@formul8.ai

**Last Updated:** October 2025
**Version:** 1.0.0
