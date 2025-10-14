#!/bin/bash

# AWS Cleanup Script for Formul8 Lambda Resources
echo "🧹 Starting AWS cleanup for Formul8 resources..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to delete Lambda function
delete_lambda_function() {
    local function_name=$1
    echo -e "${BLUE}🗑️  Deleting Lambda function: $function_name${NC}"
    
    if aws lambda delete-function --function-name "$function_name" 2>/dev/null; then
        echo -e "${GREEN}✅ Successfully deleted Lambda function: $function_name${NC}"
    else
        echo -e "${RED}❌ Failed to delete Lambda function: $function_name${NC}"
    fi
}

# Function to delete API Gateway
delete_api_gateway() {
    local api_id=$1
    local api_name=$2
    echo -e "${BLUE}🗑️  Deleting API Gateway: $api_name ($api_id)${NC}"
    
    if aws apigateway delete-rest-api --rest-api-id "$api_id" 2>/dev/null; then
        echo -e "${GREEN}✅ Successfully deleted API Gateway: $api_name${NC}"
    else
        echo -e "${RED}❌ Failed to delete API Gateway: $api_name${NC}"
    fi
}

# Function to delete CloudWatch logs
delete_cloudwatch_logs() {
    local log_group_name=$1
    echo -e "${BLUE}🗑️  Deleting CloudWatch log group: $log_group_name${NC}"
    
    if aws logs delete-log-group --log-group-name "$log_group_name" 2>/dev/null; then
        echo -e "${GREEN}✅ Successfully deleted log group: $log_group_name${NC}"
    else
        echo -e "${YELLOW}⚠️  Log group not found or already deleted: $log_group_name${NC}"
    fi
}

# Main cleanup process
main() {
    echo -e "${YELLOW}⚠️  WARNING: This will delete AWS Lambda functions and API Gateway resources.${NC}"
    echo -e "${YELLOW}   Make sure you have backed up any important data.${NC}"
    echo ""
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}❌ Cleanup cancelled.${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🚀 Starting cleanup process...${NC}"
    
    # Delete Lambda functions
    echo -e "\n${BLUE}📦 Deleting Lambda Functions...${NC}"
    delete_lambda_function "formul8-f8-lambda"
    delete_lambda_function "formul8-enhanced-chat"
    
    # Delete API Gateway
    echo -e "\n${BLUE}🌐 Deleting API Gateway...${NC}"
    delete_api_gateway "4wfkcy4xne" "formul8-api"
    
    # Delete CloudWatch log groups
    echo -e "\n${BLUE}📊 Deleting CloudWatch Log Groups...${NC}"
    delete_cloudwatch_logs "/aws/lambda/formul8-f8-lambda"
    delete_cloudwatch_logs "/aws/lambda/formul8-enhanced-chat"
    delete_cloudwatch_logs "/aws/apigateway/formul8-api"
    
    # Check for any remaining resources
    echo -e "\n${BLUE}🔍 Checking for remaining resources...${NC}"
    
    # Check remaining Lambda functions
    local remaining_lambdas=$(aws lambda list-functions --query 'Functions[?contains(FunctionName, `formul8`) || contains(FunctionName, `f8`)].FunctionName' --output text)
    if [ -n "$remaining_lambdas" ]; then
        echo -e "${YELLOW}⚠️  Remaining Lambda functions:${NC}"
        echo "$remaining_lambdas"
    else
        echo -e "${GREEN}✅ No remaining Lambda functions found${NC}"
    fi
    
    # Check remaining API Gateways
    local remaining_apis=$(aws apigateway get-rest-apis --query 'items[?contains(name, `formul8`) || contains(name, `f8`)].name' --output text)
    if [ -n "$remaining_apis" ]; then
        echo -e "${YELLOW}⚠️  Remaining API Gateways:${NC}"
        echo "$remaining_apis"
    else
        echo -e "${GREEN}✅ No remaining API Gateways found${NC}"
    fi
    
    echo -e "\n${GREEN}🎉 AWS cleanup completed!${NC}"
    echo -e "${BLUE}📋 Summary:${NC}"
    echo "  • Lambda functions deleted"
    echo "  • API Gateway deleted"
    echo "  • CloudWatch log groups deleted"
    echo ""
    echo -e "${GREEN}✅ Your Formul8 system is now running on Vercel!${NC}"
    echo -e "${BLUE}🌐 Main Agent: https://lambda-package.vercel.app${NC}"
    echo -e "${BLUE}🔑 Free API Key: https://lambda-package.vercel.app/api/free-key${NC}"
}

# Run main function
main "$@"