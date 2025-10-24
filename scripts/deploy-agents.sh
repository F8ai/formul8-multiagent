#!/bin/bash

# Formul8 Agents Deployment Script for Vercel
# This script deploys all individual agent microservices to Vercel

set -e  # Exit on any error

echo "🚀 Starting Formul8 Agents Deployment to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Please run: vercel login"
    exit 1
fi

# Array of all agents
AGENTS=(
    "compliance-agent"
    "formulation-agent" 
    "operations-agent"
    "marketing-agent"
    "sourcing-agent"
    "patent-agent"
    "spectra-agent"
    "customer-success-agent"
    "f8-slackbot"
    "mcr-agent"
    "ad-agent"
    "editor-agent"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to deploy a single agent
deploy_agent() {
    local agent=$1
    local agent_dir="agents/$agent"
    
    echo -e "\n${BLUE}📦 Deploying $agent...${NC}"
    
    # Check if agent directory exists
    if [ ! -d "$agent_dir" ]; then
        echo -e "${RED}❌ Directory $agent_dir not found${NC}"
        return 1
    fi
    
    # Navigate to agent directory
    cd "$agent_dir"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ package.json not found in $agent_dir${NC}"
        cd ../..
        return 1
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📥 Installing dependencies for $agent...${NC}"
        npm install
    fi
    
    # Deploy to Vercel
    echo -e "${YELLOW}🚀 Deploying $agent to Vercel...${NC}"
    
    # Use --yes to skip prompts and --prod for production
    if vercel --prod --yes --name "$agent-f8" 2>/dev/null; then
        echo -e "${GREEN}✅ $agent deployed successfully!${NC}"
        echo -e "${GREEN}   URL: https://$agent-f8.vercel.app${NC}"
    else
        echo -e "${RED}❌ Failed to deploy $agent${NC}"
        cd ../..
        return 1
    fi
    
    # Return to root directory
    cd ../..
}

# Function to update microservices.json with new URLs
update_microservices_config() {
    echo -e "\n${BLUE}📝 Updating microservices configuration...${NC}"
    
    # Create updated microservices.json
    cat > lambda-package/config/microservices-vercel.json << EOF
{
  "microservices": {
    "timeout": 30000,
    "retries": 2,
    "retryDelay": 1000,
    "healthCheck": {
      "enabled": true,
      "interval": 60000,
      "timeout": 5000,
      "endpoint": "/health"
    },
    "circuitBreaker": {
      "enabled": true,
      "failureThreshold": 5,
      "recoveryTimeout": 30000,
      "monitoringPeriod": 10000
    },
    "loadBalancing": {
      "enabled": false,
      "strategy": "round_robin",
      "healthCheckWeight": 0.3
    },
    "services": {
EOF

    # Add each agent to the config
    for agent in "${AGENTS[@]}"; do
        local agent_name=$(echo "$agent" | sed 's/-agent//' | sed 's/f8-slackbot/slackbot/')
        cat >> lambda-package/config/microservices-vercel.json << EOF
      "$agent_name": {
        "url": "https://$agent-f8.vercel.app",
        "type": "vercel",
        "timeout": 30000,
        "retries": 2,
        "healthCheck": true
      },
EOF
    done
    
    # Close the JSON
    cat >> lambda-package/config/microservices-vercel.json << EOF
    }
  }
}
EOF

    echo -e "${GREEN}✅ Updated microservices configuration saved to microservices-vercel.json${NC}"
}

# Main deployment process
main() {
    local failed_agents=()
    local successful_agents=()
    
    echo -e "${BLUE}🔍 Found ${#AGENTS[@]} agents to deploy${NC}"
    
    # Deploy each agent
    for agent in "${AGENTS[@]}"; do
        if deploy_agent "$agent"; then
            successful_agents+=("$agent")
        else
            failed_agents+=("$agent")
        fi
    done
    
    # Summary
    echo -e "\n${BLUE}📊 Deployment Summary:${NC}"
    echo -e "${GREEN}✅ Successfully deployed: ${#successful_agents[@]} agents${NC}"
    echo -e "${RED}❌ Failed to deploy: ${#failed_agents[@]} agents${NC}"
    
    if [ ${#successful_agents[@]} -gt 0 ]; then
        echo -e "\n${GREEN}Successful deployments:${NC}"
        for agent in "${successful_agents[@]}"; do
            echo -e "  • https://$agent-f8.vercel.app"
        done
    fi
    
    if [ ${#failed_agents[@]} -gt 0 ]; then
        echo -e "\n${RED}Failed deployments:${NC}"
        for agent in "${failed_agents[@]}"; do
            echo -e "  • $agent"
        done
    fi
    
    # Update configuration if any agents were deployed successfully
    if [ ${#successful_agents[@]} -gt 0 ]; then
        update_microservices_config
        echo -e "\n${GREEN}🎉 Deployment process completed!${NC}"
        echo -e "${YELLOW}💡 Next steps:${NC}"
        echo -e "  1. Update your main agent to use the new URLs"
        echo -e "  2. Test the deployed agents"
        echo -e "  3. Update your DNS/domain configuration if needed"
    else
        echo -e "\n${RED}❌ No agents were deployed successfully${NC}"
        exit 1
    fi
}

# Run main function
main "$@"