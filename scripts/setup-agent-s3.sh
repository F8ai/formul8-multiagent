#!/bin/bash
# Setup S3 data loading for a specific agent

AGENT_NAME="$1"

if [ -z "$AGENT_NAME" ]; then
  echo "Usage: ./scripts/setup-agent-s3.sh <agent-name>"
  echo ""
  echo "Example: ./scripts/setup-agent-s3.sh compliance"
  exit 1
fi

AGENT_DIR="agents/${AGENT_NAME}-agent"

if [ ! -d "$AGENT_DIR" ]; then
  echo "❌ Agent directory not found: $AGENT_DIR"
  exit 1
fi

echo "🔧 Setting up S3 data loading for ${AGENT_NAME}-agent..."
echo ""

# Create s3-config.json from template
echo "📝 Creating s3-config.json..."
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
sed "s/{{AGENT_NAME}}/${AGENT_NAME}/g" templates/s3-config.template.json | \
  sed "s/{{AGENT_DESCRIPTION}}/Agent data configuration/g" | \
  sed "s/{{MAIN_DATA_PATH}}/data\//g" | \
  sed "s/{{TIMESTAMP}}/${TIMESTAMP}/g" > "$AGENT_DIR/s3-config.json"
echo "✅ Created $AGENT_DIR/s3-config.json"

# Copy data-loader.js from template
echo "📝 Creating data-loader.js..."
cp templates/data-loader.template.js "$AGENT_DIR/data-loader.js"
echo "✅ Created $AGENT_DIR/data-loader.js"

# Add aws-sdk to package.json if not present
if [ -f "$AGENT_DIR/package.json" ]; then
  echo "📦 Checking package.json..."
  if ! grep -q "aws-sdk" "$AGENT_DIR/package.json"; then
    echo "📦 Adding aws-sdk dependency..."
    cd "$AGENT_DIR"
    npm install --save aws-sdk
    cd ../..
    echo "✅ Added aws-sdk"
  else
    echo "✅ aws-sdk already present"
  fi
else
  echo "⚠️  No package.json found, skipping dependency"
fi

echo ""
echo "✅ Setup complete for ${AGENT_NAME}-agent!"
echo ""
echo "Next steps:"
echo "1. Customize s3-config.json for your agent's data structure"
echo "2. Update lambda.js to use the data loader:"
echo "   const dataLoader = require('./data-loader');"
echo "   const data = await dataLoader.getData('your-key');"
echo "3. Test locally"
echo "4. Deploy to Vercel"

