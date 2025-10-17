/**
 * Google OAuth Handler for Lambda
 * Integrates with existing lambda.js to handle Google authentication
 */

const {
  verifyGoogleToken,
  generateUserJWT,
  getUserPlan,
  createOrUpdateUser,
} = require('../services/google-auth-service');

/**
 * Handle Google OAuth callback
 */
async function handleGoogleAuthCallback(req, res) {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing idToken',
        code: 'MISSING_TOKEN',
      });
    }
    
    // Verify Google token
    const userData = await verifyGoogleToken(idToken);
    
    // Create or update user in database
    const user = await createOrUpdateUser(userData);
    
    // Get user's plan
    const plan = await getUserPlan(userData.googleId);
    
    // Generate JWT for our system
    const jwt = generateUserJWT(userData, plan);
    
    // Return success response
    return res.status(200).json({
      success: true,
      token: jwt,
      user: {
        id: userData.googleId,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        plan: plan,
      },
    });
  } catch (error) {
    console.error('Google auth callback error:', error);
    return res.status(401).json({
      success: false,
      error: error.message || 'Authentication failed',
      code: 'AUTH_FAILED',
    });
  }
}

/**
 * Extract user from JWT token in request
 */
async function extractUserFromRequest(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.substring(7);
    const { verifyJWT } = require('../services/google-auth-service');
    const decoded = verifyJWT(token);
    
    return {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      plan: decoded.plan || 'standard',
      provider: decoded.provider,
    };
  } catch (error) {
    console.error('Error extracting user from JWT:', error);
    return null;
  }
}

module.exports = {
  handleGoogleAuthCallback,
  extractUserFromRequest,
};

