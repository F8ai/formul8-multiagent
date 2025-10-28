# OpenRouter Key Scanner - Deployment Guide

**Automated detection and remediation of exposed OpenRouter API keys across all F8ai repositories**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Deployment Options](#deployment-options)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Key Scanner is an automated security tool that:

1. **Detects** exposed OpenRouter API keys in your codebase
2. **Removes** them automatically with secure placeholders
3. **Alerts** via GitHub Issues and PR comments
4. **Prevents** future key exposures through CI/CD integration

### What Gets Detected?

- ✅ OpenRouter API keys (`sk-or-v1-...`)
- ✅ Keys in environment variable assignments
- ✅ Keys in Authorization headers
- ✅ Keys in documentation (with context awareness)

---

## 🚀 Features

### Automatic Detection
- Scans all file changes on push/PR
- Daily scheduled scans of entire repository
- Smart exclusions (node_modules, .env.example, etc.)
- Context-aware (skips documentation examples)

### Automatic Remediation
- Replaces exposed keys with placeholders
- Creates security issues automatically
- Comments on PRs with security alerts
- Commits fixes back to repository

### Multi-Repository Support
- Reusable workflow for all F8ai repos
- Centralized scanner script
- Consistent security across organization

---

## ⚡ Quick Start

### Option 1: Use in This Repository (Already Configured)

This repository already has the scanner configured and running. No action needed!

### Option 2: Deploy to Another F8ai Repository

**Step 1:** Create workflow file in the target repository

```bash
# In your repository
mkdir -p .github/workflows
curl -o .github/workflows/scan-exposed-keys.yml \
  https://raw.githubusercontent.com/F8ai/formul8-multiagent/main/.github/workflows/example-use-key-scanner.yml
```

**Step 2:** Commit and push

```bash
git add .github/workflows/scan-exposed-keys.yml
git commit -m "Add OpenRouter key scanner"
git push
```

**Step 3:** Enable permissions (if needed)

Go to: `Settings → Actions → General → Workflow permissions`
- Enable: "Read and write permissions"

**Done!** The scanner will now run on every push and daily.

---

## 📦 Deployment Options

### Option A: Standalone Workflow (Recommended)

Copy the complete workflow to your repository:

```yaml
# .github/workflows/scan-exposed-keys.yml
name: Scan for Exposed OpenRouter Keys

on:
  push:
    branches: ['**']
  pull_request:
    branches: ['**']
  schedule:
    - cron: '0 3 * * *'

permissions:
  contents: write
  issues: write
  pull-requests: write

jobs:
  scan-keys:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Download scanner
        run: |
          mkdir -p scripts
          curl -o scripts/detect-exposed-keys.js \
            https://raw.githubusercontent.com/F8ai/formul8-multiagent/main/scripts/detect-exposed-keys.js
          chmod +x scripts/detect-exposed-keys.js
      
      - name: Scan and fix
        run: |
          node scripts/detect-exposed-keys.js --scan-all --fix
          if [ $? -ne 0 ]; then
            git config --local user.email "github-actions[bot]@users.noreply.github.com"
            git config --local user.name "github-actions[bot]"
            git add -A
            git commit -m "🔒 Auto-remove exposed keys" || true
            git push || true
            exit 1
          fi
```

### Option B: Reusable Workflow (Centralized)

Use the centralized workflow from formul8-multiagent:

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: ['**']
  schedule:
    - cron: '0 3 * * *'

jobs:
  scan:
    uses: F8ai/formul8-multiagent/.github/workflows/reusable-key-scanner.yml@main
    with:
      auto-fix: true
      create-issue: true
      fail-on-detection: true
    secrets:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Benefits:**
- ✅ Always uses latest scanner
- ✅ Consistent across all repos
- ✅ Centralized updates

### Option C: Local Pre-Commit Hook

Add to your local development workflow:

```bash
# In your repository
curl -o .git/hooks/pre-commit \
  https://raw.githubusercontent.com/F8ai/formul8-multiagent/main/scripts/pre-commit-key-check.sh
chmod +x .git/hooks/pre-commit
```

---

## ⚙️ Configuration

### Workflow Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `auto-fix` | Automatically remove exposed keys | `true` |
| `create-issue` | Create GitHub issue on detection | `true` |
| `fail-on-detection` | Fail workflow if keys found | `true` |

### Environment Variables

Set these in your repository settings (`Settings → Secrets and variables → Actions`):

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | ✅ Yes | Automatically provided by GitHub |
| `OPENROUTER_API_KEY` | ⚠️ Secret | Your actual API key (stored securely) |

### Customizing Detection

Edit `scripts/detect-exposed-keys.js` to add custom patterns:

```javascript
const KEY_PATTERNS = [
  {
    name: 'Your Custom Pattern',
    pattern: /your-pattern-here/g,
    severity: 'CRITICAL',
  },
  // ... existing patterns
];
```

---

## 💡 Usage Examples

### Scan Entire Repository

```bash
node scripts/detect-exposed-keys.js --scan-all
```

### Scan Only Changed Files

```bash
node scripts/detect-exposed-keys.js --base=origin/main --head=HEAD
```

### Auto-Fix Exposed Keys

```bash
node scripts/detect-exposed-keys.js --scan-all --fix
```

### Verbose Output

```bash
node scripts/detect-exposed-keys.js --scan-all --verbose
```

---

## 🔐 Security Best Practices

### 1. Never Commit API Keys

**DON'T:**
```javascript
const apiKey = 'sk-or-v1-abc123...';
```

**DO:**
```javascript
const apiKey = process.env.OPENROUTER_API_KEY;
```

### 2. Use GitHub Secrets

Store keys in: `Settings → Secrets and variables → Actions`

```yaml
env:
  OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

### 3. Use Environment Variables Locally

```bash
# ~/.bashrc or ~/.zshrc
export OPENROUTER_API_KEY="sk-or-v1-..."
```

### 4. Enable GitHub Secret Scanning

Go to: `Settings → Code security and analysis`
- Enable: "Secret scanning"
- Enable: "Push protection"

### 5. Rotate Keys Regularly

```bash
# Use the automated rotation script
node scripts/openrouter-key-manager.js rotate --delete-old
```

### 6. Add Pre-Commit Hooks

```bash
# Install git-secrets
brew install git-secrets

# Initialize
git secrets --install
git secrets --add 'sk-or-v1-[A-Za-z0-9]{64}'
```

---

## 🔧 Troubleshooting

### Keys Still Being Detected After Removal

**Issue:** Scanner detects keys that were already removed.

**Solution:**
```bash
# The keys are in git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch file-with-key.txt' \
  --prune-empty --tag-name-filter cat -- --all
```

**Better Solution:** Use BFG Repo-Cleaner:
```bash
brew install bfg
bfg --replace-text passwords.txt --no-blob-protection
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

### Workflow Not Running

**Issue:** Workflow doesn't trigger on push.

**Solution:**
1. Check workflow permissions: `Settings → Actions → General`
2. Enable: "Read and write permissions"
3. Save and re-run workflow

### False Positives in Documentation

**Issue:** Documentation examples being flagged.

**Solution:** The scanner automatically skips common documentation patterns:
- Lines with "example", "sample", "template"
- Keys with "..." or "xxx"
- Files ending in `.example`, `.template`

To exclude specific files, edit `EXCLUSIONS` in `detect-exposed-keys.js`.

### Auto-Fix Not Working

**Issue:** Keys detected but not automatically removed.

**Solution:**
```bash
# Manually run with fix
node scripts/detect-exposed-keys.js --scan-all --fix

# Commit the changes
git add -A
git commit -m "Remove exposed keys"
git push
```

---

## 📊 What Happens When Keys Are Detected?

### 1. Detection Phase
```
🔍 Scanning files...
❌ Found 3 exposed keys in 2 files
```

### 2. Remediation Phase (if --fix is used)
```
🔧 Removing exposed keys...
✅ Fixed: chat.html
✅ Fixed: config.js
```

### 3. Alerting Phase
- 📧 GitHub Issue created: "🚨 Security Alert: Exposed Keys"
- 💬 PR Comment added (if in PR)
- 📝 Workflow artifact uploaded
- ❌ Workflow marked as failed

### 4. Manual Action Required
- 🔑 Revoke exposed keys at https://openrouter.ai/keys
- 🔄 Generate new keys
- 📦 Update GitHub Secrets
- ☁️ Update Vercel environment variables

---

## 🚦 Integration with CI/CD

### GitHub Actions
Already configured! See `.github/workflows/scan-exposed-keys.yml`

### Pre-Commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit
node scripts/detect-exposed-keys.js
if [ $? -ne 0 ]; then
  echo "❌ Exposed keys detected! Commit blocked."
  exit 1
fi
```

### Vercel
Add to `vercel.json`:
```json
{
  "buildCommand": "node scripts/detect-exposed-keys.js && npm run build"
}
```

---

## 📚 Additional Resources

- [OpenRouter Dashboard](https://openrouter.ai/keys)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Key Rotation Guide](../OPENROUTER_KEY_MANAGEMENT.md)
- [Security Best Practices](../SECURITY-IMPLEMENTATION-GUIDE.md)

---

## 🎓 Training Your Team

### Quick Reference Card

**Before Committing:**
```bash
# Check for exposed keys
node scripts/detect-exposed-keys.js --scan-all
```

**If Keys Are Detected:**
```bash
# Remove them
node scripts/detect-exposed-keys.js --scan-all --fix

# Revoke on OpenRouter
open https://openrouter.ai/keys

# Update secrets
gh secret set OPENROUTER_API_KEY
```

**Prevention:**
```bash
# Always use environment variables
export OPENROUTER_API_KEY="sk-or-v1-..."

# In code:
const key = process.env.OPENROUTER_API_KEY;
```

---

## 🤝 Support

**Found a bug?** [Create an issue](https://github.com/F8ai/formul8-multiagent/issues)

**Need help?** Check existing issues or ask in discussions

**Want to contribute?** Pull requests welcome!

---

## ✅ Deployment Checklist

- [ ] Copy workflow to `.github/workflows/`
- [ ] Enable workflow permissions
- [ ] Test with a sample key (documentation example)
- [ ] Verify auto-fix works
- [ ] Check issue creation
- [ ] Train team on usage
- [ ] Add to onboarding docs
- [ ] Schedule regular audits

---

**Remember:** This scanner is a safety net, not a replacement for good security practices. Always handle API keys with care! 🔐

