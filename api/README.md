# Vercel API Functions

This directory contains Vercel serverless functions for the Formul8 deployment.

## Functions

### `auth.js` - Basic Authentication Middleware

Protects all pages with Basic HTTP Authentication. Users must provide a username and password to access any content.

**Environment Variables:**
- `AUTH_USERNAME` - The username for authentication (default: "admin")
- `AUTH_PASSWORD` - The password for authentication (default: "changeme")

**How it works:**
1. All requests are routed through this function (except `/api/health`)
2. The function checks for the `Authorization` header
3. If valid credentials are provided, the requested page is served
4. If invalid or missing credentials, returns a 401 Unauthorized response

**Setting up credentials:**

```bash
# Via Vercel CLI
vercel env add AUTH_USERNAME production
vercel env add AUTH_PASSWORD production

# Or use the deployment script
./deploy-protected.sh
```

## Local Development

To test authentication locally:

```bash
# Install Vercel CLI
npm install -g vercel

# Run dev server
vercel dev
```

Visit `http://localhost:3000` and you'll be prompted for credentials.

## Security Notes

- Always use strong passwords in production
- Credentials are transmitted via HTTPS (enforced by Vercel)
- Consider implementing rate limiting for production use
- Monitor authentication attempts via Vercel logs

