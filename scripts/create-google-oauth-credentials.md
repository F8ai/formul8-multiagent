# Create Google OAuth 2.0 Credentials for Formul8.ai

## Quick Steps

1. **Open Google Cloud Console**: 
   https://console.cloud.google.com/apis/credentials?project=formul8-470214

2. **Configure OAuth Consent Screen** (if not already done):
   - Click "OAuth consent screen" in the left menu
   - Application name: **Formul8**
   - User support email: **dan@formul8.ai**
   - Authorized domains: **formul8.ai**
   - Developer contact: **dan@formul8.ai**
   - Click "Save and Continue"
   - Add scopes: `email`, `profile`, `openid`
   - Click "Save and Continue" for each step

3. **Create OAuth Client ID**:
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: **Web application**
   - Name: **Formul8 Supabase OAuth Client**
   
   - **Authorized JavaScript origins** (add each):
     - `https://formul8.ai`
     - `https://chat.formul8.ai`
     - `http://localhost` (for local development)
     - `http://localhost:3000` (for local development)
   
   - **Authorized redirect URIs** (add each):
     - `https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/auth/v1/callback`
       - Replace `[YOUR-SUPABASE-PROJECT-ID]` with your actual Supabase project ID
     - `https://formul8.ai/auth/callback`
     - `http://localhost:3000/auth/callback` (for local development)

4. **Click "CREATE"**

5. **Copy Credentials**:
   - **Client ID**: Copy this value (starts with something like `732977829559-...`)
   - **Client Secret**: Click "Show" and copy this value

## For Supabase Configuration

After creating the OAuth client:

1. Go to your Supabase project: https://supabase.com/dashboard/project/[your-project]/auth/providers

2. Enable Google provider:
   - Click on "Google" in the providers list
   - Toggle "Enable Google provider"
   - Paste your **Client ID** into "Client ID (for OAuth)"
   - Paste your **Client Secret** into "Client Secret (for OAuth)"
   - The redirect URL should be automatically set to:
     `https://[your-supabase-project-id].supabase.co/auth/v1/callback`
   - Click "Save"

3. **Important**: Make sure the redirect URI `https://[your-supabase-project-id].supabase.co/auth/v1/callback` is added to your Google OAuth client's authorized redirect URIs (step 3 above)

## Current Existing Client ID

Based on the codebase, there's an existing client ID:
- `732977829559-sm9erni1diasjrfdqdccal0htmeb2crg.apps.googleusercontent.com`

You can either:
1. Use the existing client and add Supabase redirect URI to it, OR
2. Create a new client specifically for Supabase integration

## Adding Supabase Redirect to Existing Client

1. Go to: https://console.cloud.google.com/apis/credentials?project=formul8-470214
2. Find the OAuth client with ID starting with `732977829559-...`
3. Click to edit it
4. Add to **Authorized redirect URIs**:
   - `https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/auth/v1/callback`
5. Click "Save"
6. Note: You'll need the Client Secret. If you don't have it, you may need to create a new client.
