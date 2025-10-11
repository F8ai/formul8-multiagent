const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
                <p><strong>Deployment:</strong> Production (AWS Lambda)</p>
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
    deployment: 'AWS Lambda',
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

// Lambda handler
exports.handler = async (event, context) => {
  const serverlessExpress = require('@codegenie/serverless-express');
  return serverlessExpress({ app })(event, context);
};

module.exports = app;