#!/bin/bash
# Sync agent code from formul8-multiagent/agents/ to separate repos

set -e

COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_RESET='\033[0m'

MULTIAGENT_DIR="/Users/danielmcshan/GitHub/formul8-multiagent"
AGENTS_BASE="/Users/danielmcshan/GitHub"

# Agents to sync
AGENTS=(
  "compliance"
  "formulation"
  "science"
  "operations"
  "marketing"
  "sourcing"
  "patent"
  "spectra"
  "customer-success"
  "mcr"
  "ad"
)

TOTAL=0
SYNCED=0
FAILED=0

echo -e "${COLOR_BLUE}🔄 Syncing agent code to separate repos...${COLOR_RESET}"
echo ""

for AGENT in "${AGENTS[@]}"; do
  TOTAL=$((TOTAL + 1))
  
  SOURCE_DIR="${MULTIAGENT_DIR}/agents/${AGENT}-agent"
  TARGET_DIR="${AGENTS_BASE}/${AGENT}-agent"
  
  echo -e "${COLOR_BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}"
  echo -e "${COLOR_BLUE}📦 ${AGENT}-agent${COLOR_RESET}"
  echo -e "${COLOR_BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}"
  
  # Check if target repo exists
  if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${COLOR_YELLOW}⚠️  Target repo not found: $TARGET_DIR${COLOR_RESET}"
    echo -e "${COLOR_YELLOW}   Skipping...${COLOR_RESET}"
    echo ""
    continue
  fi
  
  # Check if source exists
  if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${COLOR_RED}❌ Source not found: $SOURCE_DIR${COLOR_RESET}"
    FAILED=$((FAILED + 1))
    echo ""
    continue
  fi
  
  echo "📂 Source: $SOURCE_DIR"
  echo "📂 Target: $TARGET_DIR"
  echo ""
  
  # Sync files (excluding data directory and node_modules)
  echo "🔄 Syncing files..."
  rsync -av \
    --exclude 'data/' \
    --exclude 'node_modules/' \
    --exclude '.git/' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    "$SOURCE_DIR/" "$TARGET_DIR/"
  
  # Navigate to target repo
  cd "$TARGET_DIR"
  
  # Check git status
  if git diff --quiet && git diff --cached --quiet; then
    echo -e "${COLOR_YELLOW}ℹ️  No changes to commit${COLOR_RESET}"
    echo ""
    continue
  fi
  
  # Add all changes
  git add -A
  
  # Show what changed
  echo ""
  echo "📋 Changes:"
  git status --short | head -10
  if [ $(git status --short | wc -l) -gt 10 ]; then
    echo "   ... and $(($(git status --short | wc -l) - 10)) more files"
  fi
  echo ""
  
  # Commit
  git commit -m "feat: Add S3 data loading infrastructure

- Added data-loader.js with in-memory caching
- Added s3-config.json for S3 configuration
- Added aws-sdk dependency
- Updated from formul8-multiagent central repo
- Ready for S3 data access with 1hr cache TTL" || echo "Nothing to commit"
  
  # Push
  echo "🚀 Pushing to GitHub..."
  if git push origin main 2>&1 || git push origin master 2>&1; then
    echo -e "${COLOR_GREEN}✅ Successfully synced ${AGENT}-agent${COLOR_RESET}"
    SYNCED=$((SYNCED + 1))
  else
    echo -e "${COLOR_RED}❌ Failed to push ${AGENT}-agent${COLOR_RESET}"
    FAILED=$((FAILED + 1))
  fi
  
  echo ""
done

# Summary
echo -e "${COLOR_BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}"
echo -e "${COLOR_GREEN}🎉 Sync Complete!${COLOR_RESET}"
echo -e "${COLOR_BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}"
echo ""
echo -e "📊 Summary:"
echo -e "   Total agents: ${TOTAL}"
echo -e "   ${COLOR_GREEN}✅ Synced: ${SYNCED}${COLOR_RESET}"
echo -e "   ${COLOR_RED}❌ Failed: ${FAILED}${COLOR_RESET}"
echo ""
echo -e "${COLOR_GREEN}All agent repos updated!${COLOR_RESET}"

