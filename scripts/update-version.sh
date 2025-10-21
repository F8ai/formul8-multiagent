#!/bin/bash
# Update version info in chat.html with current commit ID

COMMIT_ID=$(git rev-parse --short HEAD)
TIMESTAMP=$(date -u +"%Y%m%d-%H%M")

echo "🔄 Updating version info..."
echo "   Commit: $COMMIT_ID"
echo "   Time: $TIMESTAMP"

# Update chat.html
sed -i.bak "s/v1\.0\.0-COMMIT_ID/v1.0.0-${COMMIT_ID} (${TIMESTAMP})/" chat.html

# Remove backup
rm -f chat.html.bak

echo "✅ Version updated to: v1.0.0-${COMMIT_ID} (${TIMESTAMP})"
