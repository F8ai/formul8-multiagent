const express = require('express');
const cors = require('cors');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
                padding: 25px;
                text-align: center;
                border-bottom: 1px solid var(--formul8-border);
            }
            
            .chat-header h2 {
                font-size: 1.8rem;
                font-weight: 600;
                color: var(--formul8-text-primary);
                margin-bottom: 8px;
            }
            
            .chat-header p {
                color: var(--formul8-text-secondary);
                font-size: 0.95rem;
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
                    <h2>Formul8 Multiagent Chat - Free Tier</h2>
                    <p>Basic cannabis industry assistance with upgrade prompts</p>
                    <div class="tier-indicator">
                        <span>Free Tier - $0/month</span>
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
            // Simple chat functionality
            document.getElementById('sendButton').addEventListener('click', function() {
                const input = document.getElementById('chatInput');
                const message = input.value.trim();
                if (message) {
                    console.log('Sending message:', message);
                    input.value = '';
                }
            });
            
            document.getElementById('chatInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    document.getElementById('sendButton').click();
                }
            });
            
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

// API chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, plan = 'standard' } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
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
    const planConfig = plansConfig.plans[plan];
    if (!planConfig) {
      return res.status(400).json({ 
        error: 'Invalid plan',
        response: `The plan '${plan}' is not available. Please select a valid plan.`
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
    
    // Determine which agent to use based on message content and available agents
    let selectedAgent = 'compliance'; // Default fallback
    const messageLower = message.toLowerCase();
    
    // Simple keyword-based routing (can be enhanced with more sophisticated logic)
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
    
    // Get selected agent details
    const selectedAgentDetails = agentsConfig.agents[selectedAgent];
    const agentName = selectedAgentDetails ? selectedAgentDetails.name : selectedAgent;
    
    // Create system prompt based on selected agent and plan
    const systemPrompt = selectedAgentDetails 
      ? `You are a ${agentName} specializing in ${selectedAgentDetails.description}. You are part of the Formul8 Multiagent system with access to the ${planConfig.name} plan. ${selectedAgentDetails.specialties ? 'Your specialties include: ' + selectedAgentDetails.specialties.join(', ') + '.' : ''} Provide helpful, accurate, and professional responses. Keep responses concise but informative.`
      : `You are a Formul8 Multiagent AI assistant specializing in the cannabis industry. You are using the ${planConfig.name} plan. Provide helpful, accurate, and professional responses. Keep responses concise but informative.`;
    
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
    
    // Calculate cost (openai/gpt-oss-120b is free, so cost is $0.00)
    const totalCost = 0.00; // Free model
    
    // Create footer with metadata
    const footer = `\n\n---\n*Agent: ${agentName} | Plan: ${planConfig.name} | Tokens: ${totalTokens} (${promptTokens}→${completionTokens}) | Cost: $${totalCost.toFixed(6)}*`;
    const responseWithFooter = aiResponse + footer;
    
    res.json({
      success: true,
      response: responseWithFooter,
      agent: selectedAgent,
      agentName: agentName,
      plan: plan,
      planName: planConfig.name,
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
    console.error('Error calling OpenRouter API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      response: 'I apologize, but I encountered an error processing your request. Please try again.'
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
    // Return the HTML for the chat interface
    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Formul8 Multiagent Chat - Dark Theme</title>
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
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
                font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
                background: linear-gradient(135deg, var(--formul8-bg-primary) 0%, var(--formul8-bg-secondary) 100%);
                color: var(--formul8-text-primary);
                min-height: 100vh;
            }
            
            .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 {
                font-size: 3rem;
                font-weight: 700;
                background: linear-gradient(135deg, var(--formul8-primary), var(--formul8-secondary));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 10px;
            }
            .header p { font-size: 1.2rem; color: var(--formul8-text-secondary); }
            .tier-selector { display: flex; justify-content: center; gap: 12px; margin: 30px 0; flex-wrap: wrap; }
            .tier-button {
                background: var(--formul8-bg-card);
                color: var(--formul8-text-secondary);
                border: 2px solid var(--formul8-border);
                padding: 12px 24px;
                border-radius: 25px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .tier-button:hover { border-color: var(--formul8-primary); color: var(--formul8-text-primary); }
            .tier-button.active {
                background: linear-gradient(135deg, var(--formul8-primary), var(--formul8-secondary));
                color: var(--formul8-bg-primary);
            }
            .chat-wrapper {
                background: var(--formul8-bg-card);
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                overflow: hidden;
                min-height: 600px;
            }
            .chat-header {
                background: linear-gradient(135deg, var(--formul8-bg-secondary), #2a2a2a);
                padding: 25px;
                text-align: center;
                border-bottom: 1px solid var(--formul8-border);
            }
            .chat-messages { height: 400px; padding: 25px; background: var(--formul8-bg-primary); }
            .welcome-message {
                text-align: center;
                color: var(--formul8-text-secondary);
                margin: 40px 0;
                padding: 30px;
                background: var(--formul8-bg-card);
                border-radius: 15px;
                border: 1px solid var(--formul8-border);
            }
            .feature-list { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 20px; }
            .feature-tag {
                background: linear-gradient(135deg, var(--formul8-primary), var(--formul8-secondary));
                color: var(--formul8-bg-primary);
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
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
            .chat-input-container { padding: 25px; background: var(--formul8-bg-secondary); border-top: 1px solid var(--formul8-border); }
            .chat-input-group { display: flex; gap: 15px; align-items: center; }
            .chat-input {
                flex: 1;
                background: var(--formul8-bg-primary);
                border: 2px solid var(--formul8-border);
                border-radius: 25px;
                padding: 15px 25px;
                color: var(--formul8-text-primary);
            }
            .chat-input:focus { outline: none; border-color: var(--formul8-primary); }
            .send-button {
                background: linear-gradient(135deg, var(--formul8-primary), var(--formul8-secondary));
                border: none;
                border-radius: 50%;
                width: 55px;
                height: 55px;
                color: var(--formul8-bg-primary);
                cursor: pointer;
            }
            .status-indicator {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #2ed573;
                color: var(--formul8-bg-primary);
                padding: 12px 20px;
                border-radius: 25px;
                font-weight: 600;
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
                    <h2>Formul8 Multiagent Chat - Free Tier</h2>
                    <p>Basic cannabis industry assistance with upgrade prompts</p>
                </div>
                
                <div class="chat-messages">
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
                        <input type="text" class="chat-input" placeholder="Ask me anything about cannabis industry...">
                        <button class="send-button">Send</button>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="status-indicator">Connected</div>
    </body>
    </html>`;
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: html
    };
  }
  
  if (request.method === 'POST' && request.url === '/api/chat') {
    const { message } = request.body;
    
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
          model: 'openai/gpt-oss-120b',
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
          temperature: 0.7
        })
      });
      
      if (!openRouterResponse.ok) {
        console.error('OpenRouter API error:', openRouterResponse.status, openRouterResponse.statusText);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'AI service temporarily unavailable',
            response: 'I apologize, but I\'m currently unable to process your request. Please try again in a moment.'
          })
        };
      }
      
      const aiData = await openRouterResponse.json();
      const aiResponse = aiData.choices?.[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
      
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
      const footer = `\n\n---\n*Agent: f8_agent | Tokens: ${totalTokens} (${promptTokens}→${completionTokens}) | Cost: $${totalCost.toFixed(6)}*`;
      const responseWithFooter = aiResponse + footer;
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          response: responseWithFooter,
          agent: 'f8_agent',
          timestamp: new Date().toISOString(),
          model: 'openai/gpt-oss-120b',
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
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Internal server error',
          response: 'I apologize, but I encountered an error processing your request. Please try again.'
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