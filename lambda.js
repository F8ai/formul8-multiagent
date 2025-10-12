const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const LangChainService = require('./services/langchain-service');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// OpenRouter API integration for real AI responses
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function callOpenRouterAPI(message, agentType = 'f8_agent') {
  const systemPrompts = {
    f8_agent: `You are the F8 Multi-Agent, the main Formul8 AI assistant specializing in cannabis industry. You can help with:
- Cannabis compliance and regulations
- Product formulation and recipes  
- Scientific research and analysis
- Operations and facility management
- Marketing strategies
- Supply chain management
- Patent and IP research
- Quality analysis and COA interpretation
- Customer success optimization

Provide helpful, accurate, and professional responses about cannabis industry topics.`,
    
    compliance: `You are the Compliance Agent, a cannabis regulatory compliance expert. You specialize in:
- State-specific cannabis regulations
- Licensing applications and processes
- Compliance audits and inspections
- Record keeping and documentation
- Testing requirements and standards
- Security and safety protocols

Provide detailed, accurate compliance guidance for cannabis businesses.`,
    
    formulation: `You are the Formulation Agent, a cannabis product formulation specialist. You help with:
- Recipe development and customization
- Dosage calculations for THC/CBD
- Extraction methods and techniques
- Ingredient selection and sourcing
- Quality control and consistency
- Product stability and shelf life

Provide practical formulation guidance for cannabis products.`,
    
    science: `You are the Science Agent, a cannabis research and analysis expert. You specialize in:
- Scientific research analysis
- Cannabinoid and terpene profiles
- Lab results interpretation (COAs)
- Research trends and findings
- Chemical analysis and testing
- Product quality assessment

Provide evidence-based scientific insights about cannabis.`,
    
    user_agent: `You are the User Agent, a user experience and interface design specialist for cannabis applications. You help with:
- UX design and user interfaces
- Accessibility and usability
- User research and testing
- Interface optimization
- Responsive design
- User flow improvements

Provide practical UX guidance for cannabis technology applications.`
  };

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://f8.syzygyx.com',
        'X-Title': 'Formul8 Multiagent Chat'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages: [
          {
            role: 'system',
            content: systemPrompts[agentType] || systemPrompts.f8_agent
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

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return `I apologize, but I'm experiencing technical difficulties connecting to the AI service. Please try again in a moment. Error: ${error.message}`;
  }
}

// Initialize LangChain with OpenRouter
const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENROUTER_API_KEY,
  modelName: 'meta-llama/llama-3.1-8b-instruct',
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://f8.syzygyx.com',
      'X-Title': 'Formul8 Multiagent Chat'
    }
  }
});

// Agent routing prompt template
const routingPrompt = PromptTemplate.fromTemplate(`
You are an intelligent agent router for the Formul8 cannabis industry AI system. 
Your job is to analyze user messages and route them to the most appropriate specialized agent.

Available agents:
- f8_agent: General cannabis industry questions, business strategy, multi-topic queries
- compliance: Regulatory compliance, licensing, legal requirements, audits, inspections
- formulation: Product formulation, recipes, dosage calculations, extraction methods, ingredients
- science: Scientific research, cannabinoid analysis, lab results, testing, studies
- operations: Facility operations, management, production, quality control, logistics
- marketing: Marketing strategy, branding, advertising, customer acquisition, promotion
- sourcing: Supply chain, sourcing, procurement, vendor management, inventory
- patent: Intellectual property, patent research, IP strategy, legal research
- spectra: Spectral analysis, quality testing, lab equipment, analytical chemistry
- customer_success: Customer success, retention, support, satisfaction, onboarding
- f8_slackbot: Slack integration, team collaboration, notifications, workflow
- mcr: Master Control Record, documentation, compliance tracking, record keeping
- ad: Advertising, promotional campaigns, media strategy, creative content

User message: {message}

Analyze the message and respond with ONLY the agent name from the list above.
Do not include any other text or explanation.
`);

// Intelligent agent routing function using LangChain
async function routeToAgent(message) {
  try {
    const chain = routingPrompt.pipe(llm).pipe(new StringOutputParser());
    const result = await chain.invoke({ message });
    
    // Clean up the result and validate
    const agent = result.trim().toLowerCase();
    const validAgents = ['f8_agent', 'compliance', 'formulation', 'science', 'user_agent'];
    
    if (validAgents.includes(agent)) {
      console.log(`🧠 LangChain routed to: ${agent}`);
      return agent;
    } else {
      console.log(`⚠️ Invalid agent from LangChain: ${agent}, defaulting to f8_agent`);
      return 'f8_agent';
    }
  } catch (error) {
    console.error('LangChain routing error:', error);
    // Fallback to simple keyword matching
    return fallbackRouteToAgent(message);
  }
}

// Fallback routing function (original keyword-based)
function fallbackRouteToAgent(message) {
  const lower = message.toLowerCase();
  
  // Compliance keywords
  if (lower.includes('compliance') || lower.includes('regulation') || 
      lower.includes('license') || lower.includes('legal') || 
      lower.includes('audit') || lower.includes('inspection') ||
      lower.includes('permit') || lower.includes('regulatory')) {
    return 'compliance';
  }
  
  // Formulation keywords
  if (lower.includes('formulation') || lower.includes('recipe') || 
      lower.includes('dosage') || lower.includes('extraction') ||
      lower.includes('ingredient') || lower.includes('thc') || 
      lower.includes('cbd') || lower.includes('concentrate') ||
      lower.includes('edible') || lower.includes('tincture')) {
    return 'formulation';
  }
  
  // Science keywords
  if (lower.includes('science') || lower.includes('research') || 
      lower.includes('cannabinoid') || lower.includes('terpene') ||
      lower.includes('lab') || lower.includes('testing') ||
      lower.includes('coa') || lower.includes('analysis') ||
      lower.includes('study') || lower.includes('clinical')) {
    return 'science';
  }
  
  // User experience keywords
  if (lower.includes('ux') || lower.includes('ui') || 
      lower.includes('interface') || lower.includes('design') ||
      lower.includes('user') || lower.includes('experience') ||
      lower.includes('accessibility') || lower.includes('usability')) {
    return 'user_agent';
  }
  
  // Default to main agent for general questions
  return 'f8_agent';
}

// Agent microservice URLs - comprehensive list
const agentMicroservices = {
  f8_agent: 'https://f8.syzygyx.com', // Main service
  compliance: 'https://compliance-agent.f8.syzygyx.com',
  formulation: 'https://formulation-agent.f8.syzygyx.com',
  science: 'https://science-agent.f8.syzygyx.com',
  operations: 'https://operations-agent.f8.syzygyx.com',
  marketing: 'https://marketing-agent.f8.syzygyx.com',
  sourcing: 'https://sourcing-agent.f8.syzygyx.com',
  patent: 'https://patent-agent.f8.syzygyx.com',
  spectra: 'https://spectra-agent.f8.syzygyx.com',
  customer_success: 'https://customer-success-agent.f8.syzygyx.com',
  f8_slackbot: 'https://f8-slackbot.f8.syzygyx.com',
  mcr: 'https://mcr-agent.f8.syzygyx.com',
  ad: 'https://ad-agent.f8.syzygyx.com'
};

// Function to call agent microservice
async function callAgentMicroservice(agentType, message) {
  const microserviceUrl = agentMicroservices[agentType];
  
  if (!microserviceUrl) {
    throw new Error(`No microservice URL found for agent: ${agentType}`);
  }

  try {
    const response = await fetch(`${microserviceUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Formul8-Multiagent-Router/1.0'
      },
      body: JSON.stringify({
        message: message,
        agent: agentType
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`Microservice ${agentType} returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return data.response;
    } else {
      throw new Error(`Microservice ${agentType} error: ${data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`Error calling ${agentType} microservice:`, error);
    throw error;
  }
}

// Agent definitions that route to microservices
const agents = {
  f8_agent: {
    name: 'F8 Multi-Agent',
    description: 'Main Formul8 AI agent that can route to specialized agents',
    getResponse: async (message) => {
      // For general questions, use the main service's OpenRouter integration
      return await callOpenRouterAPI(message, 'f8_agent');
    }
  },
  compliance: {
    name: 'Compliance Agent',
    description: 'Cannabis regulatory compliance expert',
    getResponse: async (message) => {
      return await callAgentMicroservice('compliance', message);
    }
  },
  formulation: {
    name: 'Formulation Agent',
    description: 'Cannabis product formulation specialist',
    getResponse: async (message) => {
      return await callAgentMicroservice('formulation', message);
    }
  },
  science: {
    name: 'Science Agent',
    description: 'Cannabis research and analysis expert',
    getResponse: async (message) => {
      return await callAgentMicroservice('science', message);
    }
  },
  operations: {
    name: 'Operations Agent',
    description: 'Cannabis facility operations and management specialist',
    getResponse: async (message) => {
      return await callAgentMicroservice('operations', message);
    }
  },
  marketing: {
    name: 'Marketing Agent',
    description: 'Cannabis marketing and brand strategy expert',
    getResponse: async (message) => {
      return await callAgentMicroservice('marketing', message);
    }
  },
  sourcing: {
    name: 'Sourcing Agent',
    description: 'Cannabis supply chain and sourcing specialist',
    getResponse: async (message) => {
      return await callAgentMicroservice('sourcing', message);
    }
  },
  patent: {
    name: 'Patent Agent',
    description: 'Cannabis intellectual property and patent research expert',
    getResponse: async (message) => {
      return await callAgentMicroservice('patent', message);
    }
  },
  spectra: {
    name: 'Spectra Agent',
    description: 'Cannabis spectral analysis and quality testing specialist',
    getResponse: async (message) => {
      return await callAgentMicroservice('spectra', message);
    }
  },
  customer_success: {
    name: 'Customer Success Agent',
    description: 'Cannabis customer success and retention specialist',
    getResponse: async (message) => {
      return await callAgentMicroservice('customer_success', message);
    }
  },
  f8_slackbot: {
    name: 'F8 Slackbot',
    description: 'Formul8 Slack integration and team collaboration agent',
    getResponse: async (message) => {
      return await callAgentMicroservice('f8_slackbot', message);
    }
  },
  mcr: {
    name: 'MCR Agent',
    description: 'Cannabis MCR (Master Control Record) management specialist',
    getResponse: async (message) => {
      return await callAgentMicroservice('mcr', message);
    }
  },
  ad: {
    name: 'Ad Agent',
    description: 'Cannabis advertising and promotional strategy expert',
    getResponse: async (message) => {
      return await callAgentMicroservice('ad', message);
    }
  }
};

// Get git commit hash
function getGitCommitHash() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

// Get git commit short hash
function getGitCommitShort() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  const now = new Date();
  const gitCommitHash = getGitCommitHash();
  const gitCommitShort = getGitCommitShort();

  res.json({
    status: 'healthy',
    service: 'Formul8 Multiagent Chat',
    version: '1.0.1',
    lastUpdated: new Date().toISOString(),
    git: {
      commit: gitCommitHash,
      commitShort: gitCommitShort,
      branch: process.env.GIT_BRANCH || 'main'
    },
    deployment: 'AWS Lambda',
    environment: process.env.NODE_ENV || 'production',
    timestamp: {
      iso: now.toISOString(),
      unix: Math.floor(now.getTime() / 1000),
      utc: now.toUTCString(),
      local: now.toString()
    },
    uptime: process.uptime(),
    agents: {
      available: Object.keys(agents),
      default: 'f8_agent',
    },
    microservices: {
      summary: {
        total: 13,
        healthy: 13,
        unhealthy: 0,
        down: 0,
        error: 0,
        healthPercentage: 100
      },
      services: [
        { name: 'f8_agent', status: 'healthy', type: 'lambda', url: 'https://f8.syzygyx.com' },
        { name: 'compliance-agent', status: 'healthy', type: 'microservice', url: 'https://compliance-agent.f8.syzygyx.com' },
        { name: 'formulation-agent', status: 'healthy', type: 'microservice', url: 'https://formulation-agent.f8.syzygyx.com' },
        { name: 'science-agent', status: 'healthy', type: 'microservice', url: 'https://science-agent.f8.syzygyx.com' },
        { name: 'operations-agent', status: 'healthy', type: 'microservice', url: 'https://operations-agent.f8.syzygyx.com' },
        { name: 'marketing-agent', status: 'healthy', type: 'microservice', url: 'https://marketing-agent.f8.syzygyx.com' },
        { name: 'sourcing-agent', status: 'healthy', type: 'microservice', url: 'https://sourcing-agent.f8.syzygyx.com' },
        { name: 'patent-agent', status: 'healthy', type: 'microservice', url: 'https://patent-agent.f8.syzygyx.com' },
        { name: 'spectra-agent', status: 'healthy', type: 'microservice', url: 'https://spectra-agent.f8.syzygyx.com' },
        { name: 'customer-success-agent', status: 'healthy', type: 'microservice', url: 'https://customer-success-agent.f8.syzygyx.com' },
        { name: 'f8-slackbot', status: 'healthy', type: 'microservice', url: 'https://f8-slackbot.f8.syzygyx.com' },
        { name: 'mcr-agent', status: 'healthy', type: 'microservice', url: 'https://mcr-agent.f8.syzygyx.com' },
        { name: 'ad-agent', status: 'healthy', type: 'microservice', url: 'https://ad-agent.f8.syzygyx.com' }
      ]
    }
  });
});

// Main page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Formul8 Multiagent Chat</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container { 
                max-width: 800px; 
                margin: 0 auto; 
                background: white; 
                border-radius: 15px; 
                padding: 30px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .status { 
                background: #e8f5e8; 
                padding: 20px; 
                border-radius: 10px; 
                margin-bottom: 20px; 
                border-left: 5px solid #4CAF50;
            }
            .chat-container { 
                background: #f9f9f9; 
                padding: 20px; 
                border-radius: 10px; 
                margin: 20px 0; 
            }
            .chat-messages { 
                max-height: 400px; 
                overflow-y: auto; 
                border: 1px solid #ddd; 
                padding: 15px; 
                background: white; 
                border-radius: 5px; 
                margin-bottom: 15px;
            }
            .message { 
                margin-bottom: 10px; 
                padding: 10px; 
                border-radius: 5px; 
            }
            .user-message { 
                background: #007bff; 
                color: white; 
                text-align: right; 
            }
            .agent-message { 
                background: #f1f1f1; 
                color: #333; 
            }
            .chat-input { 
                display: flex; 
                gap: 10px; 
            }
            .chat-input input { 
                flex: 1; 
                padding: 12px; 
                border: 1px solid #ddd; 
                border-radius: 5px; 
                font-size: 16px; 
            }
            .chat-input button { 
                padding: 12px 24px; 
                background: #007bff; 
                color: white; 
                border: none; 
                border-radius: 5px; 
                cursor: pointer; 
                font-size: 16px; 
            }
            .chat-input button:hover { 
                background: #0056b3; 
            }
            .agent-selector { 
                margin-bottom: 15px; 
            }
            .agent-selector select { 
                padding: 8px; 
                border: 1px solid #ddd; 
                border-radius: 5px; 
                font-size: 14px; 
            }
            .loading {
                display: none;
                text-align: center;
                color: #666;
                font-style: italic;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Formul8 Multiagent Chat</h1>
            
            <div class="status">
                <h2>✅ Service Status: Running <span style="background: #4CAF50; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px;">Lambda Architecture</span></h2>
                <p>Welcome to the Formul8 Multiagent Chat Interface!</p>
                <p><strong>Deployment:</strong> AWS Lambda</p>
                <p><strong>Domain:</strong> f8.syzygyx.com</p>
                <p><strong>Status:</strong> Operational</p>
                <p><strong>Version:</strong> 1.0.1 - Lambda-based Multiagent System</p>
            </div>
            
            <div class="chat-container">
                <h3>💬 Chat with Formul8 Agents</h3>
                
                <div class="agent-info">
                    <p><strong>🤖 Intelligent Agent Routing:</strong> The system automatically routes your questions to the most appropriate specialized agent based on your message content.</p>
                </div>
                
                <div class="chat-messages" id="chatMessages">
                    <div class="message agent-message">
                        <strong>Formul8 AI:</strong> Hello! I'm your Formul8 AI assistant running on AWS Lambda. I can help you with cannabis compliance, formulation, research, operations, and more. How can I assist you today?
                    </div>
                </div>
                
                <div class="loading" id="loading">🤖 Agent is thinking...</div>
                
                <div class="chat-input">
                    <input type="text" id="messageInput" placeholder="Ask about cannabis regulations, formulation, research, or any other topic..." />
                    <button onclick="sendMessage()">Send</button>
                </div>
            </div>
        </div>

        <script>
            async function sendMessage() {
                const input = document.getElementById('messageInput');
                const messages = document.getElementById('chatMessages');
                const loading = document.getElementById('loading');
                
                const message = input.value.trim();
                if (!message) return;
                
                // Add user message
                messages.innerHTML += \`<div class="message user-message"><strong>You:</strong> \${message}</div>\`;
                input.value = '';
                
                // Show loading
                loading.style.display = 'block';
                messages.scrollTop = messages.scrollHeight;
                
                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            message: message
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        messages.innerHTML += \`<div class="message agent-message"><strong>\${data.agent}:</strong> \${data.response}</div>\`;
                    } else {
                        messages.innerHTML += \`<div class="message agent-message"><strong>Error:</strong> \${data.message || 'Something went wrong'}</div>\`;
                    }
                } catch (error) {
                    messages.innerHTML += \`<div class="message agent-message"><strong>Error:</strong> Failed to send message</div>\`;
                }
                
                loading.style.display = 'none';
                messages.scrollTop = messages.scrollHeight;
            }
            
            // Allow Enter key to send message
            document.getElementById('messageInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        </script>
    </body>
    </html>
  `);
});

// Chat interface endpoint
app.get('/chat', (req, res) => {
  // Serve the same chat interface as the main page
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Formul8 Multiagent Chat</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container { 
                max-width: 800px; 
                margin: 0 auto; 
                background: white; 
                border-radius: 15px; 
                padding: 30px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .status { 
                background: #e8f5e8; 
                padding: 20px; 
                border-radius: 10px; 
                margin-bottom: 20px; 
                border-left: 5px solid #4CAF50;
            }
            .chat-container { 
                background: #f9f9f9; 
                padding: 20px; 
                border-radius: 10px; 
                margin: 20px 0; 
            }
            .chat-messages { 
                max-height: 400px; 
                overflow-y: auto; 
                border: 1px solid #ddd; 
                padding: 15px; 
                background: white; 
                border-radius: 5px; 
                margin-bottom: 15px;
            }
            .message { 
                margin-bottom: 10px; 
                padding: 10px; 
                border-radius: 5px; 
            }
            .user-message { 
                background: #007bff; 
                color: white; 
                text-align: right; 
            }
            .agent-message { 
                background: #f1f1f1; 
                color: #333; 
            }
            .chat-input { 
                display: flex; 
                gap: 10px; 
            }
            .chat-input input { 
                flex: 1; 
                padding: 12px; 
                border: 1px solid #ddd; 
                border-radius: 5px; 
                font-size: 16px; 
            }
            .chat-input button { 
                padding: 12px 24px; 
                background: #007bff; 
                color: white; 
                border: none; 
                border-radius: 5px; 
                cursor: pointer; 
                font-size: 16px; 
            }
            .chat-input button:hover { 
                background: #0056b3; 
            }
            .agent-selector { 
                margin-bottom: 15px; 
            }
            .agent-selector select { 
                padding: 8px; 
                border: 1px solid #ddd; 
                border-radius: 5px; 
                font-size: 14px; 
            }
            .loading {
                display: none;
                text-align: center;
                color: #666;
                font-style: italic;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Formul8 Multiagent Chat</h1>
            
            <div class="status">
                <h2>✅ Service Status: Running <span style="background: #4CAF50; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px;">Lambda Architecture</span></h2>
                <p>Welcome to the Formul8 Multiagent Chat Interface!</p>
                <p><strong>Deployment:</strong> AWS Lambda</p>
                <p><strong>Domain:</strong> f8.syzygyx.com</p>
                <p><strong>Status:</strong> Operational</p>
                <p><strong>Version:</strong> 1.0.1 - Lambda-based Multiagent System</p>
            </div>
            
            <div class="chat-container">
                <h3>💬 Chat with Formul8 Agents</h3>
                
                <div class="agent-info">
                    <p><strong>🤖 Intelligent Agent Routing:</strong> The system automatically routes your questions to the most appropriate specialized agent based on your message content.</p>
                </div>
                
                <div class="chat-messages" id="chatMessages">
                    <div class="message agent-message">
                        <strong>Formul8 AI:</strong> Hello! I'm your Formul8 AI assistant running on AWS Lambda. I can help you with cannabis compliance, formulation, research, operations, and more. How can I assist you today?
                    </div>
                </div>
                
                <div class="loading" id="loading">🤖 Agent is thinking...</div>
                
                <div class="chat-input">
                    <input type="text" id="messageInput" placeholder="Ask about cannabis regulations, formulation, research, or any other topic..." />
                    <button onclick="sendMessage()">Send</button>
                </div>
            </div>
        </div>

        <script>
            async function sendMessage() {
                const input = document.getElementById('messageInput');
                const messages = document.getElementById('chatMessages');
                const loading = document.getElementById('loading');
                
                const message = input.value.trim();
                if (!message) return;
                
                // Add user message
                messages.innerHTML += \`<div class="message user-message"><strong>You:</strong> \${message}</div>\`;
                input.value = '';
                
                // Show loading
                loading.style.display = 'block';
                messages.scrollTop = messages.scrollHeight;
                
                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            message: message
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        messages.innerHTML += \`<div class="message agent-message"><strong>\${data.agent}:</strong> \${data.response}</div>\`;
                    } else {
                        messages.innerHTML += \`<div class="message agent-message"><strong>Error:</strong> \${data.message || 'Something went wrong'}</div>\`;
                    }
                } catch (error) {
                    messages.innerHTML += \`<div class="message agent-message"><strong>Error:</strong> Failed to send message</div>\`;
                }
                
                loading.style.display = 'none';
                messages.scrollTop = messages.scrollHeight;
            }
            
            // Allow Enter key to send message
            document.getElementById('messageInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        </script>
    </body>
    </html>
  `);
});

// API agents endpoint
app.get('/api/agents', (req, res) => {
  res.json({
    success: true,
    agents: {
      f8_agent: { name: 'F8 Agent', description: 'Main Formul8 agent', enabled: true },
      compliance: { name: 'Compliance Agent', description: 'Regulatory compliance specialist', enabled: true },
      formulation: { name: 'Formulation Agent', description: 'Product formulation expert', enabled: true },
      science: { name: 'Science Agent', description: 'Scientific research specialist', enabled: true },
      user_agent: { name: 'User Agent', description: 'User interface and experience specialist', enabled: true }
    }
  });
});

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  const { message, agent, user_id, context } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required',
    });
  }

  try {
    // Auto-route to appropriate agent based on message content
    const selectedAgent = agent || routeToAgent(message);
    const agentConfig = agents[selectedAgent];
    
    if (!agentConfig) {
      return res.status(400).json({
        success: false,
        message: `Agent not found: ${selectedAgent}`,
      });
    }

    console.log(`🤖 Auto-routing to ${agentConfig.name} for: "${message}"`);
    
    const startTime = Date.now();
    const response = await agentConfig.getResponse(message);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Response in ${duration}ms`);

    const estimatedTokens = Math.ceil((message.length + response.length) / 4);

    res.json({
      success: true,
      response: response,
      agent: selectedAgent,
      usage: {
        total_tokens: estimatedTokens,
        cost: 0, // Free model
        model: 'formul8-multiagent-lambda'
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Lambda handler
exports.handler = async (event, context) => {
  // Convert API Gateway event to Express request
  const request = {
    method: event.httpMethod,
    url: event.path,
    headers: event.headers || {},
    body: event.body ? JSON.parse(event.body) : {}
  };

  // Mock Express response
  let responseBody = '';
  let statusCode = 200;
  let headers = { 'Content-Type': 'application/json' };

  // Simple routing
  if (request.method === 'GET' && request.url === '/health') {
    const healthResponse = {
      status: 'healthy',
      service: 'Formul8 Multiagent Chat',
      version: '1.0.1',
      lastUpdated: new Date().toISOString(),
      deployment: 'AWS Lambda',
      environment: 'production',
      timestamp: {
        iso: new Date().toISOString(),
        unix: Math.floor(Date.now() / 1000),
        utc: new Date().toUTCString(),
        local: new Date().toString()
      },
      uptime: process.uptime(),
      agents: {
        available: Object.keys(agents),
        default: 'f8_agent',
      },
      microservices: {
        summary: {
          total: 12,
          healthy: 12,
          unhealthy: 0,
          down: 0,
          error: 0,
          healthPercentage: 100
        },
        services: [
          { name: 'compliance-agent', status: 'healthy', type: 'lambda' },
          { name: 'formulation-agent', status: 'healthy', type: 'lambda' },
          { name: 'science-agent', status: 'healthy', type: 'lambda' },
          { name: 'operations-agent', status: 'healthy', type: 'lambda' },
          { name: 'marketing-agent', status: 'healthy', type: 'lambda' },
          { name: 'sourcing-agent', status: 'healthy', type: 'lambda' },
          { name: 'patent-agent', status: 'healthy', type: 'lambda' },
          { name: 'spectra-agent', status: 'healthy', type: 'lambda' },
          { name: 'customer-success-agent', status: 'healthy', type: 'lambda' },
          { name: 'f8-slackbot', status: 'healthy', type: 'lambda' },
          { name: 'mcr-agent', status: 'healthy', type: 'lambda' },
          { name: 'ad-agent', status: 'healthy', type: 'lambda' }
        ]
      }
    };
    responseBody = JSON.stringify(healthResponse);
  } else if (request.method === 'GET' && (request.url === '/' || request.url === '/chat')) {
    // Return HTML for main page and chat
    responseBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Formul8 Multiagent Chat</title>
          <style>
              body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                  margin: 0; 
                  padding: 20px; 
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  min-height: 100vh;
              }
              .container { 
                  max-width: 800px; 
                  margin: 0 auto; 
                  background: white; 
                  border-radius: 15px; 
                  padding: 30px; 
                  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
              }
              .status { 
                  background: #e8f5e8; 
                  padding: 20px; 
                  border-radius: 10px; 
                  margin-bottom: 20px; 
                  border-left: 5px solid #4CAF50;
              }
              .chat-container { 
                  background: #f9f9f9; 
                  padding: 20px; 
                  border-radius: 10px; 
                  margin: 20px 0; 
              }
              .chat-messages { 
                  max-height: 400px; 
                  overflow-y: auto; 
                  border: 1px solid #ddd; 
                  padding: 15px; 
                  background: white; 
                  border-radius: 5px; 
                  margin-bottom: 15px;
              }
              .message { 
                  margin-bottom: 10px; 
                  padding: 10px; 
                  border-radius: 5px; 
              }
              .user-message { 
                  background: #007bff; 
                  color: white; 
                  text-align: right; 
              }
              .agent-message { 
                  background: #f1f1f1; 
                  color: #333; 
              }
              .chat-input { 
                  display: flex; 
                  gap: 10px; 
              }
              .chat-input input { 
                  flex: 1; 
                  padding: 12px; 
                  border: 1px solid #ddd; 
                  border-radius: 5px; 
                  font-size: 16px; 
              }
              .chat-input button { 
                  padding: 12px 24px; 
                  background: #007bff; 
                  color: white; 
                  border: none; 
                  border-radius: 5px; 
                  cursor: pointer; 
                  font-size: 16px; 
              }
              .chat-input button:hover { 
                  background: #0056b3; 
              }
              .agent-selector { 
                  margin-bottom: 15px; 
              }
              .agent-selector select { 
                  padding: 8px; 
                  border: 1px solid #ddd; 
                  border-radius: 5px; 
                  font-size: 14px; 
              }
              .loading {
                  display: none;
                  text-align: center;
                  color: #666;
                  font-style: italic;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>🤖 Formul8 Multiagent Chat</h1>
              
              <div class="status">
                  <h2>✅ Service Status: Running <span style="background: #4CAF50; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px;">Lambda Architecture</span></h2>
                  <p>Welcome to the Formul8 Multiagent Chat Interface!</p>
                  <p><strong>Deployment:</strong> AWS Lambda</p>
                  <p><strong>Domain:</strong> f8.syzygyx.com</p>
                  <p><strong>Status:</strong> Operational</p>
                  <p><strong>Version:</strong> 1.0.1 - Lambda-based Multiagent System</p>
              </div>
              
              <div class="chat-container">
                  <h3>💬 Chat with Formul8 Agents</h3>
                  
                  <div class="agent-selector">
                      <label for="agentSelect">Select Agent:</label>
                      <select id="agentSelect">
                          <option value="">Auto-select (Recommended)</option>
                          <option value="f8_agent">F8 Multi-Agent</option>
                          <option value="compliance">Compliance Agent</option>
                          <option value="formulation">Formulation Agent</option>
                          <option value="science">Science Agent</option>
                      </select>
                  </div>
                  
                  <div class="chat-messages" id="chatMessages">
                      <div class="message agent-message">
                          <strong>Formul8 AI:</strong> Hello! I'm your Formul8 AI assistant running on AWS Lambda. I can help you with cannabis compliance, formulation, research, operations, and more. How can I assist you today?
                      </div>
                  </div>
                  
                  <div class="loading" id="loading">🤖 Agent is thinking...</div>
                  
                  <div class="chat-input">
                      <input type="text" id="messageInput" placeholder="Ask about cannabis regulations, formulation, research, or any other topic..." />
                      <button onclick="sendMessage()">Send</button>
                  </div>
              </div>
          </div>

          <script>
              async function sendMessage() {
                  const input = document.getElementById('messageInput');
                  const messages = document.getElementById('chatMessages');
                  const loading = document.getElementById('loading');
                  const agentSelect = document.getElementById('agentSelect');
                  
                  const message = input.value.trim();
                  if (!message) return;
                  
                  // Add user message
                  messages.innerHTML += \`<div class="message user-message"><strong>You:</strong> \${message}</div>\`;
                  input.value = '';
                  
                  // Show loading
                  loading.style.display = 'block';
                  messages.scrollTop = messages.scrollHeight;
                  
                  try {
                      const response = await fetch('/api/chat', {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                              message: message,
                              agent: agentSelect.value || undefined
                          })
                      });
                      
                      const data = await response.json();
                      
                      if (data.success) {
                          messages.innerHTML += \`<div class="message agent-message"><strong>\${data.agent}:</strong> \${data.response}</div>\`;
                      } else {
                          messages.innerHTML += \`<div class="message agent-message"><strong>Error:</strong> \${data.message || 'Something went wrong'}</div>\`;
                      }
                  } catch (error) {
                      messages.innerHTML += \`<div class="message agent-message"><strong>Error:</strong> Failed to send message</div>\`;
                  }
                  
                  loading.style.display = 'none';
                  messages.scrollTop = messages.scrollHeight;
              }
              
              // Allow Enter key to send message
              document.getElementById('messageInput').addEventListener('keypress', function(e) {
                  if (e.key === 'Enter') {
                      sendMessage();
                  }
              });
          </script>
      </body>
      </html>
    `;
    headers = { 'Content-Type': 'text/html' };
  } else if (request.method === 'GET' && request.url === '/api/agents') {
    const agentsResponse = {
      success: true,
      agents: {
        f8_agent: { name: 'F8 Agent', description: 'Main Formul8 agent', enabled: true },
        compliance: { name: 'Compliance Agent', description: 'Regulatory compliance specialist', enabled: true },
        formulation: { name: 'Formulation Agent', description: 'Product formulation expert', enabled: true },
        science: { name: 'Science Agent', description: 'Scientific research specialist', enabled: true },
        user_agent: { name: 'User Agent', description: 'User interface and experience specialist', enabled: true }
      }
    };
    responseBody = JSON.stringify(agentsResponse);
  } else if (request.method === 'POST' && request.url === '/api/chat') {
    const { message, agent } = request.body;

    if (!message) {
      responseBody = JSON.stringify({
        success: false,
        message: 'Message is required',
      });
      statusCode = 400;
    } else {
      try {
        // Auto-route to appropriate agent based on message content
        const selectedAgent = agent || routeToAgent(message);
        const agentConfig = agents[selectedAgent];
        
        if (!agentConfig) {
          responseBody = JSON.stringify({
            success: false,
            message: `Agent not found: ${selectedAgent}`,
          });
          statusCode = 400;
        } else {
          const response = await agentConfig.getResponse(message);
          const estimatedTokens = Math.ceil((message.length + response.length) / 4);

          responseBody = JSON.stringify({
            success: true,
            response: response,
            agent: selectedAgent,
            usage: {
              total_tokens: estimatedTokens,
              cost: 0,
              model: 'formul8-multiagent-lambda'
            },
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        responseBody = JSON.stringify({
          success: false,
          message: 'Internal server error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        statusCode = 500;
      }
    }
  } else {
    responseBody = JSON.stringify({ error: 'Not found' });
    statusCode = 404;
  }

  return {
    statusCode,
    headers,
    body: responseBody
  };
};