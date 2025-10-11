const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');

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
  res.redirect('/');
});

/**
 * Chat API endpoint
 */
app.post('/api/chat', async (req, res) => {
  const { message, agent, user_id, context } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required',
    });
  }

  try {
    const selectedAgent = agent || 'f8_agent';
    const agentConfig = agents[selectedAgent];
    
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Formul8 Multiagent Chat server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat interface: http://localhost:${PORT}/chat`);
  console.log(`📡 API ready for requests`);
  console.log(`🤖 Multiagent system enabled with 4 agents`);
});

module.exports = app;