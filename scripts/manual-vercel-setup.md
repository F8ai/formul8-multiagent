# Manual Vercel Secret Setup

Since the Vercel CLI is having issues, here's how to set up the secret manually:

## Option 1: Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the `formul8ai` team
3. Go to Settings > Environment Variables
4. Add a new environment variable:
   - **Name**: `OPENROUTER_API_KEY`
   - **Value**: `sk-or-v1-...` (paste the current key from your password manager)
   - **Environment**: Production, Preview, Development
5. Save the environment variable

## Option 2: Command Line (Alternative)

Try this command from the lambda-package directory:

```bash
cd lambda-package
vercel env add OPENROUTER_API_KEY
# When prompted, paste: sk-or-v1-...
```

## After Adding the Secret

Once the secret is added, deploy the project:

```bash
cd lambda-package
vercel --prod --yes
```

## Verify the Setup

After deployment, test these endpoints:

1. **Chat Interface**: https://f8.syzygyx.com/chat.html
2. **API Health**: https://f8.syzygyx.com/api/health
3. **Free API Key**: https://f8.syzygyx.com/api/free-key (POST request)

## Expected Results

- ✅ `chat.html` should load the ChatGPT-like interface
- ✅ `/api/health` should return `{"status":"healthy"}`
- ✅ `/api/free-key` should generate a free API key for testing

## Troubleshooting

If the endpoints don't work:
1. Check Vercel deployment logs
2. Verify the environment variable is set correctly
3. Wait a few minutes for the deployment to propagate
4. Check that the domain `f8.syzygyx.com` is properly configured