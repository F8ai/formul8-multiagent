# F8-Security Repository Setup

This document outlines the setup and deployment process for the Formul8 Security SDK private repository.

## 🔒 Repository Configuration

### 1. Create Private Repository

```bash
# Create private repository on GitHub
gh repo create formul8/f8-security --private --description "Formul8 Multiagent Security SDK - Proprietary security middleware for all Formul8 agents"

# Clone the repository
git clone https://github.com/formul8/f8-security.git
cd f8-security
```

### 2. Initial Setup

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: Formul8 Security SDK v1.0.0"

# Set up remote
git remote add origin https://github.com/formul8/f8-security.git
git branch -M main
git push -u origin main
```

### 3. Repository Settings

#### Access Control
- **Visibility**: Private
- **Collaborators**: Formul8 team members only
- **Branch Protection**: Enable for main branch
- **Required Reviews**: 2 approvals for main branch

#### Security Settings
- **Dependabot**: Enabled for security updates
- **Code Scanning**: Enabled with GitHub Advanced Security
- **Secret Scanning**: Enabled
- **Dependency Review**: Enabled

## 📦 NPM Package Configuration

### 1. Private NPM Registry

```bash
# Configure npm for private registry
npm config set @formul8:registry https://npm.pkg.github.com
npm config set //npm.pkg.github.com/:_authToken YOUR_GITHUB_TOKEN
```

### 2. Package Publishing

```bash
# Build the package
npm run build

# Publish to private registry
npm publish --access restricted
```

### 3. Package Access

- **Scope**: @formul8/security-sdk
- **Registry**: GitHub Packages (private)
- **Access**: Formul8 organization members only

## 🔐 Security Configuration

### 1. Environment Variables

```bash
# Required environment variables
export FORMUL8_SECURITY_KEY="your-security-key"
export GITHUB_TOKEN="your-github-token"
export NPM_TOKEN="your-npm-token"
```

### 2. GitHub Secrets

Add the following secrets to the repository:
- `FORMUL8_SECURITY_KEY`
- `GITHUB_TOKEN`
- `NPM_TOKEN`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### 3. Access Control

```yaml
# .github/CODEOWNERS
* @formul8/security-team
* @formul8/legal-team
```

## 🚀 Deployment Process

### 1. Version Management

```bash
# Update version
npm version patch  # for bug fixes
npm version minor  # for new features
npm version major  # for breaking changes

# Tag release
git tag v1.0.0
git push origin v1.0.0
```

### 2. CI/CD Pipeline

```yaml
# .github/workflows/release.yml
name: Release Security SDK

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://npm.pkg.github.com'
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 📋 Agent Integration

### 1. Agent Repository Setup

Each agent repository should:

```bash
# Install the security SDK
npm install @formul8/security-sdk

# Configure .npmrc
echo "@formul8:registry=https://npm.pkg.github.com" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> .npmrc
```

### 2. Implementation

```javascript
// In each agent's lambda.js
const { createAgentSecurity } = require('@formul8/security-sdk');

const security = createAgentSecurity({
  name: 'Agent Name',
  description: 'Agent description',
  keywords: ['keyword1', 'keyword2'],
  specialties: ['specialty1', 'specialty2']
});
```

## 🔍 Monitoring and Maintenance

### 1. Security Monitoring

- **Dependency Scanning**: Automated vulnerability scanning
- **Code Scanning**: Static analysis for security issues
- **Secret Scanning**: Detect exposed secrets
- **License Compliance**: Ensure proprietary license compliance

### 2. Regular Updates

- **Monthly**: Security dependency updates
- **Quarterly**: Security audit and review
- **Annually**: Full security assessment

### 3. Access Review

- **Monthly**: Review repository access
- **Quarterly**: Review package access
- **Annually**: Full access audit

## 📞 Support and Maintenance

### Internal Support
- **Security Team**: security@formul8.ai
- **Legal Team**: legal@formul8.ai
- **DevOps Team**: devops@formul8.ai

### Documentation
- **Internal Wiki**: [Formul8 Internal Wiki]
- **API Documentation**: [Internal API Docs]
- **Security Guidelines**: [Internal Security Guidelines]

## 🚨 Incident Response

### Security Incidents
1. **Immediate**: Contact security@formul8.ai
2. **Assessment**: Security team evaluation
3. **Response**: Immediate remediation
4. **Communication**: Internal team notification
5. **Review**: Post-incident analysis

### License Violations
1. **Detection**: Automated monitoring
2. **Investigation**: Legal team review
3. **Action**: Immediate cease and desist
4. **Enforcement**: Legal action if necessary

---

**This is a proprietary Formul8 internal document. Do not share outside the organization.**