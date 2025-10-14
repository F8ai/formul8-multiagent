const express = require('express');
const cors = require('cors');

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: '*',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple free API key generation
function generateFreeApiKey() {
  return 'f8_free_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'formul8-test-api',
    version: '1.0.0'
  });
});

// Free API key generation endpoint
app.get('/api/free-key', (req, res) => {
  const freeApiKey = generateFreeApiKey();
  res.json({
    success: true,
    apiKey: freeApiKey,
    plan: 'free',
    limits: {
      requestsPerHour: 10,
      availableAgents: ['compliance', 'formulation', 'science']
    },
    usage: {
      header: 'X-API-Key',
      value: freeApiKey
    },
    message: 'Use this API key in the X-API-Key header for free access'
  });
});

app.post('/api/free-key', (req, res) => {
  const freeApiKey = generateFreeApiKey();
  res.json({
    success: true,
    apiKey: freeApiKey,
    plan: 'free',
    limits: {
      requestsPerHour: 10,
      availableAgents: ['compliance', 'formulation', 'science']
    },
    usage: {
      header: 'X-API-Key',
      value: freeApiKey
    },
    message: 'Use this API key in the X-API-Key header for free access'
  });
});

// Simple chat endpoint
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  res.json({
    success: true,
    response: `I received your message: "${message}". This is a test response from the F8 Multiagent system.`,
    agent: 'f8_agent',
    plan: 'free'
  });
});

// Vercel serverless function handler
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Route to Express app
  return app(req, res);
};
