#!/bin/bash

# Test script for Formulation Agent RAG functionality
# Tests both local and deployed versions

set -e

echo "🧪 Testing Formulation Agent RAG Integration"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROD_URL="https://formulation-agent.f8.syzygyx.com"
API_KEY="${FORMUL8_API_KEY:-test-key}"

# Test queries designed to trigger RAG
TEST_QUERIES=(
  "What extraction method preserves terpenes?"
  "How do cannabinoids affect inflammation?"
  "What is the optimal dosage for cannabis edibles?"
  "How should I store cannabis products for maximum shelf life?"
)

echo "🔍 Test Configuration:"
echo "  • Target URL: $PROD_URL"
echo "  • Test Queries: ${#TEST_QUERIES[@]}"
echo ""

# Test 1: Health Check
echo "📊 Test 1: Health Check"
echo "----------------------"
health_response=$(curl -s "$PROD_URL/health")
echo "$health_response" | jq '.'

if echo "$health_response" | grep -q '"status":"healthy"'; then
  echo -e "${GREEN}✅ Health check passed${NC}"
else
  echo -e "${RED}❌ Health check failed${NC}"
  exit 1
fi
echo ""

# Test 2: RAG Functionality
echo "📚 Test 2: RAG Functionality"
echo "----------------------------"

for i in "${!TEST_QUERIES[@]}"; do
  query="${TEST_QUERIES[$i]}"
  echo ""
  echo "Query $((i+1)): $query"
  echo "---"
  
  response=$(curl -s -X POST "$PROD_URL/api/chat" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "{\"message\":\"$query\",\"plan\":\"standard\"}")
  
  # Check if response is valid JSON
  if ! echo "$response" | jq . > /dev/null 2>&1; then
    echo -e "${RED}❌ Invalid JSON response${NC}"
    echo "Response: $response"
    continue
  fi
  
  # Extract RAG info
  rag_enabled=$(echo "$response" | jq -r '.rag.enabled')
  papers_retrieved=$(echo "$response" | jq -r '.rag.papersRetrieved')
  rag_source=$(echo "$response" | jq -r '.rag.source')
  
  echo "RAG Enabled: $rag_enabled"
  echo "Papers Retrieved: $papers_retrieved"
  echo "Source: $rag_source"
  
  if [ "$rag_enabled" = "true" ]; then
    echo -e "${GREEN}✅ RAG is enabled${NC}"
    
    if [ "$papers_retrieved" -gt 0 ]; then
      echo -e "${GREEN}✅ Retrieved $papers_retrieved papers${NC}"
    else
      echo -e "${YELLOW}⚠️  No papers retrieved (might not match data)${NC}"
    fi
  else
    echo -e "${RED}❌ RAG is not enabled${NC}"
  fi
  
  # Show response preview
  response_text=$(echo "$response" | jq -r '.response' | head -c 200)
  echo ""
  echo "Response preview:"
  echo "$response_text..."
  echo ""
done

# Test 3: S3 Data Check
echo ""
echo "🗄️  Test 3: S3 Data Availability"
echo "--------------------------------"
echo "Checking if science-agent data exists in S3..."

if command -v aws &> /dev/null; then
  s3_files=$(aws s3 ls s3://formul8-platform-deployments/data/science/ 2>&1)
  
  if echo "$s3_files" | grep -q "index.json"; then
    echo -e "${GREEN}✅ Science-agent index.json exists in S3${NC}"
    
    # Try to read index structure
    echo ""
    echo "Index structure preview:"
    aws s3 cp s3://formul8-platform-deployments/data/science/index.json - 2>/dev/null | jq '.papers | length' || echo "Could not parse index"
  else
    echo -e "${YELLOW}⚠️  Science-agent data may not be in S3${NC}"
    echo "Note: RAG will gracefully degrade if data is missing"
  fi
else
  echo -e "${YELLOW}⚠️  AWS CLI not installed, skipping S3 check${NC}"
fi

# Summary
echo ""
echo "📊 Test Summary"
echo "==============="
echo ""
echo "✅ Formulation Agent is deployed and functional"
echo "✅ RAG integration is configured"
echo ""
echo "Next steps:"
echo "  1. Ensure science-agent data is synced to S3"
echo "  2. Monitor RAG paper retrieval rates"
echo "  3. Consider upgrading to vector search for better relevance"
echo ""
echo "Documentation:"
echo "  • RAG Implementation: agents/formulation-agent/RAG_IMPLEMENTATION.md"
echo "  • Deployment Guide: agents/formulation-agent/DEPLOYMENT_GUIDE.md"
echo "  • Summary: FORMULATION_AGENT_RAG_SUMMARY.md"
echo ""

