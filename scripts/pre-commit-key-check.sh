#!/bin/bash

# Pre-commit hook to prevent committing exposed OpenRouter API keys
# Install: cp scripts/pre-commit-key-check.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Checking for exposed API keys...${NC}"

# Check if the scanner script exists
if [ ! -f "scripts/detect-exposed-keys.js" ]; then
    echo -e "${YELLOW}⚠️  Key scanner not found, downloading...${NC}"
    curl -s -o scripts/detect-exposed-keys.js \
        https://raw.githubusercontent.com/F8ai/formul8-multiagent/main/scripts/detect-exposed-keys.js
    chmod +x scripts/detect-exposed-keys.js
fi

# Run the scanner on staged files only
node scripts/detect-exposed-keys.js > /dev/null 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo -e "${RED}❌ COMMIT BLOCKED: Exposed API keys detected!${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Your commit contains exposed OpenRouter API keys.${NC}"
    echo ""
    echo -e "To fix this:"
    echo -e "  1. Run: ${GREEN}node scripts/detect-exposed-keys.js --scan-all --fix${NC}"
    echo -e "  2. Review the changes"
    echo -e "  3. Stage the fixed files: ${GREEN}git add -A${NC}"
    echo -e "  4. Try committing again"
    echo ""
    echo -e "Or to see details:"
    echo -e "  ${GREEN}node scripts/detect-exposed-keys.js --scan-all${NC}"
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi

echo -e "${GREEN}✅ No exposed API keys found${NC}"
exit 0

