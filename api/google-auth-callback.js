/**
 * Google OAuth Callback Handler
 * Vercel serverless function to handle Google OAuth callback
 */

const {
  verifyGoogleToken,
  generateUserJWT,
  getUserPlan,
  createOrUpdateUser,
} = require('../services/google-auth-service');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
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
};

