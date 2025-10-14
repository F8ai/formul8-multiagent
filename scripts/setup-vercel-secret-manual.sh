#!/bin/bash

# Script to manually set up Vercel secret
# Usage: ./setup-vercel-secret-manual.sh <your-openrouter-api-key>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔑 Setting up Vercel Secret Manually${NC}"
echo "====================================="

# Check if API key is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: OpenRouter API key is required${NC}"
    echo "Usage: $0 <your-openrouter-api-key>"
    echo ""
    echo "Example:"
    echo "  $0 sk-or-v1-abc123..."
    exit 1
fi

API_KEY="$1"

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

# Create the Vercel secret
echo "$API_KEY" | vercel secrets add openrouter_api_key

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Vercel secret 'openrouter_api_key' created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create Vercel secret${NC}"
    exit 1
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
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "- View Vercel secrets: vercel secrets ls"
echo "- View deployments: vercel ls"
echo "- View logs: vercel logs"