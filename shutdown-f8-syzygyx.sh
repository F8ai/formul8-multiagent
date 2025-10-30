#!/bin/bash

# Complete Shutdown Script for f8.syzygyx.com
echo "🛑 Starting complete shutdown of f8.syzygyx.com..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check AWS CLI
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI first.${NC}"
        echo "   Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS CLI not configured. Please run 'aws configure' first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ AWS CLI configured and ready${NC}"
}

# Function to delete App Runner service
delete_app_runner_service() {
    local service_name=$1
    echo -e "${BLUE}🗑️  Deleting App Runner service: $service_name${NC}"
    
    # Get service ARN
    local service_arn=$(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$service_name'].ServiceArn" --output text)
    
    if [ -n "$service_arn" ] && [ "$service_arn" != "None" ]; then
        echo -e "${YELLOW}   Found service ARN: $service_arn${NC}"
        
        # Stop the service first
        aws apprunner pause-service --service-arn "$service_arn" 2>/dev/null
        echo -e "${YELLOW}   Service paused${NC}"
        
        # Delete the service
        if aws apprunner delete-service --service-arn "$service_arn" 2>/dev/null; then
            echo -e "${GREEN}✅ Successfully deleted App Runner service: $service_name${NC}"
        else
            echo -e "${RED}❌ Failed to delete App Runner service: $service_name${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  App Runner service not found: $service_name${NC}"
    fi
}

# Function to delete Lambda function
delete_lambda_function() {
    local function_name=$1
    echo -e "${BLUE}🗑️  Deleting Lambda function: $function_name${NC}"
    
    if aws lambda delete-function --function-name "$function_name" 2>/dev/null; then
        echo -e "${GREEN}✅ Successfully deleted Lambda function: $function_name${NC}"
    else
        echo -e "${YELLOW}⚠️  Lambda function not found or already deleted: $function_name${NC}"
    fi
}

# Function to delete CloudWatch log groups
delete_cloudwatch_logs() {
    local log_group_name=$1
    echo -e "${BLUE}🗑️  Deleting CloudWatch log group: $log_group_name${NC}"
    
    if aws logs delete-log-group --log-group-name "$log_group_name" 2>/dev/null; then
        echo -e "${GREEN}✅ Successfully deleted log group: $log_group_name${NC}"
    else
        echo -e "${YELLOW}⚠️  Log group not found or already deleted: $log_group_name${NC}"
    fi
}

# Function to update DNS to point to a shutdown page
update_dns_shutdown() {
    echo -e "${BLUE}🌐 Updating DNS to point to shutdown page...${NC}"
    
    # Create a simple shutdown page JSON for Route53
    cat > shutdown-f8-dns.json << 'EOF'
{
    "Comment": "Point f8.syzygyx.com to shutdown page",
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "f8.syzygyx.com.",
                "Type": "A",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "0.0.0.0"
                    }
                ]
            }
        }
    ]
}
EOF
    
    echo -e "${YELLOW}⚠️  DNS update file created: shutdown-f8-dns.json${NC}"
    echo -e "${YELLOW}   To apply DNS changes, run:${NC}"
    echo -e "${YELLOW}   aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch file://shutdown-f8-dns.json${NC}"
}

# Function to remove DNS records entirely
remove_dns_records() {
    echo -e "${BLUE}🌐 Removing DNS records for f8.syzygyx.com...${NC}"
    
    # Create a JSON to delete the CNAME record
    cat > remove-f8-dns.json << 'EOF'
{
    "Comment": "Remove f8.syzygyx.com DNS records",
    "Changes": [
        {
            "Action": "DELETE",
            "ResourceRecordSet": {
                "Name": "f8.syzygyx.com.",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "gh9wj8h9pm.us-east-1.awsapprunner.com"
                    }
                ]
            }
        }
    ]
}
EOF
    
    echo -e "${YELLOW}⚠️  DNS removal file created: remove-f8-dns.json${NC}"
    echo -e "${YELLOW}   To apply DNS changes, run:${NC}"
    echo -e "${YELLOW}   aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch file://remove-f8-dns.json${NC}"
}

# Main shutdown process
main() {
    echo -e "${RED}🛑 WARNING: This will completely shut down f8.syzygyx.com${NC}"
    echo -e "${RED}   This includes:${NC}"
    echo -e "${RED}   • All App Runner services${NC}"
    echo -e "${RED}   • All Lambda functions${NC}"
    echo -e "${RED}   • All CloudWatch logs${NC}"
    echo -e "${RED}   • DNS configuration${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  This action is IRREVERSIBLE!${NC}"
    echo ""
    read -p "Are you absolutely sure you want to shut down f8.syzygyx.com? (type 'SHUTDOWN' to confirm): " confirmation
    
    if [ "$confirmation" != "SHUTDOWN" ]; then
        echo -e "${YELLOW}❌ Shutdown cancelled.${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🚀 Starting shutdown process...${NC}"
    
    # Check AWS CLI
    check_aws_cli
    
    # Delete App Runner services
    echo -e "\n${BLUE}📦 Deleting App Runner Services...${NC}"
    delete_app_runner_service "formul8-multiagent"
    delete_app_runner_service "compliance-agent"
    delete_app_runner_service "formulation-agent"
    delete_app_runner_service "science-agent"
    delete_app_runner_service "operations-agent"
    delete_app_runner_service "marketing-agent"
    delete_app_runner_service "sourcing-agent"
    delete_app_runner_service "patent-agent"
    delete_app_runner_service "spectra-agent"
    delete_app_runner_service "customer-success-agent"
    delete_app_runner_service "mcr-agent"
    delete_app_runner_service "ad-agent"
    
    # Delete Lambda functions
    echo -e "\n${BLUE}⚡ Deleting Lambda Functions...${NC}"
    delete_lambda_function "formul8-f8-lambda"
    delete_lambda_function "formul8-enhanced-chat"
    delete_lambda_function "formul8-multiagent"
    
    # Delete CloudWatch log groups
    echo -e "\n${BLUE}📊 Deleting CloudWatch Log Groups...${NC}"
    delete_cloudwatch_logs "/aws/lambda/formul8-f8-lambda"
    delete_cloudwatch_logs "/aws/lambda/formul8-enhanced-chat"
    delete_cloudwatch_logs "/aws/lambda/formul8-multiagent"
    delete_cloudwatch_logs "/aws/apprunner/formul8-multiagent"
    
    # Update DNS
    echo -e "\n${BLUE}🌐 Preparing DNS Changes...${NC}"
    update_dns_shutdown
    remove_dns_records
    
    # Check for any remaining resources
    echo -e "\n${BLUE}🔍 Checking for remaining resources...${NC}"
    
    # Check remaining App Runner services
    local remaining_services=$(aws apprunner list-services --query 'ServiceSummaryList[?contains(ServiceName, `formul8`) || contains(ServiceName, `f8`)].ServiceName' --output text)
    if [ -n "$remaining_services" ]; then
        echo -e "${YELLOW}⚠️  Remaining App Runner services:${NC}"
        echo "$remaining_services"
    else
        echo -e "${GREEN}✅ No remaining App Runner services found${NC}"
    fi
    
    # Check remaining Lambda functions
    local remaining_lambdas=$(aws lambda list-functions --query 'Functions[?contains(FunctionName, `formul8`) || contains(FunctionName, `f8`)].FunctionName' --output text)
    if [ -n "$remaining_lambdas" ]; then
        echo -e "${YELLOW}⚠️  Remaining Lambda functions:${NC}"
        echo "$remaining_lambdas"
    else
        echo -e "${GREEN}✅ No remaining Lambda functions found${NC}"
    fi
    
    echo -e "\n${GREEN}🎉 f8.syzygyx.com shutdown completed!${NC}"
    echo -e "${BLUE}📋 Summary:${NC}"
    echo "  • App Runner services deleted"
    echo "  • Lambda functions deleted"
    echo "  • CloudWatch log groups deleted"
    echo "  • DNS configuration files created"
    echo ""
    echo -e "${YELLOW}⚠️  Next Steps:${NC}"
    echo "  1. Apply DNS changes using the generated JSON files"
    echo "  2. Verify all services are stopped"
    echo "  3. Update any documentation referencing f8.syzygyx.com"
    echo ""
    echo -e "${GREEN}✅ f8.syzygyx.com is now completely shut down!${NC}"
}

# Run main function
main "$@"
