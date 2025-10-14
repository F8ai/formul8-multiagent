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

// Serve static files from public directory
app.use(express.static('public'));

// Simple free API key generation
function generateFreeApiKey() {
  return 'f8_free_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'formul8-api',
    version: '1.0.0'
  });
});

// Future4200 page route
app.get('/future4200.html', (req, res) => {
  res.sendFile(__dirname + '/public/future4200.html');
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

// Chat endpoint with plan-based routing
app.post('/api/chat', (req, res) => {
  const { message, plan = 'free' } = req.body;
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Plan-based response logic
  let response, agent, planType;
  
  if (plan === 'future4200') {
    // Future4200 plan - uses future-agent and ad-agent
    response = `[Future4200 Mode] I received your message: "${message}". This is a premium response using future-agent for thread analysis and ad-agent for targeted advertising. The future4200.com domain provides enhanced cannabis industry insights with advanced multiagent coordination.`;
    agent = 'future-agent';
    planType = 'future4200';
  } else {
    // Free plan - basic response
    response = `I received your message: "${message}". This is a free response from the F8 Multiagent system. For enhanced features, consider upgrading to the future4200 plan.`;
    agent = 'f8_agent';
    planType = 'free';
  }
  
  res.json({
    success: true,
    response: response,
    agent: agent,
    plan: planType,
    timestamp: new Date().toISOString()
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
