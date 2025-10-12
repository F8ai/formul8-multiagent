# Formul8 Multiagent Chat - Comprehensive Test Suite

This directory contains comprehensive Playwright tests for the Formul8 Multiagent Chat System deployed at `https://f8.syzygyx.com/chat`.

## 🎯 Test Coverage

### **Tier-Based Testing**
- **Free Tier**: Basic functionality with ad delivery
- **Standard Tier**: Formulation tools and basic features
- **Micro Tier**: Compliance, marketing, and patent research
- **Operator Tier**: Full agent suite with advanced features
- **Enterprise Tier**: White-label and integration capabilities
- **Admin Tier**: System management and editor-agent functionality

### **Test Categories**

#### 1. **Functional Tests**
- Agent routing and response accuracy
- Multi-turn conversations
- Error handling and edge cases
- API endpoint validation

#### 2. **Performance Tests**
- Rapid-fire question handling
- Long-form question processing
- Response time validation
- Load testing scenarios

#### 3. **UI/UX Tests**
- Responsive design across devices
- Chat interface functionality
- User experience validation
- Accessibility checks

#### 4. **Integration Tests**
- Health endpoint monitoring
- Agent API validation
- Microservice communication
- Configuration management

#### 5. **Cross-Platform Tests**
- Desktop browsers (Chrome, Firefox, Safari)
- Mobile devices (iOS, Android)
- Different screen sizes and orientations

## 🚀 Quick Start

### Prerequisites
```bash
# Install Node.js (if not already installed)
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

#### **Quick Smoke Tests**
```bash
# Run basic functionality tests
npm run test:smoke

# Or run directly
npx playwright test tests/chat-smoke.spec.js
```

#### **Comprehensive Test Suite**
```bash
# Run all comprehensive tests
npm run test:comprehensive

# Or use the test runner
node run-tests.js
```

#### **Specific Test Categories**
```bash
# Performance tests only
npm run test:performance

# Mobile tests only
npm run test:mobile

# Cross-browser tests
npx playwright test --project=chromium --project=firefox --project=webkit
```

#### **Interactive Testing**
```bash
# Run tests with UI
npm run test:ui

# Debug mode
npm run test:debug

# Headed mode (see browser)
npm run test:headed
```

## 📊 Test Scenarios

### **Agent Routing Tests**
Each tier is tested with questions designed to trigger specific agents:

```javascript
// Free Tier Examples
"What is THC?" → science agent
"How do I calculate THC dosage?" → formulation agent

// Micro Tier Examples  
"What are California cannabis compliance requirements?" → compliance agent
"How should I market my cannabis brand?" → marketing agent
"Can I patent my cannabis extraction process?" → patent agent

// Operator Tier Examples
"How do I optimize facility operations?" → operations agent
"Where can I source quality cannabis seeds?" → sourcing agent
"How do I analyze cannabis potency?" → spectra agent
```

### **Performance Benchmarks**
- **Response Time**: < 30 seconds for complex questions
- **Rapid Fire**: < 10 seconds per question average
- **Load Handling**: 5+ concurrent questions
- **Memory Usage**: Stable under load

### **Error Handling**
- Empty message submission
- Very long messages (1000+ characters)
- Nonsensical input
- Off-topic questions
- Network timeouts

## 🔧 Configuration

### **Test Configuration** (`playwright.config.js`)
```javascript
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'https://f8.syzygyx.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  // ... browser configurations
});
```

### **Environment Variables**
```bash
# CI/CD mode
CI=true

# Custom base URL
BASE_URL=https://f8.syzygyx.com

# Test timeout
TEST_TIMEOUT=60000
```

## 📈 Test Reports

### **HTML Report**
```bash
# Generate and view HTML report
npx playwright show-report
# Opens at http://localhost:9323
```

### **JSON Results**
```bash
# JSON results for CI/CD integration
cat test-results/results.json
```

### **JUnit Results**
```bash
# JUnit XML for CI/CD systems
cat test-results/results.xml
```

## 🐛 Debugging

### **Debug Mode**
```bash
# Run specific test in debug mode
npx playwright test tests/chat-comprehensive.spec.js --debug

# Debug with specific browser
npx playwright test tests/chat-comprehensive.spec.js --project=chromium --debug
```

### **Trace Viewer**
```bash
# View detailed execution traces
npx playwright show-trace test-results/trace.zip
```

### **Screenshots and Videos**
- Screenshots: `test-results/` (on failure)
- Videos: `test-results/` (on failure)
- Traces: `test-results/` (on retry)

## 🔄 CI/CD Integration

### **GitHub Actions Example**
```yaml
name: Formul8 Chat Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### **Docker Integration**
```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npx", "playwright", "test"]
```

## 📝 Test Data

### **Question Categories**
- **Science**: Cannabinoids, terpenes, extraction methods
- **Formulation**: Recipes, dosage calculations, ingredients
- **Compliance**: Regulations, licensing, audits
- **Marketing**: Branding, advertising, social media
- **Operations**: Facility management, production, logistics
- **Patent**: IP research, legal documentation
- **Spectra**: Analytical testing, quality control
- **Customer Success**: Retention, support, onboarding

### **Expected Behaviors**
- **Free Tier**: Basic responses + upgrade prompts
- **Standard Tier**: Advanced formulation tools
- **Micro Tier**: Compliance + marketing + patent research
- **Operator Tier**: Full agent access + advanced features
- **Enterprise Tier**: White-label + integrations
- **Admin Tier**: System management + editor commands

## 🚨 Troubleshooting

### **Common Issues**

#### **Connection Timeouts**
```bash
# Increase timeout in config
actionTimeout: 60000
navigationTimeout: 60000
```

#### **Element Not Found**
```bash
# Check if selectors are correct
# Update selectors in test files
# Verify page structure
```

#### **Test Flakiness**
```bash
# Add explicit waits
await page.waitForSelector('selector', { timeout: 30000 });

# Use retries
retries: 2
```

### **Debug Commands**
```bash
# Run single test
npx playwright test tests/chat-smoke.spec.js --headed

# Run with specific browser
npx playwright test --project=chromium

# Generate trace
npx playwright test --trace=on

# Debug specific test
npx playwright test --grep "Basic chat functionality"
```

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Formul8 Multiagent System](../README.md)
- [Agent Configuration](../config/README.md)
- [API Documentation](../docs/API.md)

## 🤝 Contributing

1. Add new test cases to appropriate spec files
2. Update test data and scenarios as needed
3. Ensure tests are reliable and not flaky
4. Document new test categories and behaviors
5. Update this README with new information

## 📞 Support

For test-related issues:
- Check the [troubleshooting section](#-troubleshooting)
- Review test logs and traces
- Verify system health at `https://f8.syzygyx.com/health`
- Contact the development team