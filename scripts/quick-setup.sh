#!/bin/bash

# Quick setup script for Vercel secret
# This script will guide you through setting up the Vercel secret

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Quick Vercel Secret Setup${NC}"
echo "============================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI is not installed${NC}"
    echo "Please install it with: npm install -g vercel"
    exit 1
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Please log in to Vercel CLI first:${NC}"
    echo "vercel login"
    exit 1
fi

echo -e "${YELLOW}To set up the Vercel secret, you have two options:${NC}"
echo ""
echo -e "${BLUE}Option 1: Manual Setup (Recommended)${NC}"
echo "1. Get your OpenRouter API key from GitHub Secrets or your account"
echo "2. Run: echo 'your-api-key' | vercel secrets add openrouter_api_key"
echo "3. Run: cd lambda-package && vercel --prod --yes"
echo ""
echo -e "${BLUE}Option 2: GitHub Actions Workflow${NC}"
echo "1. Go to: https://github.com/F8ai/formul8-multiagent/actions"
echo "2. Click 'Setup Vercel Secrets from GitHub'"
echo "3. Click 'Run workflow'"
echo "4. Enter your OpenRouter API key when prompted"
echo ""

read -p "Would you like to proceed with Option 1 (manual setup)? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Please enter your OpenRouter API key:${NC}"
    read -s API_KEY
    echo ""
    
    if [ -z "$API_KEY" ]; then
        echo -e "${RED}Error: No API key provided${NC}"
        exit 1
    fi
    
    # Validate key format
    if [[ ! "$API_KEY" =~ ^sk-or-v1- ]]; then
        echo -e "${YELLOW}⚠️  Warning: Key doesn't match expected OpenRouter format (sk-or-v1-...)${NC}"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborted."
            exit 1
        fi
    fi
    
    echo -e "${YELLOW}Creating Vercel secret...${NC}"
    echo "$API_KEY" | vercel secrets add openrouter_api_key
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Vercel secret 'openrouter_api_key' created successfully${NC}"
    else
        echo -e "${RED}❌ Failed to create Vercel secret${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Deploying to Vercel...${NC}"
    cd lambda-package
    vercel --prod --yes
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Deployment successful${NC}"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Verifying deployment...${NC}"
    sleep 5
    
    echo "Testing chat.html endpoint..."
    if curl -f -s https://f8.syzygyx.com/chat.html > /dev/null; then
        echo -e "${GREEN}✅ https://f8.syzygyx.com/chat.html is working${NC}"
    else
        echo -e "${YELLOW}⚠️  https://f8.syzygyx.com/chat.html not ready yet (may take a few minutes)${NC}"
    fi
    
    echo "Testing API health endpoint..."
    if curl -f -s https://f8.syzygyx.com/api/health > /dev/null; then
        echo -e "${GREEN}✅ https://f8.syzygyx.com/api/health is working${NC}"
    else
        echo -e "${YELLOW}⚠️  https://f8.syzygyx.com/api/health not ready yet${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Setup complete!${NC}"
    echo -e "${BLUE}Test your chat interface at: https://f8.syzygyx.com/chat.html${NC}"
    
else
    echo -e "${BLUE}Please use Option 2 (GitHub Actions workflow) instead.${NC}"
    echo "Go to: https://github.com/F8ai/formul8-multiagent/actions"
fi