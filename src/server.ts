import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple agent responses (placeholder for LangChain integration)
const agents = {
  f8_agent: {
    name: 'F8 Multi-Agent',
    description: 'Main Formul8 AI agent that can route to specialized agents',
    getResponse: (message: string) => {
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
    getResponse: (message: string) => {
      return `As a compliance expert, I can help you with cannabis regulations:

1. **State Regulations**: Each state has specific requirements for cannabis businesses
2. **Licensing**: Proper licensing is essential for legal operation  
3. **Testing**: Regular product testing is required
4. **Record Keeping**: Maintain detailed records of all operations
5. **Security**: Implement proper security measures

For specific regulations in your state, please consult the official regulatory website or contact a compliance attorney.`;
    }
  },
  formulation: {
    name: 'Formulation Agent', 
    description: 'CBD/THC product formulation expert',
    getResponse: (message: string) => {
      return `As a formulation expert, I can help you with cannabis product development:

1. **Dosage Calculation**: Proper THC/CBD dosing is crucial
2. **Extraction Methods**: Choose the right extraction technique
3. **Ingredient Compatibility**: Ensure all ingredients work together
4. **Stability**: Consider shelf life and storage requirements
5. **Testing**: Regular potency and safety testing

For specific formulation questions, please provide more details about your product type.`;
    }
  },
  science: {
    name: 'Science Agent',
    description: 'Research and analysis expert', 
    getResponse: (message: string) => {
      return `As a science expert, I can help you with cannabis research and analysis:

1. **Research Design**: Proper experimental design with controls
2. **Data Analysis**: Statistical analysis of results
3. **Literature Review**: Current research findings
4. **Testing Protocols**: Standardized testing procedures
5. **Quality Control**: Ensuring reliable results

For specific scientific questions, please provide details about your research objectives.`;
    }
  }
};

// Determine which agent to use based on message content
function determineAgent(message: string): string {
  const lower = message.toLowerCase();
  
  if (lower.match(/\b(compliance|regulation|legal|sop|permit|license)\b/)) {
    return 'compliance';
  }
  if (lower.match(/\b(formulation|recipe|tincture|extract|cbd|thc)\b/)) {
    return 'formulation';
  }
  if (lower.match(/\b(research|analysis|study|data|test|lab)\b/)) {
    return 'science';
  }
  
  return 'f8_agent'; // Default
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Home page
 */
app.get('/', (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Formul8 Multiagent Chat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container { 
                max-width: 1200px; 
                margin: 0 auto; 
                background: white; 
                padding: 40px; 
                border-radius: 15px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            h1 { 
                color: #2c3e50; 
                text-align: center; 
                margin-bottom: 30px;
                font-size: 2.5em;
            }
            .status { 
                background: #e8f5e8; 
                padding: 20px; 
                border-radius: 10px; 
                margin: 20px 0; 
                border-left: 4px solid #4CAF50;
            }
            .chat-container {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                min-height: 400px;
            }
            .chat-messages {
                height: 300px;
                overflow-y: auto;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 15px;
                background: white;
                margin-bottom: 15px;
            }
            .message {
                margin: 10px 0;
                padding: 10px;
                border-radius: 8px;
            }
            .user-message {
                background: #007bff;
                color: white;
                margin-left: 20%;
            }
            .agent-message {
                background: #e9ecef;
                color: #333;
                margin-right: 20%;
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
            .endpoints { 
                background: #f0f8ff; 
                padding: 20px; 
                border-radius: 10px; 
                margin: 20px 0; 
            }
            .badge { 
                background: #4CAF50; 
                color: white; 
                padding: 5px 10px; 
                border-radius: 3px; 
                font-size: 12px; 
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
                <h2>✅ Service Status: Running <span class="badge">Multiagent System</span></h2>
                <p>Welcome to the Formul8 Multiagent Chat Interface!</p>
                <p><strong>Deployment:</strong> Production (GitHub Pages)</p>
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
            
            <div class="endpoints">
                <h3>📡 Available Endpoints:</h3>
                <ul>
                    <li><a href="/health">GET /health</a> - Service health check</li>
                    <li><strong>POST /api/chat</strong> - Send message (auto-routes to agent)</li>
                    <li><strong>POST /api/query/:agent</strong> - Query specific agent</li>
                    <li><a href="/api/agents">GET /api/agents</a> - List all agents</li>
                    <li><a href="/chat">GET /chat</a> - This chat interface</li>
                </ul>
            </div>
            
            <div class="endpoints">
                <h3>🤖 Available Agents:</h3>
                <ul>
                    <li><strong>F8 Multi-Agent</strong> - Main agent that routes to specialized agents</li>
                    <li><strong>Compliance Agent</strong> - Cannabis regulatory compliance expert</li>
                    <li><strong>Formulation Agent</strong> - CBD/THC product formulation expert</li>
                    <li><strong>Science Agent</strong> - Research and analysis expert</li>
                </ul>
            </div>
            
            <p style="text-align: center; color: #7f8c8d; margin-top: 40px;">
                Formul8 Multiagent Chat - AI-Powered Cannabis Solutions
            </p>
        </div>
        
        <script>
            const chatMessages = document.getElementById('chatMessages');
            const messageInput = document.getElementById('messageInput');
            const agentSelect = document.getElementById('agentSelect');
            const loading = document.getElementById('loading');
            
            // Allow sending message with Enter key
            messageInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
            
            async function sendMessage() {
                const message = messageInput.value.trim();
                const agent = agentSelect.value;
                
                if (!message) {
                    alert('Please enter a message');
                    return;
                }
                
                // Add user message to chat
                addMessage(message, 'user');
                messageInput.value = '';
                
                // Show loading
                loading.style.display = 'block';
                
                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            message, 
                            agent: agent || undefined,
                            user_id: 'web-user'
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        addMessage(data.response, 'agent', data.agent, data.usage);
                    } else {
                        addMessage('Sorry, I encountered an error: ' + (data.message || 'Unknown error'), 'agent');
                    }
                } catch (error) {
                    addMessage('Sorry, I encountered an error: ' + error.message, 'agent');
                } finally {
                    loading.style.display = 'none';
                }
            }
            
            function addMessage(content, type, agent = null, usage = null) {
                const messageDiv = document.createElement('div');
                messageDiv.className = \`message \${type}-message\`;
                
                let messageContent = \`<strong>\${agent || 'Formul8 AI'}:</strong> \${content}\`;
                if (usage) {
                    messageContent += \`<br><small style="color: #666;">Tokens: \${usage.total_tokens} | Cost: $\${usage.cost.toFixed(4)} | Model: \${usage.model}</small>\`;
                }
                
                messageDiv.innerHTML = messageContent;
                chatMessages.appendChild(messageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        </script>
    </body>
    </html>
  `);
});

/**
 * Chat interface page
 */
app.get('/chat', (_req: Request, res: Response) => {
  // Redirect to home page which contains the chat interface
  res.redirect('/');
});

/**
 * Get git commit hash
 */
function getGitCommitHash(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Get git commit short hash
 */
function getGitCommitShort(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Microservice health check function
 */
async function checkMicroservice(service: { name: string; port: number; url: string }) {
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

/**
 * Health check endpoint
 */
app.get('/health', async (_req: Request, res: Response) => {
  const microservices = [
    { name: 'compliance-agent', port: 3001, url: 'http://localhost:3001' },
    { name: 'formulation-agent', port: 3002, url: 'http://localhost:3002' },
    { name: 'science-agent', port: 3003, url: 'http://localhost:3003' },
    { name: 'operations-agent', port: 3004, url: 'http://localhost:3004' },
    { name: 'marketing-agent', port: 3005, url: 'http://localhost:3005' },
    { name: 'sourcing-agent', port: 3006, url: 'http://localhost:3006' },
    { name: 'patent-agent', port: 3007, url: 'http://localhost:3007' },
    { name: 'spectra-agent', port: 3008, url: 'http://localhost:3008' },
    { name: 'customer-success-agent', port: 3009, url: 'http://localhost:3009' },
    { name: 'f8-slackbot', port: 3010, url: 'http://localhost:3010' },
    { name: 'mcr-agent', port: 3011, url: 'http://localhost:3011' },
    { name: 'ad-agent', port: 3012, url: 'http://localhost:3012' }
  ];

  // Check all microservices
  const microserviceResults = await Promise.allSettled(
    microservices.map(service => checkMicroservice(service))
  );

  const microserviceHealth = microserviceResults.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        name: microservices[index].name,
        port: microservices[index].port,
        status: 'error',
        error: result.reason?.message || 'Promise rejected',
        responseTime: 0
      };
    }
  });

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
    version: '1.0.0',
    git: {
      commit: gitCommitHash,
      commitShort: gitCommitShort,
      branch: process.env.GIT_BRANCH || 'main'
    },
    deployment: 'GitHub Pages',
    environment: process.env.NODE_ENV || 'development',
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

/**
 * Get list of agents
 */
app.get('/api/agents', (_req: Request, res: Response) => {
  res.json({
    success: true,
    agents: Object.entries(agents).reduce((acc, [type, config]) => {
      acc[type] = {
        name: config.name,
        description: config.description,
        enabled: true
      };
      return acc;
    }, {} as Record<string, any>)
  });
});

/**
 * Chat API endpoint
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message, agent, user_id, context } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required',
    });
  }

  try {
    const selectedAgent = agent || determineAgent(message);
    const agentConfig = agents[selectedAgent as keyof typeof agents];
    
    if (!agentConfig) {
      return res.status(400).json({
        success: false,
        message: `Agent not found: ${selectedAgent}`,
      });
    }

    console.log(`🤖 Routing to ${agentConfig.name} for: "${message}"`);
    
    const startTime = Date.now();
    const response = agentConfig.getResponse(message);
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
        model: 'formul8-multiagent'
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

/**
 * Query specific agent
 */
app.post('/api/query/:agent', async (req: Request, res: Response) => {
  const { agent } = req.params;
  const { message, user_id, context } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required',
    });
  }

  try {
    const agentConfig = agents[agent as keyof typeof agents];
    
    if (!agentConfig) {
      return res.status(400).json({
        success: false,
        message: `Agent not found: ${agent}`,
      });
    }

    console.log(`🤖 Direct query to ${agentConfig.name}: "${message}"`);
    
    const startTime = Date.now();
    const response = agentConfig.getResponse(message);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Response in ${duration}ms`);

    const estimatedTokens = Math.ceil((message.length + response.length) / 4);

    res.json({
      success: true,
      response: response,
      agent: agent,
      usage: {
        total_tokens: estimatedTokens,
        cost: 0,
        model: 'formul8-multiagent'
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Query API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * 404 handler
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

/**
 * Error handler
 */
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message,
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`\n🚀 Formul8 Multiagent Chat server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat interface: http://localhost:${PORT}/chat`);
  console.log(`📡 API ready for requests`);
  console.log(`🤖 Multiagent system enabled with ${Object.keys(agents).length} agents\n`);
});

export default app;
