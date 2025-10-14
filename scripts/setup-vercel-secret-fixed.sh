#!/bin/bash

# Script to set up Vercel secret from GitHub Secrets
# This script reads the OpenRouter API key from GitHub Secrets and creates a Vercel secret

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔑 Setting up Vercel Secret from GitHub Secrets${NC}"
echo "=================================================="

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI is not installed${NC}"
    echo "Please install it with: npm install -g vercel"
    exit 1
fi

# Check if user is logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}Please log in to GitHub CLI first:${NC}"
    echo "gh auth login"
    exit 1
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Please log in to Vercel CLI first:${NC}"
    echo "vercel login"
    exit 1
fi

echo -e "${YELLOW}Fetching OpenRouter API key from GitHub Secrets...${NC}"

# Get the OpenRouter API key from GitHub Secrets using GitHub API
REPO_OWNER="F8ai"
REPO_NAME="formul8-multiagent"

# Get the secret value using GitHub API
API_KEY=$(gh api repos/${REPO_OWNER}/${REPO_NAME}/actions/secrets/OPENROUTER_API_KEY --jq '.secret' 2>/dev/null || echo "")

if [ -z "$API_KEY" ] || [ "$API_KEY" = "null" ]; then
    echo -e "${RED}Error: Could not retrieve OPENROUTER_API_KEY from GitHub Secrets${NC}"
    echo "This might be because:"
    echo "1. The secret doesn't exist"
    echo "2. You don't have permission to read the secret"
    echo "3. The repository is private and you need to authenticate"
    echo ""
    echo "Please check:"
    echo "- gh secret list"
    echo "- gh auth status"
    exit 1
fi

echo -e "${GREEN}✅ OpenRouter API key retrieved from GitHub Secrets${NC}"

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