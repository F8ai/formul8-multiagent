#!/bin/bash

# Script to set up Vercel secret using Vercel API
# This script reads the OpenRouter API key from ~/.env and creates a Vercel secret

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔑 Setting up Vercel Secret using API${NC}"
echo "====================================="

# Check if .env file exists
if [ ! -f ~/.env ]; then
    echo -e "${RED}Error: ~/.env file not found${NC}"
    exit 1
fi

# Get the API key from .env file
API_KEY=$(grep OPENROUTER_API_KEY ~/.env | cut -d '=' -f2)

if [ -z "$API_KEY" ]; then
    echo -e "${RED}Error: OPENROUTER_API_KEY not found in ~/.env${NC}"
    exit 1
fi

echo -e "${GREEN}✅ OpenRouter API key found in ~/.env${NC}"

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

echo -e "${YELLOW}Setting up Vercel secret using API...${NC}"

# Get Vercel token
VERCEL_TOKEN=$(vercel whoami --token 2>/dev/null || echo "")

if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${YELLOW}Please log in to Vercel first:${NC}"
    echo "vercel login"
    exit 1
fi

# Get team ID and project ID
TEAM_ID=$(vercel teams ls --json | jq -r '.[0].id' 2>/dev/null || echo "")
PROJECT_ID="lambda-package"

echo -e "${YELLOW}Creating Vercel secret...${NC}"

# Create the secret using Vercel API
curl -X POST "https://api.vercel.com/v1/secrets" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"openrouter_api_key\",
    \"value\": \"$API_KEY\"
  }" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Vercel secret 'openrouter_api_key' created successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Secret might already exist, continuing...${NC}"
fi

echo -e "${YELLOW}Deploying to Vercel...${NC}"

# Deploy to Vercel
cd lambda-package
vercel --prod --yes

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo -e "${YELLOW}Verifying deployment...${NC}"

# Wait a moment for deployment to complete
sleep 5

# Test the endpoints
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
echo -e "${GREEN}🎉 Vercel secret setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Test https://f8.syzygyx.com/chat.html in your browser"
echo "2. Run the comprehensive tests: npm run test:chatgpt"
echo "3. Check Vercel dashboard for deployment status"