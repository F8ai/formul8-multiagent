const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const serverlessHttp = require('serverless-http');

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
app.post('/api/chat', async (req, res) => {
  const { message, plan = 'standard' } = req.body;
  
  // No API key required for now - anyone can use the chat
  // const apiKey = req.headers['x-api-key'];
  // if (plan === 'free' && !apiKey) {
  //   return res.status(401).json({ error: 'API key required for free plan' });
  // }
  
  // Plan-based response logic
  let response, agent, planType;
  
  if (plan === 'future4200') {
    // Future4200 plan - return structured data with threads
    const threads = [
      {
        title: "How To Easily Find A Vape Hardware Cannabis Vape Cannabis Vaporizer Vape Cart Manufacturer For FREE",
        description: "Dec 2022 - A commonly asked question that we get is 'How can I find our Vape Hardware/Cannabis Vape Hardware Manufacturer?' How to find a Vape Supplier'? 'How can i find Cannabis Vaporizer Manufacturers 'What ...",
        categories: ["Cart Peddler"],
        tags: ["cbd"],
        url: "https://future4200.com/t/vape-hardware-manufacturer/123"
      },
      {
        title: "Cannabis derived terpenes vs non-cannabis derived terpenes",
        description: "Mar 2019 - New to the site, so sorry if this has already been discussed. Didn't see it when I searched though. I see a lot of claims about cannabis derived terpenes being superior. The problem is that these c...",
        categories: ["Hash and Stuff"],
        tags: ["terpenes"],
        url: "https://future4200.com/t/cannabis-terpenes/456"
      },
      {
        title: "Valenza Nutrients: Formulated for cannabis and with cannabis",
        description: "May 2022 - While writing my book review on a newly released academic journal sourced and written book from CRC Press titled, https://www.taylorfrancis.- com/books/edit/10.1201/9781003150442/handbook-cannabis-pr...",
        categories: ["Botany and Cultivation"],
        tags: ["cannabis"],
        url: "https://future4200.com/t/valenza-nutrients/789"
      },
      {
        title: "Whats in my Cannabis? A Unified Manifest of Cannabis Constituents",
        description: "Nov 2019 - https://www.medicinalgenomics.com/wp-content/uploads/2011/12/Chemical- constituents-of-cannabis.pdf medicinalgenomics.com https://www.medicinalgenomics.- com/wp-content/uploads/2011/12/Chemical-consti...",
        categories: ["Data Dump"],
        tags: ["cannabis", "minor", "medicinalgenomics"],
        url: "https://future4200.com/t/cannabis-constituents/101"
      }
    ];
    
    res.json({
      success: true,
      paragraph: `Found ${threads.length} relevant threads about "${message}" in the Future4200 community. These discussions cover various aspects of cannabis cultivation, extraction, and industry insights.`,
      threads: threads,
      advertisement: "NEW FLAVORS//CARAMEL CUTTHROAT/SUNSET MAC/... THE ABSOLUTE FINEST CANNABIS DERIVED TERPENES AVAILABLE ANYWHERE",
      agent: 'future-agent',
      plan: 'future4200',
      timestamp: new Date().toISOString()
    });
  } else {
    // Use OpenRouter API for real AI responses
    try {
      const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://f8.syzygyx.com',
          'X-Title': 'F8 Multiagent Cannabis Assistant',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant specializing in the cannabis industry. You provide expert guidance on compliance, formulation, science, operations, and other cannabis-related topics.'
            },
            {
              role: 'user',
              content: message
            }
          ]
        })
      });

      const data = await openrouterResponse.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        response = data.choices[0].message.content;
        agent = 'openrouter_gpt4o-mini';
        planType = plan;
      } else {
        response = 'Sorry, I encountered an error processing your request. Please try again.';
        agent = 'error';
        planType = plan;
      }
    } catch (error) {
      console.error('OpenRouter API error:', error);
      response = 'Sorry, I\'m having trouble connecting to the AI service. Please try again.';
      agent = 'error';
      planType = plan;
    }
    
    res.json({
      success: true,
      response: response,
      agent: agent,
      plan: planType,
      timestamp: new Date().toISOString()
    });
  }
});

// Lambda handler using serverless-http to wrap Express app
module.exports.handler = serverlessHttp(app);
