#!/bin/bash

# Deploy Lambda function with OpenRouter API key environment variable
echo "🚀 Deploying Formul8 Multiagent Lambda with OpenRouter API integration..."

# Get the OpenRouter API key from GitHub Secrets
echo "📋 Getting OpenRouter API key from GitHub Secrets..."
OPENROUTER_API_KEY=$(gh secret list --json name,value | jq -r '.[] | select(.name=="OPENROUTER_API_KEY") | .value')

if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "❌ Error: OPENROUTER_API_KEY not found in GitHub Secrets"
    exit 1
fi

echo "✅ OpenRouter API key retrieved successfully"

# Create deployment package
echo "📦 Creating deployment package..."
zip -r formul8-multiagent-lambda.zip lambda.js package.json node_modules/

# Deploy to AWS Lambda
echo "☁️ Deploying to AWS Lambda..."

# Update the Lambda function code
aws lambda update-function-code \
    --function-name formul8-multiagent \
    --zip-file fileb://formul8-multiagent-lambda.zip

# Update environment variables
aws lambda update-function-configuration \
    --function-name formul8-multiagent \
    --environment Variables="{OPENROUTER_API_KEY=$OPENROUTER_API_KEY}"

# Wait for update to complete
echo "⏳ Waiting for deployment to complete..."
aws lambda wait function-updated --function-name formul8-multiagent

echo "✅ Lambda function deployed successfully with OpenRouter API integration!"

# Test the deployment
echo "🧪 Testing the deployment..."
curl -X POST https://f8.syzygyx.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, test the OpenRouter integration"}' \
  -s | jq .

echo "🎉 Deployment complete! F8 chat now has real AI responses via OpenRouter API."