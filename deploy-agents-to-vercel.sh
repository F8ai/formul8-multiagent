#!/bin/bash
# Deploy all agents to Vercel with proper names
# Make sure you're logged in: vercel login

echo "🚀 Deploying Formul8 Agents to Vercel"
echo "======================================"
echo ""
echo "⚠️  Make sure you're logged in as dan@formul8.ai:"
echo "   vercel whoami"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Array of agent directories
agents=(
  "compliance-agent"
  "science-agent"
  "formulation-agent"
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

# Deploy each agent
for agent in "${agents[@]}"; do
  echo ""
  echo "📦 Deploying: $agent"
  echo "-------------------"
  
  cd "agents/$agent" || exit
  
  # Deploy to production
  vercel --prod
  
  cd ../..
  
  echo "✅ Deployed: $agent"
done

echo ""
echo "🎉 All agents deployed!"
echo ""
echo "Next steps:"
echo "1. Verify at: https://vercel.com/dashboard"
echo "2. Check each agent shows with its proper name"
echo "3. Test health endpoints for each agent"
