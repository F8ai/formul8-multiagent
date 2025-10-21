# GitHub Secrets Setup for Auto-Deploy

## Required for Auto-Deploy on Push

Go to: https://github.com/F8ai/formul8-multiagent/settings/secrets/actions

Click "New repository secret" and add each of these:

### 1. VERCEL_TOKEN (Required)

**How to get it:**
```bash
# Login to Vercel
vercel login

# Create a new token
# Go to: https://vercel.com/account/tokens
# Click "Create Token"
# Name it: "GitHub Actions - Formul8"
# Copy the token
```

**Add to GitHub:**
- Name: `VERCEL_TOKEN`
- Value: `your-vercel-token-here`

### 2. VERCEL_ORG_ID (Required)

**How to get it:**
```bash
# In your project directory
vercel link

# Or check your Vercel dashboard
# Settings → General → Team ID (if team) or User ID
```

**Add to GitHub:**
- Name: `VERCEL_ORG_ID`
- Value: `your-org-id-here`

### 3. SLACK_WEBHOOK_URL (Optional - for health alerts)

**How to get it:**
1. Go to your Slack workspace
2. Add "Incoming Webhooks" app
3. Create webhook for your channel
4. Copy the webhook URL

**Add to GitHub:**
- Name: `SLACK_WEBHOOK_URL`
- Value: `https://hooks.slack.com/services/YOUR/WEBHOOK/URL`

---

## Verify Setup

After adding secrets, push a change to test:

```bash
# Make a small change
echo "# Test" >> README.md
git add README.md
git commit -m "Test auto-deploy"
git push origin main
```

Then check:
1. Go to: https://github.com/F8ai/formul8-multiagent/actions
2. You should see workflows running
3. Wait for completion
4. Check Vercel dashboard for new deployment

---

## What Auto-Deploys

### Main Chat Interface
**Triggers:** Push to `chat.html` or `baseline.json`
**Deploys:** Main site with chat interface
**Workflow:** `.github/workflows/deploy-chat.yml`

### Individual Agents
**Triggers:** Push to `agents/[agent-name]/**`
**Deploys:** Specific agent only
**Workflows:** `.github/workflows/deploy-[agent-name].yml` (13 workflows)

### All Agents
**Triggers:** Push to `agents/**/lambda.js` or manual trigger
**Deploys:** All 13 agents
**Workflow:** `.github/workflows/deploy-all-agents.yml`

### Health Checks
**Triggers:** Every 15 minutes (cron) or manual
**Action:** Checks all agent health, creates issues if down
**Workflow:** `.github/workflows/health-check.yml`

### Baseline Updates
**Triggers:** Daily at 2 AM UTC or manual
**Action:** Collects questions from agent repos
**Workflow:** `.github/workflows/update-baseline.yml`

---

## Testing the Setup

### 1. Test Chat Deployment
```bash
# Make a small change to chat.html
sed -i '' 's/Ask anything/Ask me anything/' chat.html
git add chat.html
git commit -m "Test: update placeholder"
git push origin main

# Watch GitHub Actions
# https://github.com/F8ai/formul8-multiagent/actions
```

### 2. Test Agent Deployment
```bash
# Make a small change to an agent
echo "// Test change" >> agents/compliance-agent/lambda.js
git add agents/compliance-agent/lambda.js
git commit -m "Test: compliance agent deploy"
git push origin main

# Watch GitHub Actions - should deploy only compliance-agent
```

### 3. Test Manual Deploy
```bash
# Go to GitHub Actions
# Click "Deploy All Agents"
# Click "Run workflow"
# Watch all 13 agents deploy
```

---

## Troubleshooting

### Workflow fails with "Resource not accessible"
**Solution:** Add VERCEL_TOKEN to GitHub Secrets

### Workflow fails with "Project not found"
**Solution:** 
- First deployment creates project automatically
- Or manually create project on Vercel first
- Or remove VERCEL_PROJECT_ID from workflow

### Deployment succeeds but site doesn't update
**Solution:**
- Check Vercel dashboard for deployment logs
- Verify domain is pointing to correct project
- Clear CDN/browser cache

### Health check creates too many issues
**Solution:**
- Adjust frequency in `.github/workflows/health-check.yml`
- Change from `*/15 * * * *` to `*/30 * * * *` (every 30 min)

---

## Manual Override

If you need to deploy manually (bypassing GitHub Actions):

```bash
vercel login
cd /Users/danielmcshan/GitHub/formul8-multiagent

# Deploy main site
vercel --prod

# Deploy specific agent
cd agents/compliance-agent
vercel --prod
cd ../..
```

---

## Status Check

After setup, verify everything works:

```bash
# 1. Check GitHub Actions are running
curl https://api.github.com/repos/F8ai/formul8-multiagent/actions/runs | jq '.workflow_runs[0]'

# 2. Check main site
curl https://f8.syzygyx.com/chat | grep "v1.0.0"

# 3. Run health check locally
node health-monitor.js

# 4. Check Vercel deployments
vercel ls
```

---

## Current Status

✅ Code pushed to GitHub (commit: b32c0e0)
✅ 18 GitHub Actions workflows configured
✅ Chat interface ready with version tracking
✅ Health monitoring active
✅ Baseline system configured

⏳ **Next:** Add VERCEL_TOKEN and VERCEL_ORG_ID to GitHub Secrets

Then push any change and watch it auto-deploy! 🚀
