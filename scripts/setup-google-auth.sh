#!/bin/bash

# Setup Google OAuth for Formul8 Multiagent Chat
# This script sets up Google OAuth using gcloud CLI

set -e

echo "🔐 Setting up Google OAuth for Formul8..."
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed."
    echo ""
    echo "Please install gcloud CLI first:"
    echo "  macOS: brew install --cask google-cloud-sdk"
    echo "  Linux: curl https://sdk.cloud.google.com | bash"
    echo "  Or visit: https://cloud.google.com/sdk/docs/install"
    echo ""
    exit 1
fi

echo "✅ gcloud CLI is installed"
echo ""

# Get or prompt for project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo "No Google Cloud project is currently set."
    echo ""
    read -p "Enter your Google Cloud Project ID (or press Enter to create a new one): " PROJECT_ID
    
    if [ -z "$PROJECT_ID" ]; then
        echo "Creating a new Google Cloud project..."
        PROJECT_ID="formul8-multiagent-$(date +%s)"
        gcloud projects create $PROJECT_ID --name="Formul8 Multiagent"
        echo "✅ Created project: $PROJECT_ID"
    fi
    
    gcloud config set project $PROJECT_ID
fi

echo "📋 Using project: $PROJECT_ID"
echo ""

# Enable necessary APIs
echo "🔧 Enabling required Google APIs..."
gcloud services enable iamcredentials.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudidentity.googleapis.com --project=$PROJECT_ID
echo "✅ APIs enabled"
echo ""

# Create OAuth consent screen (manual step required)
echo "📝 OAuth Consent Screen Configuration Required"
echo ""
echo "Please complete these steps manually in Google Cloud Console:"
echo "  1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT_ID"
echo "  2. Select 'External' user type"
echo "  3. Fill in the required fields:"
echo "     - App name: Formul8 Multiagent Chat"
echo "     - User support email: your-email@example.com"
echo "     - Developer contact: your-email@example.com"
echo "  4. Add scopes: email, profile, openid"
echo "  5. Save and continue"
echo ""
read -p "Press Enter once you've completed the OAuth consent screen setup..."

# Create OAuth 2.0 Client ID
echo ""
echo "🔑 Creating OAuth 2.0 Client ID..."
echo ""

# Prompt for authorized redirect URIs
echo "Enter your authorized redirect URIs (one per line, press Enter twice when done):"
echo "Examples:"
echo "  - https://f8.syzygyx.com/auth/callback"
echo "  - http://localhost:8000/auth/callback (for local testing)"
echo ""

REDIRECT_URIS=""
while true; do
    read -p "Redirect URI (or Enter to finish): " URI
    if [ -z "$URI" ]; then
        break
    fi
    if [ -z "$REDIRECT_URIS" ]; then
        REDIRECT_URIS="$URI"
    else
        REDIRECT_URIS="$REDIRECT_URIS,$URI"
    fi
done

# Prompt for authorized JavaScript origins
echo ""
echo "Enter your authorized JavaScript origins (one per line, press Enter twice when done):"
echo "Examples:"
echo "  - https://f8.syzygyx.com"
echo "  - http://localhost:8000 (for local testing)"
echo ""

JS_ORIGINS=""
while true; do
    read -p "JavaScript Origin (or Enter to finish): " ORIGIN
    if [ -z "$ORIGIN" ]; then
        break
    fi
    if [ -z "$JS_ORIGINS" ]; then
        JS_ORIGINS="$ORIGIN"
    else
        JS_ORIGINS="$JS_ORIGINS,$ORIGIN"
    fi
done

# Create the OAuth client
echo ""
echo "Creating OAuth 2.0 client..."

# Note: gcloud doesn't have a direct command to create OAuth clients
# We need to use the Cloud Console or REST API
echo ""
echo "⚠️  OAuth Client Creation (Manual Step Required)"
echo ""
echo "Please create an OAuth 2.0 Client ID manually:"
echo "  1. Go to: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "  2. Click '+ CREATE CREDENTIALS' → 'OAuth client ID'"
echo "  3. Application type: 'Web application'"
echo "  4. Name: 'Formul8 Multiagent Chat'"
echo "  5. Authorized JavaScript origins:"
for ORIGIN in $(echo $JS_ORIGINS | tr ',' '\n'); do
    echo "     - $ORIGIN"
done
echo "  6. Authorized redirect URIs:"
for URI in $(echo $REDIRECT_URIS | tr ',' '\n'); do
    echo "     - $URI"
done
echo "  7. Click 'CREATE'"
echo ""
echo "  8. Copy the Client ID and Client Secret"
echo ""
read -p "Press Enter once you've created the OAuth client..."

# Prompt for credentials
echo ""
read -p "Enter your OAuth Client ID: " CLIENT_ID
read -p "Enter your OAuth Client Secret: " CLIENT_SECRET

# Save credentials to config file
CONFIG_FILE="config/google-oauth.json"
mkdir -p config

cat > $CONFIG_FILE <<EOF
{
  "web": {
    "client_id": "$CLIENT_ID",
    "project_id": "$PROJECT_ID",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "$CLIENT_SECRET",
    "redirect_uris": [$(echo $REDIRECT_URIS | sed 's/,/", "/g' | sed 's/^/"/' | sed 's/$/"/')],
    "javascript_origins": [$(echo $JS_ORIGINS | sed 's/,/", "/g' | sed 's/^/"/' | sed 's/$/"/')],
    "scopes": [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ]
  }
}
EOF

echo "✅ Configuration saved to $CONFIG_FILE"
echo ""

# Create .env entries
echo "📝 Adding to .env file..."
if [ ! -f .env ]; then
    touch .env
fi

# Check if entries already exist
if grep -q "GOOGLE_CLIENT_ID" .env; then
    sed -i.bak "s/^GOOGLE_CLIENT_ID=.*/GOOGLE_CLIENT_ID=$CLIENT_ID/" .env
    sed -i.bak "s/^GOOGLE_CLIENT_SECRET=.*/GOOGLE_CLIENT_SECRET=$CLIENT_SECRET/" .env
else
    echo "" >> .env
    echo "# Google OAuth Configuration" >> .env
    echo "GOOGLE_CLIENT_ID=$CLIENT_ID" >> .env
    echo "GOOGLE_CLIENT_SECRET=$CLIENT_SECRET" >> .env
    echo "GOOGLE_REDIRECT_URI=https://f8.syzygyx.com/auth/callback" >> .env
fi

echo "✅ Environment variables added to .env"
echo ""

# Install required npm packages
echo "📦 Installing required npm packages..."
npm install google-auth-library jsonwebtoken --save

echo ""
echo "🎉 Google OAuth Setup Complete!"
echo ""
echo "Next steps:"
echo "  1. Update your Vercel environment variables with:"
echo "     - GOOGLE_CLIENT_ID=$CLIENT_ID"
echo "     - GOOGLE_CLIENT_SECRET=$CLIENT_SECRET"
echo "     - GOOGLE_REDIRECT_URI=https://f8.syzygyx.com/auth/callback"
echo ""
echo "  2. Deploy your application"
echo ""
echo "  3. Test the login flow"
echo ""

