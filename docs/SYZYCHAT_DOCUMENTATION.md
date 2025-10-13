# SyzyChat Local Implementation Documentation

## Overview

This document provides comprehensive documentation for the local SyzyChat implementation created to resolve internal server errors and provide robust chat functionality for the Formul8 Multiagent System.

**Version:** 1.0.0  
**Author:** Formul8 AI  
**Date:** October 2025

## Purpose

The SyzyChat library was created to:
1. Replace the external SyzyChat library that was causing loading issues
2. Provide robust error handling and debugging capabilities
3. Implement retry logic for network failures
4. Provide detailed logging for troubleshooting
5. Support the Formul8 multiagent chat system with tier-based features

## Architecture

### Core Components

1. **Logger Class**: Comprehensive logging utility with debug, info, warn, error, and success levels
2. **SyzyChat Class**: Main chat interface with message handling, API communication, and state management
3. **Error Handling**: Multi-level error handling with retries and detailed error messages
4. **Event System**: Callbacks for messages, agent changes, errors, and typing indicators

### Key Features

- ✅ Robust error handling with retry logic
- ✅ Configurable timeout and retry attempts
- ✅ Typing indicators
- ✅ Message history management
- ✅ Agent routing support
- ✅ Tier-based access control
- ✅ Request cancellation
- ✅ Debug mode with detailed logging
- ✅ Multiple event callbacks

## Installation

### Local Installation

The `syzychat.js` file is located in the `/docs` directory:

```
/docs/syzychat.js
```

### Usage in HTML

Replace the external SyzyChat script reference:

```html
<!-- Old (external) -->
<script src="https://syzygyx.github.io/syzychat/syzychat.js"></script>

<!-- New (local) -->
<script src="./syzychat.js"></script>
```

## API Reference

### Constructor

```javascript
const chat = new SyzyChat(options);
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | string\|Element | '#chat-container' | Container element for chat |
| `backendUrl` | string | 'https://f8.syzygyx.com/api/chat' | Backend API endpoint |
| `openRouterApiKey` | string | '' | OpenRouter API key (optional) |
| `googleSheetsApiKey` | string | '' | Google Sheets API key (optional) |
| `config` | object | See below | Configuration options |
| `onMessage` | function | null | Message event callback |
| `onAgentChange` | function | null | Agent change callback |
| `onError` | function | null | Error callback |
| `onTypingStart` | function | null | Typing start callback |
| `onTypingEnd` | function | null | Typing end callback |

#### Configuration Object

| Config Key | Type | Default | Description |
|------------|------|---------|-------------|
| `enableTypingIndicator` | boolean | true | Show typing indicators |
| `enableAgentRouting` | boolean | true | Enable agent routing |
| `enableAdDelivery` | boolean | false | Enable ad delivery |
| `tier` | string | 'free' | User tier level |
| `maxMessageLength` | number | 1000 | Maximum message length |
| `responseTimeout` | number | 30000 | Request timeout (ms) |
| `theme` | string | 'default' | UI theme |
| `showAgentIndicators` | boolean | true | Show agent indicators |
| `enableMultiTurn` | boolean | true | Enable multi-turn conversations |
| `retryAttempts` | number | 3 | Number of retry attempts |
| `retryDelay` | number | 1000 | Base delay between retries (ms) |

### Methods

#### init()

Initialize the chat interface.

```javascript
chat.init();
```

**Returns:** `this` (for chaining)

**Throws:** Error if container not found or initialization fails

---

#### sendMessage(message, options)

Send a message to the backend.

```javascript
const response = await chat.sendMessage('Hello!', {
    agent: 'compliance',
    user_id: 'user123',
    context: {}
});
```

**Parameters:**
- `message` (string, required): Message text to send
- `options` (object, optional): Additional options
  - `agent` (string): Specific agent to use
  - `user_id` (string): User identifier
  - `context` (object): Additional context

**Returns:** Promise<object> with response data

**Throws:** Error if validation fails or request fails after retries

---

#### clearHistory()

Clear chat message history.

```javascript
chat.clearHistory();
```

---

#### getHistory()

Get chat message history.

```javascript
const messages = chat.getHistory();
```

**Returns:** Array of message objects

---

#### updateConfig(newConfig)

Update configuration options.

```javascript
chat.updateConfig({
    tier: 'premium',
    maxMessageLength: 2000
});
```

---

#### getConfig()

Get current configuration.

```javascript
const config = chat.getConfig();
```

**Returns:** Configuration object

---

#### getStatus()

Get current status information.

```javascript
const status = chat.getStatus();
// {
//   isInitialized: true,
//   isTyping: false,
//   currentAgent: 'f8_agent',
//   messageCount: 5,
//   config: {...}
// }
```

---

#### cancelRequest()

Cancel ongoing request.

```javascript
chat.cancelRequest();
```

---

#### setDebugMode(enabled)

Enable or disable debug mode.

```javascript
chat.setDebugMode(true);
```

---

#### destroy()

Destroy the chat instance and clean up resources.

```javascript
chat.destroy();
```

## Usage Examples

### Basic Usage

```javascript
// Initialize chat
const chat = new SyzyChat({
    container: '#chat-container',
    backendUrl: 'https://f8.syzygyx.com/api/chat'
});

chat.init();

// Send a message
async function sendMessage(text) {
    try {
        const response = await chat.sendMessage(text);
        console.log('Response:', response);
    } catch (error) {
        console.error('Error:', error);
    }
}
```

### With Event Handlers

```javascript
const chat = new SyzyChat({
    container: '#chat-container',
    backendUrl: 'https://f8.syzygyx.com/api/chat',
    config: {
        tier: 'free',
        enableTypingIndicator: true
    },
    onMessage: (message) => {
        console.log('New message:', message);
        // Update UI with message
    },
    onAgentChange: (agent) => {
        console.log('Agent changed to:', agent);
    },
    onError: (error) => {
        console.error('Chat error:', error);
        alert(`Error: ${error.message}`);
    },
    onTypingStart: () => {
        document.getElementById('typing').style.display = 'block';
    },
    onTypingEnd: () => {
        document.getElementById('typing').style.display = 'none';
    }
});

chat.init();
```

### With Custom Configuration

```javascript
const chat = new SyzyChat({
    container: document.getElementById('chat'),
    backendUrl: 'https://f8.syzygyx.com/api/chat',
    config: {
        tier: 'enterprise',
        maxMessageLength: 5000,
        responseTimeout: 60000,
        retryAttempts: 5,
        retryDelay: 2000,
        enableAgentRouting: true,
        theme: 'formul8-dark'
    }
});

chat.init();
```

## Error Handling

### Error Types

1. **Validation Errors**: Invalid input (empty message, too long, etc.)
2. **Network Errors**: Connection failures, timeouts
3. **HTTP Errors**: 4xx, 5xx status codes
4. **Backend Errors**: API returned error response

### Retry Logic

The library implements exponential backoff retry logic:

- Default retry attempts: 3
- Default retry delay: 1000ms (increases per attempt)
- Retry delay formula: `baseDelay * attemptNumber`

Example with 3 attempts:
- Attempt 1: Immediate
- Attempt 2: After 1000ms
- Attempt 3: After 2000ms

### Error Callback

```javascript
onError: (error) => {
    console.error('Error occurred:', error);
    
    // Error properties
    console.log('Message:', error.message);
    console.log('Status:', error.status); // HTTP status if applicable
    console.log('Details:', error.details); // Additional error details
}
```

## Debugging

### Enable Debug Mode

```javascript
// At initialization
const chat = new SyzyChat({
    container: '#chat-container',
    backendUrl: 'https://f8.syzygyx.com/api/chat'
});

// After initialization
chat.setDebugMode(true);
```

### Debug Output

With debug mode enabled, the library logs:
- Initialization steps
- Configuration details
- Request/response data
- Error details
- State changes

### Browser Console

Open browser console (F12) to view logs:
- `[SyzyChat]` - General logs
- `[SyzyChat] ℹ️` - Info messages
- `[SyzyChat] ⚠️` - Warnings
- `[SyzyChat] ❌` - Errors
- `[SyzyChat] ✅` - Success messages

## Testing

### Test Page

A test page is included: `/docs/test-syzychat-local.html`

Features:
- Visual chat interface
- Test controls
- Real-time debug logs
- Status monitoring
- Message history

### Manual Testing Steps

1. Open `test-syzychat-local.html` in a browser
2. Verify initialization succeeds
3. Send test messages
4. Check response handling
5. Verify error handling
6. Test retry logic (disconnect network)

### Integration Testing

```javascript
// Test initialization
try {
    const chat = new SyzyChat({...});
    chat.init();
    console.log('✅ Initialization successful');
} catch (error) {
    console.error('❌ Initialization failed:', error);
}

// Test message sending
try {
    const response = await chat.sendMessage('test');
    console.log('✅ Message sent successfully');
} catch (error) {
    console.error('❌ Message send failed:', error);
}

// Test error handling
try {
    await chat.sendMessage(''); // Should fail
} catch (error) {
    console.log('✅ Validation working');
}
```

## Backend API Integration

### Expected Request Format

```json
{
    "message": "User message text",
    "tier": "free",
    "agent": "optional-agent-id",
    "user_id": "user-identifier",
    "context": {}
}
```

### Expected Response Format

#### Success Response

```json
{
    "success": true,
    "response": "Agent response text",
    "agent": "agent-id",
    "usage": {
        "total_tokens": 150,
        "cost": 0,
        "model": "formul8-multiagent"
    },
    "timestamp": "2025-10-12T21:00:00.000Z"
}
```

#### Error Response

```json
{
    "success": false,
    "message": "Error description",
    "error": "Detailed error message"
}
```

## Troubleshooting

### Common Issues

#### 1. SyzyChat is not defined

**Cause:** Script not loaded or loaded after usage

**Solution:**
```html
<!-- Ensure script is loaded before usage -->
<script src="./syzychat.js"></script>
<script>
    // Use SyzyChat here
    const chat = new SyzyChat({...});
</script>
```

#### 2. Container element not found

**Cause:** Container doesn't exist or wrong selector

**Solution:**
```javascript
// Make sure container exists
const container = document.querySelector('#chat-container');
if (!container) {
    console.error('Container not found!');
}

// Use correct selector
const chat = new SyzyChat({
    container: '#chat-container' // ID selector
    // or
    container: '.chat-container' // Class selector
    // or
    container: document.getElementById('chat-container') // Element
});
```

#### 3. Network errors / Request timeout

**Cause:** Backend not responding or network issues

**Solution:**
```javascript
// Increase timeout and retries
const chat = new SyzyChat({
    container: '#chat-container',
    backendUrl: 'https://f8.syzygyx.com/api/chat',
    config: {
        responseTimeout: 60000, // 60 seconds
        retryAttempts: 5,
        retryDelay: 2000
    }
});
```

#### 4. CORS errors

**Cause:** Backend not allowing cross-origin requests

**Solution:** Ensure backend has proper CORS headers:
```javascript
// In server.ts
app.use(cors());
```

## Performance Considerations

### Message Batching

For high-volume scenarios, consider batching messages:

```javascript
const messageQueue = [];
let isSending = false;

async function queueMessage(message) {
    messageQueue.push(message);
    if (!isSending) {
        await processQueue();
    }
}

async function processQueue() {
    isSending = true;
    while (messageQueue.length > 0) {
        const message = messageQueue.shift();
        try {
            await chat.sendMessage(message);
        } catch (error) {
            console.error('Failed to send:', error);
        }
    }
    isSending = false;
}
```

### Memory Management

Clear history periodically:

```javascript
// Clear history after 100 messages
if (chat.getHistory().length > 100) {
    const recent = chat.getHistory().slice(-20);
    chat.clearHistory();
    chat.messages = recent;
}
```

## Security Considerations

1. **API Keys**: Never expose API keys in client-side code
2. **Input Validation**: Message length and content are validated
3. **XSS Prevention**: Sanitize user input before displaying
4. **HTTPS**: Always use HTTPS for backend communication
5. **Authentication**: Implement proper user authentication

## Future Enhancements

Potential improvements for future versions:

- [ ] WebSocket support for real-time communication
- [ ] Message encryption
- [ ] Offline mode with queue
- [ ] File upload support
- [ ] Rich media messages
- [ ] Message reactions
- [ ] Read receipts
- [ ] Push notifications
- [ ] Multi-language support
- [ ] Voice input/output

## Support

For issues or questions:

1. Check this documentation
2. Review debug logs
3. Test with `test-syzychat-local.html`
4. Check browser console for errors
5. Review network requests in DevTools

## Changelog

### Version 1.0.0 (October 2025)

- Initial release
- Core chat functionality
- Error handling with retries
- Event system
- Debug logging
- Message history management
- Tier-based support
- Agent routing
- Comprehensive documentation

## License

MIT License - Formul8 AI
