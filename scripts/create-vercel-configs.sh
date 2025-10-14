#!/bin/bash

# Script to create vercel.json for all agents

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Creating Vercel configurations for all agents...${NC}"

# List of all agent directories
AGENTS=(
    "ad-agent"
    "compliance-agent"
    "customer-success-agent"
    "editor-agent"
    "f8-slackbot"
    "formulation-agent"
    "marketing-agent"
    "mcr-agent"
    "operations-agent"
    "patent-agent"
    "science-agent"
    "sourcing-agent"
    "spectra-agent"
)

# Create vercel.json for each agent
for agent in "${AGENTS[@]}"; do
    echo -e "${YELLOW}Creating vercel.json for ${agent}...${NC}"
    
    if [ -d "agents/${agent}" ]; then
        cat > "agents/${agent}/vercel.json" << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "lambda.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/health",
      "dest": "/lambda.js"
    },
    {
      "src": "/api/chat",
      "dest": "/lambda.js"
    },
    {
      "src": "/(.*)",
      "dest": "/lambda.js"
    }
  ],
  "env": {
    "OPENROUTER_API_KEY": "@openrouter_api_key"
  }
}
EOF
        echo -e "${GREEN}✓ ${agent} configured${NC}"
    else
        echo -e "${RED}✗ ${agent} directory not found${NC}"
    fi
done

echo -e "${GREEN}All agent Vercel configurations created!${NC}"