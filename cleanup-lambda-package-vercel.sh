#!/bin/bash
# Clean up old lambda-package Vercel project

echo "🧹 Cleaning up lambda-package Vercel project"
echo "============================================="
echo ""

# Check if logged in
echo "Checking Vercel login..."
vercel whoami || {
  echo "❌ Not logged in to Vercel"
  echo "Please run: vercel login"
  exit 1
}

echo ""
echo "📋 Current Vercel projects:"
vercel ls | grep -E "lambda-package|formul8"

echo ""
echo "⚠️  This will:"
echo "   1. Remove lambda-package project from Vercel"
echo "   2. Delete local .vercel config"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Cancelled"
  exit 0
fi

# Check if project exists in .vercel
if [ -f "lambda-package/.vercel/project.json" ]; then
  PROJECT_ID=$(cat lambda-package/.vercel/project.json | grep projectId | cut -d'"' -f4)
  PROJECT_NAME=$(cat lambda-package/.vercel/project.json | grep name | cut -d'"' -f4)
  
  echo ""
  echo "🗑️  Removing Vercel project: $PROJECT_NAME (ID: $PROJECT_ID)"
  
  # Remove from Vercel
  cd lambda-package
  vercel remove $PROJECT_NAME --yes 2>&1 || echo "⚠️  Project might already be deleted or renamed"
  cd ..
  
  # Remove local .vercel folder
  echo "🗑️  Removing local .vercel config..."
  rm -rf lambda-package/.vercel
  
  echo "✅ Cleaned up lambda-package"
else
  echo "ℹ️  No .vercel config found in lambda-package"
fi

echo ""
echo "📋 Remaining Vercel projects:"
vercel ls | grep formul8 || echo "No formul8 projects found"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Optional: You can also delete the entire lambda-package directory if not needed:"
echo "  rm -rf lambda-package"
