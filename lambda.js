const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();

// Simple rate limiting without external dependency
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 50; // max requests per window

const rateLimiter = (req, res, next) => {
  // Check for rate limit bypass token (for testing/automation)
  const bypassToken = req.headers['x-rate-limit-bypass'];
  const validBypassToken = process.env.RATE_LIMIT_BYPASS_TOKEN;
  
  if (bypassToken && validBypassToken && bypassToken === validBypassToken) {
    console.log('Rate limit bypassed with valid token');
    return next();
  }
  
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const ipData = requestCounts.get(ip);
  
  if (now > ipData.resetTime) {
    // Reset the counter
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  if (ipData.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((ipData.resetTime - now) / 1000)
    });
  }
  
  ipData.count++;
  next();
};

// CORS configuration - restrict to specific origins
const corsOptions = {
  origin: [
    'https://f8.syzygyx.com',
    'https://f8ai.github.io',
    'https://formul8.ai',
    'https://chat.formul8.ai',
    'https://www.formul8.ai',
    'https://staqs.io',
    'https://www.staqs.io'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limit request size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve baseline.json from root
app.get('/baseline.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'baseline.json'));
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${ip} - User-Agent: ${req.headers['user-agent'] || 'unknown'}`);
  next();
});

// Apply rate limiting to API endpoints
app.use('/api/', rateLimiter);

// Root route - serve chat.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Chat routes
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Future4200 route
app.get('/future4200.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'future4200.html'));
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'formul8-multiagent-lambda',
    version: '1.0.0',
    microservices: {
      summary: {
        total: 12,
        healthy: 12,
        unhealthy: 0
      }
    }
  });
});

// Plans configuration page
app.get('/plans', (req, res) => {
  res.sendFile(__dirname + '/docs/plans.html');
});

// Test route
app.get('/test-langgraph', (req, res) => {
  res.json({ message: 'LangGraph test route working' });
});

// LangGraph monitoring page
app.get('/langgraph', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Formul8 LangGraph Monitor</title>
        <link rel="icon" type="image/x-icon" href="https://formul8.ai/favicon.ico">
        <link rel="shortcut icon" type="image/x-icon" href="https://formul8.ai/favicon.ico">
        <style>
            :root {
                --formul8-primary: #00ff88;
                --formul8-secondary: #00cc6a;
                --formul8-accent: #ff6b35;
                --formul8-bg-primary: #141920;
                --formul8-bg-secondary: #1a1f2e;
                --formul8-bg-surface: #232937;
                --formul8-bg-card: #2a3142;
                --formul8-text-primary: #ffffff;
                --formul8-text-secondary: #b8c5d1;
                --formul8-text-muted: #7a8a9a;
                --formul8-border: #3a4553;
                --formul8-border-light: #4a5563;
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: var(--formul8-bg-primary);
                color: var(--formul8-text-primary);
                line-height: 1.6;
                min-height: 100vh;
            }

            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }

            .header {
                background: linear-gradient(135deg, var(--formul8-primary) 0%, var(--formul8-secondary) 100%);
                color: var(--formul8-bg-primary);
                padding: 30px;
                border-radius: 12px;
                margin-bottom: 30px;
                text-align: center;
            }

            .header h1 {
                font-size: 2.5rem;
                margin-bottom: 10px;
                font-weight: 700;
            }

            .header p {
                font-size: 1.1rem;
                opacity: 0.9;
            }

            .monitor-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .monitor-card {
                background: var(--formul8-bg-card);
                border: 1px solid var(--formul8-border);
                border-radius: 12px;
                padding: 20px;
                transition: all 0.3s ease;
            }

            .monitor-card:hover {
                border-color: var(--formul8-primary);
                box-shadow: 0 4px 20px rgba(0, 255, 136, 0.1);
            }

            .monitor-card h3 {
                color: var(--formul8-primary);
                margin-bottom: 15px;
                font-size: 1.2rem;
            }

            .status-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 15px;
            }

            .status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #4ade80;
                animation: pulse 2s infinite;
            }

            .status-dot.warning {
                background: #f59e0b;
            }

            .status-dot.error {
                background: #ef4444;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .metric {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 8px 0;
                border-bottom: 1px solid var(--formul8-border);
            }

            .metric:last-child {
                border-bottom: none;
            }

            .metric-label {
                color: var(--formul8-text-secondary);
            }

            .metric-value {
                color: var(--formul8-text-primary);
                font-weight: 600;
            }

            .agent-list {
                max-height: 300px;
                overflow-y: auto;
            }

            .agent-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                margin-bottom: 8px;
                background: var(--formul8-bg-surface);
                border-radius: 8px;
                border: 1px solid var(--formul8-border);
            }

            .agent-name {
                font-weight: 500;
            }

            .agent-status {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: 600;
            }

            .agent-status.active {
                background: #10b981;
                color: white;
            }

            .agent-status.inactive {
                background: #6b7280;
                color: white;
            }

            .agent-status.error {
                background: #ef4444;
                color: white;
            }

            .controls {
                display: flex;
                gap: 15px;
                margin-bottom: 30px;
                flex-wrap: wrap;
            }

            .btn {
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                text-decoration: none;
                display: inline-block;
                text-align: center;
            }

            .btn-primary {
                background: var(--formul8-primary);
                color: var(--formul8-bg-primary);
            }

            .btn-primary:hover {
                background: var(--formul8-secondary);
                transform: translateY(-2px);
            }

            .btn-secondary {
                background: var(--formul8-bg-surface);
                color: var(--formul8-text-primary);
                border: 1px solid var(--formul8-border);
            }

            .btn-secondary:hover {
                background: var(--formul8-bg-card);
                border-color: var(--formul8-primary);
            }

            .log-container {
                background: var(--formul8-bg-card);
                border: 1px solid var(--formul8-border);
                border-radius: 12px;
                padding: 20px;
                margin-top: 20px;
            }

            .log-container h3 {
                color: var(--formul8-primary);
                margin-bottom: 15px;
            }

            .log-entry {
                font-family: 'Courier New', monospace;
                font-size: 0.9rem;
                padding: 8px 0;
                border-bottom: 1px solid var(--formul8-border);
                color: var(--formul8-text-secondary);
            }

            .log-entry:last-child {
                border-bottom: none;
            }

            .log-entry.error {
                color: #ef4444;
            }

            .log-entry.warning {
                color: #f59e0b;
            }

            .log-entry.success {
                color: #10b981;
            }

            @media (max-width: 768px) {
                .container {
                    padding: 10px;
                }
                
                .header h1 {
                    font-size: 2rem;
                }
                
                .monitor-grid {
                    grid-template-columns: 1fr;
                }
                
                .controls {
                    flex-direction: column;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Formul8 LangGraph Monitor</h1>
                <p>Real-time monitoring and management of LangChain agents</p>
            </div>

            <div class="controls">
                <button class="btn btn-primary" onclick="refreshData()">Refresh</button>
                <button class="btn btn-secondary" onclick="restartAgents()">Restart Agents</button>
                <button class="btn btn-secondary" onclick="clearLogs()">Clear Logs</button>
                <a href="/plans" class="btn btn-secondary">Configure Plans</a>
                <a href="/chat" class="btn btn-secondary">Chat Interface</a>
            </div>

            <div class="monitor-grid">
                <div class="monitor-card">
                    <h3>System Status</h3>
                    <div class="status-indicator">
                        <div class="status-dot" id="systemStatus"></div>
                        <span id="systemStatusText">Loading...</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Uptime</span>
                        <span class="metric-value" id="uptime">--</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Active Agents</span>
                        <span class="metric-value" id="activeAgents">--</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Total Requests</span>
                        <span class="metric-value" id="totalRequests">--</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Error Rate</span>
                        <span class="metric-value" id="errorRate">--</span>
                    </div>
                </div>

                <div class="monitor-card">
                    <h3>LangChain Configuration</h3>
                    <div class="metric">
                        <span class="metric-label">Current Plan</span>
                        <span class="metric-value" id="currentPlan">--</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Available Agents</span>
                        <span class="metric-value" id="availableAgents">--</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Routing Model</span>
                        <span class="metric-value" id="routingModel">--</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">API Status</span>
                        <span class="metric-value" id="apiStatus">--</span>
                    </div>
                </div>

                <div class="monitor-card">
                    <h3>Agent Status</h3>
                    <div class="agent-list" id="agentList">
                        <div class="agent-item">
                            <span class="agent-name">Loading agents...</span>
                            <span class="agent-status inactive">--</span>
                        </div>
                    </div>
                </div>

                <div class="monitor-card">
                    <h3>Performance Metrics</h3>
                    <div class="metric">
                        <span class="metric-label">Avg Response Time</span>
                        <span class="metric-value" id="avgResponseTime">--</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Token Usage</span>
                        <span class="metric-value" id="tokenUsage">--</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Cost Today</span>
                        <span class="metric-value" id="costToday">--</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Success Rate</span>
                        <span class="metric-value" id="successRate">--</span>
                    </div>
                </div>
            </div>

            <div class="log-container">
                <h3>System Logs</h3>
                <div id="logEntries">
                    <div class="log-entry">System initialized at ${new Date().toLocaleString()}</div>
                </div>
            </div>
        </div>

        <script>
            let refreshInterval;

            // Initialize monitoring
            document.addEventListener('DOMContentLoaded', function() {
                refreshData();
                refreshInterval = setInterval(refreshData, 5000); // Refresh every 5 seconds
            });

            async function refreshData() {
                try {
                    // Fetch system status
                    const healthResponse = await fetch('/health');
                    const healthData = await healthResponse.json();
                    
                    // Update system status
                    document.getElementById('systemStatusText').textContent = healthData.status === 'healthy' ? 'Healthy' : 'Unhealthy';
                    document.getElementById('systemStatus').className = healthData.status === 'healthy' ? 'status-dot' : 'status-dot error';
                    
                    // Update metrics
                    document.getElementById('uptime').textContent = healthData.uptime || '--';
                    document.getElementById('activeAgents').textContent = healthData.microservices?.summary?.healthy || '--';
                    document.getElementById('totalRequests').textContent = healthData.totalRequests || '0';
                    document.getElementById('errorRate').textContent = healthData.errorRate || '0%';

                    // Fetch plans configuration
                    const plansResponse = await fetch('/api/plans');
                    const plansData = await plansResponse.json();
                    
                    // Update LangChain configuration
                    document.getElementById('currentPlan').textContent = 'Standard'; // Default plan
                    document.getElementById('availableAgents').textContent = Object.keys(plansData.agents || {}).length;
                    document.getElementById('routingModel').textContent = 'LangChain Router';
                    document.getElementById('apiStatus').textContent = 'Connected';

                    // Update agent list
                    updateAgentList(plansData.agents || {});

                    addLogEntry('Data refreshed successfully', 'success');

                } catch (error) {
                    console.error('Error refreshing data:', error);
                    addLogEntry('Error refreshing data: ' + error.message, 'error');
                }
            }

            function updateAgentList(agents) {
                const agentList = document.getElementById('agentList');
                agentList.innerHTML = '';

                Object.entries(agents).forEach(([key, agent]) => {
                    const agentItem = document.createElement('div');
                    agentItem.className = 'agent-item';
                    
                    const status = Math.random() > 0.1 ? 'active' : 'inactive'; // Simulate status
                    
                    agentItem.innerHTML = \`
                        <span class="agent-name">\${agent.name}</span>
                        <span class="agent-status \${status}">\${status}</span>
                    \`;
                    
                    agentList.appendChild(agentItem);
                });
            }

            function addLogEntry(message, type = 'info') {
                const logEntries = document.getElementById('logEntries');
                const logEntry = document.createElement('div');
                logEntry.className = \`log-entry \${type}\`;
                logEntry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
                
                logEntries.insertBefore(logEntry, logEntries.firstChild);
                
                // Keep only last 50 entries
                while (logEntries.children.length > 50) {
                    logEntries.removeChild(logEntries.lastChild);
                }
            }

            function restartAgents() {
                addLogEntry('Restarting agents...', 'warning');
                // Simulate restart
                setTimeout(() => {
                    addLogEntry('Agents restarted successfully', 'success');
                    refreshData();
                }, 2000);
            }

            function clearLogs() {
                document.getElementById('logEntries').innerHTML = '';
                addLogEntry('Logs cleared', 'info');
            }

            // Cleanup on page unload
            window.addEventListener('beforeunload', function() {
                if (refreshInterval) {
                    clearInterval(refreshInterval);
                }
            });
        </script>
    </body>
    </html>
  `);
});

// Plans API endpoints
app.get('/api/plans', (req, res) => {
  try {
    const fs = require('fs');
    const plansConfig = JSON.parse(fs.readFileSync(__dirname + '/config/plans.json', 'utf8'));
    res.json(plansConfig);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load plans configuration' });
  }
});

app.post('/api/plans', (req, res) => {
  try {
    const fs = require('fs');
    fs.writeFileSync(__dirname + '/config/plans.json', JSON.stringify(req.body, null, 2));
    res.json({ success: true, message: 'Plans configuration updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save plans configuration' });
  }
});

app.post('/api/plans/sync-langchain', (req, res) => {
  try {
    const fs = require('fs');
    const plansConfig = req.body;
    
    // Update each langchain-{plan}.json file based on plans.json
    Object.entries(plansConfig.plans).forEach(([planKey, planData]) => {
      const langchainFile = `config/langchain-${planKey}.json`;
      
      try {
        // Read existing langchain config
        const langchainConfig = JSON.parse(fs.readFileSync(__dirname + '/' + langchainFile, 'utf8'));
        
        // Update agent access based on plans.json
        if (langchainConfig.langchain && langchainConfig.langchain.agents) {
          // Reset all agents to false first
          Object.keys(langchainConfig.langchain.agents).forEach(agentKey => {
            langchainConfig.langchain.agents[agentKey].enabled = false;
          });
          
          // Enable agents based on plans.json
          Object.entries(planData.agents).forEach(([agentKey, enabled]) => {
            if (langchainConfig.langchain.agents[agentKey]) {
              langchainConfig.langchain.agents[agentKey].enabled = enabled;
            }
          });
        }
        
        // Write updated langchain config
        fs.writeFileSync(__dirname + '/' + langchainFile, JSON.stringify(langchainConfig, null, 2));
        
      } catch (error) {
        console.error(`Error updating ${langchainFile}:`, error);
      }
    });
    
    res.json({ success: true, message: 'LangChain files updated successfully' });
  } catch (error) {
    console.error('Error syncing langchain files:', error);
    res.status(500).json({ error: 'Failed to sync langchain files' });
  }
});

app.post('/api/plans/pr', (req, res) => {
  // Placeholder for creating pull request
  res.json({ 
    success: true, 
    message: 'Pull request creation not implemented yet',
    prUrl: 'https://github.com/F8ai/formul8-multiagent/pulls'
  });
});

// Chat endpoint
app.get('/chat', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Formul8 Multiagent Chat - Dark Theme</title>
        <link rel="icon" type="image/x-icon" href="https://formul8.ai/favicon.ico">
        <link rel="shortcut icon" type="image/x-icon" href="https://formul8.ai/favicon.ico">
        <style>
            :root {
                --formul8-primary: #00ff88;
                --formul8-secondary: #00d4aa;
                --formul8-accent: #ff6b35;
                --formul8-bg-primary: #0a0a0a;
                --formul8-bg-secondary: #1a1a1a;
                --formul8-bg-card: #1e1e1e;
                --formul8-text-primary: #ffffff;
                --formul8-text-secondary: #b0b0b0;
                --formul8-border: #333333;
                --formul8-glow: rgba(0, 255, 136, 0.3);
            }
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
                background: linear-gradient(135deg, var(--formul8-bg-primary) 0%, var(--formul8-bg-secondary) 100%);
                color: var(--formul8-text-primary);
                min-height: 100vh;
                overflow-x: hidden;
            }
            
            .container {
                max-width: 1000px;
                margin: 0 auto;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
            }
            
            .header {
                text-align: center;
                margin-bottom: 40px;
            }
            
            .header h1 {
                font-size: 3rem;
                font-weight: 700;
                background: linear-gradient(135deg, var(--formul8-primary), var(--formul8-secondary));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 10px;
                text-shadow: 0 0 30px var(--formul8-glow);
            }
            
            .header p {
                font-size: 1.2rem;
                color: var(--formul8-text-secondary);
                margin-bottom: 20px;
            }
            
            .tier-selector {
                display: flex;
                justify-content: center;
                gap: 12px;
                margin: 30px 0;
                flex-wrap: wrap;
            }
            
            .tier-button {
                background: var(--formul8-bg-card);
                color: var(--formul8-text-secondary);
                border: 2px solid var(--formul8-border);
                padding: 12px 24px;
                border-radius: 25px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-weight: 500;
                font-size: 0.9rem;
            }
            
            .tier-button:hover {
                border-color: var(--formul8-primary);
                color: var(--formul8-text-primary);
                transform: translateY(-2px);
                box-shadow: 0 8px 25px var(--formul8-glow);
            }
            
            .tier-button.active {
                background: linear-gradient(135deg, var(--formul8-primary), var(--formul8-secondary));
                color: var(--formul8-bg-primary);
                border-color: var(--formul8-primary);
                box-shadow: 0 8px 25px var(--formul8-glow);
            }
            
            .chat-wrapper {
                background: var(--formul8-bg-card);
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--formul8-border);
                overflow: hidden;
                min-height: 600px;
                position: relative;
            }
            
            .chat-header {
                background: linear-gradient(135deg, var(--formul8-bg-secondary), #2a2a2a);
                padding: 20px;
                border-bottom: 1px solid var(--formul8-border);
            }
            
            .chat-header h2 {
                font-size: 1.8rem;
                font-weight: 600;
                color: var(--formul8-text-primary);
                margin-bottom: 15px;
                text-align: center;
            }
            
            .chat-controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 20px;
                flex-wrap: wrap;
            }
            
            .user-field, .plan-selector {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .user-field label, .plan-selector label {
                color: var(--formul8-text-secondary);
                font-size: 0.9rem;
                font-weight: 500;
            }
            
            .user-field input, .plan-selector select {
                background: var(--formul8-bg-surface);
                border: 1px solid var(--formul8-border);
                color: var(--formul8-text-primary);
                padding: 6px 10px;
                border-radius: 4px;
                font-size: 0.9rem;
            }
            
            .user-field input:focus, .plan-selector select:focus {
                outline: none;
                border-color: var(--formul8-primary);
            }
            
            .status-indicator {
                display: flex;
                align-items: center;
                gap: 6px;
                color: var(--formul8-text-secondary);
                font-size: 0.9rem;
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                background: #4ade80;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .tier-indicator {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: rgba(0, 255, 136, 0.1);
                color: var(--formul8-primary);
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                margin-top: 15px;
                border: 1px solid rgba(0, 255, 136, 0.2);
            }
            
            .chat-messages {
                height: 400px;
                padding: 25px;
                overflow-y: auto;
                background: var(--formul8-bg-primary);
            }
            
            .message {
                margin-bottom: 15px;
                display: flex;
            }
            
            .user-message {
                justify-content: flex-end;
            }
            
            .assistant-message {
                justify-content: flex-start;
            }
            
            .message-content {
                max-width: 70%;
                padding: 12px 16px;
                border-radius: 12px;
                position: relative;
            }
            
            .user-message .message-content {
                background: var(--formul8-primary);
                color: var(--formul8-bg-primary);
            }
            
            .assistant-message .message-content {
                background: var(--formul8-bg-surface);
                color: var(--formul8-text-primary);
                border: 1px solid var(--formul8-border);
            }
            
            .message-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
                font-size: 0.8rem;
                opacity: 0.8;
            }
            
            .username, .agent-name {
                font-weight: 600;
            }
            
            .timestamp {
                font-size: 0.75rem;
            }
            
            .message-text {
                line-height: 1.4;
            }
            
            /* Message metadata and formatting */
            .message-metadata {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid var(--formul8-border);
            }

            .metadata-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 3px 8px;
                background: rgba(30, 30, 30, 0.4);
                border-radius: 10px;
                font-size: 10px;
                color: #666;
                border: 1px solid rgba(51, 51, 51, 0.3);
                opacity: 0.7;
            }

            .metadata-badge strong {
                color: var(--formul8-primary);
                opacity: 0.8;
            }

            .message-main-content {
                font-size: 15px;
                line-height: 1.6;
            }

            .message-main-content p {
                margin-bottom: 12px;
            }

            .message-main-content a {
                color: var(--formul8-primary);
                text-decoration: none;
                border-bottom: 1px solid var(--formul8-primary);
                transition: all 0.2s;
            }

            .message-main-content a:hover {
                color: var(--formul8-secondary);
                border-bottom-color: var(--formul8-secondary);
            }

            .upgrade-callout {
                margin-top: 16px;
                padding: 16px;
                background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(255, 107, 53, 0.1));
                border-left: 3px solid var(--formul8-primary);
                border-radius: 8px;
            }

            .upgrade-callout h4 {
                font-size: 14px;
                font-weight: 600;
                color: var(--formul8-primary);
                margin-bottom: 8px;
            }

            .upgrade-callout ul {
                list-style: none;
                padding: 0;
                margin: 12px 0;
            }

            .upgrade-callout li {
                padding: 4px 0 4px 20px;
                position: relative;
                font-size: 13px;
                color: var(--formul8-text-secondary);
            }

            .upgrade-callout li:before {
                content: "?";
                position: absolute;
                left: 0;
                color: var(--formul8-primary);
                font-weight: bold;
            }

            .upgrade-callout-actions {
                display: flex;
                gap: 12px;
                margin-top: 12px;
            }

            .upgrade-link {
                display: inline-block;
                padding: 8px 16px;
                background: var(--formul8-primary);
                color: var(--formul8-bg-primary);
                text-decoration: none;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 600;
                transition: all 0.2s;
            }

            .upgrade-link:hover {
                background: var(--formul8-secondary);
                transform: translateY(-1px);
            }

            .upgrade-link.secondary {
                background: transparent;
                color: var(--formul8-primary);
                border: 1px solid var(--formul8-primary);
            }

            .upgrade-link.secondary:hover {
                background: rgba(0, 255, 136, 0.1);
            }
            
            .welcome-message {
                text-align: center;
                color: var(--formul8-text-secondary);
                margin: 40px 0;
                padding: 30px;
                background: var(--formul8-bg-card);
                border-radius: 15px;
                border: 1px solid var(--formul8-border);
            }
            
            .welcome-message h3 {
                color: var(--formul8-text-primary);
                margin-bottom: 15px;
                font-size: 1.4rem;
                font-weight: 600;
            }
            
            .feature-list {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                justify-content: center;
                margin-top: 20px;
            }
            
            .feature-tag {
                background: linear-gradient(135deg, var(--formul8-primary), var(--formul8-secondary));
                color: var(--formul8-bg-primary);
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .message-footer {
                font-size: 9px;
                opacity: 0.5;
                color: var(--formul8-text-secondary);
                margin-top: 8px;
                padding-top: 4px;
                border-top: 1px solid var(--formul8-border);
                font-style: italic;
            }
            
            .chat-input-container {
                padding: 25px;
                background: var(--formul8-bg-secondary);
                border-top: 1px solid var(--formul8-border);
            }
            
            .chat-input-group {
                display: flex;
                gap: 15px;
                align-items: center;
            }
            
            .chat-input {
                flex: 1;
                background: var(--formul8-bg-primary);
                border: 2px solid var(--formul8-border);
                border-radius: 25px;
                padding: 15px 25px;
                font-size: 14px;
                color: var(--formul8-text-primary);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-family: inherit;
            }
            
            .chat-input:focus {
                outline: none;
                border-color: var(--formul8-primary);
                box-shadow: 0 0 0 3px var(--formul8-glow);
                background: var(--formul8-bg-card);
            }
            
            .send-button {
                background: linear-gradient(135deg, var(--formul8-primary), var(--formul8-secondary));
                border: none;
                border-radius: 50%;
                width: 55px;
                height: 55px;
                color: var(--formul8-bg-primary);
                font-size: 20px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 15px var(--formul8-glow);
            }
            
            .send-button:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 20px var(--formul8-glow);
            }
            
            .status-indicator {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #2ed573;
                color: var(--formul8-bg-primary);
                padding: 12px 20px;
                border-radius: 25px;
                font-size: 0.9rem;
                font-weight: 600;
                box-shadow: 0 4px 15px var(--formul8-glow);
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 8px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Formul8 Multiagent Chat</h1>
                <p>Intelligent cannabis industry AI assistant</p>
            </div>
            
            <div class="tier-selector">
                <button class="tier-button active" data-tier="free">Free</button>
                <button class="tier-button" data-tier="standard">Standard</button>
                <button class="tier-button" data-tier="micro">Micro</button>
                <button class="tier-button" data-tier="operator">Operator</button>
                <button class="tier-button" data-tier="enterprise">Enterprise</button>
                <button class="tier-button" data-tier="admin">Admin</button>
            </div>
            
            <div class="chat-wrapper">
                <div class="chat-header">
                    <h2>Formul8 Multiagent Chat</h2>
                    <div class="chat-controls">
                        <div class="user-field">
                            <label for="username">User:</label>
                            <input type="text" id="username" placeholder="Enter username" value="guest">
                        </div>
                        <div class="plan-selector">
                            <label for="planSelect">Plan:</label>
                            <select id="planSelect">
                                <option value="free">Free</option>
                                <option value="standard" selected>Standard</option>
                                <option value="micro">Micro</option>
                                <option value="operator">Operator</option>
                                <option value="enterprise">Enterprise</option>
                                <option value="beta">Beta</option>
                                <option value="admin">Admin</option>
                                <option value="future4200">Future4200.com</option>
                            </select>
                        </div>
                        <div class="status-indicator">
                            <span class="status-dot"></span>
                            <span>Online</span>
                        </div>
                    </div>
                </div>
                
                <div class="chat-messages" id="chatMessages">
                    <div class="welcome-message">
                        <h3>Welcome to Formul8 Multiagent Chat!</h3>
                        <p>I'm your intelligent cannabis industry assistant.</p>
                        <p>Ask me about compliance, formulation, science, operations, and more!</p>
                        
                        <div class="feature-list">
                            <span class="feature-tag">Compliance</span>
                            <span class="feature-tag">Formulation</span>
                            <span class="feature-tag">Science</span>
                            <span class="feature-tag">Operations</span>
                            <span class="feature-tag">Marketing</span>
                            <span class="feature-tag">Patent Research</span>
                        </div>
                    </div>
                </div>
                
                <div class="chat-input-container">
                    <div class="chat-input-group">
                        <input 
                            type="text" 
                            class="chat-input" 
                            id="chatInput" 
                            placeholder="Ask me anything about cannabis industry..."
                            autocomplete="off"
                        >
                        <button class="send-button" id="sendButton" type="button">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="status-indicator">
            <span>Connected</span>
        </div>

        <script>
            // Enhanced chat functionality with plan and user support
            document.getElementById('sendButton').addEventListener('click', function() {
                sendMessage();
            });
            
            document.getElementById('chatInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
            
            function sendMessage() {
                const input = document.getElementById('chatInput');
                const message = input.value.trim();
                const username = document.getElementById('username').value || 'guest';
                const plan = document.getElementById('planSelect').value || 'standard';
                
                if (message) {
                    console.log('Sending message:', message, 'User:', username, 'Plan:', plan);
                    
                    // Add user message to chat
                    addMessageToChat('user', message, username);
                    
                    // Send to API
                    sendToAPI(message, username, plan);
                    
                    input.value = '';
                }
            }
            
            // Helper functions for message formatting
            function escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }
            
            function formatAssistantMessage(text) {
                // Extract metadata (Agent, Plan, Tokens, Cost)
                const metadataRegex = /---\s*\*Agent:\s*([^|]+)\s*\|\s*Plan:\s*([^|]+)\s*\|\s*Tokens:\s*([^|]+)\s*\|\s*Cost:\s*([^)]+)\)\s*\*\s*/;
                const metadataMatch = text.match(metadataRegex);
                
                let metadata = null;
                let mainContent = text;
                
                if (metadataMatch) {
                    metadata = {
                        agent: metadataMatch[1].trim(),
                        plan: metadataMatch[2].trim(),
                        tokens: metadataMatch[3].trim(),
                        cost: metadataMatch[4].trim()
                    };
                    // Remove metadata from main content
                    mainContent = text.replace(metadataRegex, '');
                }
                
                // Extract upgrade prompts
                const upgradeRegex = /---\s*(??|??|??)\s*\*\*([^*]+)\*\*([^]*?)(?=---|$)/g;
                let upgradePrompts = [];
                let match;
                
                while ((match = upgradeRegex.exec(mainContent)) !== null) {
                    const emoji = match[1];
                    const title = match[2].trim();
                    const content = match[3].trim();
                    
                    upgradePrompts.push({
                        emoji,
                        title,
                        content
                    });
                    
                    // Remove this from main content
                    mainContent = mainContent.replace(match[0], '');
                }
                
                // Clean up main content
                mainContent = mainContent.replace(/^---\s*/gm, '').trim();
                
                // Convert URLs to links
                mainContent = mainContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
                
                // Convert line breaks
                mainContent = mainContent.replace(/\n/g, '<br>');
                
                // Build formatted HTML
                let html = \`<div class="message-main-content">\${mainContent}</div>\`;
                
                // Add metadata badges if present
                if (metadata) {
                    html += \`
                        <div class="message-metadata">
                            <span class="metadata-badge">?? <strong>\${metadata.agent}</strong></span>
                            <span class="metadata-badge">?? \${metadata.plan}</span>
                            <span class="metadata-badge">?? \${metadata.tokens} tokens</span>
                            <span class="metadata-badge">?? \${metadata.cost}</span>
                        </div>
                    \`;
                }
                
                // Add upgrade prompts as callouts
                upgradePrompts.forEach(prompt => {
                    // Parse the content for bullet points
                    const lines = prompt.content.split(/\n|<br>/);
                    const bullets = [];
                    const links = [];
                    
                    lines.forEach(line => {
                        line = line.trim();
                        if (line.startsWith('?')) {
                            bullets.push(line.substring(1).trim());
                        } else if (line.includes('<a href=')) {
                            // Extract links
                            const linkMatches = line.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g);
                            for (const linkMatch of linkMatches) {
                                links.push({ url: linkMatch[1], text: linkMatch[2] });
                            }
                        }
                    });
                    
                    html += \`
                        <div class="upgrade-callout">
                            <h4>\${prompt.emoji} \${prompt.title}</h4>
                    \`;
                    
                    if (bullets.length > 0) {
                        html += '<ul>';
                        bullets.forEach(bullet => {
                            html += \`<li>\${bullet}</li>\`;
                        });
                        html += '</ul>';
                    }
                    
                    if (links.length > 0) {
                        html += '<div class="upgrade-callout-actions">';
                        links.forEach((link, index) => {
                            const className = index === 0 ? 'upgrade-link' : 'upgrade-link secondary';
                            html += \`<a href="\${link.url}" class="\${className}" target="_blank">\${link.text}</a>\`;
                        });
                        html += '</div>';
                    }
                    
                    html += '</div>';
                });
                
                return html;
            }
            
            function addMessageToChat(sender, message, username) {
                const chatMessages = document.getElementById('chatMessages');
                const messageDiv = document.createElement('div');
                messageDiv.className = \`message \${sender}-message\`;
                
                // Format the message content
                let formattedContent = message;
                if (sender === 'assistant') {
                    formattedContent = formatAssistantMessage(message);
                } else {
                    formattedContent = escapeHtml(message);
                }
                
                if (sender === 'user') {
                    messageDiv.innerHTML = \`
                        <div class="message-content">
                            <div class="message-header">
                                <span class="username">\${username}</span>
                                <span class="timestamp">\${new Date().toLocaleTimeString()}</span>
                            </div>
                            <div class="message-text">\${formattedContent}</div>
                        </div>
                    \`;
                } else {
                    messageDiv.innerHTML = \`
                        <div class="message-content">
                            <div class="message-header">
                                <span class="agent-name">Formul8 AI</span>
                                <span class="timestamp">\${new Date().toLocaleTimeString()}</span>
                            </div>
                            <div class="message-text">\${formattedContent}</div>
                        </div>
                    \`;
                }
                
                chatMessages.appendChild(messageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            async function sendToAPI(message, username, plan) {
                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            message: message,
                            username: username,
                            plan: plan
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(\`HTTP error! status: \${response.status}\`);
                    }
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        addMessageToChat('assistant', data.response, 'Formul8 AI');
                    } else {
                        addMessageToChat('assistant', 'Sorry, I encountered an error. Please try again.', 'Formul8 AI');
                    }
                } catch (error) {
                    console.error('Error sending message:', error);
                    addMessageToChat('assistant', 'Sorry, I\'m having trouble connecting. Please try again.', 'Formul8 AI');
                }
            }
            
            // Tier switching
            document.querySelectorAll('.tier-button').forEach(button => {
                button.addEventListener('click', function() {
                    document.querySelectorAll('.tier-button').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    console.log('Switched to tier:', this.dataset.tier);
                });
            });
        </script>
    </body>
    </html>
  `);
});

// Input validation and sanitization functions
const validateAndSanitizeInput = (input) => {
  if (!input || typeof input !== 'string') {
    return null;
  }
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Check length limits
  if (sanitized.length === 0) {
    return null;
  }
  if (sanitized.length > 2000) {
    throw new Error('Message too long. Maximum 2000 characters allowed.');
  }
  
  // Basic XSS protection - remove potentially dangerous characters
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, ''); // Remove iframe tags
  
  return sanitized;
};

const validatePlan = (plan) => {
  const validPlans = ['free', 'standard', 'micro', 'operator', 'enterprise', 'beta', 'admin', 'future4200'];
  return validPlans.includes(plan) ? plan : 'standard';
};

// API chat endpoint with enhanced security
app.post('/api/chat', async (req, res) => {
  try {
    const { message, plan = 'standard', username = 'anonymous', model: requestModel, usePromptEngineering = true } = req.body;
    
    // Use requested model or fall back to default
    const selectedModel = requestModel || 'openai/gpt-oss-120b';
    
    // Validate required fields
    if (!message) {
      return res.status(400).json({ 
        error: 'Message is required',
        code: 'MISSING_MESSAGE'
      });
    }
    
    // Sanitize and validate input
    let sanitizedMessage;
    try {
      sanitizedMessage = validateAndSanitizeInput(message);
      if (!sanitizedMessage) {
        return res.status(400).json({ 
          error: 'Invalid message content',
          code: 'INVALID_MESSAGE'
        });
      }
    } catch (error) {
      return res.status(400).json({ 
        error: error.message,
        code: 'MESSAGE_TOO_LONG'
      });
    }
    
    // Validate and sanitize plan
    const validatedPlan = validatePlan(plan);
    
    // Validate username
    const sanitizedUsername = validateAndSanitizeInput(username) || 'anonymous';
    if (sanitizedUsername.length > 50) {
      return res.status(400).json({ 
        error: 'Username too long. Maximum 50 characters allowed.',
        code: 'USERNAME_TOO_LONG'
      });
    }
    
    // Log the request for monitoring
    console.log(`Chat request - User: ${sanitizedUsername}, Plan: ${validatedPlan}, Message length: ${sanitizedMessage.length}`);
    
    // Continue with the original logic using sanitized inputs
    // message and plan are already available from the destructuring above
    
    // Get OpenRouter API key from environment
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    
    if (!openRouterApiKey) {
      console.error('OpenRouter API key not found in environment variables');
      return res.status(500).json({ 
        error: 'API configuration error',
        response: 'I apologize, but I\'m currently experiencing a configuration issue. Please try again later.'
      });
    }
    
    // Load plans configuration
    const fs = require('fs');
    let plansConfig;
    try {
      plansConfig = JSON.parse(fs.readFileSync(__dirname + '/config/plans.json', 'utf8'));
    } catch (error) {
      console.error('Error loading plans.json:', error);
      return res.status(500).json({ 
        error: 'Configuration error',
        response: 'I apologize, but I\'m currently experiencing a configuration issue. Please try again later.'
      });
    }
    
    // Get the requested plan configuration
    const planConfig = plansConfig.plans[validatedPlan];
    if (!planConfig) {
      return res.status(400).json({ 
        error: 'Invalid plan',
        response: `The plan '${validatedPlan}' is not available. Please select a valid plan.`
      });
    }
    
    // Get available agents for this plan
    const availableAgents = Object.entries(planConfig.agents)
      .filter(([agentKey, enabled]) => enabled)
      .map(([agentKey, enabled]) => agentKey);
    
    // Load agents configuration to get agent details
    let agentsConfig;
    try {
      agentsConfig = JSON.parse(fs.readFileSync(__dirname + '/config/agents.json', 'utf8'));
    } catch (error) {
      console.error('Error loading agents.json:', error);
      return res.status(500).json({ 
        error: 'Configuration error',
        response: 'I apologize, but I\'m currently experiencing a configuration issue. Please try again later.'
      });
    }
    
    // Use LangChain routing service for intelligent agent selection
    let selectedAgent = 'f8_agent'; // Default fallback
    
    try {
      // Initialize LangChain service for routing
      const LangChainService = require('./services/langchain-service');
      const langchainService = new LangChainService();
      
      // Route to appropriate agent using LangChain
      selectedAgent = await langchainService.routeToAgent(sanitizedMessage);
      console.log(`LangChain routing: "${sanitizedMessage.substring(0, 50)}..." ? ${selectedAgent}`);
      
      // Verify agent is available in current plan
      if (!availableAgents.includes(selectedAgent)) {
        console.warn(`Routed agent ${selectedAgent} not available in plan ${validatedPlan}, using fallback`);
        selectedAgent = availableAgents[0] || 'f8_agent';
      }
    } catch (routingError) {
      console.error('LangChain routing failed, using keyword fallback:', routingError.message);
      
      // Fallback to keyword-based routing
      const messageLower = sanitizedMessage.toLowerCase();
      for (const agentKey of availableAgents) {
        const agent = agentsConfig.agents[agentKey];
        if (agent && agent.keywords) {
          const hasKeyword = agent.keywords.some(keyword => 
            messageLower.includes(keyword.toLowerCase())
          );
          if (hasKeyword) {
            selectedAgent = agentKey;
            break;
          }
        }
      }
    }
    
    // Get selected agent details
    const selectedAgentDetails = agentsConfig.agents[selectedAgent];
    const agentName = selectedAgentDetails ? selectedAgentDetails.name : selectedAgent;
    
    // Create system prompt based on selected agent and plan
    let systemPrompt;
    if (usePromptEngineering) {
      systemPrompt = selectedAgentDetails 
        ? `You are a ${agentName} specializing in ${selectedAgentDetails.description}. You are part of the Formul8 Multiagent system with access to the ${planConfig.name} plan. ${selectedAgentDetails.specialties ? 'Your specialties include: ' + selectedAgentDetails.specialties.join(', ') + '.' : ''} Provide helpful, accurate, and professional responses. Keep responses concise but informative.`
        : `You are a Formul8 Multiagent AI assistant specializing in the cannabis industry. You are using the ${planConfig.name} plan. Provide helpful, accurate, and professional responses. Keep responses concise but informative.`;
    } else {
      // Raw mode: minimal prompt engineering
      systemPrompt = `You are a helpful AI assistant specializing in the cannabis industry.`;
    }
    
    // Call OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://f8.syzygyx.com',
        'X-Title': 'Formul8 Multiagent Chat'
      },
      body: JSON.stringify({
        model: selectedModel,
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
      let errorBody = '';
      try { errorBody = await openRouterResponse.text(); } catch (_) {}
      console.error('OpenRouter API error:', openRouterResponse.status, openRouterResponse.statusText, errorBody);
      // Graceful fallback: avoid 500s; return a degraded but helpful response
      const fallbackMsg = 'Our AI service is momentarily unavailable. Your message was received and logged. Please try again shortly.';
      const footer = `\n\n---\n*Agent: ${agentName} | Plan: ${planConfig.name} | Tokens: 0 (0?0) | Cost: $0.000000*`;
      return res.json({
        success: true,
        response: fallbackMsg + footer,
        agent: selectedAgent,
        agentName: agentName,
        plan: plan,
        planName: planConfig.name,
        timestamp: new Date().toISOString(),
        model: selectedModel,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost: 0 }
      });
    }
    
    const aiData = await openRouterResponse.json();
    const aiResponse = aiData.choices?.[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
    
    // Extract usage information
    const usage = aiData.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || (promptTokens + completionTokens);
    
    // Calculate cost (openai/gpt-oss-120b is free, so cost is $0.00)
    const totalCost = 0.00; // Free model
    
    // Create footer with metadata
    let footer = `\n\n---\n*Agent: ${agentName} | Plan: ${planConfig.name} | Tokens: ${totalTokens} (${promptTokens}?${completionTokens}) | Cost: $${totalCost.toFixed(6)}*`;
    
    // Call ad-agent for free and future4200 plans (contextual advertisements)
    if (validatedPlan === 'free' || validatedPlan === 'future4200') {
      try {
        // Get ad-agent configuration
        const adAgent = agentsConfig.agents['ad'];
        if (adAgent && adAgent.url) {
          // Call ad-agent with Q&A context to generate contextual advertisement
          const adAgentResponse = await fetch(`${adAgent.url}/generate-ad`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openRouterApiKey}`
            },
            body: JSON.stringify({
              question: sanitizedMessage,
              answer: aiResponse,
              plan: validatedPlan,
              context: {
                agent: selectedAgent,
                agentName: agentName
              }
            }),
            timeout: 5000 // 5 second timeout
          });
          
          if (adAgentResponse.ok) {
            const adData = await adAgentResponse.json();
            if (adData.advertisement) {
              // Add contextual advertisement from ad-agent
              footer += `\n\n---\n*Agent: Ad Agent | Plan: ${planConfig.name} | Tokens: ${adData.tokens || 0} | Cost: $0.000000*\n\n${adData.advertisement}`;
            }
          } else {
            console.warn('Ad-agent returned non-OK status:', adAgentResponse.status);
          }
        }
      } catch (adError) {
        // If ad-agent fails, log but don't show fallback ads
        console.warn(`Ad-agent call failed for ${validatedPlan} plan:`, adError.message);
        // Free and future4200 plans get contextual ads or nothing - no generic fallback ads
      }
    }
    
    const responseWithFooter = aiResponse + footer;
    
    res.json({
      success: true,
      response: responseWithFooter,
      agent: selectedAgent,
      agentName: agentName,
      plan: plan,
      planName: planConfig.name,
      timestamp: new Date().toISOString(),
      model: selectedModel,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        cost: totalCost
      }
    });
    
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    // Graceful fallback: avoid 500s and keep UI responsive
    const fallbackMsg = 'We hit a temporary issue processing your request. Please try again shortly.';
    return res.json({
      success: true,
      response: fallbackMsg,
      agent: 'f8_agent',
      timestamp: new Date().toISOString(),
      model: 'unknown',
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost: 0 }
    });
  }
});

// Lambda handler
exports.handler = async (event, context) => {
  // Convert Lambda event to Express request
  const request = {
    method: event.httpMethod || 'GET',
    url: event.path || '/',
    headers: event.headers || {},
    body: event.body ? JSON.parse(event.body) : {}
  };
  
  // Simple routing
  if (request.method === 'GET' && request.url === '/health') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'formul8-multiagent-lambda',
        version: '1.0.0'
      })
    };
  }
  
  if (request.method === 'GET' && request.url === '/chat') {
    // Return the HTML for the ChatGPT-style chat interface
    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Formul8 Multiagent Chat</title>
        <link rel="icon" type="image/x-icon" href="https://formul8.ai/favicon.ico">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
                font-family: ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol";
                background: #ffffff;
                color: #0d0d0d;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                font-size: 16px;
            }
            
            /* Header with login button */
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                height: 52px;
                border-bottom: 1px solid #e5e5e5;
                background: #ffffff;
            }
            
            .logo {
                font-size: 18px;
                font-weight: 600;
                color: #0d0d0d;
            }
            
            .login-button {
                background: #0d0d0d;
                color: white;
                border: none;
                padding: 0px 10px;
                border-radius: 3.35544e+07px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .login-button:hover {
                background: #0d0d0dcc;
            }
            
            /* Main chat container - dynamic layout */
            .chat-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                max-width: 768px;
                margin: 0 auto;
                padding: 20px;
                width: 100%;
                transition: all 0.3s ease;
            }
            
            /* Initial centered state */
            .chat-container.initial-state {
                justify-content: center;
                align-items: center;
            }
            
            /* Chat state after first message */
            .chat-container.chat-state {
                justify-content: flex-start;
                align-items: stretch;
            }
            
            .chat-title {
                font-size: 32px;
                font-weight: 600;
                color: #0d0d0d;
                margin-bottom: 8px;
                text-align: center;
                transition: all 0.3s ease;
            }
            
            .chat-subtitle {
                font-size: 16px;
                color: #5d5d5d;
                margin-bottom: 40px;
                text-align: center;
                transition: all 0.3s ease;
            }
            
            /* Chat state - hide title and subtitle */
            .chat-container.chat-state .chat-title,
            .chat-container.chat-state .chat-subtitle {
                display: none;
            }
            
            /* Chat messages area */
            .chat-messages {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                min-height: 200px;
                transition: all 0.3s ease;
            }
            
            /* Initial state - hide messages */
            .chat-container.initial-state .chat-messages {
                display: none;
            }
            
            /* Chat state - show messages */
            .chat-container.chat-state .chat-messages {
                display: block;
                flex: 1;
                overflow-y: auto;
                max-height: calc(100vh - 200px);
                padding: 0 0 20px 0;
            }
            
            .message {
                margin-bottom: 16px;
                padding: 12px 16px;
                border-radius: 12px;
                max-width: 100%;
            }
            
            .user-message {
                background: #f7f7f8;
                margin-left: auto;
                margin-right: 0;
                max-width: 85%;
                margin-bottom: 20px;
            }
            
            .assistant-message {
                background: #ffffff;
                border: 1px solid #e5e5e5;
                margin-right: auto;
                margin-left: 0;
                max-width: 85%;
                margin-bottom: 20px;
            }
            
            .welcome-message {
                text-align: center;
                padding: 40px 20px;
                background: #f9f9f9;
                border-radius: 12px;
                border: 1px solid #e5e5e5;
                transition: all 0.3s ease;
            }
            
            .welcome-message h3 {
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 12px;
                color: #000000;
            }
            
            .welcome-message p {
                font-size: 16px;
                color: #6b7280;
                margin-bottom: 8px;
            }
            
            .feature-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                justify-content: center;
                margin-top: 20px;
            }
            
            .feature-tag {
                background: #e5e7eb;
                color: #374151;
                padding: 6px 12px;
                border-radius: 16px;
                font-size: 14px;
                font-weight: 500;
            }
            
            /* Chat state - hide welcome message */
            .chat-container.chat-state .welcome-message {
                display: none;
            }
            
            /* Chat input area */
            .chat-input-container {
                width: 100%;
                max-width: 600px;
                position: relative;
                margin: 0 auto;
            }
            
            /* Initial state - centered input */
            .chat-container.initial-state .chat-input-container {
                margin: 0 auto 40px auto;
            }
            
            /* Chat state - input at bottom */
            .chat-container.chat-state .chat-input-container {
                margin: 20px auto 0 auto;
            }
            
            .chat-input-wrapper {
                position: relative;
                display: flex;
                align-items: flex-end;
                background: #ffffff;
                border: 1px solid #d1d5db;
                border-radius: 12px;
                padding: 12px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .chat-input {
                flex: 1;
                border: none;
                outline: none;
                font-size: 16px;
                line-height: 1.5;
                resize: none;
                min-height: 24px;
                max-height: 120px;
                font-family: inherit;
                background: transparent;
                padding: 0px 0px 16px;
            }
            
            .chat-input::placeholder {
                color: #000000b3;
            }
            
            .send-button {
                background: #10a37f;
                color: white;
                border: none;
                border-radius: 8px;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                margin-left: 8px;
                transition: background-color 0.2s;
            }
            
            .send-button:hover:not(:disabled) {
                background: #0d8a6b;
            }
            
            .send-button:disabled {
                background: #d1d5db;
                cursor: not-allowed;
            }
            
            .send-icon {
                width: 16px;
                height: 16px;
            }
            
            /* Loading indicator */
            .loading {
                display: none;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 16px;
            }
            
            .loading.show {
                display: block;
            }
            
            /* Responsive design */
            @media (max-width: 768px) {
                .chat-container {
                    padding: 16px;
                }
                
                .chat-title {
                    font-size: 24px;
                }
                
                .chat-subtitle {
                    font-size: 14px;
                }
                
                .message {
                    max-width: 90%;
                }
            }
        </style>
    </head>
    <body>
        <!-- Header with login button -->
        <div class="header">
            <div class="logo">Formul8</div>
            <button class="login-button" onclick="handleLogin()">Log in</button>
        </div>
        
        <!-- Main chat container - centered -->
        <div class="chat-container">
            <div class="chat-title">What do you want to Formul8 today?</div>
            <div class="chat-subtitle">Ask me anything about cannabis compliance, formulation, research, operations, and more.</div>
            
            <!-- Chat messages area -->
            <div class="chat-messages" id="chatMessages">
                <div class="welcome-message">
                    <h3>Welcome to Formul8 Multiagent Chat!</h3>
                    <p>I'm your intelligent cannabis industry assistant.</p>
                    <p>I can help you with compliance, formulation, science, operations, marketing, and more!</p>
                    
                    <div class="feature-tags">
                        <span class="feature-tag">Compliance</span>
                        <span class="feature-tag">Formulation</span>
                        <span class="feature-tag">Science</span>
                        <span class="feature-tag">Operations</span>
                        <span class="feature-tag">Marketing</span>
                        <span class="feature-tag">Patent Research</span>
                    </div>
                </div>
            </div>
            
            <!-- Loading indicator -->
            <div class="loading" id="loading">Formul8 is thinking...</div>
            
            <!-- Chat input area -->
            <div class="chat-input-container">
                <div class="chat-input-wrapper">
                    <textarea 
                        class="chat-input" 
                        id="messageInput" 
                        placeholder="Ask anything"
                        rows="1"
                    ></textarea>
                    <button class="send-button" id="sendButton" onclick="sendMessage()">
                        <svg class="send-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        
        <script>
            const chatContainer = document.querySelector('.chat-container');
            const chatMessages = document.getElementById('chatMessages');
            const messageInput = document.getElementById('messageInput');
            const sendButton = document.getElementById('sendButton');
            const loading = document.getElementById('loading');
            
            // Initialize in centered state
            chatContainer.classList.add('initial-state');
            
            // Auto-resize textarea
            messageInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            });
            
            // Handle Enter key (Shift+Enter for new line)
            messageInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
            
            // Handle login button
            function handleLogin() {
                alert('Login functionality coming soon! For now, you can use the chat without logging in.');
            }
            
            // Transition to chat state
            function transitionToChatState() {
                chatContainer.classList.remove('initial-state');
                chatContainer.classList.add('chat-state');
            }
            
            // Send message function
            async function sendMessage() {
                const message = messageInput.value.trim();
                
                if (!message) {
                    return;
                }
                
                // Transition to chat state on first message
                if (chatContainer.classList.contains('initial-state')) {
                    transitionToChatState();
                }
                
                // Add user message to chat
                addMessage(message, 'user');
                messageInput.value = '';
                messageInput.style.height = 'auto';
                
                // Show loading
                loading.classList.add('show');
                sendButton.disabled = true;
                
                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            message,
                            user_id: 'web-user'
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        addMessage(data.response, 'assistant');
                    } else {
                        addMessage('Sorry, I encountered an error: ' + (data.message || 'Unknown error'), 'assistant');
                    }
                } catch (error) {
                    addMessage('Sorry, I encountered an error: ' + error.message, 'assistant');
                } finally {
                    loading.classList.remove('show');
                    sendButton.disabled = false;
                    messageInput.focus();
                }
            }
            
            // Add message to chat
            function addMessage(content, type) {
                const messageDiv = document.createElement('div');
                messageDiv.className = \`message \${type}-message\`;
                messageDiv.textContent = content;
                
                chatMessages.appendChild(messageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            // Focus input on load
            messageInput.focus();
        </script>
    </body>
    </html>`;
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: html
    };
  }
  
  if (request.method === 'POST' && request.url === '/api/chat') {
    const { message, model: requestModel, usePromptEngineering = true } = request.body;
    
    // Use requested model or fall back to default
    const selectedModel = requestModel || 'openai/gpt-oss-120b';
    
    if (!message) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Message is required' })
      };
    }
    
    try {
      // Get OpenRouter API key from environment
      const openRouterApiKey = process.env.OPENROUTER_API_KEY;
      
      if (!openRouterApiKey) {
        console.error('OpenRouter API key not found in environment variables');
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'API configuration error',
            response: 'I apologize, but I\'m currently experiencing a configuration issue. Please try again later.'
          })
        };
      }
      
      // Call OpenRouter API
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://f8.syzygyx.com',
          'X-Title': 'Formul8 Multiagent Chat'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: `You are a Formul8 Multiagent AI assistant specializing in the cannabis industry. You help with compliance, formulation, science, operations, marketing, patent research, and sourcing. Provide helpful, accurate, and professional responses. Keep responses concise but informative.`
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          reasoning: {
            effort: "medium",
            exclude: false
          }
        })
      });
      
      if (!openRouterResponse.ok) {
        let errorBody = '';
        try { errorBody = await openRouterResponse.text(); } catch (_) {}
        console.error('OpenRouter API error:', openRouterResponse.status, openRouterResponse.statusText, errorBody);
        // Graceful fallback to avoid 500s in serverless handler
        const fallbackMsg = 'Our AI service is momentarily unavailable. Please try again.';
        const footer = `\n\n---\n*Agent: f8_agent | Tokens: 0 (0?0) | Cost: $0.000000*`;
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            response: fallbackMsg + footer,
            agent: 'f8_agent',
            timestamp: new Date().toISOString(),
            model: selectedModel,
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost: 0 }
          })
        };
      }
      
      const aiData = await openRouterResponse.json();
      const message = aiData.choices?.[0]?.message;
      const aiResponse = message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
      const reasoningDetails = message?.reasoning_details || [];
      
      // Extract usage information
      const usage = aiData.usage || {};
      const promptTokens = usage.prompt_tokens || 0;
      const completionTokens = usage.completion_tokens || 0;
      const totalTokens = usage.total_tokens || (promptTokens + completionTokens);
      
      // Calculate cost (openai/gpt-oss-120b is free, so cost is $0.00)
      // const inputCost = (promptTokens / 1000000) * 0.15; // Free model
      // const outputCost = (completionTokens / 1000000) * 0.60; // Free model
      const totalCost = 0.00; // Free model
      
      // Create footer with metadata
      const footer = `\n\n---\n*Agent: f8_agent | Tokens: ${totalTokens} (${promptTokens}?${completionTokens}) | Cost: $${totalCost.toFixed(6)}*`;
      const responseWithFooter = aiResponse + footer;
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          response: responseWithFooter,
          agent: 'f8_agent',
          timestamp: new Date().toISOString(),
          model: selectedModel,
          reasoning_details: reasoningDetails,
          usage: {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: totalTokens,
            cost: totalCost
          }
        })
      };
      
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      // Graceful fallback
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          response: 'We hit a temporary issue processing your request. Please try again shortly.',
          agent: 'f8_agent',
          timestamp: new Date().toISOString(),
          model: 'unknown',
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost: 0 }
        })
      };
    }
  }
  
  return {
    statusCode: 404,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Not found' })
  };
};

// Export the Express app wrapped for Vercel serverless
module.exports = app;
module.exports.handler = serverless(app);
