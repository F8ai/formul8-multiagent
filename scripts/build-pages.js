#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Build static pages for GitHub Pages deployment
 */
async function buildPages() {
  console.log('🚀 Building static pages for GitHub Pages...');
  
  const distDir = path.join(__dirname, '..', 'dist');
  const pagesDir = path.join(distDir, 'pages');
  
  // Create directories
  await fs.mkdir(pagesDir, { recursive: true });
  
  // Create index.html (main chat interface)
  const indexHtml = `<!DOCTYPE html>
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
        .api-info {
            background: #fff3cd;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #ffc107;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Formul8 Multiagent Chat</h1>
        
        <div class="status">
            <h2>✅ Service Status: Running <span class="badge">LangChain.js</span></h2>
            <p>Welcome to the Formul8 Multiagent Chat Interface!</p>
            <p><strong>Deployment:</strong> GitHub Pages (Static)</p>
            <p><strong>API Endpoint:</strong> <a href="https://f8.syzygyx.com" target="_blank">f8.syzygyx.com</a></p>
            <p><strong>Status:</strong> Operational</p>
            <p><strong>Version:</strong> 1.0.0 - Multiagent Chat Frontend</p>
        </div>
        
        <div class="api-info">
            <h3>⚠️ Static Version Notice</h3>
            <p>This is the static version of the chat interface. For full functionality, please use the live API at <a href="https://f8.syzygyx.com/chat" target="_blank">f8.syzygyx.com/chat</a></p>
            <p>The static version demonstrates the UI but requires the backend API for actual chat functionality.</p>
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
                <div class="message agent-message">
                    <strong>Note:</strong> This is a static demo. For live chat functionality, please visit <a href="https://f8.syzygyx.com/chat" target="_blank">f8.syzygyx.com/chat</a>
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
                <li><a href="https://f8.syzygyx.com/health" target="_blank">GET /health</a> - Service health check</li>
                <li><strong>POST /api/chat</strong> - Send message (auto-routes to agent)</li>
                <li><strong>POST /api/query/:agent</strong> - Query specific agent</li>
                <li><a href="https://f8.syzygyx.com/api/agents" target="_blank">GET /api/agents</a> - List all agents</li>
                <li><a href="https://f8.syzygyx.com/chat" target="_blank">GET /chat</a> - Live chat interface</li>
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
        
        <div class="endpoints">
            <h3>📚 Documentation:</h3>
            <ul>
                <li><a href="/architecture.html" target="_blank">🏗️ System Architecture & Sequence Diagram</a> - Complete authentication and request flow</li>
                <li><a href="https://github.com/F8ai/formul8-multiagent" target="_blank">📖 GitHub Repository</a> - Source code and documentation</li>
                <li><a href="https://f8.syzygyx.com/api/agents" target="_blank">🤖 Agent API Documentation</a> - Live agent endpoints</li>
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
                // Use the live API endpoint
                const response = await fetch('https://f8.syzygyx.com/api/mcr/chat', {
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
                addMessage('Sorry, I encountered an error: ' + error.message + '. Please try the live version at f8.syzygyx.com/chat', 'agent');
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
</html>`;

  await fs.writeFile(path.join(pagesDir, 'index.html'), indexHtml);
  
  // Create 404.html for GitHub Pages
  const notFoundHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Page Not Found - Formul8 Multiagent</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            padding: 40px; 
            border-radius: 15px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
        }
        h1 { 
            color: #2c3e50; 
            font-size: 3em;
            margin-bottom: 20px;
        }
        p {
            color: #666;
            font-size: 1.2em;
            margin-bottom: 30px;
        }
        a {
            color: #007bff;
            text-decoration: none;
            font-weight: bold;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>404</h1>
        <p>Page not found</p>
        <p>The page you're looking for doesn't exist.</p>
        <p><a href="/">← Back to Formul8 Multiagent Chat</a></p>
        <p><a href="https://f8.syzygyx.com" target="_blank">Visit Live API →</a></p>
    </div>
</body>
</html>`;

  await fs.writeFile(path.join(pagesDir, '404.html'), notFoundHtml);

  // Create sequence diagram page
  const sequenceDiagramHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Formul8 System Architecture - Sequence Diagram</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 1400px; 
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
        .nav {
            text-align: center;
            margin-bottom: 30px;
        }
        .nav a {
            color: #007bff;
            text-decoration: none;
            margin: 0 15px;
            padding: 8px 16px;
            border-radius: 5px;
            background: #f8f9fa;
            transition: all 0.3s ease;
        }
        .nav a:hover {
            background: #007bff;
            color: white;
        }
        .diagram-container {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            overflow-x: auto;
        }
        .mermaid {
            text-align: center;
        }
        .description {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #4CAF50;
        }
        .components {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .component {
            background: #f0f8ff;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #007bff;
        }
        .component h3 {
            margin-top: 0;
            color: #2c3e50;
        }
        .security-features {
            background: #fff3cd;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #ffc107;
        }
        .subscription-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .subscription-table th {
            background: linear-gradient(135deg, #00ff88 0%, #00d4aa 100%);
            color: #0a0a0a;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        .subscription-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        .subscription-table tr:hover {
            background: #f8f9fa;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏗️ Formul8 System Architecture</h1>
        
        <div class="nav">
            <a href="/">← Back to Chat</a>
            <a href="https://f8.syzygyx.com" target="_blank">Live API</a>
            <a href="https://github.com/F8ai/formul8-multiagent" target="_blank">GitHub</a>
        </div>
        
        <div class="description">
            <h2>📋 Overview</h2>
            <p>This sequence diagram illustrates the complete authentication and request flow between the User, Supabase, Google OAuth, and the F8 Multiagent system.</p>
        </div>
        
        <div class="diagram-container">
            <div class="mermaid">
sequenceDiagram
    participant U as User
    participant F as Formul8 Frontend<br/>(formul8.ai)
    participant D as Formul8 Dashboard<br/>(formul8-ai-dashboard.vercel.app)
    participant G as Google OAuth<br/>(OAuth 2.0)
    participant S as Supabase<br/>(Database & Auth)
    participant API as F8 API<br/>(f8.syzygyx.com)
    participant A as Specialized Agents<br/>(compliance, formulation, etc.)
    participant AD as Ad Server<br/>(Ad Agent)

    Note over U,A: Authentication Flow

    U->>F: 1. Access formul8.ai
    F->>U: 2. Display login page
    U->>F: 3. Click "Login with Google"
    
    F->>G: 4. Redirect to Google OAuth
    G->>U: 5. Google login prompt
    U->>G: 6. Enter credentials
    G->>F: 7. Return authorization code
    
    F->>G: 8. Exchange code for tokens
    G->>F: 9. Return JWT access token
    
    F->>S: 10. Verify JWT token
    S->>F: 11. Token validation response
    
    F->>S: 12. Create/update user profile
    S->>S: 13. Auto-create profile record
    S->>S: 14. Assign default subscription (free)
    S->>S: 15. Set user role with permissions
    S->>F: 16. Return user data (ID, plan, permissions)
    
    F->>U: 17. Login successful, show dashboard

    Note over U,A: Request Processing Flow

    U->>F: 18. Send chat message
    F->>API: 19. POST /api/chat<br/>Authorization: Bearer JWT<br/>Body: {message, plan, username}
    
    API->>S: 20. Verify JWT token
    S->>API: 21. Return user data (profile, subscription, role)
    
    API->>API: 22. Check plan permissions
    API->>API: 23. Apply rate limiting
    API->>API: 24. Select appropriate agent<br/>(based on keywords)
    
    alt Agent Selection
        API->>A: 25. Route to specialized agent<br/>(compliance, formulation, etc.)
        A->>A: 26. Validate plan access
        A->>A: 27. Process request with OpenRouter API
        A->>API: 28. Return agent response
    else Direct API Response
        API->>API: 25. Process with F8 agent
    end
    
    API->>F: 29. Return response with agent info
    F->>U: 30. Display response

    Note over U,A: Subscription & Plan Management

    U->>F: 31. Request plan upgrade
    F->>S: 32. Update subscription plan
    S->>S: 33. Update user_roles table
    S->>S: 34. Update permissions
    S->>F: 35. Return updated plan data
    F->>U: 36. Show new plan features

    Note over U,A: Security & Rate Limiting

    rect rgb(255, 240, 240)
        Note over API: Rate Limiting by Plan:<br/>Free: 10 req/hour<br/>Standard: 100 req/hour<br/>Enterprise: 1000 req/hour<br/>Admin: Unlimited
    end

    rect rgb(240, 255, 240)
        Note over S: Row Level Security (RLS):<br/>- User can only access own data<br/>- Plan-based feature access<br/>- Automatic profile creation<br/>- Permission validation
    end

    rect rgb(240, 240, 255)
        Note over G: OAuth 2.0 Security:<br/>- Secure token exchange<br/>- JWT token validation<br/>- Token refresh handling<br/>- Scope-based permissions
    end

    Note over U,AD: Ad Serving Flow

    U->>F: 37. Access free plan features
    F->>API: 38. Check user plan status
    API->>S: 39. Verify user subscription
    S->>API: 40. Return plan: "free"
    
    API->>AD: 41. Request ad content<br/>User plan: free<br/>Context: cannabis industry
    AD->>AD: 42. Select relevant ad<br/>Target: cannabis businesses<br/>Format: banner/video
    AD->>API: 43. Return ad content<br/>{ad_id, content, placement}
    
    API->>F: 44. Return response + ad content
    F->>U: 45. Display response with ads
    
    Note over U,AD: Ad Interaction Tracking

    U->>F: 46. Click on ad
    F->>AD: 47. Track ad click<br/>ad_id, user_id, timestamp
    AD->>AD: 48. Log interaction<br/>Update click metrics
    AD->>F: 49. Redirect to advertiser
    F->>U: 50. Open advertiser page

    Note over U,AD: Ad Revenue & Analytics

    rect rgb(255, 245, 240)
        Note over AD: Ad Revenue Model:<br/>- Free users see targeted ads<br/>- Paid users see no ads<br/>- Revenue sharing with advertisers<br/>- Analytics for ad performance
    end

    rect rgb(240, 255, 240)
        Note over S: Ad-Free Upgrade Path:<br/>- Free users see upgrade prompts<br/>- Ad-free experience for paid plans<br/>- Conversion tracking<br/>- Revenue optimization
    end

    Note over U,S: Token Usage & Cost Tracking

    U->>F: 51. Send chat request
    F->>API: 52. POST /api/chat with JWT
    API->>S: 53. Verify user & check plan limits
    S->>API: 54. Return user data & usage limits
    
    API->>A: 55. Process with OpenRouter API
    A->>A: 56. Calculate tokens: input + output
    A->>A: 57. Calculate cost: tokens × rate
    A->>API: 58. Return response + usage data
    
    API->>S: 59. Log usage to database<br/>{user_id, tokens, cost, model, timestamp}
    S->>S: 60. Update user usage totals
    S->>S: 61. Check against plan limits
    
    API->>F: 62. Return response with usage<br/>{response, usage: {tokens, cost, remaining}}
    F->>U: 63. Display response + usage info

    Note over U,S: Billing & Usage Analytics

    rect rgb(255, 248, 240)
        Note over API: Token Cost Calculation:<br/>- Input tokens: $0.001/1K tokens<br/>- Output tokens: $0.002/1K tokens<br/>- Model: GPT-OSS-120B pricing<br/>- Real-time cost tracking
    end

    rect rgb(248, 255, 248)
        Note over S: Usage Tracking:<br/>- Per-user token consumption<br/>- Monthly usage limits by plan<br/>- Cost accumulation tracking<br/>- Billing cycle management
    end
            </div>
        </div>
        
        <div class="components">
            <div class="component">
                <h3>👤 User</h3>
                <p>End user accessing the Formul8 system. Authenticates via Google OAuth and sends chat requests.</p>
            </div>
            
            <div class="component">
                <h3>🌐 Formul8 Frontend (formul8.ai)</h3>
                <p>React/HTML interface that handles user authentication flow, manages JWT token storage, and routes requests to F8 API.</p>
            </div>
            
            <div class="component">
                <h3>🔐 Google OAuth (OAuth 2.0)</h3>
                <p>Provides secure authentication, issues JWT access tokens, handles token refresh, and manages user consent and scopes.</p>
            </div>
            
            <div class="component">
                <h3>🗄️ Supabase (Database & Auth)</h3>
                <p>Stores user profiles and subscription data, manages Row Level Security (RLS) policies, handles JWT token verification, and manages 8-tier subscription system.</p>
            </div>
            
            <div class="component">
                <h3>⚡ F8 API (f8.syzygyx.com)</h3>
                <p>Central routing and coordination hub that validates JWT tokens with Supabase, applies rate limiting based on user plan, routes requests to specialized agents, and manages plan-based permissions.</p>
            </div>
            
            <div class="component">
                <h3>🤖 Specialized Agents</h3>
                <p>12 domain-specific AI assistants (compliance, formulation, science, operations, etc.) that validate plan access permissions, process requests via OpenRouter API, and return specialized responses.</p>
            </div>
            
            <div class="component">
                <h3>📺 Ad Server (Ad Agent)</h3>
                <p>Cannabis industry-focused ad serving system that targets relevant advertisements to free plan users, tracks ad interactions and click-through rates, manages ad revenue and performance analytics, and provides upgrade prompts for ad-free experience.</p>
            </div>
        </div>
        
        <div class="security-features">
            <h3>🔒 Security Features</h3>
            <ul>
                <li><strong>JWT Token Verification:</strong> All requests validated through Supabase</li>
                <li><strong>Row Level Security:</strong> Users can only access their own data</li>
                <li><strong>Plan-based Access Control:</strong> Features gated by subscription tier</li>
                <li><strong>Rate Limiting:</strong> Prevents abuse with tier-based limits</li>
                <li><strong>Input Sanitization:</strong> All user inputs validated and sanitized</li>
                <li><strong>CORS Configuration:</strong> Secure cross-origin request handling</li>
            </ul>
        </div>
        
        <div class="security-features" style="background: #f0f8ff; border-left: 4px solid #007bff;">
            <h3>💰 Token Usage & Cost Tracking</h3>
            <ul>
                <li><strong>Real-time Cost Calculation:</strong> Input tokens ($0.001/1K) + Output tokens ($0.002/1K)</li>
                <li><strong>Usage Logging:</strong> All token consumption tracked per user with timestamps</li>
                <li><strong>Plan Limits:</strong> Monthly usage limits enforced by subscription tier</li>
                <li><strong>Transparency:</strong> Users see token consumption and remaining limits</li>
                <li><strong>Billing Integration:</strong> Usage data feeds into subscription management</li>
                <li><strong>Model Tracking:</strong> Cost calculation based on GPT-OSS-120B pricing</li>
            </ul>
        </div>
        
        <div class="description">
            <h3>📊 Subscription Tiers</h3>
            <table class="subscription-table">
                <thead>
                    <tr>
                        <th>Tier</th>
                        <th>Plan</th>
                        <th>Features</th>
                        <th>Rate Limit</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>1</td><td>free</td><td>Basic chat, Standard responses</td><td>10 req/hour</td></tr>
                    <tr><td>2</td><td>standard</td><td>+ Formulation help</td><td>100 req/hour</td></tr>
                    <tr><td>3</td><td>micro</td><td>+ Compliance assistance, Basic analytics</td><td>100 req/hour</td></tr>
                    <tr><td>4</td><td>operator</td><td>+ Operations support, Advanced analytics</td><td>100 req/hour</td></tr>
                    <tr><td>5</td><td>enterprise</td><td>+ Marketing tools, Custom integrations</td><td>1000 req/hour</td></tr>
                    <tr><td>6</td><td>beta</td><td>All standard + Beta features, Early access</td><td>1000 req/hour</td></tr>
                    <tr><td>7</td><td>admin</td><td>All features + Admin tools, System management</td><td>Unlimited</td></tr>
                    <tr><td>8</td><td>future4200</td><td>All + Future4200 integration, Community tools</td><td>Unlimited</td></tr>
                </tbody>
            </table>
        </div>
        
        <p style="text-align: center; color: #7f8c8d; margin-top: 40px;">
            Formul8 Multiagent System Architecture - AI-Powered Cannabis Solutions
        </p>
    </div>
    
    <script>
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'default',
            themeVariables: {
                primaryColor: '#00ff88',
                primaryTextColor: '#0a0a0a',
                primaryBorderColor: '#00d4aa',
                lineColor: '#333333',
                secondaryColor: '#f8f9fa',
                tertiaryColor: '#ffffff'
            }
        });
    </script>
</body>
</html>`;

  await fs.writeFile(path.join(pagesDir, 'architecture.html'), sequenceDiagramHtml);
  
  // Also create sequence.html as an alias
  await fs.writeFile(path.join(pagesDir, 'sequence.html'), sequenceDiagramHtml);
  
  // Build agents.html with dynamic data from root baseline.json and agent baseline.json files
  const agentsDir = path.join(__dirname, '..', 'agents');
  const rootBaselinePath = path.join(__dirname, '..', 'baseline.json');
  const agentsData = [];
  
  // RAG data sizes from AGENT_DATA_S3_ARCHITECTURE.md
  const ragSizes = {
    'sourcing-agent': '12GB',
    'compliance-agent': '3.3GB',
    'metabolomics-agent': '1.3GB',
    'future-agent': '410MB',
    'patent-agent': '4.2MB',
    'science-agent': '324KB',
    'mcr-agent': '228KB',
    'formulation-agent': '4KB',
    'operations-agent': '4KB',
    'editor-agent': null,
    'ad-agent': null,
    'customer-success-agent': null,
    'marketing-agent': null,
    'spectra-agent': null,
    'f8-slackbot': null
  };
  
  const ragSources = {
    'formulation-agent': 'science-agent (324KB)'
  };
  
  const descriptions = {
    'ad-agent': 'Advertising campaigns and marketing strategy',
    'compliance-agent': 'State regulations and compliance documentation',
    'customer-success-agent': 'Customer retention and engagement',
    'editor-agent': 'File management and document editing',
    'f8-slackbot': 'Team collaboration and communication',
    'formulation-agent': 'Product formulation specialist',
    'marketing-agent': 'Brand and marketing strategy',
    'mcr-agent': 'Master Control Records documentation',
    'operations-agent': 'Facility operations management',
    'patent-agent': 'Patent records and IP research',
    'science-agent': 'Research papers and scientific studies',
    'sourcing-agent': 'Supplier databases, pricing, and availability',
    'spectra-agent': 'Spectral analysis and processing'
  };
  
  // Agent name mapping: how to find questions in root baseline.json
  const agentCategoryMap = {
    'compliance-agent': [
      'compliance',
      'sop-generation-compliance',
      'labeling-packaging-compliance',
      'formulation-ingredient-compliance',
      'waste-management-compliance',
      'compliance-recordkeeping',
      'transport-transfer-regulations',
      'product-testing',
      'recordkeeping',
      'testing'
    ],
    'marketing-agent': ['marketing'],
    'operations-agent': ['operations', 'operational', 'facility', 'extraction', 'cultivation', 'inventory', 'packaging', 'quality-assurance', 'equipment', 'environmental-health', 'delivery', 'logistics', 'training', 'sops-work-instructions', 'risk-management', 'supplier', 'procurement', 'sustainability', 'r&d', 'customer-service', 'security', 'project-management', 'retail-processing', 'data-systems'],
    'formulation-agent': ['formulation', 'edibles-potency', 'extraction', 'postprocessing', 'co-extraction', 'ethanol-extraction', 'hydrocarbon-extraction', 'solventless'],
    'science-agent': ['science'],
    'patent-agent': ['patent'],
    'sourcing-agent': ['sourcing', 'supplier', 'procurement'],
    'customer-success-agent': ['customer-success', 'customer-retention', 'customer-service'],
    'ad-agent': ['ad', 'advertising'],
    'spectra-agent': ['spectra'],
    'mcr-agent': ['mcr'],
    'editor-agent': ['editor'],
    'f8-slackbot': ['slackbot', 'slack']
  };
  
  try {
    // Load root baseline.json to count questions by category
    let rootBaseline = null;
    try {
      const rootBaselineContent = await fs.readFile(rootBaselinePath, 'utf8');
      rootBaseline = JSON.parse(rootBaselineContent);
    } catch (error) {
      console.warn('⚠️  Could not read root baseline.json:', error.message);
    }
    
    const agentDirs = await fs.readdir(agentsDir);
    
    for (const agentName of agentDirs) {
      let questionCount = 0;
      let agentQuestions = [];
      
      // Try to get count from root baseline.json first (more accurate)
      if (rootBaseline && rootBaseline.questions && agentCategoryMap[agentName]) {
        const categories = agentCategoryMap[agentName];
        // Special handling for compliance-agent: also check question text for jurisdiction mentions
        const isComplianceAgent = agentName === 'compliance-agent';
        const jurisdictionPattern = /\b(new jersey|california|new york|colorado|florida|arizona|michigan|illinois|massachusetts|washington|oregon|nevada|pennsylvania|virginia|maryland|connecticut|vermont|maine|new hampshire|rhode island|delaware|montana|south dakota|new mexico|mississippi|alabama|south carolina|louisiana|utah|west virginia|north dakota|wyoming|idaho|kentucky|tennessee|oklahoma|arkansas|missouri|iowa|indiana|ohio|wisconsin|minnesota|nebraska|kansas|texas|north carolina|georgia|alaska|hawaii|nevada|district of columbia|dc)\b/i;
        
        const matchingQuestions = rootBaseline.questions.filter(q => {
          // Check category match
          if (q.category) {
            const categoryLower = q.category.toLowerCase();
            if (categories.some(cat => categoryLower.includes(cat.toLowerCase()))) {
              return true;
            }
          }
          
          // For compliance-agent, also check if question mentions jurisdictions/states
          if (isComplianceAgent && q.question) {
            const questionLower = q.question.toLowerCase();
            if (jurisdictionPattern.test(questionLower)) {
              return true;
            }
            // Also match questions that mention "compliant", "compliance", "regulation", "jurisdiction"
            if (questionLower.includes('compliant') || questionLower.includes('compliance') || 
                questionLower.includes('regulation') || questionLower.includes('jurisdiction') ||
                questionLower.includes('state requirement') || questionLower.includes('legal requirement')) {
              return true;
            }
          }
          
          return false;
        });
        
        questionCount = matchingQuestions.length;
        // Store questions for display
        agentQuestions = matchingQuestions.map(q => ({
          question: q.question,
          category: q.category || 'uncategorized',
          expectedAnswer: q.expected_answer || q.expectedAnswer || null
        }));
      }
      
      // Fallback to individual agent baseline.json if root count is 0
      if (questionCount === 0) {
        const baselinePath = path.join(agentsDir, agentName, 'baseline.json');
        try {
          const baselineContent = await fs.readFile(baselinePath, 'utf8');
          const baseline = JSON.parse(baselineContent);
          questionCount = baseline.questions ? baseline.questions.length : 0;
          agentQuestions = (baseline.questions || []).map(q => ({
            question: q.question,
            category: q.category || 'uncategorized',
            expectedAnswer: q.expected_answer || q.expectedAnswer || null
          }));
        } catch (error) {
          questionCount = 0;
          agentQuestions = [];
        }
      }
      
      agentsData.push({
        agent: agentName,
        questions: questionCount,
        questionList: agentQuestions, // Include the actual questions
        ragSize: ragSizes[agentName] || null,
        ragSource: ragSources[agentName] || null,
        description: descriptions[agentName] || `${agentName} agent`,
        usesRAG: !!ragSources[agentName],
        isRAGSource: agentName === 'science-agent'
      });
    }
    
    // Read the agents.html template
    const agentsHtmlPath = path.join(__dirname, '..', 'agents.html');
    let agentsHtml = await fs.readFile(agentsHtmlPath, 'utf8');
    
    // Replace the hardcoded agentsData with dynamically generated data
    const agentsDataJson = JSON.stringify(agentsData, null, 2);
    agentsHtml = agentsHtml.replace(
      /const agentsData = \[[\s\S]*?\];/,
      `const agentsData = ${agentsDataJson};`
    );
    
    await fs.writeFile(path.join(pagesDir, 'agents.html'), agentsHtml);
    console.log(`✅ Built agents.html with data from ${agentsData.length} agents`);
    console.log(`   Total questions: ${agentsData.reduce((sum, a) => sum + a.questions, 0)}`);
  } catch (error) {
    console.warn('⚠️  Could not build agents.html:', error.message);
    // Fallback: just copy the file as-is
    try {
      const agentsHtmlPath = path.join(__dirname, '..', 'agents.html');
      const agentsHtml = await fs.readFile(agentsHtmlPath, 'utf8');
      await fs.writeFile(path.join(pagesDir, 'agents.html'), agentsHtml);
      console.log('✅ Copied agents.html to pages directory (fallback)');
    } catch (fallbackError) {
      console.error('❌ Could not copy agents.html:', fallbackError.message);
    }
  }
  
  console.log('✅ Static pages built successfully!');
  console.log(`📁 Pages directory: ${pagesDir}`);
  console.log('🚀 Ready for GitHub Pages deployment');
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildPages().catch(console.error);
}
