#!/bin/bash

###############################################################################
# Scheduled Key Rotation Script
# 
# This script is designed to run automatically via cron for regular key rotation
# Recommended schedule: Monthly (first day of month at 2 AM)
# 
# Cron example:
# 0 2 1 * * /path/to/scheduled-key-rotation.sh >> /var/log/openrouter-rotation.log 2>&1
#
# Or use with GitHub Actions for automated cloud-based rotation
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Log file
LOG_FILE="${PROJECT_ROOT}/logs/key-rotation-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "${PROJECT_ROOT}/logs"

# Redirect all output to log file and console
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Scheduled Key Rotation${NC}"
echo -e "${BLUE}$(date)${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check if provisioning key is set
if [ -z "$OPENROUTER_PROVISIONING_KEY" ]; then
    echo -e "${RED}❌ Error: OPENROUTER_PROVISIONING_KEY not set${NC}"
    echo -e "${YELLOW}Please set the environment variable before running this script${NC}"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js not found${NC}"
    exit 1
fi

# Check if Vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Error: Vercel CLI not found${NC}"
    echo -e "${YELLOW}Install with: npm install -g vercel${NC}"
    exit 1
fi

# Run the rotation
echo -e "${YELLOW}Starting automated key rotation...${NC}"
echo ""

cd "$PROJECT_ROOT"

# Run key rotation with old key deletion
if node scripts/openrouter-key-manager.js rotate --delete-old; then
    echo ""
    echo -e "${GREEN}✅ Key rotation completed successfully!${NC}"
    echo -e "${BLUE}Log saved to: ${LOG_FILE}${NC}"
    
    # Optional: Send notification (uncomment and configure as needed)
    # curl -X POST "https://api.slack.com/your-webhook" \
    #   -H "Content-Type: application/json" \
    #   -d "{\"text\": \"✅ OpenRouter API key rotation completed successfully\"}"
    
    exit 0
else
    echo ""
    echo -e "${RED}❌ Key rotation failed!${NC}"
    echo -e "${BLUE}Log saved to: ${LOG_FILE}${NC}"
    
    # Optional: Send error notification (uncomment and configure as needed)
    # curl -X POST "https://api.slack.com/your-webhook" \
    #   -H "Content-Type: application/json" \
    #   -d "{\"text\": \"❌ OpenRouter API key rotation FAILED! Check logs immediately.\"}"
    
    exit 1
fi


