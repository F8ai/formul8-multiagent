#!/bin/bash

# Script to get Supabase credentials using Supabase CLI
# Usage: ./scripts/get-supabase-credentials.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Getting Supabase Credentials${NC}\n"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install with: brew install supabase/tap/supabase"
    exit 1
fi

# Check if authenticated
if ! supabase projects list &>/dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with Supabase${NC}"
    echo "Please run: supabase login"
    echo "This will open a browser for authentication."
    read -p "Do you want to login now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        supabase login
    else
        exit 1
    fi
fi

echo -e "${GREEN}✅ Authenticated with Supabase${NC}\n"

# List projects and let user select
echo -e "${BLUE}Available Supabase Projects:${NC}\n"
supabase projects list

echo -e "\n${YELLOW}Finding formul8-platform project...${NC}\n"

# Try to find formul8-platform project
PROJECT_REF=$(supabase projects list --format json 2>/dev/null | \
    python3 -c "import sys, json; projects = json.load(sys.stdin); \
    match = next((p for p in projects if 'formul8' in p.get('name', '').lower() or 'f8' in p.get('name', '').lower()), None); \
    print(match['id'] if match else '')" 2>/dev/null || echo "")

if [ -z "$PROJECT_REF" ]; then
    echo -e "${YELLOW}Could not automatically find formul8-platform project.${NC}"
    echo -e "Please enter your project reference ID (from the list above):"
    read -p "Project Reference: " PROJECT_REF
    if [ -z "$PROJECT_REF" ]; then
        echo -e "${RED}❌ Project reference is required${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Using project: ${PROJECT_REF}${NC}\n"

# Get project details
echo -e "${BLUE}Fetching project details...${NC}\n"
PROJECT_INFO=$(supabase projects get "$PROJECT_REF" --format json 2>/dev/null || \
    supabase projects list --format json 2>/dev/null | \
    python3 -c "import sys, json; projects = json.load(sys.stdin); \
    match = next((p for p in projects if p.get('id') == '${PROJECT_REF}'), None); \
    print(json.dumps(match) if match else '{}')" 2>/dev/null)

if [ -z "$PROJECT_INFO" ] || [ "$PROJECT_INFO" = "{}" ]; then
    echo -e "${RED}❌ Could not fetch project details${NC}"
    echo "Try: supabase projects list"
    exit 1
fi

# Extract URL and other info
PROJECT_URL=$(echo "$PROJECT_INFO" | python3 -c "import sys, json; p = json.load(sys.stdin); print(p.get('database_url', '').replace('.supabase.co/', '.supabase.co') if 'database_url' in p else p.get('api_url', '') or p.get('endpoint', ''))" 2>/dev/null || echo "")

# Get API keys - these might not be available via CLI, so we'll need to guide user
echo -e "${GREEN}✅ Found Project!${NC}\n"
echo -e "${BLUE}Project Information:${NC}"
echo "$PROJECT_INFO" | python3 -m json.tool 2>/dev/null || echo "$PROJECT_INFO"
echo

# Note: Supabase CLI doesn't expose anon keys directly for security
# We need to guide user to dashboard
echo -e "${YELLOW}⚠️  Note: Supabase CLI cannot retrieve API keys directly.${NC}"
echo -e "${YELLOW}You'll need to get the anon key from the dashboard.${NC}\n"

if [ ! -z "$PROJECT_URL" ]; then
    SUPABASE_URL="$PROJECT_URL"
    echo -e "${GREEN}✅ SUPABASE_URL: ${SUPABASE_URL}${NC}"
else
    echo -e "${YELLOW}⚠️  Could not determine project URL from CLI${NC}"
    echo "You can find it at: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api"
    read -p "Enter Supabase URL (e.g., https://xxxxx.supabase.co): " SUPABASE_URL
fi

echo
echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "1. Go to: ${YELLOW}https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api${NC}"
echo -e "2. Copy the ${YELLOW}anon public${NC} key"
echo -e "3. Then set both values:"
echo
echo -e "${GREEN}SUPABASE_URL=${SUPABASE_URL}${NC}"
echo -e "${GREEN}SUPABASE_ANON_KEY=<your-anon-key>${NC}"
echo

# Option to set in Vercel if vercel CLI is available
if command -v vercel &> /dev/null; then
    read -p "Do you want to set these in Vercel now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "\n${YELLOW}Enter your Supabase anon key:${NC}"
        read -sp "SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
        echo
        
        if [ -z "$SUPABASE_ANON_KEY" ]; then
            echo -e "${RED}❌ SUPABASE_ANON_KEY is required${NC}"
            exit 1
        fi
        
        echo -e "\n${BLUE}Setting in Vercel...${NC}\n"
        
        # Set for production
        echo "$SUPABASE_URL" | vercel env add SUPABASE_URL production 2>/dev/null || \
            (echo "$SUPABASE_URL" | vercel env rm SUPABASE_URL production --yes 2>/dev/null; \
             echo "$SUPABASE_URL" | vercel env add SUPABASE_URL production)
        
        echo "$SUPABASE_ANON_KEY" | vercel env add SUPABASE_ANON_KEY production 2>/dev/null || \
            (echo "$SUPABASE_ANON_KEY" | vercel env rm SUPABASE_ANON_KEY production --yes 2>/dev/null; \
             echo "$SUPABASE_ANON_KEY" | vercel env add SUPABASE_ANON_KEY production)
        
        echo -e "${GREEN}✅ Credentials set in Vercel production!${NC}"
        echo -e "${YELLOW}Note: You may need to redeploy for changes to take effect.${NC}"
    fi
fi

echo -e "\n${GREEN}✅ Done!${NC}"
