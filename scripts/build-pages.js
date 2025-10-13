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
  
  console.log('✅ Static pages built successfully!');
  console.log(`📁 Pages directory: ${pagesDir}`);
  console.log('🚀 Ready for GitHub Pages deployment');
}

// Run if this file is executed directly
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  buildPages().catch(console.error);
}
