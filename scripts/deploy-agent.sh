#!/bin/bash
# Deploy a specific agent (pulls repo if separate, uses local if embedded)

set -e

AGENT_NAME="$1"
DEPLOYMENT_TYPE="${2:-production}"

if [ -z "$AGENT_NAME" ]; then
  echo "Usage: ./scripts/deploy-agent.sh <agent-name> [production|preview]"
  echo ""
  echo "Available agents:"
  echo "  - compliance-agent"
  echo "  - formulation-agent"
  echo "  - science-agent"
  echo "  - operations-agent"
  echo "  - marketing-agent"
  echo "  - sourcing-agent"
  echo "  - patent-agent"
  echo "  - spectra-agent"
  echo "  - customer-success-agent"
  echo "  - mcr-agent"
  echo "  - ad-agent"
  echo "  - editor-agent"
  echo "  - f8-slackbot"
  exit 1
fi

echo "🚀 Deploying $AGENT_NAME..."

# Check if agent has separate repo
REPO_CHECK=$(gh repo view "F8ai/$AGENT_NAME" 2>/dev/null || echo "NOT_FOUND")

if [ "$REPO_CHECK" != "NOT_FOUND" ]; then
  echo "📦 Agent has separate repo, cloning..."
  TEMP_DIR=$(mktemp -d)
  cd "$TEMP_DIR"
  gh repo clone "F8ai/$AGENT_NAME"
  cd "$AGENT_NAME"
  AGENT_PATH="$PWD"
else
  echo "📁 Using embedded agent from multiagent repo"
  AGENT_PATH="$PWD/agents/$AGENT_NAME"
  
  if [ ! -d "$AGENT_PATH" ]; then
    echo "❌ Agent not found: $AGENT_PATH"
    exit 1
  fi
fi

echo "📍 Agent path: $AGENT_PATH"

# Install dependencies
cd "$AGENT_PATH"
echo "📦 Installing dependencies..."
npm install

# Deploy
echo "🚀 Deploying to Vercel..."
if [ "$DEPLOYMENT_TYPE" == "production" ]; then
  vercel --prod --yes
else
  vercel --yes
fi

echo ""
echo "✅ $AGENT_NAME deployed successfully!"
echo "🔗 URL: https://$AGENT_NAME.f8.syzygyx.com"
echo ""
echo "Note: Agent receives OPENROUTER_API_KEY via API calls, doesn't store it"

# Cleanup temp dir if used
if [ "$REPO_CHECK" != "NOT_FOUND" ]; then
  cd ~
  rm -rf "$TEMP_DIR"
fi

