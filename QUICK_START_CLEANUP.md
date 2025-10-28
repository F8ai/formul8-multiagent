# 🚀 Quick Start: Complete Security Cleanup

**One command to do everything!**

---

## 📋 Prerequisites

Before running the cleanup script, make sure you have:

1. ✅ Your F8 Provisioning key ready: `sk-or-v1-4eb...971`
2. ✅ Access to:
   - OpenRouter dashboard
   - GitHub CLI (`gh`)
   - Vercel CLI (`vercel`)
   - AWS CLI (`aws`)

---

## 🎯 One-Command Cleanup

```bash
# 1. Set your provisioning key
export OPENROUTER_PROVISIONING_KEY="sk-or-v1-4eb...971"  # Use your FULL key

# 2. Run the comprehensive cleanup script
./scripts/complete-security-cleanup.sh
```

**That's it!** The script will:
- ✅ Revoke all 3 exposed keys
- ✅ Clean up AWS Lambda functions
- ✅ Generate new key
- ✅ Update GitHub Secrets
- ✅ Update Vercel env vars
- ✅ Update local ~/.env
- ✅ Commit changes
- ✅ Test everything

**Time:** ~5-10 minutes (mostly waiting for confirmations)

---

## 🔧 Manual Alternative

If you prefer to do it step-by-step manually:

### Step 1: Export Provisioning Key
```bash
export OPENROUTER_PROVISIONING_KEY="sk-or-v1-4eb...971"
```

### Step 2: Revoke Exposed Keys
```bash
# Revoke Lambda key
node scripts/revoke-exposed-key.js sk-or-v1-your-key-here

# Revoke hardcoded key
node scripts/revoke-exposed-key.js sk-or-v1-your-key-here

# Revoke documentation key
node scripts/revoke-exposed-key.js sk-or-v1-your-key-here
```

### Step 3: Clean Up AWS Lambda
```bash
# Delete unused Lambda functions
aws lambda delete-function --function-name formul8-f8-lambda
aws lambda delete-function --function-name syzychat-backend
aws lambda delete-function --function-name syzychat-ai-backend

# Or use the cleanup script
bash cleanup-aws.sh
```

### Step 4: Generate New Key
```bash
node scripts/openrouter-key-manager.js create --name="Formul8-Production-$(date +%Y-%m-%d)"
# Save the output key!
```

### Step 5: Update GitHub Secrets
```bash
gh secret set OPENROUTER_API_KEY
# Paste your new key when prompted

gh secret set OPENROUTER_PROVISIONING_KEY
# Paste your provisioning key
```

### Step 6: Update Vercel
```bash
# Remove old keys
vercel env rm OPENROUTER_API_KEY production
vercel env rm OPENROUTER_API_KEY preview
vercel env rm OPENROUTER_API_KEY development

# Add new key
vercel env add OPENROUTER_API_KEY production
vercel env add OPENROUTER_API_KEY preview
vercel env add OPENROUTER_API_KEY development
# Paste your new key when prompted for each
```

### Step 7: Update Local Environment
```bash
# Backup old .env
cp ~/.env ~/.env.backup

# Update with new key
echo "OPENROUTER_API_KEY=sk-or-v1-YOUR-NEW-KEY" >> ~/.env
```

### Step 8: Commit Changes
```bash
git add -A
git commit -m "🔒 Security: Complete key revocation and cleanup"
git push
```

### Step 9: Delete Redundant Provisioning Key
1. Go to: https://openrouter.ai/settings/keys
2. Find: "GitHub Provisioning Key" (`sk-or-v1-eda...3fe`)
3. Click "..." menu → Delete

### Step 10: Test
```bash
# Test new key
curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer YOUR-NEW-KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"anthropic/claude-3.5-sonnet","messages":[{"role":"user","content":"test"}],"max_tokens":5}'

# Test scanner
node scripts/detect-exposed-keys.js --scan-all
```

---

## 🆘 Troubleshooting

### "OPENROUTER_PROVISIONING_KEY not set"
```bash
# Make sure you've exported it
export OPENROUTER_PROVISIONING_KEY="sk-or-v1-4eb...971"

# Verify it's set
echo $OPENROUTER_PROVISIONING_KEY
```

### "gh command not found"
```bash
brew install gh
gh auth login
```

### "vercel command not found"
```bash
npm install -g vercel
vercel login
```

### "aws command not found"
```bash
brew install awscli
aws configure
```

### "Cannot revoke key"
If automated revocation fails, manually revoke at:
https://openrouter.ai/settings/keys

---

## ✅ Post-Cleanup Checklist

- [ ] All 3 exposed keys revoked
- [ ] AWS Lambda functions deleted
- [ ] New API key generated
- [ ] GitHub Secrets updated
- [ ] Vercel env vars updated (all 3 environments)
- [ ] Local ~/.env updated
- [ ] Changes committed and pushed
- [ ] Old provisioning key deleted
- [ ] GitHub Actions workflow running
- [ ] New key tested and working

---

## 📚 Documentation

- **Full Guide**: [docs/REVOKE_EXPOSED_KEYS_GUIDE.md](docs/REVOKE_EXPOSED_KEYS_GUIDE.md)
- **Scanner Guide**: [docs/KEY_SCANNER_DEPLOYMENT_GUIDE.md](docs/KEY_SCANNER_DEPLOYMENT_GUIDE.md)
- **Architecture**: [SECURITY_KEY_SCANNER_SUMMARY.md](SECURITY_KEY_SCANNER_SUMMARY.md)

---

## 🎉 Done!

Once complete, your system will be:
- 🔒 Free of exposed keys
- 🔒 Using fresh, secure credentials
- 🔒 Protected by automated scanning
- 🔒 Clean of unused infrastructure

**Time to celebrate!** 🎊

