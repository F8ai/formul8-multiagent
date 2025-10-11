#!/bin/bash

# Deploy formul8-multiagent to AWS Lambda
echo "🚀 Deploying Formul8 Multiagent to AWS Lambda..."

# Create deployment package
cd deploy
npm install --production
zip -r ../formul8-multiagent-lambda.zip . -x "*.git*" "*.DS_Store*"

# Deploy to Lambda
aws lambda create-function \
  --function-name formul8-multiagent \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler lambda.handler \
  --zip-file fileb://../formul8-multiagent-lambda.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables='{NODE_ENV=production}' \
  --description "Formul8 Multiagent Chat with LangChain and microservice monitoring"

echo "✅ Lambda function created: formul8-multiagent"
echo "📝 Next steps:"
echo "   1. Create API Gateway endpoint"
echo "   2. Update Route 53 to point to API Gateway"
echo "   3. Test the deployment"