#!/bin/bash

# Deploy Formul8 to Vercel with Password Protection
# This script helps you deploy with authentication enabled

set -e

echo "🔒 Formul8 Protected Deployment to Vercel"
echo "=========================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "📝 Please login to Vercel:"
    vercel login
fi

echo ""
echo "Setting up password protection..."
echo ""

# Prompt for credentials if not set
read -p "Enter username for authentication (default: admin): " AUTH_USER
AUTH_USER=${AUTH_USER:-admin}

read -sp "Enter password for authentication: " AUTH_PASS
echo ""

if [ -z "$AUTH_PASS" ]; then
    echo "❌ Password cannot be empty!"
    exit 1
fi

echo ""
echo "Checking environment variables..."

# Check if env vars exist and remove them
if vercel env ls production | grep -q "AUTH_USERNAME"; then
    echo "Removing existing AUTH_USERNAME..."
    echo "$AUTH_USER" | vercel env rm AUTH_USERNAME production -y || true
fi

if vercel env ls production | grep -q "AUTH_PASSWORD"; then
    echo "Removing existing AUTH_PASSWORD..."
    echo "$AUTH_PASS" | vercel env rm AUTH_PASSWORD production -y || true
fi

# Add new environment variables
echo ""
echo "Adding environment variables..."
echo "$AUTH_USER" | vercel env add AUTH_USERNAME production
echo "$AUTH_PASS" | vercel env add AUTH_PASSWORD production

# Copy protected config to vercel.json
echo ""
echo "Updating Vercel configuration..."
cp vercel-protected.json vercel.json

echo ""
echo "🚀 Deploying to Vercel..."
vercel --prod --yes

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your site is now protected with Basic Authentication:"
echo "  Username: $AUTH_USER"
echo "  Password: ********"
echo ""
echo "Don't forget to save these credentials securely!"

