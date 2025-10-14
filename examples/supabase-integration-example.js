/**
 * Supabase User Authentication Integration Example
 * 
 * This file demonstrates a complete implementation of user authentication
 * and authorization using Supabase with the Formul8 Security SDK.
 * 
 * @see f8-security/SUPABASE-USER-AUTH-GUIDE.md for detailed documentation
 */

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { createAgentSecurity } = require('../f8-security');
require('dotenv').config();

// ========================================
// CONFIGURATION
// ========================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';
const PORT = process.env.PORT || 3000;

// Agent configuration
const AGENT_CONFIG = {
  name: 'User Data Agent',
  description: 'Demonstrates Supabase user authentication and authorization',
  keywords: ['authentication', 'authorization', 'supabase', 'user-management'],
  specialties: ['User authentication', 'Permission management', 'Subscription handling']
};

// ========================================
// SUPABASE CLIENTS
// ========================================

/**
 * Client-side Supabase client (uses anon key)
 * Safe for browser/client-side operations
 */
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

/**
 * Server-side Supabase admin client (uses service role key)
 * Only use on backend - bypasses RLS policies
 * NEVER expose this to the client!
 */
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ========================================
// USER DATA SERVICES
// ========================================

/**
 * Get user profile from Supabase (server-side with RLS bypass)
 * @param {string} userId - User ID from Supabase auth
 * @returns {Promise<Object>} User profile with subscription and role data
 */
async function getUserProfile(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        username,
        email,
        created_at,
        updated_at,
        subscriptions (
          id,
          plan,
          status,
          started_at,
          expires_at
        ),
        user_roles (
          role,
          permissions,
          granted_at
        )
      `)
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
    
    return {
      id: data.id,
      username: data.username,
      email: data.email,
      plan: data.subscriptions?.[0]?.plan || 'free',
      subscriptionStatus: data.subscriptions?.[0]?.status || 'inactive',
      role: data.user_roles?.[0]?.role || 'user',
      permissions: data.user_roles?.[0]?.permissions || ['read'],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Exception in getUserProfile:', error);
    throw error;
  }
}

/**
 * Verify JWT token and extract user data
 * @param {string} token - JWT token from Authorization header
 * @returns {Promise<Object>} Verified user data
 */
async function verifyAndGetUserData(token) {
  try {
    // Verify the JWT token using Supabase auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid or expired token');
    }
    
    // Get complete user profile
    const userData = await getUserProfile(user.id);
    
    return userData;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
}

/**
 * Update user subscription plan
 * @param {string} userId - User ID
 * @param {string} plan - New plan name
 * @returns {Promise<Object>} Updated subscription
 */
async function updateUserSubscription(userId, plan) {
  try {
    const validPlans = ['free', 'standard', 'micro', 'operator', 'enterprise', 'beta', 'admin', 'future4200'];
    
    if (!validPlans.includes(plan)) {
      throw new Error(`Invalid plan: ${plan}`);
    }
    
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
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Check if user has required permission
 * @param {string} userId - User ID
 * @param {string} permission - Permission to check
 * @returns {Promise<boolean>} Whether user has permission
 */
async function checkUserPermission(userId, permission) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('permissions')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return data.permissions.includes(permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

// ========================================
// EXPRESS APP SETUP
// ========================================

const app = express();

// Create Formul8 Security instance
const security = createAgentSecurity(AGENT_CONFIG);

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://f8.syzygyx.com'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(security.requestLogger.middleware());

// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================

/**
 * Supabase authentication middleware
 * Verifies JWT token and attaches user data to request
 */
async function supabaseAuthMiddleware(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
        code: 'UNAUTHORIZED'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token and get user data
    const userData = await verifyAndGetUserData(token);
    
    // Attach user data to request
    req.supabaseUser = userData;
    
    // Create Formul8 user context for compatibility
    req.userContext = {
      username: userData.username,
      plan: userData.plan,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    };
    
    next();
  } catch (error) {
    console.error('Authentication failed:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
      message: error.message
    });
  }
}

/**
 * Optional authentication middleware
 * Allows requests without authentication but extracts user data if present
 */
async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const userData = await verifyAndGetUserData(token);
      
      req.supabaseUser = userData;
      req.userContext = {
        username: userData.username,
        plan: userData.plan,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
      };
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    console.log('Optional authentication failed, continuing without user context');
    next();
  }
}

/**
 * Permission check middleware factory
 * @param {string} permission - Required permission
 * @returns {Function} Express middleware
 */
function requirePermission(permission) {
  return async (req, res, next) => {
    if (!req.supabaseUser) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const hasPermission = req.supabaseUser.permissions.includes(permission);
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'PERMISSION_DENIED',
        required: permission
      });
    }
    
    next();
  };
}

/**
 * Role check middleware factory
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.supabaseUser) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    if (!allowedRoles.includes(req.supabaseUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient role',
        code: 'ROLE_DENIED',
        required: allowedRoles,
        current: req.supabaseUser.role
      });
    }
    
    next();
  };
}

// ========================================
// API ENDPOINTS
// ========================================

/**
 * Health check endpoint (public)
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'supabase-user-auth-example',
    version: '1.0.0',
    supabase: {
      configured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
      url: SUPABASE_URL.substring(0, 30) + '...'
    }
  });
});

/**
 * Get current user data (requires authentication)
 */
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
        permissions: userData.permissions,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
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

/**
 * Get user plan and available features
 */
app.get('/api/user/plan', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { plan, permissions } = req.supabaseUser;
    
    // Map plan to tier
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
      'micro': ['All standard features', 'Compliance assistance', 'Basic analytics'],
      'operator': ['All micro features', 'Operations support', 'Advanced analytics'],
      'enterprise': ['All operator features', 'Marketing tools', 'Custom integrations', 'Priority support'],
      'beta': ['All standard features', 'Beta features', 'Early access', 'Feedback channel'],
      'admin': ['All features', 'Admin tools', 'System management', 'User management'],
      'future4200': ['All features', 'Future4200 integration', 'Community tools', 'Exclusive content']
    };
    
    res.json({
      success: true,
      data: {
        plan: plan,
        tier: tier,
        maxTier: 8,
        tierPercentage: Math.round((tier / 8) * 100),
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

/**
 * Secure chat endpoint with user context
 */
app.post('/api/chat', supabaseAuthMiddleware, security.createSecureEndpoint('/api/chat', async (req, res) => {
  try {
    const userContext = req.userContext;
    const userData = req.supabaseUser;
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid message',
        code: 'INVALID_INPUT'
      });
    }
    
    // Log the request with user context
    console.log(`[CHAT] User: ${userData.username} (${userData.plan}) - Message: ${message.substring(0, 50)}...`);
    
    // Create personalized response based on user plan and permissions
    let response = `Hello ${userData.username}! `;
    
    if (userData.role === 'admin') {
      response += 'As an admin, you have full system access. ';
    } else if (userData.role === 'moderator') {
      response += 'As a moderator, you have elevated permissions. ';
    }
    
    response += `Your ${userData.plan} plan gives you access to: ${userData.permissions.join(', ')}. `;
    
    if (message.toLowerCase().includes('features')) {
      const { data } = await fetch(`http://localhost:${PORT}/api/user/plan`, {
        headers: { 'Authorization': req.headers.authorization }
      }).then(r => r.json());
      
      response += `\n\nAvailable features:\n- ${data.features.join('\n- ')}`;
    }
    
    response += '\n\nHow can I assist you today?';
    
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
      error: 'Failed to process chat message',
      response: 'I apologize, but I encountered an error. Please try again.'
    });
  }
}));

/**
 * Update user subscription (admin only)
 */
app.post('/api/admin/update-subscription', 
  supabaseAuthMiddleware,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { userId, plan } = req.body;
      
      if (!userId || !plan) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: userId, plan'
        });
      }
      
      const updatedSubscription = await updateUserSubscription(userId, plan);
      
      res.json({
        success: true,
        data: updatedSubscription,
        message: `Subscription updated to ${plan}`
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update subscription',
        message: error.message
      });
    }
  }
);

/**
 * Check user permission (requires 'manage' permission)
 */
app.post('/api/admin/check-permission',
  supabaseAuthMiddleware,
  requirePermission('manage'),
  async (req, res) => {
    try {
      const { userId, permission } = req.body;
      
      if (!userId || !permission) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: userId, permission'
        });
      }
      
      const hasPermission = await checkUserPermission(userId, permission);
      
      res.json({
        success: true,
        data: {
          userId: userId,
          permission: permission,
          hasPermission: hasPermission
        }
      });
    } catch (error) {
      console.error('Error checking permission:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check permission'
      });
    }
  }
);

/**
 * Public endpoint (no authentication required)
 */
app.get('/api/public/info', optionalAuthMiddleware, (req, res) => {
  const isAuthenticated = Boolean(req.supabaseUser);
  
  res.json({
    success: true,
    message: 'This is a public endpoint',
    authenticated: isAuthenticated,
    user: isAuthenticated ? {
      username: req.supabaseUser.username,
      plan: req.supabaseUser.plan
    } : null,
    info: {
      service: 'Supabase User Authentication Example',
      version: '1.0.0',
      documentation: '/f8-security/SUPABASE-USER-AUTH-GUIDE.md'
    }
  });
});

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ========================================
// SERVER STARTUP
// ========================================

/**
 * Test database connection on startup
 */
async function testDatabaseConnection() {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection test failed:', error.message);
      return false;
    }
    
    console.log('✓ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection exception:', error.message);
    return false;
  }
}

// Start server
if (require.main === module) {
  // Only test connection if not in test mode
  if (process.env.NODE_ENV !== 'test') {
    testDatabaseConnection().then(connected => {
      if (!connected) {
        console.warn('⚠️  Database connection failed, but server will start anyway');
      }
      
      app.listen(PORT, () => {
        console.log('\n========================================');
        console.log('🚀 Supabase User Auth Example Server');
        console.log('========================================');
        console.log(`📍 Server running on port ${PORT}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/health`);
        console.log(`📚 Documentation: f8-security/SUPABASE-USER-AUTH-GUIDE.md`);
        console.log('========================================\n');
      });
    });
  }
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  app,
  supabaseClient,
  supabaseAdmin,
  getUserProfile,
  verifyAndGetUserData,
  updateUserSubscription,
  checkUserPermission,
  supabaseAuthMiddleware,
  optionalAuthMiddleware,
  requirePermission,
  requireRole
};
