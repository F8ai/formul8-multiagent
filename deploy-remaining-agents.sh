#!/bin/bash

# Deploy remaining Formul8 agents to Vercel
echo "🚀 Deploying remaining Formul8 agents to Vercel..."

# Array of remaining agents to deploy
REMAINING_AGENTS=(
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
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Deploy each agent
for agent in "${REMAINING_AGENTS[@]}"; do
    echo -e "\n${BLUE}📦 Deploying $agent...${NC}"
    
    if [ -d "agents/$agent" ]; then
        cd "agents/$agent"
        
        if vercel --prod --yes 2>/dev/null; then
            echo -e "${GREEN}✅ $agent deployed successfully!${NC}"
        else
            echo -e "${RED}❌ Failed to deploy $agent${NC}"
        fi
        
        cd ../..
    else
        echo -e "${RED}❌ Directory agents/$agent not found${NC}"
    fi
done

echo -e "\n${GREEN}🎉 Agent deployment process completed!${NC}"
echo -e "\n${BLUE}📋 Deployed Agents:${NC}"
echo "Main Agent: https://lambda-package-2gaouclku-formul8ai.vercel.app"
echo "Compliance: https://compliance-agent-25c62zq0x-formul8ai.vercel.app"
echo "Formulation: https://formulation-agent-dqwp91p6f-formul8ai.vercel.app"
echo "Science: https://science-agent-cauwfvrml-formul8ai.vercel.app"
echo "Check Vercel dashboard for other agent URLs"