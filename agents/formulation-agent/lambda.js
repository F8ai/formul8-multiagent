/**
 * Formulation Agent - Secure Implementation with RAG
 * Generated from secure-agent-template.js
 * Enhanced with RAG from science-agent (PubMed data)
 */

const express = require('express');
const cors = require('cors');
const {
  rateLimiter,
  corsOptions,
  validateAndSanitizeInput,
  validatePlan,
  validateApiKey,
  requestLogger,
  errorHandler,
  securityHeaders,
  contentFilter,
  validateAgentAccess,
  SECURITY_CONFIG,
  getClientIP
} = require('./security-module');
const dataLoader = require('./data-loader');
const AWS = require('aws-sdk');

// Create Express app
const app = express();

// Security middleware (order matters!)
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use('/api/', rateLimiter);
app.use(validateApiKey);
app.use(contentFilter);

// Agent-specific configuration
const AGENT_CONFIG = {
  name: 'Formulation Agent',
  description: 'Cannabis product formulation specialist',
  keywords: ["formulation","recipe","dosage","extraction","ingredient","thc","cbd","concentrate","edible","tincture"],
  specialties: ["Recipe development and customization","Dosage calculations for THC/CBD","Extraction methods and techniques","Ingredient selection and sourcing","Quality control and consistency","Product stability and shelf life"],
  tierRestriction: null
};

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'formulation-agent',
    version: '1.1.0',
    rag: {
      enabled: true,
      source: 'science-agent',
      cacheEnabled: true
    },
    security: {
      rateLimit: `${SECURITY_CONFIG.maxMessageLength} requests per ${RATE_LIMIT_WINDOW / 1000 / 60} minutes`,
      cors: SECURITY_CONFIG.allowedOrigins,
      inputValidation: true,
      xssProtection: true
    }
  });
});

// In-memory S3 cache for RAG data
const ragCache = {
  data: null,
  timestamp: null,
  ttl: 3600000 // 1 hour
};

// Cache management endpoint
app.post('/api/cache/clear', (req, res) => {
  try {
    const { source } = req.body;
    
    console.log(`🗑️  RAG cache clear requested from: ${source || 'unknown'}`);
    
    // Clear the RAG cache
    ragCache.data = null;
    ragCache.timestamp = null;
    
    // Also clear data-loader cache if available
    if (dataLoader && dataLoader.clearCache) {
      dataLoader.clearCache();
    }
    
    res.json({
      success: true,
      message: 'RAG cache cleared successfully',
      source: source || 'manual',
      timestamp: new Date().toISOString(),
      note: 'Next RAG query will fetch fresh data from S3'
    });
    
    console.log(`✅ RAG cache cleared at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error clearing RAG cache:', error);
    res.status(500).json({ 
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

// RAG Helper: Retrieve relevant research data from science-agent
async function retrieveRelevantResearch(query) {
  try {
    // Check cache first
    const now = Date.now();
    if (ragCache.data && ragCache.timestamp && (now - ragCache.timestamp) < ragCache.ttl) {
      console.log(`✅ Using cached RAG data (age: ${Math.round((now - ragCache.timestamp) / 1000)}s)`);
    } else {
      // Load from S3
      console.log(`📥 Loading fresh RAG data from S3`);
      const s3 = new AWS.S3({ region: 'us-east-1' });
      
      const params = {
        Bucket: 'formul8-platform-deployments',
        Key: 'data/science/index.json'
      };
      
      const data = await s3.getObject(params).promise();
      ragCache.data = JSON.parse(data.Body.toString('utf-8'));
      ragCache.timestamp = now;
      console.log(`💾 RAG data cached (${ragCache.data.totalPapers || 0} papers)`);
    }
    
    const scienceIndex = ragCache.data;
    
    // Simple keyword-based filtering (can be enhanced with vector embeddings later)
    const keywords = query.toLowerCase().split(' ').filter(w => w.length > 3);
    const relevantPapers = scienceIndex.papers?.filter(paper => {
      const paperText = `${paper.title} ${paper.abstract || ''} ${paper.keywords?.join(' ') || ''}`.toLowerCase();
      return keywords.some(keyword => paperText.includes(keyword));
    }).slice(0, 3) || []; // Top 3 most relevant
    
    return relevantPapers;
  } catch (error) {
    console.log(`⚠️  Could not retrieve research data: ${error.message}`);
    return [];
  }
}

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, plan = 'standard', username = 'anonymous' } = req.body;
    
    // Validate required fields
    if (!message) {
      return res.status(400).json({ 
        error: 'Message is required',
        code: 'MISSING_MESSAGE'
      });
    }
    
    // Check agent access permissions
    if (!validateAgentAccess(AGENT_CONFIG.name.toLowerCase().replace(/\s+/g, '_'), plan)) {
      return res.status(403).json({
        error: 'Access denied for this plan',
        code: 'PLAN_ACCESS_DENIED'
      });
    }
    
    // Log the request
    console.log(`Chat request - Agent: ${AGENT_CONFIG.name}, User: ${username}, Plan: ${plan}, Message length: ${message.length}`);
    
    // Get OpenRouter API key
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      console.error('OpenRouter API key not found in environment variables');
      return res.status(500).json({ 
        error: 'API configuration error',
        response: 'I apologize, but I\'m currently experiencing a configuration issue. Please try again later.'
      });
    }
    
    // Retrieve relevant research papers (RAG)
    const relevantResearch = await retrieveRelevantResearch(message);
    console.log(`📚 Found ${relevantResearch.length} relevant research papers`);
    
    // Build research context for RAG
    let researchContext = '';
    if (relevantResearch.length > 0) {
      researchContext = '\n\nRelevant scientific research from PubMed:\n' + 
        relevantResearch.map((paper, i) => 
          `${i + 1}. ${paper.title}\n   ${paper.abstract || paper.summary || ''}`
        ).join('\n\n');
    }
    
    // Create system prompt with RAG context
    const systemPrompt = `You are a ${AGENT_CONFIG.name} specializing in ${AGENT_CONFIG.description}. 
    Your specialties include: ${AGENT_CONFIG.specialties.join(', ')}. 
    You are part of the Formul8 Multiagent system. 
    Provide helpful, accurate, and professional responses. Keep responses concise but informative.
    ${researchContext ? '\n\nUse the following scientific research to inform your response when relevant:' + researchContext : ''}`;
    
    // Call OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://f8.syzygyx.com',
        'X-Title': `Formul8 ${AGENT_CONFIG.name}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });
    
    if (!openRouterResponse.ok) {
      console.error('OpenRouter API error:', openRouterResponse.status, openRouterResponse.statusText);
      return res.status(500).json({ 
        error: 'AI service temporarily unavailable',
        response: 'I apologize, but I\'m currently unable to process your request. Please try again in a moment.'
      });
    }
    
    const aiData = await openRouterResponse.json();
    const aiResponse = aiData.choices?.[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
    
    // Extract usage information
    const usage = aiData.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || (promptTokens + completionTokens);
    const totalCost = 0.00; // Free model
    
    // Create footer with metadata including RAG info
    const ragInfo = relevantResearch.length > 0 ? ` | RAG: ${relevantResearch.length} papers from science-agent` : '';
    const footer = `\n\n---\n*Agent: ${AGENT_CONFIG.name} | Plan: ${plan} | Tokens: ${totalTokens} (${promptTokens}→${completionTokens}) | Cost: $${totalCost.toFixed(6)}${ragInfo}*`;
    
    res.json({
      success: true,
      response: aiResponse + footer,
      agent: AGENT_CONFIG.name.toLowerCase().replace(/\s+/g, '_'),
      timestamp: new Date().toISOString(),
      model: 'openai/gpt-oss-120b',
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        cost: totalCost
      },
      rag: {
        enabled: true,
        papersRetrieved: relevantResearch.length,
        source: 'science-agent'
      }
    });
    
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      response: 'I apologize, but I encountered an error processing your request. Please try again.'
    });
  }
});

// Error handling
app.use(errorHandler);

// Lambda handler
exports.handler = async (event, context) => {
  // Convert Lambda event to Express request
  const request = {
    method: event.httpMethod,
    path: event.path,
    headers: event.headers || {},
    body: event.body ? JSON.parse(event.body) : {},
    query: event.queryStringParameters || {}
  };
  
  // Create mock response object
  let responseBody = '';
  let statusCode = 200;
  let headers = {};
  
  const response = {
    status: (code) => {
      statusCode = code;
      return response;
    },
    json: (data) => {
      responseBody = JSON.stringify(data);
      headers['Content-Type'] = 'application/json';
      return response;
    },
    setHeader: (key, value) => {
      headers[key] = value;
      return response;
    }
  };
  
  // Process request through Express app
  try {
    await new Promise((resolve, reject) => {
      const req = Object.assign({}, request);
      const res = Object.assign({}, response, {
        end: () => resolve()
      });
      
      app(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (error) {
    console.error('Lambda handler error:', error);
    statusCode = 500;
    responseBody = JSON.stringify({ error: 'Internal server error' });
  }
  
  return {
    statusCode,
    headers,
    body: responseBody
  };
};
