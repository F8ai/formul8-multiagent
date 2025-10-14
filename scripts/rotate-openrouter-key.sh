#!/bin/bash

# Script to rotate OpenRouter API key across all Vercel projects
# This script updates the environment variable in all projects and redeploys them

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 OpenRouter API Key Rotation Script${NC}"
echo "================================================"

# Check if new key is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: New OpenRouter API key not provided${NC}"
    echo "Usage: $0 <new-api-key> [--dry-run]"
    echo "Example: $0 'sk-or-v1-abc123...' --dry-run"
    exit 1
fi

NEW_API_KEY="$1"
DRY_RUN=false

# Check for dry-run flag
if [ "$2" = "--dry-run" ]; then
    DRY_RUN=true
    echo -e "${YELLOW}🧪 DRY RUN MODE - No changes will be made${NC}"
fi

# Validate key format (basic check)
if [[ ! "$NEW_API_KEY" =~ ^sk-or-v1- ]]; then
    echo -e "${YELLOW}⚠️  Warning: Key doesn't match expected OpenRouter format (sk-or-v1-...)${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# List of all agent projects
AGENTS=(
    "compliance-agent"
    "formulation-agent" 
    "science-agent"
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
)

# Main agent project
MAIN_AGENT="lambda-package"

# Function to update environment variable
update_env_var() {
    local project_dir="$1"
    local project_name="$2"
    
    echo -e "${YELLOW}Updating ${project_name}...${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${BLUE}  [DRY RUN] Would update OPENROUTER_API_KEY in ${project_name}${NC}"
        return 0
    fi
    
    cd "$project_dir"
    
    # Update for all environments
    echo "  Updating production environment..."
    vercel env rm OPENROUTER_API_KEY production --yes 2>/dev/null || true
    echo "$NEW_API_KEY" | vercel env add OPENROUTER_API_KEY production
    
    echo "  Updating preview environment..."
    vercel env rm OPENROUTER_API_KEY preview --yes 2>/dev/null || true
    echo "$NEW_API_KEY" | vercel env add OPENROUTER_API_KEY preview
    
    echo "  Updating development environment..."
    vercel env rm OPENROUTER_API_KEY development --yes 2>/dev/null || true
    echo "$NEW_API_KEY" | vercel env add OPENROUTER_API_KEY development
    
    cd - > /dev/null
    echo -e "${GREEN}  ✓ ${project_name} updated${NC}"
}

# Function to redeploy project
redeploy_project() {
    local project_dir="$1"
    local project_name="$2"
    
    echo -e "${YELLOW}Redeploying ${project_name}...${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${BLUE}  [DRY RUN] Would redeploy ${project_name}${NC}"
        return 0
    fi
    
    cd "$project_dir"
    vercel --prod --yes
    cd - > /dev/null
    echo -e "${GREEN}  ✓ ${project_name} redeployed${NC}"
}

# Start the rotation process
echo -e "${BLUE}Starting key rotation...${NC}"
echo "New key: ${NEW_API_KEY:0:20}..."
echo ""

# Update main agent
echo -e "${BLUE}1. Updating main agent (${MAIN_AGENT})...${NC}"
update_env_var "lambda-package" "$MAIN_AGENT"

# Update individual agents
echo -e "${BLUE}2. Updating individual agents...${NC}"
for agent in "${AGENTS[@]}"; do
    if [ -d "agents/${agent}" ]; then
        update_env_var "agents/${agent}" "$agent"
    else
        echo -e "${RED}  ✗ ${agent} directory not found${NC}"
    fi
done

# Update future-agent
echo -e "${BLUE}3. Updating future-agent...${NC}"
if [ -d "../future-agent" ]; then
    update_env_var "../future-agent" "future-agent"
else
    echo -e "${RED}  ✗ future-agent directory not found${NC}"
fi

# Redeploy all projects
if [ "$DRY_RUN" = false ]; then
    echo ""
    echo -e "${BLUE}4. Redeploying all projects...${NC}"
    
    # Redeploy main agent
    redeploy_project "lambda-package" "$MAIN_AGENT"
    
    # Redeploy individual agents
    for agent in "${AGENTS[@]}"; do
        if [ -d "agents/${agent}" ]; then
            redeploy_project "agents/${agent}" "$agent"
        fi
    done
    
    # Redeploy future-agent
    if [ -d "../future-agent" ]; then
        redeploy_project "../future-agent" "future-agent"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Key rotation completed successfully!${NC}"

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}This was a dry run. To apply changes, run without --dry-run flag.${NC}"
else
    echo -e "${BLUE}All projects have been updated and redeployed with the new key.${NC}"
    echo -e "${YELLOW}Note: It may take a few minutes for all deployments to complete.${NC}"
fi

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Test a few endpoints to verify the new key works"
echo "2. Update your GitHub Secrets with the new key"
echo "3. Monitor logs for any issues"
echo "4. Consider updating any hardcoded references to the old key"