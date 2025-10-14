# Manual Environment Variable Setup

Since the OpenRouter API key is in GitHub Secrets, you'll need to set it up manually in each Vercel project.

## Option 1: Use the automated script

1. Get your OpenRouter API key from GitHub Secrets
2. Run the setup script:
   ```bash
   export OPENROUTER_API_KEY="your-key-here"
   ./scripts/setup-vercel-env.sh
   ```

## Option 2: Manual setup via Vercel CLI

For each project, run:

```bash
# Main agent
cd lambda-package
vercel env add OPENROUTER_API_KEY
# Paste your key when prompted

# Individual agents
cd agents/compliance-agent
vercel env add OPENROUTER_API_KEY
# Paste your key when prompted

# Repeat for each agent...
```

## Option 3: Use Vercel Dashboard

1. Go to each project in Vercel dashboard
2. Go to Settings > Environment Variables
3. Add `OPENROUTER_API_KEY` with your key value
4. Select all environments (Production, Preview, Development)

## Projects that need the key:

### Main Projects:
- `lambda-package` (main agent)
- `future-agent` (in ../future-agent/)

### Individual Agents:
- `compliance-agent`
- `formulation-agent`
- `science-agent`
- `operations-agent`
- `marketing-agent`
- `sourcing-agent`
- `patent-agent`
- `spectra-agent`
- `customer-success-agent`
- `f8-slackbot-agent`
- `mcr-agent`
- `ad-agent`
- `editor-agent`

## After setting up environment variables:

You'll need to redeploy each project for the environment variables to take effect:

```bash
# Redeploy main agent
cd lambda-package
vercel --prod --yes

# Redeploy future-agent
cd ../future-agent
vercel --prod --yes

# Redeploy individual agents (run from agents/ directory)
cd agents/compliance-agent
vercel --prod --yes
# Repeat for each agent...
```

## Verification:

After setup, you can verify the environment variables are working by checking the Vercel function logs or by testing the endpoints.