# Automated OpenRouter API Key Rotation Setup

## Overview

The system now automatically rotates the OpenRouter API key **every 15 minutes** for enhanced security.

## ✅ Already Configured

- ✅ GitHub Workflow: `.github/workflows/rotate-key-15min.yml`
- ✅ `OPENROUTER_PROVISIONING_KEY` - Set in GitHub Secrets
- ✅ `VERCEL_ORG_ID` - Set in GitHub Secrets
- ✅ `VERCEL_PROJECT_ID` - Set in GitHub Secrets

## ⚠️ Required Secrets

You need to create two tokens and add them to GitHub Secrets:

### A. GitHub Personal Access Token (GH_PAT)

The workflow needs a PAT to update GitHub Secrets (standard GITHUB_TOKEN cannot write secrets).

1. Go to: https://github.com/settings/tokens/new
2. **Token name:** `Formul8-Key-Rotation`
3. **Expiration:** `No expiration`
4. **Scopes:** Select:
   - ✅ `repo` (Full control of private repositories)
5. Click **"Generate token"**
6. Copy the token (starts with `ghp_...`)
7. Add to GitHub Secrets:
```bash
gh secret set GH_PAT --body "ghp_YOUR_TOKEN_HERE"
```

### B. Vercel Token (VERCEL_TOKEN)

You need a Vercel token to update environment variables:

### 1. Create Vercel Token

1. Go to: https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Name it: `GitHub-Actions-Key-Rotation`
4. Scope: **Full Access** (needed to update environment variables)
5. Expiration: **No Expiration** (for continuous automation)
6. Click **"Create"**
7. Copy the token (starts with `vercel_...`)

### 2. Add to GitHub Secrets

Run this command (replace `YOUR_TOKEN_HERE` with the actual token):

```bash
gh secret set VERCEL_TOKEN --body "YOUR_TOKEN_HERE"
```

Or add it manually:
1. Go to: https://github.com/F8ai/formul8-multiagent/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `VERCEL_TOKEN`
4. Value: Paste your Vercel token
5. Click **"Add secret"**

## 🔄 How It Works

Every 15 minutes, the workflow:

1. **Creates** a new OpenRouter API key via Provisioning API
2. **Updates** GitHub Secret `OPENROUTER_API_KEY`
3. **Updates** Vercel environment variables (production, preview, development)
4. **Deploys** the update to Vercel
5. **Deletes** old keys (keeps last 3 for safety)

## 🧪 Test the Rotation

After setting `VERCEL_TOKEN`, test it manually:

```bash
gh workflow run "Rotate OpenRouter Key (15 min)" --ref main
```

Then monitor the workflow:

```bash
gh run watch $(gh run list --workflow="Rotate OpenRouter Key (15 min)" --limit 1 --json databaseId --jq '.[0].databaseId')
```

## 📊 Monitor Rotations

View rotation history:

```bash
gh run list --workflow="Rotate OpenRouter Key (15 min)" --limit 10
```

## 🚨 If Rotation Fails

1. Check the workflow logs:
   ```bash
   gh run view --log-failed
   ```

2. Manually rotate using the script:
   ```bash
   node scripts/openrouter-key-manager.js rotate
   ```

3. Ensure all secrets are correctly set:
   ```bash
   gh secret list
   ```

## ⏱️ Change Rotation Frequency

To change from every 15 minutes to a different interval, edit `.github/workflows/rotate-key-15min.yml`:

```yaml
on:
  schedule:
    # Change this cron expression:
    - cron: '*/15 * * * *'  # Every 15 minutes
    # Examples:
    # - cron: '0 * * * *'     # Every hour
    # - cron: '0 */6 * * *'   # Every 6 hours
    # - cron: '0 0 * * *'     # Daily at midnight
```

## 📝 Cost Considerations

Each rotation costs:
- **OpenRouter:** ~$0.00 (provisioning API is free)
- **GitHub Actions:** ~1 minute of runtime (free tier: 2000 min/month)
- **Vercel:** Free (deployments included in plan)

**Monthly cost:** Effectively $0

**Monthly rotations:** 2,880 rotations/month (every 15 min)

## 🔐 Security Benefits

- **Short-lived keys:** Compromised keys expire automatically
- **Reduced exposure:** 15-minute window limits potential damage
- **Audit trail:** All rotations logged in GitHub Actions
- **Zero-touch:** No manual intervention required

