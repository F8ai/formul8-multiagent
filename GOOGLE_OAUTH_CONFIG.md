# Google OAuth Configuration for Formul8.ai

## OAuth Client Credentials

**Client ID**: `732977829559-kbv45vacksioliu9idp870prumc34jrr.apps.googleusercontent.com`

**Client Secret**: ⚠️ *Must be retrieved from Google Cloud Console*
- Go to: https://console.cloud.google.com/apis/credentials?project=formul8-platform
- Find the OAuth client with the Client ID above
- Click to edit/view
- The secret is only shown once when created, or you can reset it

## Google Cloud Project Information

- **Project ID**: `formul8-platform`
- **Project Number**: `732977829559`
- **Project Name**: Formul8 Platform
- **Email**: dan@formul8.ai

## Other Projects Found

- **f8ai-471618** (project number: 1007764742351) - F8ai (different project)

## Next Steps

### 1. Add Supabase Redirect URI to Google OAuth Client

1. Go to: https://console.cloud.google.com/apis/credentials?project=formul8-platform
2. Find the OAuth client: `732977829559-kbv45vacksioliu9idp870prumc34jrr`
3. Click to edit
4. Under **Authorized redirect URIs**, add:
   - `https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/auth/v1/callback`
   - Replace `[YOUR-SUPABASE-PROJECT-ID]` with your actual Supabase project ID (formul8-platform package)
5. Also ensure these are present:
   - `https://formul8.ai/auth/callback`
   - `https://chat.formul8.ai/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)
6. Click **Save**

### 2. Configure in Supabase

1. Go to your Supabase project dashboard (formul8-platform package)
2. Navigate to: **Authentication** → **Providers**
3. Find **Google** in the list
4. Enable the Google provider:
   - Toggle **Enable Google provider**
   - **Client ID (for OAuth)**: `732977829559-kbv45vacksioliu9idp870prumc34jrr.apps.googleusercontent.com`
   - **Client Secret (for OAuth)**: [Paste your client secret here]
   - **Redirect URL**: Should auto-populate as `https://[your-project].supabase.co/auth/v1/callback`
5. Click **Save**

### 3. Verify Configuration

Test the OAuth flow:
1. Go to your chat.html page
2. Click "Sign in with Google"
3. You should be redirected to Google for authentication
4. After authorization, you'll be redirected back to your app via Supabase

## Security Notes

- ⚠️ Never commit the Client Secret to version control
- Store secrets in environment variables or secure secret management
- For production, use environment variables in your deployment platform (Vercel, etc.)
