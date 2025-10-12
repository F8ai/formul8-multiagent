/**
 * SyzyChat - Local Chat Library for Formul8 Multiagent System
 * 
 * This is a local implementation of the SyzyChat library with robust error handling
 * and debugging capabilities to resolve internal server errors.
 * 
 * @version 1.0.0
 * @author Formul8 AI
 */

(function(global) {
    'use strict';

    /**
     * Logger utility for debugging
     */
    class Logger {
        constructor(prefix = 'SyzyChat') {
            this.prefix = prefix;
            this.debug = true; // Enable debug mode by default
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
     * Main SyzyChat class
     */
    class SyzyChat {
        constructor(options = {}) {
            this.logger = new Logger('SyzyChat');
            this.logger.log('Initializing SyzyChat with options:', options);

            try {
                // Validate required options
                this.validateOptions(options);

                // Core configuration
                this.container = options.container || '#chat-container';
                this.backendUrl = options.backendUrl || 'https://f8.syzygyx.com/api/chat';
                this.openRouterApiKey = options.openRouterApiKey || '';
                this.googleSheetsApiKey = options.googleSheetsApiKey || '';

                // Configuration options
                this.config = {
                    enableTypingIndicator: true,
                    enableAgentRouting: true,
                    enableAdDelivery: false,
                    tier: 'free',
                    maxMessageLength: 1000,
                    responseTimeout: 30000,
                    theme: 'default',
                    showAgentIndicators: true,
                    enableMultiTurn: true,
                    retryAttempts: 3,
                    retryDelay: 1000,
                    ...options.config
                };

                // Event handlers
                this.onMessage = options.onMessage || null;
                this.onAgentChange = options.onAgentChange || null;
                this.onError = options.onError || null;
                this.onTypingStart = options.onTypingStart || null;
                this.onTypingEnd = options.onTypingEnd || null;

                // Internal state
                this.messages = [];
                this.currentAgent = null;
                this.isTyping = false;
                this.isInitialized = false;
                this.containerElement = null;
                this.requestAbortController = null;

                this.logger.success('SyzyChat configuration loaded successfully');
            } catch (error) {
                this.logger.error('Failed to initialize SyzyChat:', error);
                throw error;
            }
        }

        /**
         * Validate required options
         */
        validateOptions(options) {
            if (!options.container || !options.backendUrl) {
                throw new Error('Missing required options: both container and backendUrl are required');
            }
        }

        /**
         * Initialize the chat interface
         */
        init() {
            try {
                this.logger.log('Initializing chat interface...');

                // Get container element
                if (typeof this.container === 'string') {
                    this.containerElement = document.querySelector(this.container);
                } else {
                    this.containerElement = this.container;
                }

                if (!this.containerElement) {
                    throw new Error(`Container element not found: ${this.container}`);
                }

                this.logger.log('Container element found:', this.containerElement);

                // Mark as initialized
                this.isInitialized = true;
                this.logger.success('SyzyChat initialized successfully');

                return this;
            } catch (error) {
                this.logger.error('Initialization failed:', error);
                if (this.onError) {
                    this.onError(error);
                }
                throw error;
            }
        }

        /**
         * Send a message to the backend
         */
        async sendMessage(message, options = {}) {
            if (!this.isInitialized) {
                const error = new Error('SyzyChat is not initialized. Call init() first.');
                this.logger.error(error.message);
                if (this.onError) {
                    this.onError(error);
                }
                throw error;
            }

            // Validate message
            if (!message || typeof message !== 'string') {
                const error = new Error('Invalid message: must be a non-empty string');
                this.logger.error(error.message);
                if (this.onError) {
                    this.onError(error);
                }
                throw error;
            }

            const trimmedMessage = message.trim();
            if (trimmedMessage.length === 0) {
                const error = new Error('Message cannot be empty');
                this.logger.error(error.message);
                if (this.onError) {
                    this.onError(error);
                }
                throw error;
            }

            if (trimmedMessage.length > this.config.maxMessageLength) {
                const error = new Error(`Message too long. Maximum length: ${this.config.maxMessageLength}`);
                this.logger.error(error.message);
                if (this.onError) {
                    this.onError(error);
                }
                throw error;
            }

            this.logger.log('Sending message:', trimmedMessage);

            // Add user message to history
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

            // Attempt to send message with retries
            let lastError = null;
            for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
                try {
                    this.logger.log(`Attempt ${attempt} of ${this.config.retryAttempts}`);
                    
                    const response = await this.makeRequest(trimmedMessage, options);
                    
                    // Stop typing indicator
                    this.stopTyping();

                    // Add assistant message to history
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

                    this.logger.success('Message sent and response received');
                    return response;

                } catch (error) {
                    lastError = error;
                    this.logger.warn(`Attempt ${attempt} failed:`, error.message);

                    if (attempt < this.config.retryAttempts) {
                        // Wait before retrying
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
            this.logger.log('Making request to backend:', this.backendUrl);

            // Create abort controller for timeout
            this.requestAbortController = new AbortController();
            const timeoutId = setTimeout(() => {
                this.requestAbortController.abort();
            }, this.config.responseTimeout);

            try {
                const requestBody = {
                    message: message,
                    tier: this.config.tier,
                    agent: options.agent || undefined,
                    user_id: options.user_id || 'web-user',
                    context: options.context || undefined
                };

                this.logger.log('Request body:', requestBody);

                const response = await fetch(this.backendUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(this.openRouterApiKey && { 'X-OpenRouter-API-Key': this.openRouterApiKey })
                    },
                    body: JSON.stringify(requestBody),
                    signal: this.requestAbortController.signal
                });

                clearTimeout(timeoutId);

                this.logger.log('Response status:', response.status);

                if (!response.ok) {
                    let errorMessage = `HTTP error! status: ${response.status}`;
                    let errorDetails = null;

                    try {
                        const errorData = await response.json();
                        errorDetails = errorData;
                        errorMessage = errorData.message || errorMessage;
                        this.logger.error('Error response data:', errorData);
                    } catch (parseError) {
                        this.logger.warn('Could not parse error response as JSON');
                    }

                    const error = new Error(errorMessage);
                    error.status = response.status;
                    error.details = errorDetails;
                    throw error;
                }

                const data = await response.json();
                this.logger.log('Response data:', data);

                if (!data.success) {
                    const error = new Error(data.message || 'Request failed');
                    error.details = data;
                    throw error;
                }

                return data;

            } catch (error) {
                clearTimeout(timeoutId);

                if (error.name === 'AbortError') {
                    const timeoutError = new Error(`Request timed out after ${this.config.responseTimeout}ms`);
                    this.logger.error('Request timeout:', timeoutError.message);
                    throw timeoutError;
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
            this.config = {
                ...this.config,
                ...newConfig
            };
            this.logger.success('Configuration updated');
        }

        /**
         * Get current configuration
         */
        getConfig() {
            return { ...this.config };
        }

        /**
         * Cancel ongoing request
         */
        cancelRequest() {
            if (this.requestAbortController) {
                this.logger.log('Cancelling ongoing request');
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
            this.logger.success('SyzyChat instance destroyed');
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
                config: this.getConfig()
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

    // Log that library is loaded
    console.log('%c[SyzyChat] Library loaded successfully', 'color: #4CAF50; font-weight: bold;');
    console.log('%c[SyzyChat] Version 1.0.0 - Local Implementation', 'color: #2196F3;');

})(typeof window !== 'undefined' ? window : this);
