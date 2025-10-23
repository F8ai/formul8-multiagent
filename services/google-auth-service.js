/**
 * Google OAuth Authentication Service
 * Handles Google Sign-In authentication and token verification
 */

const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

// Allowed email domains for authentication
const ALLOWED_EMAIL_DOMAINS = [
  'formul8.ai',
  'staqs.io',
  'f8.syzygyx.com',
  // Add more domains as needed
];

// Initialize Google OAuth client
const getGoogleClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID not configured');
  }
  return new OAuth2Client(clientId);
};

/**
 * Verify Google ID token
 * @param {string} idToken - Google ID token from frontend
 * @returns {Promise<Object>} - Verified user payload
 */
async function verifyGoogleToken(idToken) {
  try {
    const client = getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    // Check if email domain is allowed
    const email = payload.email;
    const emailDomain = email.split('@')[1];
    
    if (!ALLOWED_EMAIL_DOMAINS.includes(emailDomain)) {
      throw new Error(`Email domain @${emailDomain} is not authorized. Allowed domains: ${ALLOWED_EMAIL_DOMAINS.join(', ')}`);
    }
    
    return {
      googleId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified,
      name: payload.name,
      picture: payload.picture,
      givenName: payload.given_name,
      familyName: payload.family_name,
    };
  } catch (error) {
    console.error('Error verifying Google token:', error);
    throw new Error(error.message || 'Invalid Google token');
  }
}

/**
 * Generate JWT for authenticated user
 * @param {Object} userData - User data from Google
 * @param {string} plan - User's subscription plan
 * @returns {string} - JWT token
 */
function generateUserJWT(userData, plan = 'standard') {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }
  
  const payload = {
    userId: userData.googleId,
    email: userData.email,
    name: userData.name,
    picture: userData.picture,
    plan: plan,
    provider: 'google',
  };
  
  return jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} - Decoded token payload
 */
function verifyJWT(token) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }
  
  try {
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    throw new Error('Invalid JWT token');
  }
}

/**
 * Get user plan from database or default to standard
 * In production, this should query your user database
 * @param {string} googleId - Google user ID
 * @returns {Promise<string>} - User plan
 */
async function getUserPlan(googleId) {
  // TODO: Implement database lookup
  // For now, return default plan
  // In production, query your database:
  // const user = await db.users.findOne({ googleId });
  // return user?.plan || 'standard';
  
  return 'standard';
}

/**
 * Create or update user in database
 * @param {Object} userData - User data from Google
 * @returns {Promise<Object>} - User record
 */
async function createOrUpdateUser(userData) {
  // TODO: Implement database operations
  // For now, return the userData with default plan
  // In production:
  // let user = await db.users.findOne({ googleId: userData.googleId });
  // if (!user) {
  //   user = await db.users.create({
  //     googleId: userData.googleId,
  //     email: userData.email,
  //     name: userData.name,
  //     picture: userData.picture,
  //     plan: 'standard',
  //     createdAt: new Date(),
  //   });
  // } else {
  //   await db.users.update(
  //     { googleId: userData.googleId },
  //     { $set: { name: userData.name, picture: userData.picture, lastLogin: new Date() } }
  //   );
  // }
  // return user;
  
  return {
    ...userData,
    plan: 'standard',
    createdAt: new Date(),
  };
}

/**
 * Middleware to authenticate requests with Google OAuth
 */
function authenticateGoogleUser(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }
  
  try {
    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);
    
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      plan: decoded.plan || 'standard',
      provider: decoded.provider,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid authentication token',
      code: 'INVALID_TOKEN',
    });
  }
}

module.exports = {
  verifyGoogleToken,
  generateUserJWT,
  verifyJWT,
  getUserPlan,
  createOrUpdateUser,
  authenticateGoogleUser,
  ALLOWED_EMAIL_DOMAINS,
};


