#!/bin/bash

# Deploy Lambda function with OpenRouter API key environment variable
echo "🚀 Deploying Formul8 Multiagent Lambda with OpenRouter API integration..."

# Create deployment package
echo "📦 Creating deployment package..."
zip -r formul8-multiagent-lambda.zip lambda.js package.json node_modules/

# Deploy to both Lambda functions
echo "☁️ Deploying to AWS Lambda functions..."

# Update formul8-f8-lambda
echo "📝 Updating formul8-f8-lambda..."
aws lambda update-function-code \
    --function-name formul8-f8-lambda \
    --zip-file fileb://formul8-multiagent-lambda.zip

# Update formul8-enhanced-chat
echo "📝 Updating formul8-enhanced-chat..."
aws lambda update-function-code \
    --function-name formul8-enhanced-chat \
    --zip-file fileb://formul8-multiagent-lambda.zip

# Set environment variable for both functions
echo "🔑 Setting OpenRouter API key environment variable..."

# Get the API key from GitHub Secrets (we'll need to set it manually)
echo "⚠️  Please set the OPENROUTER_API_KEY environment variable manually:"
echo "aws lambda update-function-configuration --function-name formul8-f8-lambda --environment Variables='{OPENROUTER_API_KEY=your-key-here}'"
echo "aws lambda update-function-configuration --function-name formul8-enhanced-chat --environment Variables='{OPENROUTER_API_KEY=your-key-here}'"

echo "✅ Lambda functions updated successfully!"
echo "🧪 Test the deployment:"
echo "curl -X POST https://f8.syzygyx.com/api/chat -H 'Content-Type: application/json' -d '{\"message\": \"Hello, test the OpenRouter integration\"}'"