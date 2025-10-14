import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

// Load environment variables
dotenv.config();

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

/**
 * Future4200 page - mimics future4200.com
 */
app.get('/future4200.html', (_req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html lang="en" class="desktop-view not-mobile-device text-size-normal anon no-touch discourse-no-touch">
<head>
    <meta charset="utf-8">
    <title>Future4200</title>
    <meta name="description" content="The Future Is Now">
    <meta name="theme-color" content="#252525">
    <meta name="color-scheme" content="dark">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content">
    <link rel="icon" type="image/png" href="https://future4200.com/uploads/default/optimized/3X/a/d/ad54c52220ad6e9905fd2e055365d34f95362f91_2_32x32.ico">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            background-color: #0e0e0e;
            color: #d1d1d1;
            font-size: 16px;
            line-height: 1.4;
        }
        
        /* Header */
        .header {
            background-color: #252525;
            border-bottom: 1px solid #333;
            padding: 8px 0;
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        
        .header-container {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
        }
        
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #fff;
            text-decoration: none;
        }
        
        .nav-links {
            display: flex;
            gap: 20px;
            align-items: center;
        }
        
        .nav-link {
            color: #d1d1d1;
            text-decoration: none;
            padding: 8px 12px;
            border-radius: 4px;
            transition: background-color 0.2s;
        }
        
        .nav-link:hover {
            background-color: #333;
        }
        
        .auth-buttons {
            display: flex;
            gap: 10px;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
        }
        
        .btn-primary {
            background-color: #007bff;
            color: white;
        }
        
        .btn-primary:hover {
            background-color: #0056b3;
        }
        
        .btn-secondary {
            background-color: transparent;
            color: #d1d1d1;
            border: 1px solid #555;
        }
        
        .btn-secondary:hover {
            background-color: #333;
        }
        
        /* Main content */
        .main-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .page-title {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 30px;
            color: #fff;
        }
        
        /* Categories */
        .categories {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .category-card {
            background-color: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 20px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .category-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .category-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .category-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(45deg, #007bff, #00d4aa);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-size: 20px;
        }
        
        .category-title {
            font-size: 18px;
            font-weight: bold;
            color: #fff;
            margin-bottom: 5px;
        }
        
        .category-description {
            color: #888;
            font-size: 14px;
        }
        
        .category-stats {
            display: flex;
            gap: 20px;
            margin-top: 15px;
            font-size: 14px;
            color: #888;
        }
        
        /* Topics list */
        .topics-section {
            background-color: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .topics-header {
            background-color: #252525;
            padding: 15px 20px;
            border-bottom: 1px solid #333;
        }
        
        .topics-title {
            font-size: 20px;
            font-weight: bold;
            color: #fff;
        }
        
        .topics-list {
            list-style: none;
        }
        
        .topic-item {
            border-bottom: 1px solid #333;
            padding: 15px 20px;
            display: flex;
            align-items: center;
            transition: background-color 0.2s;
        }
        
        .topic-item:hover {
            background-color: #222;
        }
        
        .topic-item:last-child {
            border-bottom: none;
        }
        
        .topic-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 15px;
            background: linear-gradient(45deg, #007bff, #00d4aa);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
        }
        
        .topic-content {
            flex: 1;
        }
        
        .topic-title {
            font-size: 16px;
            font-weight: 500;
            color: #fff;
            margin-bottom: 5px;
            text-decoration: none;
        }
        
        .topic-title:hover {
            color: #007bff;
        }
        
        .topic-meta {
            display: flex;
            gap: 15px;
            font-size: 14px;
            color: #888;
        }
        
        .topic-category {
            background-color: #007bff;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
        }
        
        .topic-stats {
            display: flex;
            gap: 15px;
            font-size: 14px;
            color: #888;
        }
        
        /* Footer */
        .footer {
            background-color: #0e0e0e;
            border-top: 1px solid #333;
            padding: 40px 20px;
            margin-top: 60px;
            text-align: center;
            color: #888;
        }
        
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-bottom: 20px;
        }
        
        .footer-link {
            color: #888;
            text-decoration: none;
        }
        
        .footer-link:hover {
            color: #fff;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .header-container {
                flex-direction: column;
                gap: 15px;
            }
            
            .nav-links {
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .categories {
                grid-template-columns: 1fr;
            }
            
            .topic-item {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .topic-avatar {
                margin-bottom: 10px;
            }
            
            .footer-links {
                flex-direction: column;
                gap: 15px;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="header-container">
            <a href="/" class="logo">Future4200</a>
            
            <nav class="nav-links">
                <a href="/latest" class="nav-link">Topics</a>
                <a href="/upcoming-events" class="nav-link">Upcoming events</a>
                <a href="/categories" class="nav-link">All categories</a>
            </nav>
            
            <div class="auth-buttons">
                <button class="btn btn-secondary">Log In</button>
                <button class="btn btn-primary">Sign Up</button>
            </div>
        </div>
    </header>

    <!-- Main content -->
    <main class="main-container">
        <h1 class="page-title">All latest topics</h1>
        
        <!-- Categories -->
        <section class="categories">
            <div class="category-card">
                <div class="category-header">
                    <div class="category-icon">🌿</div>
                    <div>
                        <h3 class="category-title">Hash and Stuff</h3>
                        <p class="category-description">Discussion about hash, concentrates, and extraction methods</p>
                    </div>
                </div>
                <div class="category-stats">
                    <span>1,234 topics</span>
                    <span>5,678 posts</span>
                </div>
            </div>
            
            <div class="category-card">
                <div class="category-header">
                    <div class="category-icon">❓</div>
                    <div>
                        <h3 class="category-title">Help Support and Requests</h3>
                        <p class="category-description">Get help and support from the community</p>
                    </div>
                </div>
                <div class="category-stats">
                    <span>890 topics</span>
                    <span>3,456 posts</span>
                </div>
            </div>
            
            <div class="category-card">
                <div class="category-header">
                    <div class="category-icon">📊</div>
                    <div>
                        <h3 class="category-title">Data Dump</h3>
                        <p class="category-description">Share and discuss data, research, and analytics</p>
                    </div>
                </div>
                <div class="category-stats">
                    <span>567 topics</span>
                    <span>2,345 posts</span>
                </div>
            </div>
            
            <div class="category-card">
                <div class="category-header">
                    <div class="category-icon">🌱</div>
                    <div>
                        <h3 class="category-title">Botany and Cultivation</h3>
                        <p class="category-description">Growing techniques, genetics, and cultivation tips</p>
                    </div>
                </div>
                <div class="category-stats">
                    <span>2,345 topics</span>
                    <span>8,901 posts</span>
                </div>
            </div>
            
            <div class="category-card">
                <div class="category-header">
                    <div class="category-icon">🧪</div>
                    <div>
                        <h3 class="category-title">Testing and Analytics</h3>
                        <p class="category-description">Lab testing, quality control, and analytical methods</p>
                    </div>
                </div>
                <div class="category-stats">
                    <span>678 topics</span>
                    <span>2,890 posts</span>
                </div>
            </div>
        </section>
        
        <!-- Topics list -->
        <section class="topics-section">
            <div class="topics-header">
                <h2 class="topics-title">Latest Topics</h2>
            </div>
            
            <ul class="topics-list">
                <li class="topic-item">
                    <div class="topic-avatar">S</div>
                    <div class="topic-content">
                        <a href="#" class="topic-title">New extraction method for high-CBD concentrates</a>
                        <div class="topic-meta">
                            <span class="topic-category">Hash and Stuff</span>
                            <span>by sidco</span>
                            <span>2 hours ago</span>
                        </div>
                    </div>
                    <div class="topic-stats">
                        <span>15 replies</span>
                        <span>234 views</span>
                    </div>
                </li>
                
                <li class="topic-item">
                    <div class="topic-avatar">V</div>
                    <div class="topic-content">
                        <a href="#" class="topic-title">Help with winterization process - cloudy final product</a>
                        <div class="topic-meta">
                            <span class="topic-category">Help Support and Requests</span>
                            <span>by villy</span>
                            <span>4 hours ago</span>
                        </div>
                    </div>
                    <div class="topic-stats">
                        <span>8 replies</span>
                        <span>156 views</span>
                    </div>
                </li>
                
                <li class="topic-item">
                    <div class="topic-avatar">F</div>
                    <div class="topic-content">
                        <a href="#" class="topic-title">Lab results from latest batch - potency analysis</a>
                        <div class="topic-meta">
                            <span class="topic-category">Data Dump</span>
                            <span>by future</span>
                            <span>6 hours ago</span>
                        </div>
                    </div>
                    <div class="topic-stats">
                        <span>23 replies</span>
                        <span>445 views</span>
                    </div>
                </li>
                
                <li class="topic-item">
                    <div class="topic-avatar">K</div>
                    <div class="topic-content">
                        <a href="#" class="topic-title">CBD extraction yield optimization techniques</a>
                        <div class="topic-meta">
                            <span class="topic-category">Botany and Cultivation</span>
                            <span>by ky_cbd</span>
                            <span>8 hours ago</span>
                        </div>
                    </div>
                    <div class="topic-stats">
                        <span>12 replies</span>
                        <span>289 views</span>
                    </div>
                </li>
                
                <li class="topic-item">
                    <div class="topic-avatar">C</div>
                    <div class="topic-content">
                        <a href="#" class="topic-title">Testing equipment recommendations for small lab</a>
                        <div class="topic-meta">
                            <span class="topic-category">Testing and Analytics</span>
                            <span>by curiouschemist22</span>
                            <span>10 hours ago</span>
                        </div>
                    </div>
                    <div class="topic-stats">
                        <span>19 replies</span>
                        <span>367 views</span>
                    </div>
                </li>
                
                <li class="topic-item">
                    <div class="topic-avatar">C</div>
                    <div class="topic-content">
                        <a href="#" class="topic-title">Ethanol vs CO2 extraction - pros and cons discussion</a>
                        <div class="topic-meta">
                            <span class="topic-category">Hash and Stuff</span>
                            <span>by cbd.machinabis</span>
                            <span>12 hours ago</span>
                        </div>
                    </div>
                    <div class="topic-stats">
                        <span>31 replies</span>
                        <span>523 views</span>
                    </div>
                </li>
                
                <li class="topic-item">
                    <div class="topic-avatar">P</div>
                    <div class="topic-content">
                        <a href="#" class="topic-title">Portland cannabis regulations update - compliance tips</a>
                        <div class="topic-meta">
                            <span class="topic-category">Help Support and Requests</span>
                            <span>by pdxcanna</span>
                            <span>14 hours ago</span>
                        </div>
                    </div>
                    <div class="topic-stats">
                        <span>7 replies</span>
                        <span>198 views</span>
                    </div>
                </li>
                
                <li class="topic-item">
                    <div class="topic-avatar">S</div>
                    <div class="topic-content">
                        <a href="#" class="topic-title">Substitute creature genetics - strain development</a>
                        <div class="topic-meta">
                            <span class="topic-category">Botany and Cultivation</span>
                            <span>by substitutecreature</span>
                            <span>16 hours ago</span>
                        </div>
                    </div>
                    <div class="topic-stats">
                        <span>14 replies</span>
                        <span>312 views</span>
                    </div>
                </li>
                
                <li class="topic-item">
                    <div class="topic-avatar">O</div>
                    <div class="topic-content">
                        <a href="#" class="topic-title">Oscar's lab testing methodology - detailed breakdown</a>
                        <div class="topic-meta">
                            <span class="topic-category">Data Dump</span>
                            <span>by oscar</span>
                            <span>18 hours ago</span>
                        </div>
                    </div>
                    <div class="topic-stats">
                        <span>26 replies</span>
                        <span>456 views</span>
                    </div>
                </li>
                
                <li class="topic-item">
                    <div class="topic-avatar">V</div>
                    <div class="topic-content">
                        <a href="#" class="topic-title">Villy's winterization tips - troubleshooting guide</a>
                        <div class="topic-meta">
                            <span class="topic-category">Hash and Stuff</span>
                            <span>by villy</span>
                            <span>20 hours ago</span>
                        </div>
                    </div>
                    <div class="topic-stats">
                        <span>18 replies</span>
                        <span>389 views</span>
                    </div>
                </li>
            </ul>
        </section>
    </main>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-links">
            <a href="#" class="footer-link">About</a>
            <a href="#" class="footer-link">Privacy</a>
            <a href="#" class="footer-link">Terms</a>
            <a href="#" class="footer-link">Contact</a>
            <a href="#" class="footer-link">Help</a>
        </div>
        <p>&copy; 2024 Future4200. The Future Is Now.</p>
    </footer>

    <script>
        // Add some interactivity
        document.addEventListener('DOMContentLoaded', function() {
            // Add hover effects to topic items
            const topicItems = document.querySelectorAll('.topic-item');
            topicItems.forEach(item => {
                item.addEventListener('mouseenter', function() {
                    this.style.backgroundColor = '#222';
                });
                item.addEventListener('mouseleave', function() {
                    this.style.backgroundColor = 'transparent';
                });
            });
            
            // Add click handlers for auth buttons
            const loginBtn = document.querySelector('.btn-secondary');
            const signupBtn = document.querySelector('.btn-primary');
            
            loginBtn.addEventListener('click', function() {
                alert('Login functionality would be implemented here');
            });
            
            signupBtn.addEventListener('click', function() {
                alert('Sign up functionality would be implemented here');
            });
            
            // Add click handlers for topic titles
            const topicTitles = document.querySelectorAll('.topic-title');
            topicTitles.forEach(title => {
                title.addEventListener('click', function(e) {
                    e.preventDefault();
                    alert('Topic: ' + this.textContent);
                });
            });
        });
    </script>
</body>
</html>
  `);
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
