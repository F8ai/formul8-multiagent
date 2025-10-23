/**
 * SyzyChat - Universal Chat Library
 * 
 * A comprehensive, production-ready chat library with:
 * - Markdown & emoji rendering
 * - Pluggable message formatters
 * - Authentication token support
 * - Robust error handling with retry logic
 * - DOM rendering with auto-inject
 * - Theme management
 * - Secure configuration management
 * 
 * @version 2.5.0
 * @author Syzygyx (enhanced for universal use)
 * @license MIT
 */

(function(global) {
    'use strict';

    /**
     * ConfigManager - Secure configuration management
     */
    class ConfigManager {
        constructor() {
            this.sensitiveKeys = new Set([
                'openRouterApiKey',
                'apiKey',
                'api_key',
                'secret',
                'password',
                'token',
                'auth',
                'credential',
                'authToken'
            ]);
        }

        get(key, options = {}, envPrefix = 'SYZYCHAT_') {
            if (options[key] !== undefined && options[key] !== '') {
                return this.validate(key, options[key]);
            }

            if (typeof process !== 'undefined' && process.env) {
                const envKey = envPrefix + key.replace(/([A-Z])/g, '_$1').toUpperCase();
                const envValue = process.env[envKey];
                if (envValue !== undefined && envValue !== '') {
                    return this.validate(key, envValue);
                }
            }

            return options[key] || '';
        }

        validate(key, value) {
            if (this.sensitiveKeys.has(key)) {
                if (typeof value !== 'string' || value.length === 0) {
                    console.warn(`⚠️ ${key} is empty or invalid`);
                    return '';
                }
            }
            return value;
        }
    }

    /**
     * Logger utility
     */
    class Logger {
        constructor(prefix = 'SyzyChat') {
            this.prefix = prefix;
            this.debug = false;
        }

        log(...args) {
            if (this.debug) {
                console.log(`[${this.prefix}]`, ...args);
            }
        }

        info(...args) {
            console.info(`[${this.prefix}] ℹ️`, ...args);
        }

        warn(...args) {
            console.warn(`[${this.prefix}] ⚠️`, ...args);
        }

        error(...args) {
            console.error(`[${this.prefix}] ❌`, ...args);
        }

        success(...args) {
            console.log(`[${this.prefix}] ✅`, ...args);
        }
    }

    /**
     * Default Message Formatter - Handles markdown and basic formatting
     */
    class DefaultMessageFormatter {
        static escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /**
         * Format assistant message with markdown
         */
        static formatAssistantMessage(text, options = {}) {
            return this.markdownToHtml(text);
        }

        /**
         * Format user message
         */
        static formatUserMessage(text) {
            return this.escapeHtml(text).replace(/\n/g, '<br>');
        }

        /**
         * Markdown to HTML conversion
         */
        static markdownToHtml(text) {
            // Code blocks with syntax highlighting
            text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                return `<pre><code class="language-${lang || 'text'}">${this.escapeHtml(code)}</code></pre>`;
            });
            
            // Inline code
            text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
            
            // Bold, italic, bold+italic
            text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
            text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
            text = text.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
            text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
            text = text.replace(/_(.+?)_/g, '<em>$1</em>');
            
            // Links
            text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
            
            // Headers
            text = text.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
            text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
            text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
            text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');
            
            // Blockquotes
            text = text.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
            
            // Horizontal rules
            text = text.replace(/^---$/gm, '<hr>');
            text = text.replace(/^\*\*\*$/gm, '<hr>');
            
            // Lists (simple implementation)
            text = text.replace(/^- (.+)$/gm, '<li>$1</li>');
            text = text.replace(/^• (.+)$/gm, '<li>$1</li>');
            text = text.replace(/^\* (.+)$/gm, '<li>$1</li>');
            text = text.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');
            
            // Wrap consecutive <li> tags in <ul>
            text = text.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
                return `<ul>${match}</ul>`;
            });
            
            // Line breaks
            text = text.replace(/\n/g, '<br>');
            
            return text;
        }
    }

    /**
     * SyzyChat - Main chat library class
     */
    class SyzyChat {
        constructor(options = {}) {
            this.configManager = new ConfigManager();
            this.logger = new Logger('SyzyChat');
            this.logger.log('Initializing SyzyChat...');

            try {
                // Theme management
                this.currentTheme = localStorage.getItem('syzychat-theme') || 'dark';
                localStorage.setItem('syzychat-theme', this.currentTheme);

                // Core configuration
                this.container = options.container || null;
                this.messagesContainer = options.messagesContainer || null;
                this.inputElement = options.inputElement || null;
                this.sendButton = options.sendButton || null;
                this.backendUrl = options.backendUrl || '/api/chat';
                this.authToken = this.configManager.get('authToken', options);

                // Pluggable formatter
                this.formatter = options.formatter || DefaultMessageFormatter;

                // Feature flags
                this.features = {
                    enableEmoji: options.enableEmoji !== false,
                    enableMarkdown: options.enableMarkdown !== false,
                    enableHTML: options.enableHTML !== false,
                    enableDarkMode: options.enableDarkMode !== false,
                    darkMode: options.darkMode !== false
                };

                // Configuration options
                this.config = {
                    enableTypingIndicator: true,
                    tier: 'free',
                    username: 'guest',
                    maxMessageLength: 4000,
                    responseTimeout: 30000,
                    retryAttempts: 3,
                    retryDelay: 1000,
                    autoRender: true,
                    formatMessages: true,
                    ...options.config
                };

                // Event handlers
                this.onMessage = options.onMessage || null;
                this.onAgentChange = options.onAgentChange || null;
                this.onError = options.onError || null;
                this.onTypingStart = options.onTypingStart || null;
                this.onTypingEnd = options.onTypingEnd || null;
                this.onBeforeSend = options.onBeforeSend || null;
                this.onAfterReceive = options.onAfterReceive || null;

                // Internal state
                this.messages = [];
                this.currentAgent = null;
                this.isTyping = false;
                this.isInitialized = false;
                this.containerElement = null;
                this.messagesElement = null;
                this.inputEl = null;
                this.sendBtn = null;
                this.requestAbortController = null;
                this.typingIndicatorElement = null;

                this.logger.success('SyzyChat configuration loaded');
            } catch (error) {
                this.logger.error('Failed to initialize:', error);
                throw error;
            }
        }

        /**
         * Initialize the chat interface
         */
        init() {
            try {
                this.logger.log('Initializing chat interface...');

                // Get DOM elements
                if (this.container) {
                    this.containerElement = typeof this.container === 'string' 
                        ? document.querySelector(this.container) 
                        : this.container;
                }

                if (this.messagesContainer) {
                    this.messagesElement = typeof this.messagesContainer === 'string'
                        ? document.querySelector(this.messagesContainer)
                        : this.messagesContainer;
                }

                if (this.inputElement) {
                    this.inputEl = typeof this.inputElement === 'string'
                        ? document.querySelector(this.inputElement)
                        : this.inputElement;
                }

                if (this.sendButton) {
                    this.sendBtn = typeof this.sendButton === 'string'
                        ? document.querySelector(this.sendButton)
                        : this.sendButton;
                }

                // Bind events
                if (this.inputEl && this.sendBtn) {
                    this.bindEvents();
                }

                // Create typing indicator
                if (this.messagesElement && this.config.enableTypingIndicator) {
                    this.createTypingIndicator();
                }

                this.isInitialized = true;
                this.logger.success('SyzyChat initialized successfully');
                return this;
            } catch (error) {
                this.logger.error('Initialization failed:', error);
                if (this.onError) this.onError(error);
                throw error;
            }
        }

        /**
         * Bind input and button events
         */
        bindEvents() {
            if (this.sendBtn) {
                this.sendBtn.addEventListener('click', () => this.handleSend());
            }

            if (this.inputEl) {
                this.inputEl.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.handleSend();
                    }
                });
            }

            this.logger.log('Events bound');
        }

        /**
         * Handle send button click
         */
        async handleSend() {
            if (!this.inputEl) return;

            const message = this.inputEl.value.trim();
            if (!message) return;

            try {
                this.inputEl.value = '';
                await this.sendMessage(message);
            } catch (error) {
                this.logger.error('Failed to send message:', error);
            }
        }

        /**
         * Create typing indicator element
         */
        createTypingIndicator() {
            this.typingIndicatorElement = document.createElement('div');
            this.typingIndicatorElement.className = 'typing-indicator';
            this.typingIndicatorElement.innerHTML = `
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            `;
            this.typingIndicatorElement.style.display = 'none';
        }

        /**
         * Render a message to the DOM
         */
        renderMessage(message, type = 'assistant', name = null) {
            if (!this.messagesElement || !this.config.autoRender) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            
            const displayName = name || (type === 'user' ? this.config.username : 'Assistant');
            const initial = displayName.charAt(0).toUpperCase();
            
            // Format content using pluggable formatter
            let formattedContent = message;
            if (this.config.formatMessages && this.formatter) {
                if (type === 'assistant' && this.features.enableMarkdown) {
                    formattedContent = this.formatter.formatAssistantMessage(message);
                } else {
                    formattedContent = this.formatter.formatUserMessage(message);
                }
            } else if (this.features.enableMarkdown) {
                formattedContent = DefaultMessageFormatter.markdownToHtml(message);
            }
            
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-avatar">${initial}</div>
                    <div class="message-text">${formattedContent}</div>
                </div>
            `;
            
            this.messagesElement.appendChild(messageDiv);
            this.scrollToBottom();
        }

        /**
         * Scroll messages to bottom
         */
        scrollToBottom() {
            if (this.messagesElement) {
                this.messagesElement.scrollTop = this.messagesElement.scrollHeight;
            }
        }

        /**
         * Send a message to the backend
         */
        async sendMessage(message, options = {}) {
            if (!this.isInitialized) {
                throw new Error('SyzyChat is not initialized. Call init() first.');
            }

            // Validate message
            const trimmedMessage = message.trim();
            if (!trimmedMessage || trimmedMessage.length === 0) {
                throw new Error('Message cannot be empty');
            }

            if (trimmedMessage.length > this.config.maxMessageLength) {
                throw new Error(`Message too long. Maximum: ${this.config.maxMessageLength}`);
            }

            this.logger.log('Sending message:', trimmedMessage);

            // Before send hook
            if (this.onBeforeSend) {
                this.onBeforeSend(trimmedMessage);
            }

            // Render user message
            if (this.config.autoRender) {
                this.renderMessage(trimmedMessage, 'user', this.config.username);
            }

            // Add to history
            const userMessage = {
                role: 'user',
                content: trimmedMessage,
                timestamp: new Date().toISOString()
            };
            this.messages.push(userMessage);

            if (this.onMessage) {
                this.onMessage(userMessage);
            }

            // Show typing indicator
            this.startTyping();

            // Retry logic
            let lastError = null;
            for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
                try {
                    this.logger.log(`Attempt ${attempt}/${this.config.retryAttempts}`);
                    
                    const response = await this.makeRequest(trimmedMessage, options);
                    
                    this.stopTyping();

                    // Render assistant message
                    if (this.config.autoRender && response.response) {
                        this.renderMessage(response.response, 'assistant', response.agent || null);
                    }

                    // Add to history
                    const assistantMessage = {
                        role: 'assistant',
                        content: response.response,
                        agent: response.agent,
                        timestamp: response.timestamp || new Date().toISOString(),
                        usage: response.usage
                    };
                    this.messages.push(assistantMessage);

                    // Update current agent
                    if (response.agent && response.agent !== this.currentAgent) {
                        this.currentAgent = response.agent;
                        if (this.onAgentChange) {
                            this.onAgentChange(response.agent);
                        }
                    }

                    if (this.onMessage) {
                        this.onMessage(assistantMessage);
                    }

                    if (this.onAfterReceive) {
                        this.onAfterReceive(response);
                    }

                    this.logger.success('Message sent successfully');
                    return response;

                } catch (error) {
                    lastError = error;
                    this.logger.warn(`Attempt ${attempt} failed:`, error.message);

                    if (attempt < this.config.retryAttempts) {
                        await this.sleep(this.config.retryDelay * attempt);
                    }
                }
            }

            // All attempts failed
            this.stopTyping();
            this.logger.error('All retry attempts failed:', lastError);
            
            if (this.onError) {
                this.onError(lastError);
            }

            throw lastError;
        }

        /**
         * Make HTTP request to backend
         */
        async makeRequest(message, options = {}) {
            this.logger.log('Making request to:', this.backendUrl);

            this.requestAbortController = new AbortController();
            const timeoutId = setTimeout(() => {
                this.requestAbortController.abort();
            }, this.config.responseTimeout);

            try {
                const requestBody = {
                    message: message,
                    tier: this.config.tier,
                    username: this.config.username,
                    ...options
                };

                this.logger.log('Request body:', requestBody);

                const headers = {
                    'Content-Type': 'application/json'
                };

                if (this.authToken) {
                    headers['Authorization'] = `Bearer ${this.authToken}`;
                }

                const response = await fetch(this.backendUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestBody),
                    signal: this.requestAbortController.signal
                });

                clearTimeout(timeoutId);

                this.logger.log('Response status:', response.status);

                if (!response.ok) {
                    let errorMessage = `HTTP error! status: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                        this.logger.error('Error response:', errorData);
                    } catch (parseError) {
                        this.logger.warn('Could not parse error response');
                    }

                    const error = new Error(errorMessage);
                    error.status = response.status;
                    throw error;
                }

                const data = await response.json();
                this.logger.log('Response data:', data);

                if (data.success === false) {
                    throw new Error(data.message || 'Request failed');
                }

                return data;

            } catch (error) {
                clearTimeout(timeoutId);

                if (error.name === 'AbortError') {
                    throw new Error(`Request timed out after ${this.config.responseTimeout}ms`);
                }

                this.logger.error('Request failed:', error);
                throw error;
            }
        }

        /**
         * Start typing indicator
         */
        startTyping() {
            if (this.isTyping) return;
            
            this.isTyping = true;
            this.logger.log('Typing indicator started');
            
            if (this.typingIndicatorElement && this.messagesElement) {
                this.typingIndicatorElement.style.display = 'flex';
                this.messagesElement.appendChild(this.typingIndicatorElement);
                this.scrollToBottom();
            }
            
            if (this.onTypingStart) {
                this.onTypingStart();
            }
        }

        /**
         * Stop typing indicator
         */
        stopTyping() {
            if (!this.isTyping) return;
            
            this.isTyping = false;
            this.logger.log('Typing indicator stopped');
            
            if (this.typingIndicatorElement && this.typingIndicatorElement.parentNode) {
                this.typingIndicatorElement.style.display = 'none';
                this.typingIndicatorElement.parentNode.removeChild(this.typingIndicatorElement);
            }
            
            if (this.onTypingEnd) {
                this.onTypingEnd();
            }
        }

        /**
         * Clear chat history
         */
        clearHistory() {
            this.logger.log('Clearing chat history');
            this.messages = [];
            this.currentAgent = null;
            
            if (this.messagesElement && this.config.autoRender) {
                this.messagesElement.innerHTML = '';
            }
        }

        /**
         * Get chat history
         */
        getHistory() {
            return [...this.messages];
        }

        /**
         * Update configuration
         */
        updateConfig(newConfig) {
            this.logger.log('Updating configuration:', newConfig);
            this.config = { ...this.config, ...newConfig };
            this.logger.success('Configuration updated');
        }

        /**
         * Get current configuration
         */
        getConfig() {
            return { ...this.config };
        }

        /**
         * Set authentication token
         */
        setAuthToken(token) {
            this.authToken = token;
            this.logger.log('Auth token updated');
        }

        /**
         * Set custom formatter
         */
        setFormatter(formatter) {
            this.formatter = formatter;
            this.logger.log('Custom formatter set');
        }

        /**
         * Cancel ongoing request
         */
        cancelRequest() {
            if (this.requestAbortController) {
                this.logger.log('Cancelling request');
                this.requestAbortController.abort();
                this.stopTyping();
            }
        }

        /**
         * Destroy the chat instance
         */
        destroy() {
            this.logger.log('Destroying SyzyChat instance');
            this.cancelRequest();
            this.clearHistory();
            this.isInitialized = false;
            this.containerElement = null;
            this.messagesElement = null;
            this.inputEl = null;
            this.sendBtn = null;
            this.logger.success('SyzyChat destroyed');
        }

        /**
         * Sleep utility for retries
         */
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        /**
         * Get status information
         */
        getStatus() {
            return {
                isInitialized: this.isInitialized,
                isTyping: this.isTyping,
                currentAgent: this.currentAgent,
                messageCount: this.messages.length,
                theme: this.currentTheme,
                features: this.features,
                config: this.getConfig(),
                authToken: this.authToken ? 'Set' : 'Not set'
            };
        }

        /**
         * Enable/disable debug mode
         */
        setDebugMode(enabled) {
            this.logger.debug = enabled;
            this.logger.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    // Export to global scope
    global.SyzyChat = SyzyChat;
    global.DefaultMessageFormatter = DefaultMessageFormatter;
    global.ConfigManager = ConfigManager;
    global.Logger = Logger;

    // Log library loaded
    console.log('%c[SyzyChat] Library Loaded Successfully', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
    console.log('%c[SyzyChat] Version 2.5.0 - Universal Edition', 'color: #2196F3;');
    console.log('%c[SyzyChat] Markdown ✓ | Emoji ✓ | Auth ✓ | Pluggable Formatters ✓', 'color: #19c37d;');

})(typeof window !== 'undefined' ? window : this);
