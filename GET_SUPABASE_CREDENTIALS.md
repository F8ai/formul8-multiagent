# Get Supabase Credentials Using CLI

## Quick Method

Yes! Supabase has a CLI. Here's how to use it:

### Step 1: Authenticate

```bash
supabase login
```

This will open a browser for authentication. Once authenticated, you can use the CLI.

### Step 2: Get Credentials

**Option A: Use the automated script**

```bash
./scripts/get-supabase-credentials.sh
```

This script will:
1. Check if you're authenticated
2. List your projects
3. Find the formul8-platform project
4. Extract the project URL
5. Guide you to get the anon key from the dashboard
6. Optionally set them in Vercel

**Option B: Manual CLI commands**

```bash
# List projects
supabase projects list

# Get project details (replace PROJECT_REF with your project ID)
supabase projects get PROJECT_REF --format json

# This will show the project URL, but NOT the API keys
# (API keys are not exposed via CLI for security)
```

### Step 3: Get Anon Key

⚠️ **Important**: The Supabase CLI cannot retrieve API keys directly for security reasons.

You still need to get the **anon key** from the dashboard:

1. Go to: https://supabase.com/dashboard
2. Select your **formul8-platform** project
3. Go to: **Settings** → **API**
4. Copy the **anon public** key

### Step 4: Set Credentials

Once you have both:
- **SUPABASE_URL** (from CLI: `https://xxxxx.supabase.co`)
- **SUPABASE_ANON_KEY** (from dashboard)

Set them using one of these methods:

**Via Vercel Dashboard:**
- Go to: https://vercel.com/dashboard
- Project → Settings → Environment Variables
- Add both variables

**Via Vercel CLI:**
```bash
vercel env add SUPABASE_URL production
# Paste: https://xxxxx.supabase.co

vercel env add SUPABASE_ANON_KEY production
# Paste: [your-anon-key]
```

**Via GitHub Secrets (for auto-deployment):**
- Go to: https://github.com/F8ai/formul8-multiagent/settings/secrets/actions
- Add `SUPABASE_URL` and `SUPABASE_ANON_KEY`

## Alternative: Direct API Access

If you have a Supabase access token, you can also use the Supabase Management API:

```bash
# Set access token
export SUPABASE_ACCESS_TOKEN="your-token"

# List projects
curl -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  https://api.supabase.com/v1/projects

# Get project details
curl -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  https://api.supabase.com/v1/projects/PROJECT_REF
```

But again, API keys are not exposed via the API for security.

## Summary

✅ **What CLI can do:**
- List projects
- Get project URLs
- Get project metadata

❌ **What CLI cannot do:**
- Retrieve API keys (anon/service keys) - security feature
- These must be retrieved from the dashboard
