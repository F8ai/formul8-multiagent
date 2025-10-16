# Vercel Deployment Guide with Password Protection

This guide explains how to deploy your Formul8 Pages to Vercel with password protection.

## Overview

The deployment uses Basic HTTP Authentication to protect all pages. Users will be prompted for a username and password before accessing any content.

## Quick Start

### 1. Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Set Environment Variables

Before deploying, you need to set your authentication credentials as environment variables:

```bash
# Set production environment variables
vercel env add AUTH_USERNAME
# Enter your desired username when prompted (e.g., "admin")

vercel env add AUTH_PASSWORD
# Enter your desired password when prompted (e.g., a strong password)
```

You can also set these in the Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add `AUTH_USERNAME` and `AUTH_PASSWORD`

### 4. Deploy to Vercel

```bash
# Deploy using the protected configuration
vercel --prod --yes
```

Or to deploy with a specific config file:

```bash
# Copy the protected config to vercel.json
cp vercel-protected.json vercel.json

# Deploy
vercel --prod --yes
```

## Configuration Files

### Option 1: Serverless Function Authentication (Recommended)

Uses `vercel-protected.json` which routes all requests through an authentication serverless function (`api/auth.js`).

**Pros:**
- Works on free Vercel plans
- Full control over authentication logic
- Can customize per-route authentication

**Cons:**
- Slightly slower than edge middleware
- Uses serverless function execution time

### Option 2: Edge Middleware Authentication

Uses `middleware.js` for edge-based authentication (requires Vercel Enterprise).

**Pros:**
- Faster response times
- Runs at the edge

**Cons:**
- Requires Vercel Enterprise plan

## Default Credentials

If you don't set environment variables, the default credentials are:
- **Username:** `admin`
- **Password:** `changeme`

⚠️ **Warning:** Always change these in production!

## Security Best Practices

1. **Use Strong Passwords:** Generate a strong password for production
2. **Environment Variables:** Never commit credentials to git
3. **HTTPS Only:** Vercel automatically provides HTTPS
4. **Rotate Credentials:** Change passwords periodically
5. **Monitor Access:** Check Vercel logs for authentication attempts

## Testing Locally

To test the authentication locally:

```bash
# Install dependencies
npm install

# Run Vercel dev server
vercel dev
```

Visit `http://localhost:3000` and you'll be prompted for credentials.

## Updating Credentials

To update your credentials after deployment:

```bash
# Update environment variables
vercel env rm AUTH_USERNAME production
vercel env add AUTH_USERNAME production

vercel env rm AUTH_PASSWORD production
vercel env add AUTH_PASSWORD production

# Redeploy
vercel --prod
```

Or update via the Vercel Dashboard and trigger a new deployment.

## Troubleshooting

### Issue: Authentication not working

**Solution:** Make sure environment variables are set for the production environment:

```bash
vercel env ls
```

### Issue: Getting 404 errors

**Solution:** Ensure your HTML files are in the `public/` directory and the routes in `vercel-protected.json` match your file structure.

### Issue: API routes not working

**Solution:** Check that your lambda function is correctly configured and environment variables are set.

## Advanced Configuration

### Excluding Routes from Authentication

Edit `api/auth.js` to add routes that don't require authentication:

```javascript
const publicRoutes = ['/api/health', '/public-page'];
const requestPath = req.url;

if (publicRoutes.some(route => requestPath.startsWith(route))) {
  // Serve without authentication
}
```

### Custom Authentication Logic

Modify `api/auth.js` to implement:
- Multiple user accounts
- Different access levels
- IP whitelisting
- Time-based access
- Integration with external auth services

## Deployment Commands Reference

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Deploy with specific config
vercel --prod -c vercel-protected.json

# Check deployment status
vercel ls

# View environment variables
vercel env ls

# View logs
vercel logs
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Serverless Functions](https://vercel.com/docs/serverless-functions/introduction)
- [Basic Authentication RFC](https://tools.ietf.org/html/rfc7617)

