# Revoking Exposed OpenRouter Keys

Quick guide for revoking compromised OpenRouter API keys using the Provisioning API.

---

## 🔑 Understanding Key Types

### Regular API Keys
- Used for OpenRouter API calls (chat completions, etc.)
- Example: `sk-or-v1-bbee5d9e907ab017...`
- **These are what get exposed in code**

### Provisioning Keys
- "Master keys" that manage regular API keys
- Can create, list, and **delete** regular keys
- **Cannot** be used for OpenRouter API calls
- **You only need ONE provisioning key**

---

## 🚀 Quick Revocation

### Option 1: Automatic Revocation Script (Recommended)

```bash
# Set your provisioning key (one-time setup)
export OPENROUTER_PROVISIONING_KEY="sk-or-v1-4eb...971"

# Revoke the exposed key
node scripts/revoke-exposed-key.js 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
```

The script will:
1. ✅ List all your API keys
2. ✅ Find the matching exposed key
3. ✅ Revoke it automatically
4. ✅ Show you next steps

### Option 2: Using the Key Manager

```bash
# List all keys to find the ID
node scripts/openrouter-key-manager.js list

# Output:
# • Formul8-Main-2025-10-15 (abc123) - Created: 2025-10-15
# • Old-Key (xyz789) - Created: 2025-09-01

# Delete by ID
node scripts/openrouter-key-manager.js delete --key-id=xyz789
```

### Option 3: Manual (Dashboard)

1. Go to https://openrouter.ai/settings/keys
2. Find the exposed key (look for last 4 characters)
3. Click "..." menu → Delete/Revoke

---

## 🔐 Revoke All Exposed Keys from Scan

Based on your recent scan, here are the keys that need revocation:

### 1. Lambda Function Key (CRITICAL)
```bash
# This key is in AWS Lambda: formul8-f8-lambda
# Key: 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

node scripts/revoke-exposed-key.js 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
```

### 2. Hardcoded in Files (Already Removed from Code)
```bash
# Key: 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
# Was in: chat-vs.html, public/chat-vs.html, lambda-package/public/chat-vs.html

node scripts/revoke-exposed-key.js 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
```

```bash
# Key: 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
# Was in: scripts/manual-vercel-setup.md, syzychat-backend Lambda

node scripts/revoke-exposed-key.js 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
```

---

## 🔄 Complete Remediation Workflow

### Step 1: Revoke All Exposed Keys
```bash
export OPENROUTER_PROVISIONING_KEY="sk-or-v1-4eb...971"

# Revoke each exposed key
node scripts/revoke-exposed-key.js sk-or-v1-2fa...3f7
node scripts/revoke-exposed-key.js sk-or-v1-bbee...aecb
node scripts/revoke-exposed-key.js sk-or-v1-dbdd...6a94
```

### Step 2: Generate New Key
```bash
# Create a fresh key
node scripts/openrouter-key-manager.js create --name="Formul8-Production-$(date +%Y-%m-%d)"

# Output will show your new key - save it securely!
```

### Step 3: Update GitHub Secrets
```bash
# Update the GitHub secret
gh secret set OPENROUTER_API_KEY

# Paste your new key when prompted
```

### Step 4: Update Vercel (Production)
```bash
# Remove old key
vercel env rm OPENROUTER_API_KEY production

# Add new key
vercel env add OPENROUTER_API_KEY production
# Paste your new key when prompted

# Repeat for preview and development
vercel env add OPENROUTER_API_KEY preview
vercel env add OPENROUTER_API_KEY development
```

### Step 5: Update AWS Lambda (if still using)
```bash
# Update the Lambda function
aws lambda update-function-configuration \
  --function-name formul8-f8-lambda \
  --environment Variables="{OPENROUTER_API_KEY=sk-or-v1-YOUR-NEW-KEY}"
```

Or just delete the unused Lambda:
```bash
bash cleanup-aws.sh
```

### Step 6: Update Local Environment
```bash
# Update ~/.env
echo "OPENROUTER_API_KEY=sk-or-v1-YOUR-NEW-KEY" >> ~/.env
```

### Step 7: Verify Everything Works
```bash
# Test the new key
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer sk-or-v1-YOUR-NEW-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-3.5-sonnet",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 5
  }'
```

---

## 📊 Your Provisioning Keys

You currently have **2 provisioning keys**. You only need **one**.

### Current Keys:
1. **"GitHub Provisioning Key"** - `sk-or-v1-eda...3fe`
2. **"F8 Provisioning"** - `sk-or-v1-4eb...971` ✅ Use this one

### Recommendation:
```bash
# Keep F8 Provisioning (newer/more descriptive name)
export OPENROUTER_PROVISIONING_KEY="sk-or-v1-4eb...971"

# Delete the old GitHub Provisioning Key
# Go to: https://openrouter.ai/settings/keys
# Find: "GitHub Provisioning Key"
# Delete it
```

---

## 🔐 Security Best Practices

### Store Provisioning Key Securely
```bash
# Add to GitHub Secrets (for automation)
gh secret set OPENROUTER_PROVISIONING_KEY

# Add to your local ~/.env (for manual operations)
echo "OPENROUTER_PROVISIONING_KEY=sk-or-v1-..." >> ~/.env
```

### Never Commit Provisioning Keys
```bash
# They're even more sensitive than regular keys!
# Make sure ~/.env is in .gitignore
echo "~/.env" >> .gitignore
```

### Rotate Regular Keys Monthly
```bash
# Use the automated rotation
node scripts/openrouter-key-manager.js rotate --delete-old
```

---

## 🆘 Emergency: Key Leaked in Git History

If keys are in git history (not just current files):

### Option 1: BFG Repo-Cleaner (Recommended)
```bash
# Install
brew install bfg

# Create a file with exposed keys
cat > exposed-keys.txt << EOF
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
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
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
EOF

# Remove from history
bfg --replace-text exposed-keys.txt --no-blob-protection

# Force push (⚠️ dangerous, coordinate with team)
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

### Option 2: Git Filter-Branch
```bash
# More complex but built-in
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch chat-vs.html' \
  --prune-empty --tag-name-filter cat -- --all

git push --force
```

---

## 📞 Support

- **OpenRouter Dashboard**: https://openrouter.ai/settings/keys
- **API Docs**: https://openrouter.ai/docs/api-keys
- **Key Manager**: `node scripts/openrouter-key-manager.js --help`
- **Revoke Script**: `node scripts/revoke-exposed-key.js`

---

## ✅ Post-Revocation Checklist

- [ ] Revoked all exposed regular API keys
- [ ] Generated new regular API key
- [ ] Updated GitHub Secrets
- [ ] Updated Vercel environment variables
- [ ] Updated AWS Lambda (or deleted it)
- [ ] Updated local ~/.env
- [ ] Tested new key works
- [ ] Deleted unused provisioning key
- [ ] Verified only one provisioning key remains
- [ ] Added OPENROUTER_PROVISIONING_KEY to GitHub Secrets (for automation)
- [ ] Committed code changes (with keys removed)
- [ ] Verified automated scanner is working

---

**Remember**: Act fast! Exposed keys should be revoked within minutes of detection. 🚨

