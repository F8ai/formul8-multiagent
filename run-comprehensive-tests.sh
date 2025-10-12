#!/bin/bash

# Formul8 Multiagent Chat - Comprehensive Test Suite Runner
echo "🚀 Starting Formul8 Multiagent Chat Comprehensive Test Suite"
echo "=============================================================="

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Node.js/npx not found. Please install Node.js first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Install Playwright browsers if needed
echo "🌐 Installing Playwright browsers..."
npx playwright install

# Create test results directory
mkdir -p test-results
mkdir -p playwright-report

# Run comprehensive test suite
echo "🧪 Running comprehensive test suite..."
echo "Target: https://f8.syzygyx.com/chat"
echo ""

# Run tests with different configurations
echo "1️⃣ Running basic functionality tests..."
npx playwright test tests/chat-comprehensive.spec.js --grep "Free Tier|Standard Tier|Micro Tier" --reporter=line

echo ""
echo "2️⃣ Running advanced functionality tests..."
npx playwright test tests/chat-comprehensive.spec.js --grep "Operator Tier|Enterprise Tier|Admin Tier" --reporter=line

echo ""
echo "3️⃣ Running performance tests..."
npx playwright test tests/chat-comprehensive.spec.js --grep "Performance" --reporter=line

echo ""
echo "4️⃣ Running error handling tests..."
npx playwright test tests/chat-comprehensive.spec.js --grep "Error Handling|Edge Cases" --reporter=line

echo ""
echo "5️⃣ Running UI/UX tests..."
npx playwright test tests/chat-comprehensive.spec.js --grep "UI/UX" --reporter=line

echo ""
echo "6️⃣ Running health check tests..."
npx playwright test tests/chat-comprehensive.spec.js --grep "Health Check" --reporter=line

echo ""
echo "7️⃣ Running mobile tests..."
npx playwright test --project="Mobile Chrome" --project="Mobile Safari" --reporter=line

echo ""
echo "8️⃣ Running cross-browser tests..."
npx playwright test --project="chromium" --project="firefox" --project="webkit" --reporter=line

# Generate comprehensive report
echo ""
echo "📊 Generating comprehensive test report..."
npx playwright show-report --host 0.0.0.0 --port 9323 &

# Wait a moment for report to generate
sleep 5

echo ""
echo "✅ Test suite completed!"
echo "=============================================================="
echo "📈 Test Results:"
echo "   - HTML Report: playwright-report/index.html"
echo "   - JSON Results: test-results/results.json"
echo "   - JUnit Results: test-results/results.xml"
echo ""
echo "🌐 View detailed report at: http://localhost:9323"
echo ""
echo "📋 Test Summary:"
echo "   - Basic functionality across all tiers"
echo "   - Agent routing and responses"
echo "   - Performance and load testing"
echo "   - Error handling and edge cases"
echo "   - UI/UX and responsive design"
echo "   - Health checks and API endpoints"
echo "   - Cross-browser compatibility"
echo "   - Mobile device testing"
echo ""
echo "🎯 Target System: https://f8.syzygyx.com/chat"
echo "=============================================================="