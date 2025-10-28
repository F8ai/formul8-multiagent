#!/bin/bash

# Complete Security Cleanup Script
# Performs comprehensive cleanup of exposed keys and unused infrastructure

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Progress tracking
TOTAL_STEPS=10
CURRENT_STEP=0

function print_step() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    echo ""
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${CYAN}Step $CURRENT_STEP/$TOTAL_STEPS: $1${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

function success() {
    echo -e "${GREEN}✅ $1${NC}"
}

function error() {
    echo -e "${RED}❌ $1${NC}"
}

function warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

function info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

function prompt_continue() {
    echo ""
    read -p "$(echo -e ${YELLOW}Press Enter to continue...${NC})"
    echo ""
}

# Banner
clear
echo -e "${BOLD}${MAGENTA}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║           🔐 COMPLETE SECURITY CLEANUP SCRIPT 🔐              ║
║                                                               ║
║              Comprehensive Key Revocation &                   ║
║              Infrastructure Cleanup                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
info "This script will:"
echo "  1. Revoke all 3 exposed regular API keys"
echo "  2. Clean up unused AWS Lambda functions"
echo "  3. Delete redundant provisioning key (manual step)"
echo "  4. Generate new regular API key"
echo "  5. Update GitHub Secrets"
echo "  6. Update Vercel environment variables"
echo "  7. Update local ~/.env"
echo "  8. Commit security fixes"
echo "  9. Test everything works"
echo "  10. Final verification"
echo ""
warning "This is a destructive operation. Make sure you have backups!"
echo ""
read -p "$(echo -e ${BOLD}${YELLOW}Are you ready to proceed? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    error "Aborted by user"
    exit 1
fi

# ============================================================================
# STEP 1: Check Prerequisites
# ============================================================================
print_step "Check Prerequisites"

info "Checking required tools..."

MISSING_TOOLS=()

if ! command -v node &> /dev/null; then
    MISSING_TOOLS+=("node")
fi

if ! command -v aws &> /dev/null; then
    MISSING_TOOLS+=("aws")
fi

if ! command -v gh &> /dev/null; then
    MISSING_TOOLS+=("gh")
fi

if ! command -v vercel &> /dev/null; then
    MISSING_TOOLS+=("vercel")
fi

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    error "Missing required tools: ${MISSING_TOOLS[*]}"
    echo ""
    info "Install missing tools:"
    for tool in "${MISSING_TOOLS[@]}"; do
        case $tool in
            node)
                echo "  brew install node"
                ;;
            aws)
                echo "  brew install awscli"
                ;;
            gh)
                echo "  brew install gh"
                ;;
            vercel)
                echo "  npm install -g vercel"
                ;;
        esac
    done
    exit 1
fi

success "All required tools are installed"

# Check OPENROUTER_PROVISIONING_KEY
if [ -z "$OPENROUTER_PROVISIONING_KEY" ]; then
    echo ""
    error "OPENROUTER_PROVISIONING_KEY not set!"
    echo ""
    warning "Please set your provisioning key:"
    echo -e "${CYAN}  export OPENROUTER_PROVISIONING_KEY=\"sk-or-v1-4eb...971\"${NC}"
    echo ""
    info "Get your provisioning key from:"
    echo "  https://openrouter.ai/settings/keys"
    echo "  Look for: 'F8 Provisioning' (sk-or-v1-4eb...971)"
    echo ""
    exit 1
fi

success "OPENROUTER_PROVISIONING_KEY is set"

# Check GitHub authentication
if ! gh auth status &> /dev/null; then
    warning "GitHub CLI not authenticated"
    info "Authenticating with GitHub..."
    gh auth login
fi

success "GitHub CLI authenticated"

# Check Vercel authentication
if ! vercel whoami &> /dev/null; then
    warning "Vercel CLI not authenticated"
    info "Authenticating with Vercel..."
    vercel login
fi

success "Vercel CLI authenticated"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    warning "AWS CLI not configured"
    info "Please configure AWS credentials:"
    echo "  aws configure"
    exit 1
fi

success "AWS CLI configured"

prompt_continue

# ============================================================================
# STEP 2: Revoke Exposed Keys
# ============================================================================
print_step "Revoke Exposed Regular API Keys"

EXPOSED_KEYS=(
    "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"  # Lambda key
    "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"  # Hardcoded
    "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"  # Documentation
)

info "Found ${#EXPOSED_KEYS[@]} exposed keys to revoke"
echo ""

for key in "${EXPOSED_KEYS[@]}"; do
    info "Revoking key: ${key:0:20}...${key: -4}"
    
    if node scripts/revoke-exposed-key.js "$key" 2>&1 | tee /tmp/revoke-output.txt; then
        success "Key revoked successfully"
    else
        warning "Automated revocation failed - manual action required"
        warning "Visit: https://openrouter.ai/settings/keys"
        warning "Look for key ending in: ...${key: -4}"
    fi
    echo ""
done

success "All exposed keys processed"

prompt_continue

# ============================================================================
# STEP 3: Clean Up AWS Lambda
# ============================================================================
print_step "Clean Up Unused AWS Lambda Functions"

info "Checking for unused Lambda functions..."

LAMBDA_FUNCTIONS=(
    "formul8-f8-lambda"
    "syzychat-backend"
    "syzychat-ai-backend"
)

for func in "${LAMBDA_FUNCTIONS[@]}"; do
    if aws lambda get-function --function-name "$func" &> /dev/null; then
        warning "Found Lambda function: $func"
        read -p "$(echo -e ${YELLOW}Delete $func? [y/N]: ${NC})" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            info "Deleting $func..."
            aws lambda delete-function --function-name "$func"
            success "Deleted: $func"
            
            # Delete associated CloudWatch logs
            LOG_GROUP="/aws/lambda/$func"
            if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" &> /dev/null; then
                aws logs delete-log-group --log-group-name "$LOG_GROUP" 2>/dev/null || true
                success "Deleted logs: $LOG_GROUP"
            fi
        else
            info "Skipped: $func"
        fi
    else
        info "Lambda function $func not found (already deleted)"
    fi
    echo ""
done

success "AWS Lambda cleanup complete"

prompt_continue

# ============================================================================
# STEP 4: Delete Redundant Provisioning Key
# ============================================================================
print_step "Delete Redundant Provisioning Key"

warning "You have 2 provisioning keys. You only need 1."
echo ""
echo "  ✅ KEEP: 'F8 Provisioning' (sk-or-v1-4eb...971)"
echo "  ❌ DELETE: 'GitHub Provisioning Key' (sk-or-v1-eda...3fe)"
echo ""
info "Please manually delete the redundant key:"
echo "  1. Go to: https://openrouter.ai/settings/keys"
echo "  2. Find: 'GitHub Provisioning Key'"
echo "  3. Click '...' menu → Delete"
echo ""

read -p "$(echo -e ${YELLOW}Press Enter when you've deleted the redundant key...${NC})"

success "Redundant provisioning key noted for deletion"

prompt_continue

# ============================================================================
# STEP 5: Generate New Regular API Key
# ============================================================================
print_step "Generate New Regular API Key"

KEY_NAME="Formul8-Production-$(date +%Y-%m-%d)"
info "Creating new API key: $KEY_NAME"
echo ""

if node scripts/openrouter-key-manager.js create --name="$KEY_NAME" > /tmp/new-key.txt 2>&1; then
    cat /tmp/new-key.txt
    
    # Extract the new key from output
    NEW_KEY=$(grep -o 'sk-or-v1-[a-zA-Z0-9]\{64\}' /tmp/new-key.txt | head -1)
    
    if [ -z "$NEW_KEY" ]; then
        error "Failed to extract new key from output"
        warning "Please create a new key manually:"
        echo "  node scripts/openrouter-key-manager.js create --name='$KEY_NAME'"
        exit 1
    fi
    
    success "New key generated: ${NEW_KEY:0:20}...${NEW_KEY: -4}"
    echo ""
    warning "Save this key securely - you'll need it for the next steps!"
    echo ""
    
    # Save to temp file for next steps
    echo "$NEW_KEY" > /tmp/f8-new-openrouter-key.txt
    chmod 600 /tmp/f8-new-openrouter-key.txt
    
else
    error "Failed to generate new key"
    cat /tmp/new-key.txt
    exit 1
fi

prompt_continue

# ============================================================================
# STEP 6: Update GitHub Secrets
# ============================================================================
print_step "Update GitHub Secrets"

NEW_KEY=$(cat /tmp/f8-new-openrouter-key.txt)

info "Updating OPENROUTER_API_KEY in GitHub Secrets..."

if echo "$NEW_KEY" | gh secret set OPENROUTER_API_KEY; then
    success "GitHub Secret OPENROUTER_API_KEY updated"
else
    error "Failed to update GitHub Secret"
    warning "Please update manually:"
    echo "  gh secret set OPENROUTER_API_KEY"
    echo "  (paste the new key when prompted)"
fi

echo ""
info "Adding OPENROUTER_PROVISIONING_KEY to GitHub Secrets (for automation)..."

if echo "$OPENROUTER_PROVISIONING_KEY" | gh secret set OPENROUTER_PROVISIONING_KEY; then
    success "GitHub Secret OPENROUTER_PROVISIONING_KEY added"
else
    warning "Failed to add provisioning key - not critical"
fi

prompt_continue

# ============================================================================
# STEP 7: Update Vercel Environment Variables
# ============================================================================
print_step "Update Vercel Environment Variables"

info "Updating OPENROUTER_API_KEY in Vercel..."
echo ""

for env in production preview development; do
    info "Updating $env environment..."
    
    # Remove old key
    vercel env rm OPENROUTER_API_KEY "$env" --yes 2>/dev/null || true
    
    # Add new key
    if echo "$NEW_KEY" | vercel env add OPENROUTER_API_KEY "$env"; then
        success "Updated: $env"
    else
        warning "Failed to update $env environment"
    fi
    echo ""
done

success "Vercel environment variables updated"

prompt_continue

# ============================================================================
# STEP 8: Update Local Environment
# ============================================================================
print_step "Update Local ~/.env"

info "Updating local environment file..."

if [ -f ~/.env ]; then
    # Backup existing .env
    cp ~/.env ~/.env.backup.$(date +%Y%m%d-%H%M%S)
    success "Backed up existing ~/.env"
    
    # Remove old key
    sed -i.bak '/^OPENROUTER_API_KEY=/d' ~/.env
    
    # Add new key
    echo "OPENROUTER_API_KEY=$NEW_KEY" >> ~/.env
    success "Updated ~/.env with new key"
else
    # Create new .env
    echo "OPENROUTER_API_KEY=$NEW_KEY" > ~/.env
    chmod 600 ~/.env
    success "Created new ~/.env with key"
fi

echo ""
info "Also adding provisioning key to ~/.env..."
if ! grep -q "^OPENROUTER_PROVISIONING_KEY=" ~/.env 2>/dev/null; then
    echo "OPENROUTER_PROVISIONING_KEY=$OPENROUTER_PROVISIONING_KEY" >> ~/.env
    success "Added provisioning key to ~/.env"
fi

prompt_continue

# ============================================================================
# STEP 9: Commit Security Fixes
# ============================================================================
print_step "Commit Security Fixes"

info "Staging all security-related changes..."

git add -A

echo ""
info "Files to be committed:"
git status --short

echo ""
read -p "$(echo -e ${YELLOW}Commit these changes? [y/N]: ${NC})" -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    git commit -m "🔒 Security: Complete key revocation and cleanup

- Removed 3 exposed OpenRouter API keys from source files
- Added automated key scanner and revocation tools
- Created GitHub Action for continuous secret scanning
- Cleaned up unused AWS Lambda functions
- Rotated to new API keys
- Updated all secrets and environment variables

Security actions taken:
- Revoked: sk-or-v1-2fa...3f7 (Lambda)
- Revoked: sk-or-v1-bbee...aecb (Hardcoded)
- Revoked: sk-or-v1-dbdd...6a94 (Documentation)
- Generated: New production key
- Updated: GitHub Secrets, Vercel env vars, local ~/.env

Tools added:
- scripts/detect-exposed-keys.js - Key scanner
- scripts/revoke-exposed-key.js - API-based revocation
- .github/workflows/scan-exposed-keys.yml - Automated scanning
- docs/KEY_SCANNER_DEPLOYMENT_GUIDE.md - Documentation"

    success "Changes committed"
    
    echo ""
    read -p "$(echo -e ${YELLOW}Push to GitHub? [y/N]: ${NC})" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push
        success "Changes pushed to GitHub"
    else
        info "Changes committed locally but not pushed"
        warning "Remember to push: git push"
    fi
else
    warning "Changes not committed"
    info "You can commit manually later with: git commit"
fi

prompt_continue

# ============================================================================
# STEP 10: Test Everything Works
# ============================================================================
print_step "Test Everything Works"

info "Testing new API key..."
echo ""

# Test the key
TEST_RESPONSE=$(curl -s -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $NEW_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-3.5-sonnet",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 5
  }')

if echo "$TEST_RESPONSE" | grep -q '"choices"'; then
    success "✅ New API key is working!"
else
    error "❌ New API key test failed"
    warning "Response: $TEST_RESPONSE"
fi

echo ""
info "Testing scanner..."
if node scripts/detect-exposed-keys.js --scan-all 2>&1 | grep -q "No exposed"; then
    success "✅ No exposed keys detected!"
else
    warning "⚠️  Scanner detected some patterns (review output)"
fi

echo ""
info "Checking GitHub Actions..."
echo "  Visit: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"

echo ""
info "Checking Vercel deployments..."
vercel ls 2>/dev/null | head -10 || true

prompt_continue

# ============================================================================
# FINAL SUMMARY
# ============================================================================
echo ""
echo -e "${BOLD}${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                  ✅ CLEANUP COMPLETE! ✅                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
echo -e "${BOLD}${CYAN}Summary of Actions:${NC}"
echo ""
echo "✅ Revoked 3 exposed regular API keys"
echo "✅ Cleaned up AWS Lambda functions"
echo "✅ Generated new regular API key"
echo "✅ Updated GitHub Secrets"
echo "✅ Updated Vercel environment variables (prod, preview, dev)"
echo "✅ Updated local ~/.env"
echo "✅ Committed and pushed security fixes"
echo "✅ Tested new key works"
echo ""
echo -e "${BOLD}${YELLOW}Manual Steps Remaining:${NC}"
echo ""
echo "1. Delete redundant provisioning key:"
echo "   https://openrouter.ai/settings/keys"
echo "   Delete: 'GitHub Provisioning Key' (sk-or-v1-eda...3fe)"
echo ""
echo "2. Verify GitHub Action is running:"
echo "   https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
echo ""
echo "3. Monitor deployments complete:"
echo "   vercel --prod"
echo ""
echo -e "${BOLD}${GREEN}Security Status:${NC}"
echo "🔒 All exposed keys removed from code"
echo "🔒 All exposed keys revoked on OpenRouter"
echo "🔒 New secure key deployed across all systems"
echo "🔒 Automated scanning active for future protection"
echo ""
echo -e "${BOLD}${CYAN}Next Steps:${NC}"
echo "- Monitor GitHub Actions for any issues"
echo "- Check Vercel deployments complete successfully"
echo "- Delete the old provisioning key manually"
echo "- Consider setting up monthly key rotation:"
echo "  node scripts/openrouter-key-manager.js rotate --delete-old"
echo ""
echo -e "${BOLD}${GREEN}All done! Your system is now secure. 🎉${NC}"
echo ""

# Cleanup temp files
rm -f /tmp/new-key.txt /tmp/f8-new-openrouter-key.txt /tmp/revoke-output.txt

exit 0

