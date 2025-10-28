#!/bin/bash

# Watch for baseline test results and auto-push to GitHub Pages
# This enables real-time dashboard updates

WATCH_FILE="docs/baseline-results/latest.json"
PUSH_INTERVAL=60  # Push every 60 seconds if changes detected
LAST_HASH=""

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║     🔄 REAL-TIME GITHUB PAGES UPDATER                            ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "Watching: $WATCH_FILE"
echo "Push interval: ${PUSH_INTERVAL}s"
echo "Target: https://f8ai.github.io/formul8-multiagent/baseline.html"
echo ""
echo "Press Ctrl+C to stop"
echo ""

while true; do
    if [ -f "$WATCH_FILE" ]; then
        # Calculate hash of the file
        if command -v md5 &> /dev/null; then
            CURRENT_HASH=$(md5 -q "$WATCH_FILE")
        else
            CURRENT_HASH=$(md5sum "$WATCH_FILE" | awk '{print $1}')
        fi
        
        # Check if file has changed
        if [ "$CURRENT_HASH" != "$LAST_HASH" ] && [ -n "$LAST_HASH" ]; then
            echo "[$(date +%H:%M:%S)] 📝 Changes detected in $WATCH_FILE"
            
            # Get current test progress from file
            PROGRESS=$(grep -o '"completed":[0-9]*' "$WATCH_FILE" 2>/dev/null | cut -d':' -f2)
            TOTAL=$(grep -o '"totalQuestions":[0-9]*' "$WATCH_FILE" 2>/dev/null | cut -d':' -f2)
            
            if [ -n "$PROGRESS" ] && [ -n "$TOTAL" ]; then
                echo "[$(date +%H:%M:%S)] 📊 Progress: $PROGRESS/$TOTAL questions"
            fi
            
            # Stage changes
            git add "$WATCH_FILE" 2>/dev/null
            
            # Commit with progress info
            if [ -n "$PROGRESS" ]; then
                COMMIT_MSG="Update baseline results: $PROGRESS/$TOTAL questions completed"
            else
                COMMIT_MSG="Update baseline results: $(date +%H:%M:%S)"
            fi
            
            git commit -m "$COMMIT_MSG" --quiet 2>/dev/null
            
            if [ $? -eq 0 ]; then
                echo "[$(date +%H:%M:%S)] 💾 Committed changes"
                
                # Push to GitHub
                echo "[$(date +%H:%M:%S)] 🚀 Pushing to GitHub Pages..."
                git push origin main --quiet 2>&1 | grep -v "To https://github.com"
                
                if [ $? -eq 0 ]; then
                    echo "[$(date +%H:%M:%S)] ✅ Pushed to GitHub! Dashboard updating..."
                    echo "[$(date +%H:%M:%S)] 🔗 View at: https://f8ai.github.io/formul8-multiagent/baseline.html"
                    echo ""
                else
                    echo "[$(date +%H:%M:%S)] ⚠️  Push failed (maybe nothing to push)"
                fi
            else
                echo "[$(date +%H:%M:%S)] ℹ️  No changes to commit"
            fi
        else
            if [ -z "$LAST_HASH" ]; then
                echo "[$(date +%H:%M:%S)] 👀 Started watching $WATCH_FILE"
            fi
        fi
        
        LAST_HASH="$CURRENT_HASH"
    else
        if [ -n "$LAST_HASH" ]; then
            echo "[$(date +%H:%M:%S)] ⚠️  File disappeared: $WATCH_FILE"
            LAST_HASH=""
        fi
    fi
    
    sleep $PUSH_INTERVAL
done




