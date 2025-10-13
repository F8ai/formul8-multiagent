# Formul8 Multiagent Security Implementation Guide

This guide provides step-by-step instructions for implementing comprehensive security across all Formul8 agent repositories.

## 🔒 Security Features to Implement

### 1. Rate Limiting
- 50 requests per 15 minutes per IP
- Custom rate limiter without external dependencies
- Proper error responses with retry information

### 2. Input Validation & Sanitization
- Message length limits (2000 characters)
- Username length limits (50 characters)
- XSS protection (script tag removal, event handler removal)
- Content filtering for malicious patterns

### 3. CORS Protection
- Restrict to specific trusted origins:
  - `https://f8.syzygyx.com`
  - `https://f8ai.github.io`
  - `https://formul8.ai`

### 4. Request Logging & Monitoring
- IP address tracking
- User agent logging
- Request timestamp logging
- Error logging with context

### 5. Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### 6. Plan-Based Access Control
- Validate plan parameters
- Restrict agent access based on user plan
- Proper error responses for access denied

## 📁 Files to Add to Each Agent Repository

### 1. `security-module.js`
```javascript
// Copy the security-module.js from the main repository
// This provides all shared security functions
```

### 2. `package.json` Updates
```json
{
  "dependencies": {
    "express": "^5.1.0",
    "cors": "^2.8.5"
  }
}
```

### 3. `lambda.js` Updates
- Import security module
- Apply security middleware
- Implement secure chat endpoint
- Add proper error handling

## 🚀 Implementation Steps for Each Agent

### Step 1: Copy Security Module
```bash
# Copy security-module.js to each agent repository
cp security-module.js /path/to/agent-repo/
```

### Step 2: Update Dependencies
```bash
cd /path/to/agent-repo/
npm install express cors
```

### Step 3: Update Lambda Function
Replace the existing `lambda.js` with the secure version that includes:
- Security middleware setup
- Input validation
- Rate limiting
- CORS protection
- Error handling

### Step 4: Deploy to AWS Lambda
```bash
# Package the agent
zip -r agent-deployment.zip . -x "*.git*" "node_modules/.cache/*"

# Deploy to Lambda
aws lambda update-function-code \
  --function-name [AGENT-NAME] \
  --zip-file fileb://agent-deployment.zip
```

### Step 5: Configure API Gateway
- Set up API Gateway for the agent
- Configure CORS settings
- Set up rate limiting
- Configure security headers

### Step 6: Test Security Features
```bash
# Test rate limiting
for i in {1..60}; do curl -X POST https://agent-url/api/chat -d '{"message":"test"}' & done

# Test input validation
curl -X POST https://agent-url/api/chat -d '{"message":"<script>alert(1)</script>"}'

# Test CORS
curl -H "Origin: https://malicious-site.com" https://agent-url/api/chat
```

## 🔧 Agent-Specific Configuration

Each agent should customize the `AGENT_CONFIG` object:

```javascript
const AGENT_CONFIG = {
  name: 'Agent Display Name',
  description: 'Agent description',
  keywords: ['keyword1', 'keyword2'],
  specialties: ['specialty1', 'specialty2'],
  tierRestriction: null // or ['admin'] for restricted agents
};
```

## 📋 Security Checklist

- [ ] Security module imported and configured
- [ ] Rate limiting implemented (50 req/15min)
- [ ] Input validation and sanitization active
- [ ] CORS restricted to trusted origins
- [ ] Security headers configured
- [ ] Request logging implemented
- [ ] Error handling with proper codes
- [ ] Plan-based access control (if applicable)
- [ ] API Gateway configured
- [ ] Lambda function deployed
- [ ] Security tests passing

## 🚨 Critical Security Notes

1. **Never commit API keys** to repositories
2. **Use environment variables** for sensitive configuration
3. **Regularly update dependencies** for security patches
4. **Monitor logs** for suspicious activity
5. **Test security features** after each deployment
6. **Keep security module updated** across all agents

## 📞 Support

For security implementation questions or issues:
- Check the main repository for latest security updates
- Review security logs for error patterns
- Test with the provided security test scripts
- Update security module when new threats are identified

## 🔄 Maintenance

- **Monthly**: Review security logs and update dependencies
- **Quarterly**: Security audit and penetration testing
- **Annually**: Full security review and policy updates