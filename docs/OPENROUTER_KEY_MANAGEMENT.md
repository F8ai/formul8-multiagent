# OpenRouter API Key Management Guide

This guide explains how to use the automated OpenRouter API key management system for the Formul8 multi-agent platform.

## Overview

The key management system provides automated creation, rotation, and monitoring of OpenRouter API keys using the OpenRouter Provisioning API.

## Components

### 1. Key Manager (`scripts/openrouter-key-manager.js`)
Main tool for managing OpenRouter API keys programmatically.

### 2. Manual Rotation Script (`scripts/rotate-openrouter-key.sh`)
Legacy script for manual key rotation with a provided key.

### 3. Scheduled Rotation (`scripts/scheduled-key-rotation.sh`)
Cron-friendly script for automated scheduled rotations.

### 4. GitHub Action (`.github/workflows/rotate-openrouter-key.yml`)
Cloud-based automated monthly key rotation.

## Setup

### Prerequisites

1. **OpenRouter Provisioning API Key**
   - Go to [OpenRouter Provisioning Keys](https://openrouter.ai/docs/features/provisioning-api-keys)
   - Click "Create New Key"
   - Save the provisioning key securely

2. **Environment Variables**
   ```bash
   export OPENROUTER_PROVISIONING_KEY="sk-or-v1-your-provisioning-key"
   ```

3. **Tools Required**
   - Node.js (v18+)
   - Vercel CLI (`npm install -g vercel`)
   - Bash shell

### GitHub Secrets Configuration

For automated GitHub Actions rotation, set these secrets:

1. Go to: `Settings → Secrets and variables → Actions`
2. Add:
   - `OPENROUTER_PROVISIONING_KEY`: Your provisioning key
   - `VERCEL_TOKEN`: Your Vercel API token

## Usage

### List All Keys

```bash
node scripts/openrouter-key-manager.js list
```

Output shows all keys with:
- Key ID and name
- Creation date
- Usage limits
- Current usage
- Status

### Create a New Key

```bash
# Basic creation
node scripts/openrouter-key-manager.js create

# With custom name and limit
node scripts/openrouter-key-manager.js create "Production Key" 100.00

# With name, limit, and label
node scripts/openrouter-key-manager.js create "Staging Key" 50.00 "staging-env"
```

### Get Key Information

```bash
node scripts/openrouter-key-manager.js info <key-id>
```

### Delete a Key

```bash
node scripts/openrouter-key-manager.js delete <key-id>
```

### Automated Key Rotation

#### Option 1: Full Rotation (Recommended)

Creates a new key, updates all Vercel projects, and deploys:

```bash
node scripts/openrouter-key-manager.js rotate
```

#### Option 2: Rotation with Cleanup

Same as above, but also deletes old keys:

```bash
node scripts/openrouter-key-manager.js rotate --delete-old
```

**⚠️ Warning**: Only use `--delete-old` if you're confident the new key is working!

### Manual Key Rotation (Legacy)

If you already have a key to rotate to:

```bash
bash scripts/rotate-openrouter-key.sh "sk-or-v1-your-new-key"

# Dry run (preview changes)
bash scripts/rotate-openrouter-key.sh "sk-or-v1-your-new-key" --dry-run
```

## Scheduled Automation

### Option 1: GitHub Actions (Recommended)

The workflow runs automatically on the 1st of each month at 2 AM UTC.

**Manual Trigger:**
1. Go to: `Actions → Rotate OpenRouter API Key`
2. Click "Run workflow"
3. Choose whether to delete old keys
4. Click "Run workflow"

**View Results:**
- Check the Actions tab for workflow status
- Download logs from the workflow artifacts

### Option 2: Cron Job (Self-Hosted)

Add to your crontab:

```bash
# Edit crontab
crontab -e

# Add this line for monthly rotation (1st day at 2 AM)
0 2 1 * * /path/to/formul8-multiagent/scripts/scheduled-key-rotation.sh >> /var/log/openrouter-rotation.log 2>&1

# Or weekly rotation (Sunday at 2 AM)
0 2 * * 0 /path/to/formul8-multiagent/scripts/scheduled-key-rotation.sh >> /var/log/openrouter-rotation.log 2>&1
```

## Rotation Process Flow

1. **Create New Key**: Generate a new OpenRouter API key via Provisioning API
2. **Update Vercel**: Update `OPENROUTER_API_KEY` in all Vercel projects
3. **Deploy**: Redeploy all affected services
4. **Verify**: Wait 30 seconds for deployments to stabilize
5. **Cleanup**: (Optional) Delete old keys
6. **Log**: Save rotation details for audit trail

## Best Practices

### Security

1. **Never commit provisioning keys** to version control
2. **Use environment variables** or secure secret managers
3. **Rotate keys regularly** (monthly recommended)
4. **Set usage limits** on keys to prevent abuse
5. **Monitor key usage** regularly

### Key Naming Convention

Use descriptive names:
- `Formul8 Production Key` - Main production key
- `Formul8 Staging Key` - Staging environment
- `Formul8 Development Key` - Local development
- `Formul8 Agent <agent-name>` - Per-agent keys (optional)

### Usage Limits

Set appropriate limits based on expected usage:
- **Development**: $10-50/month
- **Staging**: $50-100/month
- **Production**: Unlimited or $500+/month

### Monitoring

1. **Check logs regularly**: `logs/key-rotation-*.log`
2. **Monitor usage**: Use `list` command weekly
3. **Set up alerts**: Configure notifications in rotation scripts
4. **Track costs**: Review OpenRouter dashboard monthly

## Troubleshooting

### "Authorization failed"

- Check that `OPENROUTER_PROVISIONING_KEY` is set correctly
- Verify the key is a Provisioning key, not a regular API key
- Ensure the key hasn't been revoked

### "Vercel deployment failed"

- Check Vercel CLI is logged in: `vercel whoami`
- Verify VERCEL_TOKEN is valid
- Ensure you have permissions for all projects

### "Old key still working after rotation"

- Vercel caches environment variables
- Wait 5-10 minutes for edge network to update
- Force redeploy: `vercel --prod --force`

### "New key not working"

1. Check key was created successfully
2. Verify key appears in `list` output
3. Test key manually:
   ```bash
   curl https://openrouter.ai/api/v1/chat/completions \
     -H "Authorization: Bearer sk-or-v1-your-new-key" \
     -H "Content-Type: application/json" \
     -d '{"model":"anthropic/claude-3.5-sonnet","messages":[{"role":"user","content":"test"}]}'
   ```
4. Check Vercel environment variables are updated

## Emergency Rollback

If rotation fails and services are down:

1. **Get previous key** from logs or backup
2. **Manual rotation**:
   ```bash
   bash scripts/rotate-openrouter-key.sh "sk-or-v1-previous-key"
   ```
3. **Verify services** are back online
4. **Investigate failure** using rotation logs

## API Reference

### Provisioning API Endpoints

Base URL: `https://openrouter.ai/api/v1/keys`

#### List Keys
```
GET /api/v1/keys?limit=100
Authorization: Bearer <provisioning-key>
```

#### Create Key
```
POST /api/v1/keys
Authorization: Bearer <provisioning-key>
Content-Type: application/json

{
  "name": "Key Name",
  "limit": 100.00,
  "label": "optional-label"
}
```

#### Get Key Info
```
GET /api/v1/keys/:id
Authorization: Bearer <provisioning-key>
```

#### Delete Key
```
DELETE /api/v1/keys/:id
Authorization: Bearer <provisioning-key>
```

## Support

For issues or questions:
1. Check the [OpenRouter Documentation](https://openrouter.ai/docs)
2. Review rotation logs in `logs/`
3. Contact F8 DevOps team

## Changelog

### v1.0.0 (Current)
- Initial implementation
- Automated rotation via GitHub Actions
- Manual and scheduled rotation support
- Comprehensive logging and monitoring



