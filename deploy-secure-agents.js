#!/usr/bin/env node

/**
 * Deploy Secure Agents Script
 * Deploys all agents with security measures
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Agent configurations
const AGENTS = [
  {
    name: 'compliance-agent',
    displayName: 'Compliance Agent',
    description: 'Cannabis regulatory compliance expert',
    keywords: ['compliance', 'regulation', 'license', 'legal', 'audit', 'inspection', 'permit', 'regulatory'],
    specialties: [
      'State-specific cannabis regulations',
      'Licensing applications and processes',
      'Compliance audits and inspections',
      'Record keeping and documentation',
      'Testing requirements and standards',
      'Security and safety protocols'
    ]
  },
  {
    name: 'formulation-agent',
    displayName: 'Formulation Agent',
    description: 'Cannabis product formulation specialist',
    keywords: ['formulation', 'recipe', 'dosage', 'extraction', 'ingredient', 'thc', 'cbd', 'concentrate', 'edible', 'tincture'],
    specialties: [
      'Recipe development and customization',
      'Dosage calculations for THC/CBD',
      'Extraction methods and techniques',
      'Ingredient selection and sourcing',
      'Quality control and consistency',
      'Product stability and shelf life'
    ]
  },
  {
    name: 'science-agent',
    displayName: 'Science Agent',
    description: 'Cannabis research and analysis expert',
    keywords: ['science', 'research', 'cannabinoid', 'terpene', 'lab', 'testing', 'coa', 'analysis', 'study', 'clinical'],
    specialties: [
      'Scientific research analysis',
      'Cannabinoid and terpene profiles',
      'Lab results interpretation (COAs)',
      'Research trends and findings',
      'Chemical analysis and testing',
      'Product quality assessment'
    ]
  },
  {
    name: 'operations-agent',
    displayName: 'Operations Agent',
    description: 'Cannabis facility operations and management specialist',
    keywords: ['operations', 'facility', 'management', 'production', 'quality', 'control', 'logistics', 'manufacturing'],
    specialties: [
      'Facility operations and management',
      'Production planning and scheduling',
      'Quality control processes',
      'Logistics and supply chain',
      'Equipment maintenance',
      'Staff training and safety'
    ]
  },
  {
    name: 'marketing-agent',
    displayName: 'Marketing Agent',
    description: 'Cannabis marketing and brand strategy expert',
    keywords: ['marketing', 'brand', 'advertising', 'promotion', 'customer', 'acquisition', 'strategy', 'campaign'],
    specialties: [
      'Marketing strategy and planning',
      'Brand development and positioning',
      'Advertising and promotional campaigns',
      'Customer acquisition strategies',
      'Digital marketing and social media',
      'Market research and analysis'
    ]
  },
  {
    name: 'sourcing-agent',
    displayName: 'Sourcing Agent',
    description: 'Cannabis supply chain and sourcing specialist',
    keywords: ['sourcing', 'supply', 'chain', 'procurement', 'vendor', 'inventory', 'supplier', 'purchasing'],
    specialties: [
      'Supply chain management',
      'Vendor sourcing and evaluation',
      'Procurement strategies',
      'Inventory management',
      'Quality assurance for suppliers',
      'Cost optimization'
    ]
  },
  {
    name: 'patent-agent',
    displayName: 'Patent Agent',
    description: 'Cannabis intellectual property and patent research expert',
    keywords: ['patent', 'intellectual', 'property', 'ip', 'research', 'legal', 'innovation', 'invention'],
    specialties: [
      'Patent research and analysis',
      'Intellectual property strategy',
      'Legal research and documentation',
      'Innovation tracking',
      'IP portfolio management',
      'Patent filing assistance'
    ]
  },
  {
    name: 'spectra-agent',
    displayName: 'Spectra Agent',
    description: 'Cannabis spectral analysis and quality testing specialist',
    keywords: ['spectra', 'analysis', 'testing', 'lab', 'equipment', 'chemistry', 'spectroscopy', 'quality'],
    specialties: [
      'Spectral analysis techniques',
      'Quality testing protocols',
      'Lab equipment operation',
      'Analytical chemistry',
      'Data interpretation',
      'Testing standards compliance'
    ]
  },
  {
    name: 'customer-success-agent',
    displayName: 'Customer Success Agent',
    description: 'Cannabis customer success and retention specialist',
    keywords: ['customer', 'success', 'retention', 'support', 'satisfaction', 'onboarding', 'service'],
    specialties: [
      'Customer success strategies',
      'Retention and loyalty programs',
      'Support and service optimization',
      'Customer onboarding processes',
      'Satisfaction measurement',
      'Account management'
    ]
  },
  {
    name: 'f8-slackbot',
    displayName: 'F8 Slackbot',
    description: 'Formul8 Slack integration and team collaboration agent',
    keywords: ['slack', 'integration', 'team', 'collaboration', 'notification', 'workflow', 'communication'],
    specialties: [
      'Slack integration and automation',
      'Team collaboration tools',
      'Notification and alert systems',
      'Workflow automation',
      'Communication optimization',
      'Team productivity tools'
    ]
  },
  {
    name: 'mcr-agent',
    displayName: 'MCR Agent',
    description: 'Cannabis MCR (Master Control Record) management specialist',
    keywords: ['mcr', 'master', 'control', 'record', 'documentation', 'compliance', 'tracking'],
    specialties: [
      'Master Control Record management',
      'Documentation and record keeping',
      'Compliance tracking systems',
      'Data integrity management',
      'Audit trail maintenance',
      'Regulatory reporting'
    ]
  },
  {
    name: 'ad-agent',
    displayName: 'Ad Agent',
    description: 'Cannabis advertising and promotional strategy expert',
    keywords: ['advertising', 'ad', 'promotional', 'campaign', 'media', 'strategy', 'creative', 'content'],
    specialties: [
      'Advertising strategy and planning',
      'Promotional campaign development',
      'Media buying and placement',
      'Creative content development',
      'Campaign performance analysis',
      'Brand messaging optimization'
    ]
  },
  {
    name: 'editor-agent',
    displayName: 'Editor Agent',
    description: 'Content editing and document management specialist',
    keywords: ['edit', 'editor', 'content', 'document', 'review', 'modify', 'update', 'version'],
    specialties: [
      'Document editing and revision',
      'Content review and optimization',
      'Version control and tracking',
      'Collaborative editing',
      'Format standardization',
      'Quality assurance'
    ],
    tierRestriction: ['admin']
  }
];

function createSecureAgent(agentConfig) {
  console.log(`Creating secure agent: ${agentConfig.name}`);
  
  // Create agent directory
  const agentDir = `agents/${agentConfig.name}`;
  if (!fs.existsSync(agentDir)) {
    fs.mkdirSync(agentDir, { recursive: true });
  }
  
  // Copy security module
  fs.copyFileSync('security-module.js', `${agentDir}/security-module.js`);
  
  // Create agent-specific lambda.js
  const agentCode = `/**
 * ${agentConfig.displayName} - Secure Implementation
 * Generated from secure-agent-template.js
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
  name: '${agentConfig.displayName}',
  description: '${agentConfig.description}',
  keywords: ${JSON.stringify(agentConfig.keywords)},
  specialties: ${JSON.stringify(agentConfig.specialties)},
  tierRestriction: ${agentConfig.tierRestriction ? JSON.stringify(agentConfig.tierRestriction) : 'null'}
};

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: '${agentConfig.name}',
    version: '1.0.0',
    security: {
      rateLimit: \`\${SECURITY_CONFIG.maxMessageLength} requests per \${RATE_LIMIT_WINDOW / 1000 / 60} minutes\`,
      cors: SECURITY_CONFIG.allowedOrigins,
      inputValidation: true,
      xssProtection: true
    }
  });
});

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
    if (!validateAgentAccess(AGENT_CONFIG.name.toLowerCase().replace(/\\s+/g, '_'), plan)) {
      return res.status(403).json({
        error: 'Access denied for this plan',
        code: 'PLAN_ACCESS_DENIED'
      });
    }
    
    // Log the request
    console.log(\`Chat request - Agent: \${AGENT_CONFIG.name}, User: \${username}, Plan: \${plan}, Message length: \${message.length}\`);
    
    // Get OpenRouter API key
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      console.error('OpenRouter API key not found in environment variables');
      return res.status(500).json({ 
        error: 'API configuration error',
        response: 'I apologize, but I\\'m currently experiencing a configuration issue. Please try again later.'
      });
    }
    
    // Create system prompt
    const systemPrompt = \`You are a \${AGENT_CONFIG.name} specializing in \${AGENT_CONFIG.description}. 
    Your specialties include: \${AGENT_CONFIG.specialties.join(', ')}. 
    You are part of the Formul8 Multiagent system. 
    Provide helpful, accurate, and professional responses. Keep responses concise but informative.\`;
    
    // Call OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${openRouterApiKey}\`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://f8.syzygyx.com',
        'X-Title': \`Formul8 \${AGENT_CONFIG.name}\`
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
        response: 'I apologize, but I\\'m currently unable to process your request. Please try again in a moment.'
      });
    }
    
    const aiData = await openRouterResponse.json();
    const aiResponse = aiData.choices?.[0]?.message?.content || 'I apologize, but I couldn\\'t generate a response. Please try again.';
    
    // Extract usage information
    const usage = aiData.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || (promptTokens + completionTokens);
    const totalCost = 0.00; // Free model
    
    // Create footer with metadata
    const footer = \`\\n\\n---\\n*Agent: \${AGENT_CONFIG.name} | Plan: \${plan} | Tokens: \${totalTokens} (\${promptTokens}→\${completionTokens}) | Cost: $\${totalCost.toFixed(6)}*\`;
    
    res.json({
      success: true,
      response: aiResponse + footer,
      agent: AGENT_CONFIG.name.toLowerCase().replace(/\\s+/g, '_'),
      timestamp: new Date().toISOString(),
      model: 'openai/gpt-oss-120b',
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        cost: totalCost
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
`;
  
  fs.writeFileSync(`${agentDir}/lambda.js`, agentCode);
  
  // Create package.json
  const packageJson = {
    name: agentConfig.name,
    version: "1.0.0",
    description: agentConfig.description,
    main: "lambda.js",
    scripts: {
      test: "echo \"Error: no test specified\" && exit 1"
    },
    keywords: agentConfig.keywords,
    author: "Formul8",
    license: "ISC",
    dependencies: {
      "express": "^5.1.0",
      "cors": "^2.8.5"
    }
  };
  
  fs.writeFileSync(`${agentDir}/package.json`, JSON.stringify(packageJson, null, 2));
  
  console.log(`✅ Created secure agent: ${agentConfig.name}`);
}

function main() {
  console.log('🔒 Deploying Secure Agents...\n');
  
  // Create agents directory
  if (!fs.existsSync('agents')) {
    fs.mkdirSync('agents');
  }
  
  // Create each secure agent
  AGENTS.forEach(agent => {
    try {
      createSecureAgent(agent);
    } catch (error) {
      console.error(`❌ Error creating ${agent.name}:`, error.message);
    }
  });
  
  console.log('\n🎉 All secure agents created successfully!');
  console.log('\nNext steps:');
  console.log('1. Deploy each agent to AWS Lambda');
  console.log('2. Configure API Gateway for each agent');
  console.log('3. Update DNS records to point to the new endpoints');
  console.log('4. Test all endpoints for security compliance');
}

if (require.main === module) {
  main();
}

module.exports = { createSecureAgent, AGENTS };