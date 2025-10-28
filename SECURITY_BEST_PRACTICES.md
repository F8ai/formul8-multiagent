# 🔒 Security Best Practices: Preventing API Key Exposure

**Updated:** $(date)  
**Purpose:** Prevent future OpenRouter API key exposures

---

## 🚨 Current Status

- ✅ **GitHub Action** automatically scans for exposed keys
- ✅ **Pre-commit hook** prevents key commits locally  
- ✅ **Detection script** available for manual scanning
- ⚠️ **GitHub Secret Scanning** should be enabled

---

## 🛡️ Prevention Measures

### 1. GitHub Secret Scanning (CRITICAL)

**Enable this immediately:**

1. Go to your repository → Settings → Security
2. Enable "Secret scanning" 
3. Enable "Push protection"

This will automatically detect and block commits containing API keys.

### 2. Pre-commit Hook (ACTIVE)

The pre-commit hook is now installed and will:
- ✅ Scan every commit for OpenRouter keys
- ✅ Block commits containing exposed keys
- ✅ Provide helpful error messages

**To install on other machines:**
```bash
cp .git/hooks/pre-commit .git/hooks/pre-commit.backup
# The hook is already in the repository
```

### 3. GitHub Actions (ACTIVE)

The `scan-exposed-keys.yml` workflow:
- ✅ Runs on every push and PR
- ✅ Automatically removes exposed keys
- ✅ Creates security issues
- ✅ Blocks PRs until fixed

### 4. Manual Scanning

**Before committing:**
```bash
# Scan all files
node scripts/detect-exposed-keys.js --scan-all

# Scan only changed files
node scripts/detect-exposed-keys.js

# Auto-fix exposed keys
node scripts/detect-exposed-keys.js --fix
```

---

## 📋 Development Guidelines

### ✅ DO: Use Environment Variables

```javascript
// ✅ CORRECT
const apiKey = process.env.OPENROUTER_API_KEY;

// ✅ CORRECT  
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
  }
});
```

### ✅ DO: Use Placeholders in Documentation

```markdown
<!-- ✅ CORRECT -->
**Example:** `sk-or-v1-your-key-here`

<!-- ✅ CORRECT -->
**Example:** `sk-or-v1-****` (masked)
```

### ❌ DON'T: Hardcode Keys

```javascript
// ❌ WRONG - Never do this!
const apiKey = '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';

// ❌ WRONG - Never do this!
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  headers: {
    'Authorization': 'Bearer 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'
  }
});
```

### ❌ DON'T: Use Real Keys in Examples

```markdown
<!-- ❌ WRONG -->
**Example:** `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`

<!-- ❌ WRONG -->
**Example:** `sk-or-v1-23c...95e` (still exposes part of the key)
```

---

## 🔧 Environment Setup

### Local Development

```bash
# Create .env file (never commit this!)
echo "OPENROUTER_API_KEY=sk-or-v1-your-actual-key" >> .env
echo "OPENROUTER_PROVISIONING_KEY=sk-or-v1-your-provisioning-key" >> .env

# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

### GitHub Secrets

```bash
# Set secrets (one-time setup)
gh secret set OPENROUTER_API_KEY --body "sk-or-v1-your-actual-key"
gh secret set OPENROUTER_PROVISIONING_KEY --body "sk-or-v1-your-provisioning-key"
```

### Vercel Environment Variables

```bash
# Set for all environments
vercel env add OPENROUTER_API_KEY production
vercel env add OPENROUTER_API_KEY preview  
vercel env add OPENROUTER_API_KEY development
```

---

## 🚨 Incident Response

### If You Accidentally Commit a Key

1. **STOP** - Don't push to remote
2. **Remove** the key from your commit:
   ```bash
   git reset HEAD~1  # Undo last commit
   # Edit files to remove keys
   git add .
   git commit -m "Remove exposed API keys"
   ```
3. **Scan** to verify:
   ```bash
   node scripts/detect-exposed-keys.js --scan-all
   ```

### If Key is Already Pushed

1. **Revoke** the key immediately:
   ```bash
   export OPENROUTER_PROVISIONING_KEY="sk-or-v1-your-provisioning-key"
   node scripts/revoke-exposed-key.js sk-or-v1-exposed-key
   ```
2. **Generate** new key
3. **Update** all deployments
4. **Clean** git history (if necessary)

---

## 🔍 Key Management

### Key Types

1. **Regular API Keys** (`sk-or-v1-...`)
   - Used for OpenRouter API calls
   - Store in environment variables
   - Rotate monthly

2. **Provisioning Keys** (`sk-or-v1-...`)
   - Used to manage other keys
   - Store in GitHub Secrets only
   - Keep secure

### Key Rotation

**Monthly rotation recommended:**

```bash
# 1. Generate new key
# 2. Update GitHub Secrets
gh secret set OPENROUTER_API_KEY --body "sk-or-v1-new-key"

# 3. Update Vercel
vercel env rm OPENROUTER_API_KEY production
vercel env add OPENROUTER_API_KEY production

# 4. Test deployment
# 5. Revoke old key
node scripts/revoke-exposed-key.js sk-or-v1-old-key
```

---

## 📊 Monitoring

### GitHub Actions

Monitor these workflows:
- `scan-exposed-keys.yml` - Key detection
- `rotate-openrouter-key.yml` - Key rotation
- `monitor-openrouter-usage.yml` - Usage monitoring

### Alerts

Set up alerts for:
- Failed key scans
- Unusual API usage
- Key rotation failures

---

## 🎯 Action Items

### Immediate (Today)
- [ ] Enable GitHub Secret Scanning
- [ ] Test pre-commit hook
- [ ] Review current key usage

### This Week  
- [ ] Implement automated key rotation
- [ ] Add usage monitoring
- [ ] Create incident response playbook

### This Month
- [ ] Implement secrets management service
- [ ] Add anomaly detection
- [ ] Regular security audits

---

## 📞 Support

- **OpenRouter Docs:** https://openrouter.ai/docs/api-keys
- **GitHub Secret Scanning:** https://docs.github.com/en/code-security/secret-scanning
- **Vercel Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables

---

**Remember:** Security is everyone's responsibility. When in doubt, ask before committing sensitive information.
