#!/bin/bash

# Script to set up OpenRouter API key for all Vercel projects
# Run this after getting the key from GitHub Secrets

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up OpenRouter API key for all Vercel projects...${NC}"

# Check if OPENROUTER_API_KEY is set
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo -e "${RED}Error: OPENROUTER_API_KEY environment variable not set${NC}"
    echo "Please set it first: export OPENROUTER_API_KEY='your-key-here'"
    exit 1
fi

# List of all agent projects
AGENTS=(
    "compliance-agent"
    "formulation-agent" 
    "operations-agent"
    "marketing-agent"
    "sourcing-agent"
    "patent-agent"
    "spectra-agent"
    "customer-success-agent"
    "f8-slackbot-agent"
    "mcr-agent"
    "ad-agent"
    "editor-agent"
    "future-agent"
)

# Main agent project
MAIN_AGENT="lambda-package"

echo -e "${YELLOW}Setting up main agent (${MAIN_AGENT})...${NC}"
cd lambda-package
vercel env add OPENROUTER_API_KEY production <<< "$OPENROUTER_API_KEY"
vercel env add OPENROUTER_API_KEY preview <<< "$OPENROUTER_API_KEY"
vercel env add OPENROUTER_API_KEY development <<< "$OPENROUTER_API_KEY"
cd ..

echo -e "${YELLOW}Setting up individual agents...${NC}"

# Set up each agent
for agent in "${AGENTS[@]}"; do
    echo -e "${YELLOW}Setting up ${agent}...${NC}"
    
    # Check if agent directory exists
    if [ -d "agents/${agent}" ]; then
        cd "agents/${agent}"
        
        # Add environment variable for all environments
        vercel env add OPENROUTER_API_KEY production <<< "$OPENROUTER_API_KEY"
        vercel env add OPENROUTER_API_KEY preview <<< "$OPENROUTER_API_KEY" 
        vercel env add OPENROUTER_API_KEY development <<< "$OPENROUTER_API_KEY"
        
        cd ../..
        echo -e "${GREEN}✓ ${agent} configured${NC}"
    else
        echo -e "${RED}✗ ${agent} directory not found${NC}"
    fi
done

# Set up future-agent (separate directory)
if [ -d "../future-agent" ]; then
    echo -e "${YELLOW}Setting up future-agent...${NC}"
    cd ../future-agent
    
    vercel env add OPENROUTER_API_KEY production <<< "$OPENROUTER_API_KEY"
    vercel env add OPENROUTER_API_KEY preview <<< "$OPENROUTER_API_KEY"
    vercel env add OPENROUTER_API_KEY development <<< "$OPENROUTER_API_KEY"
    
    cd ../formul8-multiagent
    echo -e "${GREEN}✓ future-agent configured${NC}"
else
    echo -e "${RED}✗ future-agent directory not found${NC}"
fi

echo -e "${GREEN}All projects configured with OpenRouter API key!${NC}"
echo -e "${YELLOW}Note: You may need to redeploy projects for environment variables to take effect${NC}"