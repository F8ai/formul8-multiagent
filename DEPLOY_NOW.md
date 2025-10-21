# 🚀 Deploy Now - Quick Guide

## Current Status
✅ All code pushed to GitHub (commit: b52a5fe)
✅ Ready to deploy
⏳ Waiting for Vercel authentication

---

## Step 1: Login to Vercel

```bash
vercel login
```

**Choose:** Login with **dan@formul8.ai** account

---

## Step 2: Deploy Main Chat Interface

```bash
cd /Users/danielmcshan/GitHub/formul8-multiagent
vercel --prod
```

This deploys:
- chat.html (with sidebar, version, ads)
- baseline.json (questions)
- status-dashboard.html

**Expected URL:** https://f8.syzygyx.com/chat

---

## Step 3: Deploy All Agents (Automated)

```bash
./deploy-agents-to-vercel.sh
```

This deploys all 13 agents:
1. compliance-agent
2. science-agent
3. formulation-agent
4. marketing-agent
5. patent-agent
6. operations-agent
7. sourcing-agent
8. spectra-agent
9. mcr-agent
10. customer-success-agent
11. ad-agent
12. editor-agent
13. f8-slackbot

Each will appear with its proper name on Vercel dashboard!

---

## Step 4: Set Environment Variables

For each agent on Vercel dashboard:

1. Go to agent project → Settings → Environment Variables
2. Add:
   ```
   OPENROUTER_API_KEY = sk-or-v1-xxx
   ```

---

## Step 5: Verify Deployment

### Test Main Chat
```bash
curl https://f8.syzygyx.com/chat
# Should return HTML
```

### Test Health Monitoring
```bash
node health-monitor.js
# Should check all agents
```

### Test Baseline Collection
```bash
node scripts/collect-baselines-from-repos.js
# Should collect questions from agent repos
```

---

## Alternative: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import: `F8ai/formul8-multiagent`
3. **For main site:**
   - Root Directory: `.` (leave default)
   - Click Deploy

4. **For each agent:**
   - Create new project
   - Import same repo
   - Root Directory: `agents/compliance-agent` (change for each)
   - Click Deploy

---

## What Happens After Deployment

### Automatic Features:
✅ **Health checks every 15 min** - GitHub Actions monitors all agents
✅ **Daily baseline updates** - Collects questions from agent repos
✅ **Auto-deploy on push** - Each agent deploys when its folder changes
✅ **Version tracking** - Commit ID shown on page

### User Experience:
✅ **Free tier users** - See ads, auto-open sidebar with sign-in prompt
✅ **Logged-in users** - See conversation history in Projects → Conversations → Files
✅ **Questions rotate** - From baseline.json
✅ **User messages** - Appear on right side

---

## Quick Commands

```bash
# Deploy everything at once
vercel login
vercel --prod
./deploy-agents-to-vercel.sh

# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url]

# Run health check
node health-monitor.js
```

---

## Expected Vercel Dashboard

After deployment you'll see:

```
Projects (dan@formul8.ai):
├── formul8-multiagent (main chat)
├── compliance-agent ✓
├── science-agent ✓
├── formulation-agent ✓
├── marketing-agent ✓
├── patent-agent ✓
├── operations-agent ✓
├── sourcing-agent ✓
├── spectra-agent ✓
├── mcr-agent ✓
├── customer-success-agent ✓
├── ad-agent ✓
├── editor-agent ✓
└── f8-slackbot ✓
```

Each with proper name (not "lambda-package")!

---

## Troubleshooting

**"No existing credentials found"**
→ Run: `vercel login`

**"Project not found"**
→ First deployment creates it automatically

**Agent shows wrong name**
→ Check `agents/[agent]/vercel.json` has `"name": "[agent]"`

**No questions showing**
→ Baseline.json needs to be deployed with main site

---

## Support

- GitHub: https://github.com/F8ai/formul8-multiagent
- Actions: https://github.com/F8ai/formul8-multiagent/actions

---

**Ready to deploy!** Just run:
```bash
vercel login
vercel --prod
```
