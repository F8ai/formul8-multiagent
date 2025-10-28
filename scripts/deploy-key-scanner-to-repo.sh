#!/bin/bash

# Deploy Key Scanner to Any F8ai Repository
# Usage: ./scripts/deploy-key-scanner-to-repo.sh [repo-path]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TARGET_REPO=${1:-.}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   OpenRouter Key Scanner Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Validate target repo
if [ ! -d "$TARGET_REPO/.git" ]; then
    echo -e "${RED}❌ Error: $TARGET_REPO is not a git repository${NC}"
    exit 1
fi

cd "$TARGET_REPO"
echo -e "${GREEN}📁 Target repository: $(pwd)${NC}"
echo ""

# Step 1: Create directories
echo -e "${YELLOW}Step 1: Creating directories...${NC}"
mkdir -p .github/workflows
mkdir -p scripts
echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Step 2: Copy workflow
echo -e "${YELLOW}Step 2: Installing GitHub Action workflow...${NC}"
cat > .github/workflows/scan-exposed-keys.yml << 'EOF'
name: Security - Scan for Exposed Keys

on:
  push:
    branches: ['**']
  pull_request:
    branches: ['**']
  schedule:
    - cron: '0 3 * * *'

permissions:
  contents: write
  issues: write
  pull-requests: write

jobs:
  scan-keys:
    uses: F8ai/formul8-multiagent/.github/workflows/reusable-key-scanner.yml@main
    with:
      auto-fix: true
      create-issue: true
      fail-on-detection: true
    secrets:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
EOF
echo -e "${GREEN}✅ Workflow installed${NC}"
echo ""

# Step 3: Download scanner script
echo -e "${YELLOW}Step 3: Downloading key scanner script...${NC}"
curl -s -o scripts/detect-exposed-keys.js \
    https://raw.githubusercontent.com/F8ai/formul8-multiagent/main/scripts/detect-exposed-keys.js
chmod +x scripts/detect-exposed-keys.js
echo -e "${GREEN}✅ Scanner script installed${NC}"
echo ""

# Step 4: Install pre-commit hook
echo -e "${YELLOW}Step 4: Installing pre-commit hook...${NC}"
curl -s -o scripts/pre-commit-key-check.sh \
    https://raw.githubusercontent.com/F8ai/formul8-multiagent/main/scripts/pre-commit-key-check.sh
chmod +x scripts/pre-commit-key-check.sh

# Ask if user wants to install the pre-commit hook
read -p "Install pre-commit hook? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp scripts/pre-commit-key-check.sh .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    echo -e "${GREEN}✅ Pre-commit hook installed${NC}"
else
    echo -e "${YELLOW}⚠️  Pre-commit hook not installed (you can install it later)${NC}"
fi
echo ""

# Step 5: Run initial scan
echo -e "${YELLOW}Step 5: Running initial security scan...${NC}"
node scripts/detect-exposed-keys.js --scan-all > scan-results.txt 2>&1 || true
cat scan-results.txt
echo ""

if grep -q "No exposed" scan-results.txt; then
    echo -e "${GREEN}✅ No exposed keys found in repository${NC}"
else
    echo -e "${RED}⚠️  Exposed keys detected!${NC}"
    read -p "Automatically fix exposed keys? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        node scripts/detect-exposed-keys.js --scan-all --fix
        echo -e "${GREEN}✅ Keys removed. Please review changes before committing.${NC}"
    else
        echo -e "${YELLOW}⚠️  Please fix manually: node scripts/detect-exposed-keys.js --scan-all --fix${NC}"
    fi
fi
rm -f scan-results.txt
echo ""

# Step 6: Commit changes
echo -e "${YELLOW}Step 6: Would you like to commit these changes?${NC}"
git status
echo ""
read -p "Commit changes? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .github/workflows/scan-exposed-keys.yml scripts/detect-exposed-keys.js scripts/pre-commit-key-check.sh
    git commit -m "🔒 Security: Add OpenRouter key scanner

- Automated detection and removal of exposed API keys
- GitHub Action workflow for CI/CD integration
- Pre-commit hook for local development
- Daily scheduled scans"
    echo -e "${GREEN}✅ Changes committed${NC}"
    echo ""
    echo -e "${BLUE}Next step: Push to GitHub to activate the workflow${NC}"
    echo -e "  ${GREEN}git push${NC}"
else
    echo -e "${YELLOW}⚠️  Changes staged but not committed${NC}"
    echo -e "Commit manually with: ${GREEN}git add -A && git commit -m 'Add key scanner'${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Key Scanner Successfully Deployed!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}What was installed:${NC}"
echo -e "  📄 GitHub Action workflow (.github/workflows/scan-exposed-keys.yml)"
echo -e "  🔍 Key scanner script (scripts/detect-exposed-keys.js)"
echo -e "  🪝 Pre-commit hook (scripts/pre-commit-key-check.sh)"
echo ""
echo -e "${YELLOW}What happens now:${NC}"
echo -e "  ✅ Every push is automatically scanned"
echo -e "  ✅ Pull requests are checked for exposed keys"
echo -e "  ✅ Daily scheduled scans run at 3 AM UTC"
echo -e "  ✅ Local commits are blocked if keys detected (if hook installed)"
echo ""
echo -e "${YELLOW}Manual commands:${NC}"
echo -e "  Scan:     ${GREEN}node scripts/detect-exposed-keys.js --scan-all${NC}"
echo -e "  Fix:      ${GREEN}node scripts/detect-exposed-keys.js --scan-all --fix${NC}"
echo -e "  Verbose:  ${GREEN}node scripts/detect-exposed-keys.js --scan-all --verbose${NC}"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo -e "  📖 Full guide: https://github.com/F8ai/formul8-multiagent/blob/main/docs/KEY_SCANNER_DEPLOYMENT_GUIDE.md"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

