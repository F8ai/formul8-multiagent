#!/bin/bash

# Deploy Formul8 with Google OAuth
# This script prepares and deploys the application with Google authentication

set -e

echo "🚀 Deploying Formul8 with Google OAuth..."
echo ""

# Check required environment variables
if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "❌ Error: GOOGLE_CLIENT_ID not set"
    echo "Please run: export GOOGLE_CLIENT_ID=your-client-id"
    exit 1
fi

if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "⚠️  Warning: GOOGLE_CLIENT_SECRET not set"
    echo "Make sure it's set in your Vercel environment variables"
fi

if [ -z "$JWT_SECRET" ]; then
    echo "⚠️  Warning: JWT_SECRET not set"
    echo "Generating a random JWT_SECRET..."
    JWT_SECRET=$(openssl rand -base64 32)
    export JWT_SECRET
    echo "Generated JWT_SECRET: $JWT_SECRET"
    echo "Please save this and add it to your Vercel environment variables"
fi

echo "✅ Environment variables checked"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install google-auth-library jsonwebtoken --save
echo "✅ Dependencies installed"
echo ""

# Inject Google Client ID into chat.html
echo "🔧 Injecting Google Client ID into chat.html..."
node scripts/inject-google-client-id.js
echo "✅ Client ID injected"
echo ""

# Copy chat.html to public directory
echo "📄 Copying chat.html to public directory..."
mkdir -p public
cp chat.html public/chat.html
echo "✅ Files copied"
echo ""

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo ""
echo "Make sure the following environment variables are set in Vercel:"
echo "  - GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID"
echo "  - GOOGLE_CLIENT_SECRET=(set in Vercel dashboard)"
echo "  - JWT_SECRET=$JWT_SECRET"
echo ""

read -p "Have you set these environment variables in Vercel? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please set the environment variables in Vercel first:"
    echo "  1. Go to: https://vercel.com/your-project/settings/environment-variables"
    echo "  2. Add the environment variables listed above"
    echo "  3. Re-run this script"
    echo ""
    exit 1
fi

# Deploy
echo ""
echo "Deploying to Vercel..."
vercel --prod

echo ""
echo "✨ Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Test the Google Sign-In button at your deployed URL"
echo "  2. Verify that authentication works correctly"
echo "  3. Check that user sessions are maintained"
echo ""

