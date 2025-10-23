# Agent Deployment Architecture

## Overview

Formul8 uses a **centralized key management** system where only the main application stores the OpenRouter API key. Individual agents receive the key via API calls.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  chat.formul8.ai (Main System)                                  │
│  ├── Stores: OPENROUTER_API_KEY                                 │
│  ├── Rotates: Monthly via GitHub Actions                        │
│  └── Passes key to agents per request                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
  │ compliance  │ │ formulation │ │  science    │
  │   -agent    │ │   -agent    │ │   -agent    │
  │             │ │             │ │             │
  │ No key      │ │ No key      │ │ No key      │
  │ stored!     │ │ stored!     │ │ stored!     │
  └─────────────┘ └─────────────┘ └─────────────┘
  
  API Call format:
  POST /api/chat
  {
    "message": "user question",
    "api_key": "OPENROUTER_API_KEY",  ← passed in request
    "plan": "free|standard|enterprise"
  }
```

## Agent Repositories

### Separate Repos (Pull on deploy)
- `F8ai/compliance-agent` - Cannabis compliance expert with S3 data
- `F8ai/formulation-agent` - Product formulation specialist
- `F8ai/marketing-agent` - Brand and marketing strategy
- `F8ai/customer-success-agent` - Customer retention expert
- `F8ai/mcr-agent` - Master Control Records
- `F8ai/ad-agent` - Advertising campaigns

### Embedded in Multiagent (Deploy directly)
- `agents/science-agent` - Research and cannabinoids
- `agents/operations-agent` - Facility management
- `agents/sourcing-agent` - Supply chain
- `agents/patent-agent` - IP research
- `agents/spectra-agent` - Quality testing
- `agents/editor-agent` - Content management
- `agents/f8-slackbot` - Team collaboration

## Deployment Methods

### Method 1: GitHub Actions (Recommended)

Deploy any agent via GitHub Actions UI:

1. Go to: https://github.com/F8ai/formul8-multiagent/actions
2. Select: "Deploy Agent On Demand"
3. Click: "Run workflow"
4. Choose: Agent name + deployment type
5. Click: "Run workflow"

### Method 2: CLI Script

```bash
cd /Users/danielmcshan/GitHub/formul8-multiagent

# Deploy to production
./scripts/deploy-agent.sh compliance-agent production

# Deploy preview
./scripts/deploy-agent.sh formulation-agent preview
```

The script will:
- ✅ Check if agent has separate repo
- ✅ Clone repo if separate, or use embedded version
- ✅ Install dependencies
- ✅ Deploy to Vercel
- ✅ Clean up temporary files

### Method 3: Manual Deployment

For separate agent repo:
```bash
cd /Users/danielmcshan/GitHub/compliance-agent
git pull
npm install
vercel --prod
```

For embedded agent:
```bash
cd /Users/danielmcshan/GitHub/formul8-multiagent/agents/science-agent
npm install
vercel --prod
```

## Key Rotation

**Monthly automated rotation** (1st of month at 3 AM UTC):

1. ✅ New key created via OpenRouter API
2. ✅ GitHub secret `OPENROUTER_API_KEY` updated
3. ✅ Vercel environment variable updated
4. ✅ Main application redeployed
5. ✅ New key tested
6. ✅ Old key deactivated

**Agents don't need redeployment** - they receive the new key automatically via API calls!

### Manual Rotation

```bash
# Trigger rotation workflow
gh workflow run rotate-keys-deploy-main.yml
```

## Security Benefits

| Traditional (Each agent has key) | Centralized (Current) |
|----------------------------------|-----------------------|
| 13 keys to manage | 1 key to manage |
| 13 rotation points | 1 rotation point |
| 13 deployment updates needed | 0 agent deployments needed |
| Key exposed in 13 places | Key only in main system |
| Higher attack surface | Minimal attack surface |

## Environment Variables

### Main System (chat.formul8.ai)
```bash
OPENROUTER_API_KEY=sk-or-v1-xxx  # Rotated monthly
OPENROUTER_PROVISIONING_KEY=xxx   # For rotation script
AWS_ACCESS_KEY_ID=xxx             # For S3 data access
AWS_SECRET_ACCESS_KEY=xxx         # For S3 data access
```

### Individual Agents
```bash
# Agents DON'T store OPENROUTER_API_KEY
# They only need:
AWS_ACCESS_KEY_ID=xxx             # For S3 (compliance-agent only)
AWS_SECRET_ACCESS_KEY=xxx         # For S3 (compliance-agent only)
```

## Adding a New Agent

### Option 1: Separate Repo (Recommended for complex agents)

```bash
# 1. Create new repo
gh repo create F8ai/new-agent --public

# 2. Clone and setup
cd /Users/danielmcshan/GitHub
gh repo clone F8ai/new-agent
cd new-agent

# 3. Copy template
cp -r ../formul8-multiagent/agents/compliance-agent/* .

# 4. Customize agent
# Edit lambda.js, package.json, etc.

# 5. Deploy
vercel --prod

# 6. Test
curl https://new-agent.f8.syzygyx.com/health
```

### Option 2: Embedded (For simpler agents)

```bash
# 1. Create in multiagent repo
cd /Users/danielmcshan/GitHub/formul8-multiagent
mkdir -p agents/new-agent

# 2. Copy template
cp -r agents/compliance-agent/* agents/new-agent/

# 3. Customize and deploy
cd agents/new-agent
npm install
vercel --prod
```

## Agent Communication

Agents receive requests from main system:

```javascript
// Main system (chat.formul8.ai)
const response = await fetch('https://compliance-agent.f8.syzygyx.com/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "What are CA licensing requirements?",
    api_key: process.env.OPENROUTER_API_KEY,  // ← Key passed here
    plan: 'free',
    username: 'user123'
  })
});

// Agent receives and uses key
const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${req.body.api_key}`  // ← Key from request
  },
  // ...
});
```

## Monitoring

### Check Agent Status
```bash
# All agents
for agent in compliance formulation science; do
  curl -s https://$agent-agent.f8.syzygyx.com/health | jq .
done

# Specific agent
curl https://compliance-agent.f8.syzygyx.com/health | jq .
```

### Vercel Logs
```bash
vercel logs compliance-agent-f8 --follow
```

### GitHub Actions Status
```bash
gh run list --workflow=rotate-keys-deploy-main.yml
```

## Troubleshooting

### Agent not receiving key
Check main system passes it:
```bash
# Check main system env
vercel env ls

# Test agent with manual key
curl -X POST https://compliance-agent.f8.syzygyx.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","api_key":"sk-or-v1-xxx","plan":"free"}'
```

### Agent deployment fails
```bash
# Check if separate repo exists
gh repo view F8ai/agent-name

# If not, check embedded version
ls -la agents/agent-name

# Redeploy
./scripts/deploy-agent.sh agent-name production
```

### Key rotation fails
```bash
# Check provisioning key
gh secret list | grep PROVISIONING

# Manually test OpenRouter API
curl -X POST https://openrouter.ai/api/v1/keys \
  -H "Authorization: Bearer $OPENROUTER_PROVISIONING_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"test","limit":100}'
```

## Benefits Summary

✅ **Single point of key management**  
✅ **Automatic monthly rotation**  
✅ **No agent redeployment needed for key rotation**  
✅ **Reduced attack surface**  
✅ **Centralized monitoring**  
✅ **Pull agent repos only when needed**  
✅ **Independent agent updates**

---

**Last Updated**: 2025-10-23  
**Contact**: dan@formul8.ai

