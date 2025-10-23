# Deploy SyzyChat to chat.syzygyx.com

## 📋 Deployment Guide

This guide covers deploying the universal SyzyChat demo to `chat.syzygyx.com`.

---

## 🎯 What We're Deploying

- **URL:** https://chat.syzygyx.com
- **Purpose:** Showcase for universal SyzyChat library
- **Files:**
  - `public/syzychat-demo.html` - Beautiful demo interface
  - `public/syzychat.js` - Universal library (v2.5.0)
  - `vercel-syzychat.json` - Vercel configuration
  - `.github/workflows/deploy-syzychat.yml` - Auto-deployment

---

## 🚀 Deployment Methods

### Method 1: GitHub Actions (Automatic)

**Status:** ✅ Configured  
**Triggers:** 
- Push to `main` branch (when relevant files change)
- Manual workflow dispatch

**Files Watched:**
- `docs/syzychat.js`
- `public/syzychat-demo.html`
- `public/syzychat.js`
- `vercel-syzychat.json`
- `.github/workflows/deploy-syzychat.yml`

**Process:**
1. Commit changes
2. Push to main
3. GitHub Actions automatically deploys
4. Comment posted with deployment info

---

### Method 2: Vercel CLI (Manual)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel deploy --prod --config vercel-syzychat.json
```

---

### Method 3: Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Import project from GitHub
3. Configure:
   - **Framework Preset:** Other
   - **Output Directory:** `public`
   - **Build Command:** (leave empty)
   - **Config File:** `vercel-syzychat.json`
4. Add domain: `chat.syzygyx.com`
5. Deploy!

---

## 🔧 Configuration

### Vercel Project Settings

Create a new Vercel project and set:

```json
{
  "name": "syzychat-demo",
  "outputDirectory": "public",
  "buildCommand": "echo 'No build needed'"
}
```

### Required GitHub Secrets

Add these to your repository secrets:

| Secret | Description | Where to Get |
|--------|-------------|--------------|
| `VERCEL_TOKEN` | Vercel API token | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Organization ID | Project Settings → General |
| `VERCEL_SYZYCHAT_PROJECT_ID` | Project ID | Project Settings → General |

### Add Secrets:
```bash
# In GitHub:
# Settings → Secrets and variables → Actions → New repository secret

# VERCEL_TOKEN: your-vercel-token
# VERCEL_ORG_ID: team_xxxxxxxxxxxxx
# VERCEL_SYZYCHAT_PROJECT_ID: prj_xxxxxxxxxxxxx
```

---

## 📁 File Structure

```
formul8-multiagent/
├── public/
│   ├── syzychat-demo.html      # 🎨 Beautiful demo page
│   └── syzychat.js              # 📦 Universal library (copy of docs/syzychat.js)
├── docs/
│   └── syzychat.js              # 📚 Source library
├── vercel-syzychat.json         # ⚙️ Vercel config
└── .github/workflows/
    └── deploy-syzychat.yml      # 🤖 Auto-deployment
```

---

## 🌐 Domain Setup

### 1. Add Domain in Vercel

1. Go to Project Settings → Domains
2. Add domain: `chat.syzygyx.com`
3. Vercel will provide DNS records

### 2. Configure DNS

Add these records to your DNS provider:

```
Type: CNAME
Name: chat
Value: cname.vercel-dns.com
TTL: Auto
```

Or use A records:
```
Type: A
Name: chat
Value: 76.76.21.21
TTL: Auto
```

### 3. Verify

Wait 24-48 hours for DNS propagation, then:
```bash
curl -I https://chat.syzygyx.com
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [x] Create `public/syzychat-demo.html`
- [x] Copy `docs/syzychat.js` to `public/syzychat.js`
- [x] Create `vercel-syzychat.json`
- [x] Create GitHub Actions workflow
- [ ] Add GitHub secrets (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_SYZYCHAT_PROJECT_ID)
- [ ] Create Vercel project

### Deployment
- [ ] Push to main branch
- [ ] Verify GitHub Actions workflow runs
- [ ] Check deployment logs
- [ ] Visit https://chat.syzygyx.com
- [ ] Test chat functionality

### Post-Deployment
- [ ] Verify all features work
- [ ] Check mobile responsiveness
- [ ] Test error handling
- [ ] Monitor analytics
- [ ] Update documentation

---

## 🧪 Testing

### Local Testing

```bash
# Start local server
python3 -m http.server 8000

# Visit
http://localhost:8000/public/syzychat-demo.html
```

### Production Testing

```bash
# Check if site is live
curl https://chat.syzygyx.com

# Check headers
curl -I https://chat.syzygyx.com

# Test API endpoint
curl -X POST https://f8.syzygyx.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","tier":"free","username":"test"}'
```

---

## 🐛 Troubleshooting

### Issue: GitHub Actions Fails

**Check:**
1. All secrets are added correctly
2. Vercel project exists
3. Token has correct permissions

**Fix:**
```bash
# Re-generate Vercel token
vercel login
vercel token create

# Update GitHub secret
# Settings → Secrets → VERCEL_TOKEN → Update
```

### Issue: Domain Not Resolving

**Check:**
1. DNS records are correct
2. Propagation completed (use https://dnschecker.org)
3. SSL certificate issued

**Fix:**
```bash
# Force SSL cert renewal in Vercel Dashboard
# Project → Settings → Domains → Refresh
```

### Issue: 404 Error

**Check:**
1. Files exist in `public/` directory
2. `vercel-syzychat.json` rewrites are correct
3. Deployment output directory is `public`

**Fix:**
```bash
# Verify files
ls -la public/

# Redeploy
vercel deploy --prod --config vercel-syzychat.json
```

---

## 📊 Monitoring

### Vercel Analytics

Enable in Vercel Dashboard:
- Project → Settings → Analytics → Enable

### Logs

View deployment logs:
```bash
vercel logs [deployment-url]
```

### Performance

Check Core Web Vitals:
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)

---

## 🔄 Updates

### Update SyzyChat Library

```bash
# Edit source
vim docs/syzychat.js

# Copy to public
cp docs/syzychat.js public/syzychat.js

# Commit and push
git add docs/syzychat.js public/syzychat.js
git commit -m "Update SyzyChat library"
git push origin main

# GitHub Actions will auto-deploy
```

### Update Demo Page

```bash
# Edit demo
vim public/syzychat-demo.html

# Commit and push
git add public/syzychat-demo.html
git commit -m "Update SyzyChat demo"
git push origin main
```

---

## 📈 Features

### Current Features
- ✅ Universal chat library demo
- ✅ Beautiful gradient UI
- ✅ Markdown & emoji support
- ✅ Real-time chat with F8 backend
- ✅ Responsive design
- ✅ Error handling
- ✅ Typing indicators
- ✅ Auto-scroll

### Planned Features
- [ ] Theme switcher (light/dark)
- [ ] Code syntax highlighting
- [ ] File upload support
- [ ] Voice messages
- [ ] Message reactions
- [ ] Read receipts
- [ ] User avatars
- [ ] Conversation history

---

## 🔗 Links

- **Live Demo:** https://chat.syzygyx.com
- **GitHub Repo:** https://github.com/F8ai/formul8-multiagent
- **Documentation:** [SYZYCHAT_UNIVERSAL_EDITION.md](./SYZYCHAT_UNIVERSAL_EDITION.md)
- **Vercel Dashboard:** [vercel.com/dashboard](https://vercel.com/dashboard)

---

## 📝 Notes

### Security Headers

The deployment includes:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Caching

- HTML files: No cache (dynamic)
- JavaScript files: 1 hour cache, 24 hour CDN cache

### API Backend

Uses Formul8 API: `https://f8.syzygyx.com/api/chat`

---

## 🎉 Success Criteria

Deployment is successful when:
- ✅ https://chat.syzygyx.com loads
- ✅ Chat interface is functional
- ✅ Messages send and receive
- ✅ Markdown renders correctly
- ✅ Mobile responsive
- ✅ No console errors
- ✅ SSL certificate active
- ✅ Fast load times (<2s)

---

**Last Updated:** October 2024  
**Version:** 1.0.0  
**Status:** 🟢 Ready for Deployment

