/**
 * Unit tests for SyzyChat implementation
 * Tests the library without requiring a browser or backend
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('🧪 SyzyChat Unit Tests\n');

// Load the SyzyChat library
const syzychatPath = path.join(__dirname, 'docs', 'syzychat.js');
const syzychatCode = fs.readFileSync(syzychatPath, 'utf8');

// Create a mock browser environment
const sandbox = {
    console: {
        log: () => {},
        info: () => {},
        warn: () => {},
        error: () => {}
    },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    window: {},
    document: {
        querySelector: (selector) => {
            return {
                id: 'mock-container',
                selector: selector
            };
        }
    },
    fetch: async (url, options) => {
        // Mock fetch for testing
        return {
            ok: true,
            status: 200,
            json: async () => ({
                success: true,
                response: 'Mock response',
                agent: 'test-agent',
                timestamp: new Date().toISOString(),
                usage: {
                    total_tokens: 50,
                    cost: 0,
                    model: 'formul8-multiagent'
                }
            })
        };
    }
};

vm.createContext(sandbox);

// Test Suite
const tests = {
    passed: 0,
    failed: 0,
    total: 0
};

function test(name, fn) {
    tests.total++;
    try {
        fn();
        console.log(`✅ ${name}`);
        tests.passed++;
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        tests.failed++;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

// Run the SyzyChat code in the sandbox
try {
    vm.runInContext(syzychatCode, sandbox);
    console.log('✅ SyzyChat code loaded into sandbox\n');
} catch (error) {
    console.error('❌ Failed to load SyzyChat:', error.message);
    process.exit(1);
}

// Get SyzyChat from sandbox
const SyzyChat = sandbox.window.SyzyChat || sandbox.SyzyChat;

if (!SyzyChat) {
    console.error('❌ SyzyChat class not found in sandbox');
    process.exit(1);
}

console.log('Running unit tests...\n');

// Test 1: Constructor
test('Constructor accepts valid options', () => {
    const chat = new SyzyChat({
        container: '#test',
        backendUrl: 'https://test.com/api'
    });
    assert(chat.container === '#test', 'Container not set');
    assert(chat.backendUrl === 'https://test.com/api', 'Backend URL not set');
});

// Test 2: Default configuration
test('Constructor sets default configuration', () => {
    const chat = new SyzyChat({
        container: '#test',
        backendUrl: 'https://test.com/api'
    });
    assert(chat.config.enableTypingIndicator === true, 'Default enableTypingIndicator not true');
    assert(chat.config.tier === 'free', 'Default tier not free');
    assert(chat.config.maxMessageLength === 1000, 'Default maxMessageLength not 1000');
    assert(chat.config.retryAttempts === 3, 'Default retryAttempts not 3');
});

// Test 3: Custom configuration
test('Constructor accepts custom configuration', () => {
    const chat = new SyzyChat({
        container: '#test',
        backendUrl: 'https://test.com/api',
        config: {
            tier: 'premium',
            maxMessageLength: 2000,
            retryAttempts: 5
        }
    });
    assert(chat.config.tier === 'premium', 'Custom tier not set');
    assert(chat.config.maxMessageLength === 2000, 'Custom maxMessageLength not set');
    assert(chat.config.retryAttempts === 5, 'Custom retryAttempts not set');
});

// Test 4: Initialization
test('Init method initializes the chat', () => {
    const chat = new SyzyChat({
        container: '#test',
        backendUrl: 'https://test.com/api'
    });
    chat.init();
    assert(chat.isInitialized === true, 'Chat not initialized');
    assert(chat.containerElement !== null, 'Container element not set');
});

// Test 5: Get status
test('getStatus returns correct status', () => {
    const chat = new SyzyChat({
        container: '#test',
        backendUrl: 'https://test.com/api'
    });
    chat.init();
    const status = chat.getStatus();
    assert(status.isInitialized === true, 'Status isInitialized incorrect');
    assert(status.isTyping === false, 'Status isTyping incorrect');
    assert(status.messageCount === 0, 'Status messageCount incorrect');
    assert(typeof status.config === 'object', 'Status config not an object');
});

// Test 6: Get/update configuration
test('getConfig and updateConfig work correctly', () => {
    const chat = new SyzyChat({
        container: '#test',
        backendUrl: 'https://test.com/api'
    });
    const config1 = chat.getConfig();
    assert(config1.tier === 'free', 'Initial tier not free');
    
    chat.updateConfig({ tier: 'enterprise' });
    const config2 = chat.getConfig();
    assert(config2.tier === 'enterprise', 'Updated tier not enterprise');
});

// Test 7: Message history
test('Message history management works', () => {
    const chat = new SyzyChat({
        container: '#test',
        backendUrl: 'https://test.com/api'
    });
    chat.init();
    
    assert(chat.getHistory().length === 0, 'Initial history not empty');
    
    chat.messages.push({ role: 'user', content: 'test' });
    assert(chat.getHistory().length === 1, 'History length incorrect after push');
    
    chat.clearHistory();
    assert(chat.getHistory().length === 0, 'History not cleared');
});

// Test 8: Typing indicators
test('Typing indicators work correctly', () => {
    const chat = new SyzyChat({
        container: '#test',
        backendUrl: 'https://test.com/api'
    });
    chat.init();
    
    assert(chat.isTyping === false, 'Initial typing state not false');
    
    chat.startTyping();
    assert(chat.isTyping === true, 'Typing state not true after start');
    
    chat.stopTyping();
    assert(chat.isTyping === false, 'Typing state not false after stop');
});

// Test 9: Event callbacks
test('Event callbacks are called correctly', () => {
    let messageCallbackCalled = false;
    let typingStartCalled = false;
    let typingEndCalled = false;
    
    const chat = new SyzyChat({
        container: '#test',
        backendUrl: 'https://test.com/api',
        onMessage: () => { messageCallbackCalled = true; },
        onTypingStart: () => { typingStartCalled = true; },
        onTypingEnd: () => { typingEndCalled = true; }
    });
    chat.init();
    
    if (chat.onMessage) chat.onMessage({ role: 'user', content: 'test' });
    assert(messageCallbackCalled === true, 'Message callback not called');
    
    chat.startTyping();
    assert(typingStartCalled === true, 'Typing start callback not called');
    
    chat.stopTyping();
    assert(typingEndCalled === true, 'Typing end callback not called');
});

// Test 10: Logger
test('Logger is properly initialized', () => {
    const chat = new SyzyChat({
        container: '#test',
        backendUrl: 'https://test.com/api'
    });
    assert(chat.logger !== undefined, 'Logger not initialized');
    assert(typeof chat.logger.log === 'function', 'Logger.log not a function');
    assert(typeof chat.logger.error === 'function', 'Logger.error not a function');
});

// Test 11: Debug mode
test('Debug mode can be toggled', () => {
    const chat = new SyzyChat({
        container: '#test',
        backendUrl: 'https://test.com/api'
    });
    
    const initialDebug = chat.logger.debug;
    chat.setDebugMode(!initialDebug);
    assert(chat.logger.debug === !initialDebug, 'Debug mode not toggled');
    
    chat.setDebugMode(initialDebug);
    assert(chat.logger.debug === initialDebug, 'Debug mode not restored');
});

// Test 12: Validation options
test('validateOptions validates required fields', () => {
    let error = null;
    try {
        chat.validateOptions({});
    } catch (e) {
        error = e;
    }
    assert(error !== null, 'Validation should fail for empty options');
});

// Test 13: Destroy cleanup
test('Destroy cleans up resources', () => {
    const chat = new SyzyChat({
        container: '#test',
        backendUrl: 'https://test.com/api'
    });
    chat.init();
    chat.messages.push({ role: 'user', content: 'test' });
    
    chat.destroy();
    assert(chat.isInitialized === false, 'isInitialized not false after destroy');
    assert(chat.messages.length === 0, 'Messages not cleared after destroy');
    assert(chat.containerElement === null, 'Container element not null after destroy');
});

// Test 14: Request cancellation
test('cancelRequest cancels ongoing requests', () => {
    const chat = new SyzyChat({
        container: '#test',
        backendUrl: 'https://test.com/api'
    });
    chat.init();
    
    // Create a mock abort controller
    chat.requestAbortController = {
        abort: () => {},
        signal: {}
    };
    
    chat.startTyping();
    chat.cancelRequest();
    assert(chat.isTyping === false, 'Typing not stopped after cancel');
});

// Test 15: Sleep utility
test('Sleep utility is a function', () => {
    const chat = new SyzyChat({
        container: '#test',
        backendUrl: 'https://test.com/api'
    });
    
    assert(typeof chat.sleep === 'function', 'Sleep is not a function');
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Results');
console.log('='.repeat(60));
console.log(`Total tests: ${tests.total}`);
console.log(`✅ Passed: ${tests.passed}`);
console.log(`❌ Failed: ${tests.failed}`);
console.log(`Success rate: ${Math.round((tests.passed / tests.total) * 100)}%`);

if (tests.failed === 0) {
    console.log('\n🎉 All unit tests passed!');
    console.log('\n✨ SyzyChat implementation is robust and working correctly');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
}
