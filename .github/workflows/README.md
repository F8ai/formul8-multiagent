# GitHub Actions Workflows for Formul8 Agents

## Overview

Each agent has its own GitHub Actions workflow that automatically deploys to Vercel when changes are pushed.

## Workflows

### Individual Agent Workflows
Each agent deploys independently when its files change:

- `deploy-compliance-agent.yml` - Deploys when `agents/compliance-agent/**` changes
- `deploy-science-agent.yml` - Deploys when `agents/science-agent/**` changes
- `deploy-formulation-agent.yml` - Deploys when `agents/formulation-agent/**` changes
- `deploy-marketing-agent.yml` - Deploys when `agents/marketing-agent/**` changes
- `deploy-patent-agent.yml` - Deploys when `agents/patent-agent/**` changes
- `deploy-operations-agent.yml` - Deploys when `agents/operations-agent/**` changes
- `deploy-sourcing-agent.yml` - Deploys when `agents/sourcing-agent/**` changes
- `deploy-spectra-agent.yml` - Deploys when `agents/spectra-agent/**` changes
- `deploy-mcr-agent.yml` - Deploys when `agents/mcr-agent/**` changes
- `deploy-customer-success-agent.yml` - Deploys when `agents/customer-success-agent/**` changes
- `deploy-ad-agent.yml` - Deploys when `agents/ad-agent/**` changes
- `deploy-editor-agent.yml` - Deploys when `agents/editor-agent/**` changes
- `deploy-f8-slackbot.yml` - Deploys when `agents/f8-slackbot/**` changes

### Bulk Deployment
- `deploy-all-agents.yml` - Deploys all agents (manual trigger or when common files change)

## Setup Required

### 1. Add GitHub Secrets

Go to: https://github.com/F8ai/formul8-multiagent/settings/secrets/actions

Add the following secrets:

#### Required for All Deployments
```
VERCEL_TOKEN - Your Vercel token (from https://vercel.com/account/tokens)
VERCEL_ORG_ID - Your Vercel organization ID
```

#### Optional: Individual Project IDs (for more control)
```
VERCEL_COMPLIANCE_PROJECT_ID
VERCEL_SCIENCE_PROJECT_ID
VERCEL_FORMULATION_PROJECT_ID
VERCEL_MARKETING_PROJECT_ID
VERCEL_PATENT_PROJECT_ID
VERCEL_OPERATIONS_PROJECT_ID
VERCEL_SOURCING_PROJECT_ID
VERCEL_SPECTRA_PROJECT_ID
VERCEL_MCR_PROJECT_ID
VERCEL_CUSTOMER_SUCCESS_PROJECT_ID
VERCEL_AD_PROJECT_ID
VERCEL_EDITOR_PROJECT_ID
VERCEL_F8_SLACKBOT_PROJECT_ID
```

### 2. Get Your Vercel Token

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Get your token
vercel whoami
# Or create new token at: https://vercel.com/account/tokens
```

### 3. Get Your Vercel Org ID

```bash
# In your project directory
vercel link

# Or get from: https://vercel.com/[your-username]/settings
```

### 4. Get Project IDs (Optional)

After first deploying each agent manually:

```bash
cd agents/compliance-agent
cat .vercel/project.json
# Copy the "projectId" value
```

Or get from Vercel dashboard:
- Go to project settings
- Copy the Project ID

## How It Works

### Automatic Deployment

When you push changes to an agent:

```bash
# Example: Update compliance agent
vim agents/compliance-agent/lambda.js
git add agents/compliance-agent/lambda.js
git commit -m "Update compliance agent logic"
git push origin main
```

GitHub Actions will:
1. ✅ Detect changes in `agents/compliance-agent/**`
2. ✅ Trigger `deploy-compliance-agent.yml` workflow
3. ✅ Install Vercel CLI
4. ✅ Pull Vercel environment config
5. ✅ Build the project
6. ✅ Deploy to Vercel production
7. ✅ Report success/failure

### Manual Deployment

Deploy all agents manually:

1. Go to: https://github.com/F8ai/formul8-multiagent/actions
2. Click "Deploy All Agents"
3. Click "Run workflow"
4. Select branch (usually `main`)
5. Click "Run workflow"

## Monitoring

### View Deployment Status

- **GitHub**: https://github.com/F8ai/formul8-multiagent/actions
- **Vercel**: https://vercel.com/dashboard

### Workflow Status Badges

You can add badges to your README:

```markdown
![Compliance Agent](https://github.com/F8ai/formul8-multiagent/actions/workflows/deploy-compliance-agent.yml/badge.svg)
![Science Agent](https://github.com/F8ai/formul8-multiagent/actions/workflows/deploy-science-agent.yml/badge.svg)
```

## Troubleshooting

### Workflow Fails with "Resource not accessible by integration"

- Check that VERCEL_TOKEN is set in GitHub Secrets
- Verify token is valid at https://vercel.com/account/tokens

### Workflow Fails with "Project not found"

- Make sure agent is deployed to Vercel first (manually)
- Or remove VERCEL_PROJECT_ID from workflow (it will auto-create)

### Agent not deploying

- Check workflow paths in `.github/workflows/deploy-*.yml`
- Ensure changes are pushed to `main` branch
- Check GitHub Actions tab for error logs

## Benefits

✅ **Automatic Deployment** - Push to deploy, no manual steps
✅ **Fast Feedback** - See deployment status in minutes
✅ **Safe Rollback** - Vercel keeps previous deployments
✅ **Individual Control** - Each agent deploys independently
✅ **Bulk Updates** - Deploy all agents at once when needed
✅ **Audit Trail** - See who deployed what and when

## Advanced Configuration

### Add Pre-Deployment Tests

```yaml
- name: Run Tests
  run: npm test
  working-directory: ./agents/compliance-agent
```

### Add Notifications

```yaml
- name: Notify Slack
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Compliance Agent deployed!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Deploy to Staging First

```yaml
- name: Deploy to Staging
  run: vercel deploy --token=${{ secrets.VERCEL_TOKEN }}
  
- name: Run E2E Tests
  run: npm run test:e2e
  
- name: Promote to Production
  if: success()
  run: vercel promote --token=${{ secrets.VERCEL_TOKEN }}
```

## Security Notes

- ✅ Never commit VERCEL_TOKEN to git
- ✅ Use GitHub Secrets for all sensitive data
- ✅ Rotate tokens periodically
- ✅ Use least-privilege tokens when possible
- ✅ Review GitHub Actions logs for sensitive data leaks

## Support

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Vercel CLI Docs**: https://vercel.com/docs/cli
- **Vercel GitHub Integration**: https://vercel.com/docs/git/vercel-for-github

---

**Last Updated**: 2025-10-21
**Maintained by**: F8ai Team
