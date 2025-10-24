#!/bin/bash
# Sync all agent data directories to S3
# S3 Structure: s3://formul8-platform-deployments/data/{agent-name}/

set -e

BUCKET_NAME="formul8-platform-deployments"
S3_BASE="data"
COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_RESET='\033[0m'

echo "🔄 Syncing all agent data to S3..."
echo ""

# Define agents and their paths (space-separated)
AGENTS=(
  "compliance-agent:/Users/danielmcshan/GitHub/compliance-agent/data"
  "sourcing-agent:/Users/danielmcshan/GitHub/sourcing-agent/data"
  "metabolomics-agent:/Users/danielmcshan/GitHub/metabolomics-agent/data"
  "future-agent:/Users/danielmcshan/GitHub/future-agent/data"
  "patent-agent:/Users/danielmcshan/GitHub/patent-agent/data"
  "mcr-agent:/Users/danielmcshan/GitHub/mcr-agent/data"
  "formulation-agent:/Users/danielmcshan/GitHub/formulation-agent/data"
  "operations-agent:/Users/danielmcshan/GitHub/operations-agent/data"
)

# Track stats
TOTAL_AGENTS=0
SYNCED_AGENTS=0
SKIPPED_AGENTS=0
FAILED_AGENTS=0

for AGENT_ENTRY in "${AGENTS[@]}"; do
  AGENT=$(echo "$AGENT_ENTRY" | cut -d: -f1)
  LOCAL_PATH=$(echo "$AGENT_ENTRY" | cut -d: -f2)
  S3_PATH="s3://${BUCKET_NAME}/${S3_BASE}/${AGENT}/"
  
  TOTAL_AGENTS=$((TOTAL_AGENTS + 1))
  
  echo -e "${COLOR_BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}"
  echo -e "${COLOR_BLUE}📦 Agent: ${AGENT}${COLOR_RESET}"
  echo -e "${COLOR_BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}"
  
  # Check if directory exists
  if [ ! -d "$LOCAL_PATH" ]; then
    echo -e "${COLOR_YELLOW}⚠️  No data directory found: ${LOCAL_PATH}${COLOR_RESET}"
    SKIPPED_AGENTS=$((SKIPPED_AGENTS + 1))
    echo ""
    continue
  fi
  
  # Check if directory is empty
  if [ -z "$(ls -A $LOCAL_PATH 2>/dev/null)" ]; then
    echo -e "${COLOR_YELLOW}⚠️  Empty data directory, skipping${COLOR_RESET}"
    SKIPPED_AGENTS=$((SKIPPED_AGENTS + 1))
    echo ""
    continue
  fi
  
  # Get directory size
  SIZE=$(du -sh "$LOCAL_PATH" | cut -f1)
  FILE_COUNT=$(find "$LOCAL_PATH" -type f | wc -l | tr -d ' ')
  
  echo -e "📊 Size: ${SIZE}"
  echo -e "📁 Files: ${FILE_COUNT}"
  echo -e "📂 Source: ${LOCAL_PATH}"
  echo -e "☁️  Target: ${S3_PATH}"
  echo ""
  
  # Sync to S3
  echo "🚀 Syncing..."
  if aws s3 sync "$LOCAL_PATH" "$S3_PATH" \
    --storage-class INTELLIGENT_TIERING \
    --exclude "*.pyc" \
    --exclude "__pycache__/*" \
    --exclude ".DS_Store" \
    --exclude "*.log" \
    --exclude "node_modules/*" \
    --exclude "venv/*" \
    --exclude "gdrive_env/*" \
    --exclude ".git/*"; then
    
    echo -e "${COLOR_GREEN}✅ Successfully synced ${AGENT}${COLOR_RESET}"
    SYNCED_AGENTS=$((SYNCED_AGENTS + 1))
    
    # Create index file
    cat > /tmp/agent_index.json <<EOF
{
  "agent": "${AGENT}",
  "lastUpdated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "size": "${SIZE}",
  "files": ${FILE_COUNT},
  "s3Path": "${S3_PATH}",
  "localPath": "${LOCAL_PATH}"
}
EOF
    
    aws s3 cp /tmp/agent_index.json "s3://${BUCKET_NAME}/${S3_BASE}/${AGENT}/index.json" \
      --content-type "application/json"
    
    echo -e "${COLOR_GREEN}📝 Created index.json${COLOR_RESET}"
  else
    echo -e "${COLOR_RED}❌ Failed to sync ${AGENT}${COLOR_RESET}"
    FAILED_AGENTS=$((FAILED_AGENTS + 1))
  fi
  
  echo ""
done

# Create master index
echo -e "${COLOR_BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}"
echo -e "${COLOR_BLUE}📋 Creating master index${COLOR_RESET}"
echo -e "${COLOR_BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}"

# Build JSON agents array
AGENTS_JSON="["
FIRST=true
for AGENT_ENTRY in "${AGENTS[@]}"; do
  AGENT=$(echo "$AGENT_ENTRY" | cut -d: -f1)
  LOCAL_PATH=$(echo "$AGENT_ENTRY" | cut -d: -f2)
  
  if [ -d "$LOCAL_PATH" ] && [ -n "$(ls -A $LOCAL_PATH 2>/dev/null)" ]; then
    if [ "$FIRST" = false ]; then
      AGENTS_JSON="${AGENTS_JSON},"
    fi
    SIZE=$(du -sh "$LOCAL_PATH" | cut -f1)
    AGENTS_JSON="${AGENTS_JSON}
    {
      \"name\": \"${AGENT}\",
      \"size\": \"${SIZE}\",
      \"path\": \"${S3_BASE}/${AGENT}/\",
      \"url\": \"s3://${BUCKET_NAME}/${S3_BASE}/${AGENT}/\"
    }"
    FIRST=false
  fi
done
AGENTS_JSON="${AGENTS_JSON}
  ]"

cat > /tmp/master_index.json <<EOF
{
  "lastUpdated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "bucket": "${BUCKET_NAME}",
  "basePath": "${S3_BASE}",
  "agents": ${AGENTS_JSON},
  "stats": {
    "totalAgents": ${TOTAL_AGENTS},
    "synced": ${SYNCED_AGENTS},
    "skipped": ${SKIPPED_AGENTS},
    "failed": ${FAILED_AGENTS}
  }
}
EOF

aws s3 cp /tmp/master_index.json "s3://${BUCKET_NAME}/${S3_BASE}/index.json" \
  --content-type "application/json"

echo -e "${COLOR_GREEN}✅ Master index created${COLOR_RESET}"
echo ""

# Summary
echo -e "${COLOR_BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}"
echo -e "${COLOR_GREEN}🎉 Sync Complete!${COLOR_RESET}"
echo -e "${COLOR_BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}"
echo ""
echo -e "📊 Summary:"
echo -e "   Total agents: ${TOTAL_AGENTS}"
echo -e "   ${COLOR_GREEN}✅ Synced: ${SYNCED_AGENTS}${COLOR_RESET}"
echo -e "   ${COLOR_YELLOW}⚠️  Skipped: ${SKIPPED_AGENTS}${COLOR_RESET}"
echo -e "   ${COLOR_RED}❌ Failed: ${FAILED_AGENTS}${COLOR_RESET}"
echo ""
echo -e "🔗 S3 Base: s3://${BUCKET_NAME}/${S3_BASE}/"
echo -e "📋 Master index: s3://${BUCKET_NAME}/${S3_BASE}/index.json"
echo ""
echo -e "${COLOR_GREEN}All agent data is now available in S3!${COLOR_RESET}"

# Cleanup
rm -f /tmp/agent_index.json /tmp/master_index.json
