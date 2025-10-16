#!/bin/bash

# Deploy Formul8 Multiagent Lambda Function
echo "🚀 Deploying Formul8 Multiagent Lambda Function..."

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p lambda-deploy
cp -r lambda-package/* lambda-deploy/
cp lambda-package.json lambda-deploy/package.json

# Install dependencies
echo "📥 Installing dependencies..."
cd lambda-deploy
npm install --production
cd ..

# Create ZIP file
echo "🗜️  Creating ZIP file..."
cd lambda-deploy
zip -r ../formul8-multiagent-lambda.zip .
cd ..

# Deploy to Lambda
echo "🚀 Deploying to AWS Lambda..."
aws lambda update-function-code \
  --function-name formul8-enhanced-chat \
  --zip-file fileb://formul8-multiagent-lambda.zip

# Update function configuration
echo "⚙️  Updating function configuration..."
aws lambda update-function-configuration \
  --function-name formul8-enhanced-chat \
  --handler lambda.handler \
  --runtime nodejs18.x \
  --timeout 30 \
  --memory-size 512

# Clean up
echo "🧹 Cleaning up..."
rm -rf lambda-deploy
rm formul8-multiagent-lambda.zip

echo "✅ Lambda function deployed successfully!"
echo "🌐 Test the function at: https://f8.syzygyx.com"