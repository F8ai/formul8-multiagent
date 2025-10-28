# OpenRouter Key Scanner Scripts

Quick reference for security scanning tools.

## 🔍 Main Scanner

### `detect-exposed-keys.js`
Detects and removes exposed OpenRouter API keys.

```bash
# Scan all files
node scripts/detect-exposed-keys.js --scan-all

# Auto-fix exposed keys
node scripts/detect-exposed-keys.js --scan-all --fix

# Scan only changed files
node scripts/detect-exposed-keys.js --base=main --head=HEAD

# Verbose output
node scripts/detect-exposed-keys.js --scan-all --verbose
```

## 🪝 Pre-Commit Hook

### `pre-commit-key-check.sh`
Blocks commits containing exposed keys.

```bash
# Install
cp scripts/pre-commit-key-check.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Test (try committing a file with a key)
git add file-with-key.js
git commit -m "test"  # Will be blocked
```

## 🚀 Deployment Script

### `deploy-key-scanner-to-repo.sh`
One-command deployment to any repository.

```bash
# Deploy to current repo
./scripts/deploy-key-scanner-to-repo.sh

# Deploy to another repo
./scripts/deploy-key-scanner-to-repo.sh /path/to/repo
```

## 📚 Full Documentation

See [KEY_SCANNER_DEPLOYMENT_GUIDE.md](../docs/KEY_SCANNER_DEPLOYMENT_GUIDE.md) for complete documentation.

