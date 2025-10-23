# 🚀 Deploy with Vercel CLI - Quick Guide

## Current Issue
GitHub Actions are failing because:
- ❌ `VERCEL_TOKEN` secret is empty
- ❌ `VERCEL_ORG_ID` secret is empty

## Solution: Use Vercel CLI

### Step 1: Login to Vercel

```bash
vercel login
```

**Choose:** Login with **dan@formul8.ai**

This will:
1. Open browser for authentication
2. Save your credentials locally
3. Allow CLI to deploy

### Step 2: Deploy Main Chat Interface

```bash
cd /Users/danielmcshan/GitHub/formul8-multiagent
vercel --prod
```

**Expected output:**
```
🔍  Inspect: https://vercel.com/...
✅  Production: https://f8.syzygyx.com
```

### Step 3: Verify Deployment

```bash
curl https://f8.syzygyx.com/chat.html | grep "v1.0.0"
```

Should show: `v1.0.0-690c6a2` (or newer)

### Step 4: Deploy Individual Agents (Optional)

```bash
# Deploy all agents automatically
./deploy-agents-to-vercel.sh

# Or deploy one agent manually
cd agents/compliance-agent
vercel --prod
cd ../..
```

---

## Alternative: Add GitHub Secrets

If you want auto-deploy on push:

### Get VERCEL_TOKEN:

```bash
# After logging in
vercel whoami  # Confirm you're logged in

# Then go to: https://vercel.com/account/tokens
# Click "Create Token"
# Name: "GitHub Actions - Formul8"
# Scope: Full Account
# Copy the token
```

### Get VERCEL_ORG_ID:

```bash
cd /Users/danielmcshan/GitHub/formul8-multiagent
cat .vercel/project.json
```

Look for `orgId` field, or get from: https://vercel.com/account

### Add to GitHub:

1. Go to: https://github.com/F8ai/formul8-multiagent/settings/secrets/actions
2. Click on `VERCEL_TOKEN` → Update
3. Paste your token
4. Click on `VERCEL_ORG_ID` → Update  
5. Paste your org ID
6. Save

Then push any change to trigger auto-deploy!

---

## Fixed GitHub Actions

✅ Health checks won't fail on undeployed agents
✅ Monitoring reduced to 30min intervals
✅ No more spam issues during setup
✅ Push commits won't trigger health checks

---

## Quick Deploy Now

```bash
# 1. Login
vercel login

# 2. Deploy
cd /Users/danielmcshan/GitHub/formul8-multiagent
vercel --prod

# 3. Verify
curl -I https://f8.syzygyx.com/chat.html
```

**That's it!** 🎉

---

## Check Current Vercel Projects

```bash
vercel ls
```

Should show:
- formul8-multiagent (main site)
- compliance-agent (if deployed)
- science-agent (if deployed)
- etc.

---

## Troubleshooting

### "Error: Not authenticated"
→ Run: `vercel login`

### "Error: No existing credentials found"
→ Run: `vercel login`

### "Project not found"
→ First deployment creates project automatically

### Site not updating
→ Check: `vercel ls` to see latest deployment
→ May need to clear browser cache
→ Check Vercel dashboard for deployment logs

---

## Current Status

✅ Code pushed (commit: 690c6a2)
✅ GitHub Actions fixed (no more false failures)
✅ Ready to deploy via CLI
⏳ Waiting for: `vercel login` + `vercel --prod`

**Just run `vercel login` and you're ready to deploy!**
