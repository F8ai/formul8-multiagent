const express = require('express');
const cors = require('cors');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple agent responses (placeholder for LangChain integration)
const agents = {
  f8_agent: {
    name: 'F8 Multi-Agent',
    description: 'Main Formul8 AI agent that can route to specialized agents',
    getResponse: (message) => {
      const lower = message.toLowerCase();
      if (lower.includes('compliance') || lower.includes('regulation')) {
        return `As the F8 Multi-Agent, I can help you with cannabis compliance. Here are some key areas:

1. **State Regulations**: Each state has specific cannabis regulations
2. **Licensing**: Proper licensing is essential for legal operation
3. **Testing**: Regular product testing is required
4. **Record Keeping**: Maintain detailed records of all operations
5. **Security**: Implement proper security measures

I can connect you with our specialized Compliance Agent for more detailed assistance.`;
      }
      if (lower.includes('formulation') || lower.includes('recipe')) {
        return `As the F8 Multi-Agent, I can help you with cannabis product formulation. Key considerations include:

1. **Dosage Calculation**: Proper THC/CBD dosing is crucial
2. **Extraction Methods**: Choose the right extraction technique
3. **Ingredient Compatibility**: Ensure all ingredients work together
4. **Stability**: Consider shelf life and storage requirements
5. **Testing**: Regular potency and safety testing

I can connect you with our specialized Formulation Agent for detailed recipes and guidance.`;
      }
      return `Hello! I'm the F8 Multi-Agent, your main Formul8 AI assistant. I can help you with:

- Cannabis compliance and regulations
- Product formulation and recipes
- Scientific research and analysis
- Operations and facility management
- Marketing strategies
- Supply chain management
- Patent and IP research
- Quality analysis and COA interpretation
- Customer success optimization

How can I assist you today?`;
    }
  },
  compliance: {
    name: 'Compliance Agent',
    description: 'Cannabis regulatory compliance expert',
    getResponse: (message) => {
      return `As the Compliance Agent, I specialize in cannabis regulatory compliance. I can help with:

1. **State-Specific Regulations**: Each state has unique requirements
2. **Licensing Applications**: Guide you through the licensing process
3. **Compliance Audits**: Prepare for regulatory inspections
4. **Record Keeping**: Set up proper documentation systems
5. **Testing Requirements**: Ensure products meet testing standards

What specific compliance question do you have?`;
    }
  },
  formulation: {
    name: 'Formulation Agent',
    description: 'Cannabis product formulation specialist',
    getResponse: (message) => {
      return `As the Formulation Agent, I help create cannabis products. I can help with:

1. **Recipe Development**: Create custom formulations
2. **Dosage Calculations**: Precise THC/CBD dosing
3. **Extraction Methods**: Choose optimal extraction techniques
4. **Ingredient Selection**: Source quality ingredients
5. **Quality Control**: Ensure consistent product quality

What type of product are you looking to formulate?`;
    }
  },
  science: {
    name: 'Science Agent',
    description: 'Cannabis research and analysis expert',
    getResponse: (message) => {
      return `As the Science Agent, I provide scientific insights on cannabis. I can help with:

1. **Research Analysis**: Interpret scientific studies
2. **Cannabinoid Profiles**: Understand different cannabinoids
3. **Terpene Analysis**: Analyze terpene profiles
4. **Lab Results**: Interpret COA and test results
5. **Research Trends**: Stay updated on latest findings

What scientific aspect would you like to explore?`;
    }
  }
};

// Microservice watchdog functionality - App Runner services
const microservices = [
  { name: 'compliance-agent', url: 'https://compliance-agent.f8.syzygyx.com', repo: 'f8ai/compliance-agent' },
  { name: 'formulation-agent', url: 'https://formulation-agent.f8.syzygyx.com', repo: 'f8ai/formulation-agent' },
  { name: 'science-agent', url: 'https://science-agent.f8.syzygyx.com', repo: 'f8ai/science-agent' },
  { name: 'operations-agent', url: 'https://operations-agent.f8.syzygyx.com', repo: 'f8ai/operations-agent' },
  { name: 'marketing-agent', url: 'https://marketing-agent.f8.syzygyx.com', repo: 'f8ai/marketing-agent' },
  { name: 'sourcing-agent', url: 'https://sourcing-agent.f8.syzygyx.com', repo: 'f8ai/sourcing-agent' },
  { name: 'patent-agent', url: 'https://patent-agent.f8.syzygyx.com', repo: 'f8ai/patent-agent' },
  { name: 'spectra-agent', url: 'https://spectra-agent.f8.syzygyx.com', repo: 'f8ai/spectra-agent' },
  { name: 'customer-success-agent', url: 'https://customer-success-agent.f8.syzygyx.com', repo: 'f8ai/customer-success-agent' },
  { name: 'f8-slackbot', url: 'https://f8-slackbot.f8.syzygyx.com', repo: 'f8ai/f8-slackbot' },
  { name: 'mcr-agent', url: 'https://mcr-agent.f8.syzygyx.com', repo: 'f8ai/mcr-agent' },
  { name: 'ad-agent', url: 'https://ad-agent.f8.syzygyx.com', repo: 'f8ai/ad-agent' }
];

// Function to check if a microservice is running
async function isMicroserviceRunning(url) {
  try {
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Function to trigger App Runner deployment for a microservice
async function startMicroservice(service) {
  try {
    console.log(`🚀 Checking ${service.name} App Runner service...`);
    
    // For App Runner services, we can't directly start them from here
    // Instead, we check if they're running and log the status
    const isRunning = await isMicroserviceRunning(service.url);
    
    if (isRunning) {
      console.log(`✅ ${service.name} is running at ${service.url}`);
      return true;
    } else {
      console.log(`❌ ${service.name} is not responding at ${service.url}`);
      console.log(`💡 To start ${service.name}, deploy it to App Runner from ${service.repo}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error checking ${service.name}: ${error.message}`);
    return false;
  }
}

// Function to check all microservices
async function startAllMicroservices() {
  console.log('🔍 Checking App Runner microservices...');
  const results = [];
  
  for (const service of microservices) {
    const isRunning = await isMicroserviceRunning(service.url);
    if (isRunning) {
      console.log(`✅ ${service.name} is running at ${service.url}`);
      results.push({ ...service, status: 'healthy' });
    } else {
      console.log(`❌ ${service.name} is not responding at ${service.url}`);
      console.log(`💡 Deploy ${service.name} to App Runner from ${service.repo}`);
      results.push({ ...service, status: 'down' });
    }
  }
  
  return results;
}

// Get git commit hash
function getGitCommitHash() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

function getGitCommitShort() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

// Microservice health check function
async function checkMicroservice(service) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const startTime = Date.now();
    const response = await fetch(`${service.url}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      return {
        name: service.name,
        port: service.port,
        status: 'healthy',
        responseTime: responseTime,
        details: data
      };
    } else {
      return {
        name: service.name,
        port: service.port,
        status: 'unhealthy',
        error: `HTTP ${response.status}`,
        responseTime: responseTime
      };
    }
  } catch (error) {
    return {
      name: service.name,
      port: service.port,
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: 0
    };
  }
}

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Formul8 Multiagent Chat</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #2c3e50; text-align: center; }
            .status { background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .endpoints { background: #f0f8ff; padding: 20px; border-radius: 5px; margin: 20px 0; }
            a { color: #3498db; text-decoration: none; }
            a:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Formul8 Multiagent Chat</h1>
            <div class="status">
                <h2>✅ Service Status: Running <span class="badge">Multiagent System</span></h2>
                <p>Welcome to the Formul8 Multiagent Chat Interface!</p>
                <p><strong>Deployment:</strong> Production (AWS App Runner)</p>
                <p><strong>Domain:</strong> f8.syzygyx.com</p>
                <p><strong>Status:</strong> Operational</p>
                <p><strong>Version:</strong> 1.0.0 - Multiagent Chat Frontend</p>
            </div>
            <div class="endpoints">
                <h3>🔗 Available Endpoints:</h3>
                <ul>
                    <li><a href="/health">GET /health</a> - Service health check with microservice monitoring</li>
                    <li><a href="/api/agents">GET /api/agents</a> - List all agents</li>
                    <li><a href="/chat">GET /chat</a> - Live chat interface</li>
                </ul>
            </div>
        </div>
    </body>
    </html>
  `);
});

app.get('/health', async (req, res) => {
  console.log('🔍 Health check requested - starting watchdog...');
  
  // Use watchdog to start microservices if needed
  const microserviceResults = await startAllMicroservices();
  
  // Convert results to the expected format
  const microserviceHealth = microserviceResults.map(service => ({
    name: service.name,
    url: service.url,
    status: service.status,
    responseTime: service.status === 'healthy' ? 100 : 0,
    error: service.status === 'down' ? 'Service not deployed or not responding' : undefined
  }));

  const healthyCount = microserviceHealth.filter(r => r.status === 'healthy').length;
  const totalCount = microserviceHealth.length;
  const overallStatus = healthyCount === totalCount ? 'healthy' : 
                       healthyCount > 0 ? 'degraded' : 'unhealthy';

  const now = new Date();
  const gitCommitHash = getGitCommitHash();
  const gitCommitShort = getGitCommitShort();

  res.json({
    status: overallStatus,
    service: 'Formul8 Multiagent Chat',
    version: '1.0.1',
    lastUpdated: new Date().toISOString(),
    git: {
      commit: gitCommitHash,
      commitShort: gitCommitShort,
      branch: process.env.GIT_BRANCH || 'main'
    },
    deployment: 'AWS App Runner',
    environment: process.env.NODE_ENV || 'development',
    timestamp: {
      iso: now.toISOString(),
      unix: Math.floor(now.getTime() / 1000),
      utc: now.toUTCString(),
      local: now.toString()
    },
    uptime: process.uptime(),
    agents: {
      available: ['f8_agent', 'compliance', 'formulation', 'science'],
      default: 'f8_agent'
    },
    microservices: {
      summary: {
        total: totalCount,
        healthy: healthyCount,
        unhealthy: microserviceHealth.filter(r => r.status === 'unhealthy').length,
        down: microserviceHealth.filter(r => r.status === 'down').length,
        error: microserviceHealth.filter(r => r.status === 'error').length,
        healthPercentage: Math.round((healthyCount / totalCount) * 100)
      },
      services: microserviceHealth
    }
  });
});

app.get('/api/agents', (req, res) => {
  res.json({
    success: true,
    agents: {
      f8_agent: { name: 'F8 Agent', description: 'Main Formul8 agent', enabled: true },
      compliance: { name: 'Compliance Agent', description: 'Regulatory compliance specialist', enabled: true },
      formulation: { name: 'Formulation Agent', description: 'Product formulation expert', enabled: true },
      science: { name: 'Science Agent', description: 'Scientific research specialist', enabled: true }
    }
  });
});

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
                <h2>✅ Service Status: Running <span style="background: #4CAF50; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px;">Multiagent System</span></h2>
                <p>Welcome to the Formul8 Multiagent Chat Interface!</p>
                <p><strong>Deployment:</strong> AWS App Runner</p>
                <p><strong>Domain:</strong> f8.syzygyx.com</p>
                <p><strong>Status:</strong> Operational</p>
                <p><strong>Version:</strong> 1.0.0 - Multiagent Chat Frontend</p>
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
                        <strong>Formul8 AI:</strong> Hello! I'm your Formul8 AI assistant. I can help you with cannabis compliance, formulation, research, operations, and more. How can I assist you today?
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
  `);
});

/**
 * Chat API endpoint - Using consolidated chat service
 */
app.post('/api/chat', async (req, res) => {
  const { message, agent, user_id, context, plan, username } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required',
    });
  }

  try {
    // Use consolidated chat service with LangChain integration
    const ChatService = require('./services/chat-service');
    const chatService = new ChatService();
    
    const result = await chatService.processChat({
      message,
      agent,
      plan: plan || 'free',
      username: username || user_id || 'anonymous'
    });

    res.json(result);
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Formul8 Multiagent Chat server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat interface: http://localhost:${PORT}/chat`);
  console.log(`📡 API ready for requests`);
  console.log(`🤖 Multiagent system enabled with 4 agents`);
});

module.exports = app;