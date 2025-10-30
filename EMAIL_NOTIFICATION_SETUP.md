# Email Notification Setup Guide

## Overview

The OpenRouter Security Monitoring system now supports email notifications for all security events. You can configure email alerts using either SendGrid (recommended) or SMTP.

## 📧 Supported Email Providers

### 1. SendGrid (Recommended)
- **Pros**: Reliable, professional, easy setup
- **Cons**: Requires account setup
- **Best for**: Production environments

### 2. SMTP
- **Pros**: Works with any email provider
- **Cons**: Requires SMTP credentials
- **Best for**: Custom email servers

## 🔧 Setup Instructions

### Option 1: SendGrid Setup (Recommended)

#### Step 1: Create SendGrid Account
1. Go to [SendGrid.com](https://sendgrid.com)
2. Sign up for a free account (100 emails/day free)
3. Verify your email address

#### Step 2: Create API Key
1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Choose **Restricted Access**
4. Grant **Mail Send** permissions
5. Copy the API key (starts with `SG.`)

#### Step 3: Configure GitHub Secrets
```bash
# Set your email address for notifications
gh secret set NOTIFICATION_EMAIL --body "your-email@example.com"

# Set SendGrid API key
gh secret set SENDGRID_API_KEY --body "SG.your-api-key-here"

# Set sender email (must be verified in SendGrid)
gh secret set SENDGRID_FROM_EMAIL --body "security@yourdomain.com"

# Set sender name (optional)
gh secret set SENDGRID_FROM_NAME --body "Formul8 Security Monitor"
```

#### Step 4: Verify Sender Email
1. In SendGrid dashboard, go to **Settings** → **Sender Authentication**
2. Add and verify your sender email address
3. This is required for sending emails

### Option 2: SMTP Setup

#### Step 1: Get SMTP Credentials
Choose your email provider and get SMTP settings:

**Gmail:**
- Host: `smtp.gmail.com`
- Port: `587`
- Username: Your Gmail address
- Password: App password (not regular password)

**Outlook/Hotmail:**
- Host: `smtp-mail.outlook.com`
- Port: `587`
- Username: Your email address
- Password: Your email password

**Custom SMTP:**
- Get settings from your email provider
- Usually requires authentication

#### Step 2: Configure GitHub Secrets
```bash
# Set your email address for notifications
gh secret set NOTIFICATION_EMAIL --body "your-email@example.com"

# Set SMTP settings
gh secret set SMTP_HOST --body "smtp.gmail.com"
gh secret set SMTP_USER --body "your-email@gmail.com"
gh secret set SMTP_PASS --body "your-app-password"

# Set sender email and name
gh secret set SENDGRID_FROM_EMAIL --body "your-email@gmail.com"
gh secret set SENDGRID_FROM_NAME --body "Formul8 Security Monitor"
```

## 📋 Required GitHub Secrets

### Essential Secrets
| Secret | Description | Required |
|--------|-------------|----------|
| `NOTIFICATION_EMAIL` | Email address to receive alerts | ✅ Yes |
| `OPENROUTER_PROVISIONING_KEY` | OpenRouter API key for monitoring | ✅ Yes |

### SendGrid Secrets
| Secret | Description | Required |
|--------|-------------|----------|
| `SENDGRID_API_KEY` | SendGrid API key | ✅ Yes (if using SendGrid) |
| `SENDGRID_FROM_EMAIL` | Sender email address | ✅ Yes (if using SendGrid) |
| `SENDGRID_FROM_NAME` | Sender display name | ❌ Optional |

### SMTP Secrets
| Secret | Description | Required |
|--------|-------------|----------|
| `SMTP_HOST` | SMTP server hostname | ✅ Yes (if using SMTP) |
| `SMTP_USER` | SMTP username | ✅ Yes (if using SMTP) |
| `SMTP_PASS` | SMTP password | ✅ Yes (if using SMTP) |

### Optional Secrets
| Secret | Description | Required |
|--------|-------------|----------|
| `NOTIFICATION_CC_EMAIL` | CC email address | ❌ Optional |
| `NOTIFICATION_BCC_EMAIL` | BCC email address | ❌ Optional |
| `SEND_SUCCESS_EMAILS` | Send success notifications (true/false) | ❌ Optional |

## 🧪 Testing Email Notifications

### Test Email Function
```bash
# Test email configuration
node scripts/email-notifier.js test
```

### Manual Alert Testing
```bash
# Test critical alert
node scripts/email-notifier.js alert CRITICAL

# Test anomaly alert
node scripts/email-notifier.js alert ANOMALY

# Test success notification
node scripts/email-notifier.js alert SUCCESS
```

### Test with Custom Data
```bash
# Test with custom data
echo '{"riskLevel":"HIGH","riskScore":75,"anomalies":[],"recommendations":["Test recommendation"]}' | node scripts/email-notifier.js alert HIGH
```

## 📧 Email Types and Triggers

### 1. Critical Alerts
- **Trigger**: Risk score > 70
- **Frequency**: Every monitoring cycle
- **Content**: Detailed security analysis with immediate action items
- **Priority**: High

### 2. Anomaly Alerts
- **Trigger**: Multiple anomalies detected
- **Frequency**: When anomalies are found
- **Content**: List of detected anomalies and recommendations
- **Priority**: Medium

### 3. Success Notifications
- **Trigger**: Normal monitoring completion
- **Frequency**: Only if `SEND_SUCCESS_EMAILS=true`
- **Content**: Summary of monitoring results
- **Priority**: Low

### 4. Failure Notifications
- **Trigger**: Monitoring system failure
- **Frequency**: When monitoring fails
- **Content**: Error details and troubleshooting steps
- **Priority**: High

## 🎨 Email Template Features

### Visual Design
- **Responsive HTML** design
- **Color-coded alerts** (Red for critical, Orange for high, etc.)
- **Professional formatting** with clear sections
- **Mobile-friendly** layout

### Content Sections
- **Security Summary** with risk scores and metrics
- **Detected Anomalies** with detailed descriptions
- **Security Recommendations** with actionable steps
- **Immediate Actions** for critical alerts
- **GitHub Actions Links** for easy access to reports

### Interactive Elements
- **Action buttons** to view GitHub Actions
- **Repository links** for quick access
- **Workflow run information** for debugging

## 🔧 Configuration Examples

### Complete SendGrid Setup
```bash
# Essential secrets
gh secret set NOTIFICATION_EMAIL --body "admin@yourcompany.com"
gh secret set OPENROUTER_PROVISIONING_KEY --body "sk-or-v1-your-key"

# SendGrid configuration
gh secret set SENDGRID_API_KEY --body "SG.your-sendgrid-api-key"
gh secret set SENDGRID_FROM_EMAIL --body "security@yourcompany.com"
gh secret set SENDGRID_FROM_NAME --body "Formul8 Security Monitor"

# Optional settings
gh secret set NOTIFICATION_CC_EMAIL --body "security-team@yourcompany.com"
gh secret set SEND_SUCCESS_EMAILS --body "false"
```

### Complete SMTP Setup (Gmail)
```bash
# Essential secrets
gh secret set NOTIFICATION_EMAIL --body "admin@yourcompany.com"
gh secret set OPENROUTER_PROVISIONING_KEY --body "sk-or-v1-your-key"

# SMTP configuration
gh secret set SMTP_HOST --body "smtp.gmail.com"
gh secret set SMTP_USER --body "your-email@gmail.com"
gh secret set SMTP_PASS --body "your-gmail-app-password"

# Sender configuration
gh secret set SENDGRID_FROM_EMAIL --body "your-email@gmail.com"
gh secret set SENDGRID_FROM_NAME --body "Formul8 Security Monitor"
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "No email service configured"
- **Cause**: Missing SendGrid API key or SMTP credentials
- **Fix**: Set either `SENDGRID_API_KEY` or `SMTP_HOST` secrets

#### 2. "SendGrid API error: 401"
- **Cause**: Invalid API key
- **Fix**: Verify API key is correct and has Mail Send permissions

#### 3. "SMTP error: Authentication failed"
- **Cause**: Invalid SMTP credentials
- **Fix**: Check username/password and use app passwords for Gmail

#### 4. "No notification email configured"
- **Cause**: Missing `NOTIFICATION_EMAIL` secret
- **Fix**: Set the email address to receive notifications

### Debug Steps
1. **Check secrets**: Verify all required secrets are set
2. **Test email**: Run `node scripts/email-notifier.js test`
3. **Check logs**: Review GitHub Actions logs for error details
4. **Verify permissions**: Ensure API keys have correct permissions

### Gmail App Password Setup
1. Enable 2-factor authentication on Gmail
2. Go to Google Account settings
3. Security → 2-Step Verification → App passwords
4. Generate app password for "Mail"
5. Use this password (not your regular password) for `SMTP_PASS`

## 📊 Monitoring Email Delivery

### Email Delivery Status
- **SendGrid**: Check delivery status in SendGrid dashboard
- **SMTP**: Check email provider's sent folder
- **GitHub Actions**: Review workflow logs for email status

### Email Frequency Control
- **Critical alerts**: Always sent
- **Anomaly alerts**: Always sent
- **Success notifications**: Only if `SEND_SUCCESS_EMAILS=true`
- **Failure notifications**: Always sent

### Rate Limiting
- **SendGrid Free**: 100 emails/day
- **SendGrid Paid**: Based on plan
- **SMTP**: Based on provider limits

## 🔒 Security Considerations

### Email Security
- **Use app passwords** for Gmail/Outlook
- **Rotate API keys** regularly
- **Use dedicated email accounts** for monitoring
- **Enable 2FA** on email accounts

### Data Privacy
- **Email content** includes risk scores and anomaly details
- **No sensitive API keys** are included in emails
- **GitHub Actions links** provide access to detailed reports
- **Consider data retention** policies for email content

## 📈 Advanced Configuration

### Custom Email Templates
Modify `scripts/email-notifier.js` to customize:
- Email styling and colors
- Content sections and layout
- Alert thresholds and triggers
- Notification frequency

### Multiple Recipients
```bash
# Set multiple recipients
gh secret set NOTIFICATION_EMAIL --body "admin@company.com,security@company.com"
gh secret set NOTIFICATION_CC_EMAIL --body "manager@company.com"
gh secret set NOTIFICATION_BCC_EMAIL --body "audit@company.com"
```

### Conditional Notifications
```bash
# Only send critical alerts
gh secret set SEND_SUCCESS_EMAILS --body "false"

# Send all notifications
gh secret set SEND_SUCCESS_EMAILS --body "true"
```

---

**📧 With email notifications configured, you'll receive immediate alerts for any security issues with your OpenRouter API keys, ensuring you can respond quickly to potential threats.**