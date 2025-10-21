#!/bin/bash
# Quick script to sync baselines and commit

echo "🔄 Syncing baseline questions from all agent repos..."
echo ""

node scripts/collect-baselines-from-repos.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Baseline collection complete"
    echo ""
    
    # Check if there are changes
    if git diff --quiet baseline.json; then
        echo "✅ No changes detected"
    else
        echo "📝 Changes detected, committing..."
        git add baseline.json baseline-summary.md
        git commit -m "Update baseline questions from agent repos [automated]"
        
        echo ""
        read -p "Push to origin? (y/N) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin main
            echo "✅ Pushed to origin"
        fi
    fi
else
    echo "❌ Baseline collection failed"
    exit 1
fi
