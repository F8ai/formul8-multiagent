#!/bin/bash

# Quick script to set Supabase credentials with provided values
# Usage: SUPABASE_URL="..." SUPABASE_ANON_KEY="..." ./scripts/set-supabase-now.sh

set -e

SUPABASE_URL="${SUPABASE_URL:-https://zlgfmdpijpwizkzckyhm.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ2ZtZHBpanB3aXpremNreWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzc1OTIsImV4cCI6MjA3NDg1MzU5Mn0.2GHeHkdty_d5QcXE_FdDwsZDl25q0qGJfOBv0p-pw7g}"

echo "🔐 Setting Supabase credentials..."

if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install with: npm install -g vercel"
    exit 1
fi

if ! vercel whoami &> /dev/null; then
    echo "❌ Not authenticated. Run: vercel login"
    exit 1
fi

echo "Setting SUPABASE_URL: $SUPABASE_URL"
echo "$SUPABASE_URL" | vercel env rm SUPABASE_URL production --yes 2>/dev/null || true
echo "$SUPABASE_URL" | vercel env add SUPABASE_URL production

echo "Setting SUPABASE_ANON_KEY..."
echo "$SUPABASE_ANON_KEY" | vercel env rm SUPABASE_ANON_KEY production --yes 2>/dev/null || true
echo "$SUPABASE_ANON_KEY" | vercel env add SUPABASE_ANON_KEY production

echo "✅ Credentials set! Redeploying..."
vercel --prod --yes

echo "✅ Done! Visit https://chat.formul8.ai to verify"
