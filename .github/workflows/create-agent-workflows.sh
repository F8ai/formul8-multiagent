#!/bin/bash
# Generate GitHub Actions workflows for all agents

agents=(
  "marketing-agent"
  "patent-agent"
  "operations-agent"
  "sourcing-agent"
  "spectra-agent"
  "mcr-agent"
  "customer-success-agent"
  "ad-agent"
  "editor-agent"
  "f8-slackbot"
)

for agent in "${agents[@]}"; do
  # Convert agent name to title case for display
  title=$(echo "$agent" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')
  
  # Convert to uppercase with underscores for secret name
  secret_suffix=$(echo "$agent" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
  
  cat > ".github/workflows/deploy-${agent}.yml" << WORKFLOW
name: Deploy ${title}

on:
  push:
    branches:
      - main
    paths:
      - 'agents/${agent}/**'
      - '.github/workflows/deploy-${agent}.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=\${{ secrets.VERCEL_TOKEN }}
        working-directory: ./agents/${agent}

      - name: Build Project Artifacts
        run: vercel build --prod --token=\${{ secrets.VERCEL_TOKEN }}
        working-directory: ./agents/${agent}

      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=\${{ secrets.VERCEL_TOKEN }}
        working-directory: ./agents/${agent}
        env:
          VERCEL_ORG_ID: \${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: \${{ secrets.VERCEL_${secret_suffix}_PROJECT_ID }}

      - name: Verify Deployment
        run: |
          echo "✅ ${title} deployed successfully!"
          echo "🔗 Check status at: https://vercel.com/dashboard"
WORKFLOW

  echo "✅ Created workflow for ${agent}"
done

echo ""
echo "🎉 All agent workflows created!"
