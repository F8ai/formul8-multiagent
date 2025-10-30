# OpenRouter Security Monitoring System

## Overview

This comprehensive security monitoring system automatically tracks OpenRouter API usage patterns and detects unauthorized activity, suspicious behavior, and potential security breaches. The system runs continuously via GitHub Actions and provides detailed security reports and alerts.

## 🚀 Features

### 📊 Usage Monitoring
- **Real-time tracking** of API key usage patterns
- **Cost monitoring** and spending analysis
- **Request pattern analysis** to detect abuse
- **Token usage tracking** for resource management
- **Key limit monitoring** to prevent overages

### 🔍 Anomaly Detection
- **Rapid request detection** (potential DDoS or abuse)
- **Burst usage patterns** (unusual spikes in activity)
- **Off-hours usage** (suspicious timing patterns)
- **Geographic anomalies** (unexpected locations)
- **Model abuse detection** (excessive expensive model usage)
- **Key sharing detection** (multiple IPs using same key)
- **Suspicious user agents** (non-standard clients)

### 🚨 Alert System
- **Risk scoring** with configurable thresholds
- **Multi-level alerts** (Critical, High, Medium, Low)
- **Automated notifications** via GitHub Actions
- **Security reports** with detailed analysis
- **Recommendations** for remediation

## 📁 System Components

### Scripts
- **`scripts/openrouter-usage-monitor.js`** - Basic usage monitoring
- **`scripts/security-anomaly-detector.js`** - Advanced anomaly detection

### GitHub Actions Workflows
- **`.github/workflows/monitor-openrouter-usage.yml`** - Basic usage monitoring (every 6 hours)
- **`.github/workflows/security-monitoring.yml`** - Comprehensive security monitoring (every 4 hours)

### Generated Reports
- **`security-reports/security-report-*.json`** - Usage monitoring reports
- **`security-reports/anomaly-report-*.json`** - Anomaly detection reports
- **`logs/`** - Detailed monitoring logs

## 🔧 Setup and Configuration

### Prerequisites
1. **OpenRouter Provisioning Key** - Set in GitHub Secrets as `OPENROUTER_PROVISIONING_KEY`
2. **GitHub Actions enabled** - Workflows will run automatically
3. **Node.js 18+** - For running monitoring scripts

### Required GitHub Secrets
```bash
# Set the provisioning key for API access
gh secret set OPENROUTER_PROVISIONING_KEY --body "sk-or-v1-your-provisioning-key"
```

### Optional Configuration
- **Alert thresholds** - Configure in workflow inputs
- **Monitoring frequency** - Adjust cron schedules
- **Notification endpoints** - Add Slack/Discord webhooks

## 🚀 Usage

### Automatic Monitoring
The system runs automatically via GitHub Actions:
- **Usage monitoring**: Every 6 hours
- **Security monitoring**: Every 4 hours
- **Reports**: Generated and stored as artifacts

### Manual Monitoring
Run monitoring scripts manually:

```bash
# Basic usage monitoring
node scripts/openrouter-usage-monitor.js monitor

# Advanced anomaly detection
node scripts/security-anomaly-detector.js detect
```

### Manual Workflow Triggers
Trigger workflows manually via GitHub Actions:
1. Go to **Actions** tab in GitHub
2. Select **OpenRouter Security Monitoring**
3. Click **Run workflow**
4. Choose monitoring type and thresholds
5. Click **Run workflow**

## 📊 Monitoring Types

### 1. Usage Monitoring
Tracks basic usage patterns and generates risk scores based on:
- Request counts vs. limits
- Token usage patterns
- Cost analysis
- Key creation dates
- Usage frequency

### 2. Anomaly Detection
Detects specific security patterns:
- **Rapid Requests**: >100 requests/minute
- **Burst Usage**: >1000 requests in 5 minutes
- **Off-Hours Usage**: High activity during 2-6 AM
- **Geographic Anomalies**: Usage from unexpected locations
- **Model Abuse**: Excessive expensive model usage
- **Key Sharing**: Multiple IPs using same key
- **Suspicious User Agents**: Non-standard clients

## 🚨 Alert Levels

### Risk Score Calculation
- **Usage Risk**: 0-100 points based on usage patterns
- **Anomaly Risk**: 0-100 points based on detected anomalies
- **Total Risk**: Combined score (0-200 points)

### Alert Thresholds
- **CRITICAL**: >70 points - Immediate action required
- **HIGH**: 40-70 points - Review and address promptly
- **MEDIUM**: 20-40 points - Monitor closely
- **LOW**: <20 points - Continue regular monitoring

### Alert Types
1. **Critical Alert**: Risk score exceeds threshold
2. **Anomaly Alert**: Multiple anomalies detected
3. **Success Notification**: Normal monitoring completed
4. **Failure Notification**: Monitoring system error

## 📄 Report Structure

### Usage Report
```json
{
  "timestamp": "2025-10-30T04:00:00Z",
  "summary": {
    "total_keys": 3,
    "suspicious_activities": 2,
    "risk_score": 50,
    "risk_level": "MEDIUM"
  },
  "usage_data": [...],
  "analysis": {
    "suspicious_activity": [...],
    "warnings": [...],
    "recommendations": [...]
  }
}
```

### Anomaly Report
```json
{
  "timestamp": "2025-10-30T04:00:00Z",
  "summary": {
    "total_keys": 3,
    "anomalies_detected": 6,
    "risk_score": 140,
    "risk_level": "CRITICAL"
  },
  "anomalies": [...],
  "usage_data": [...],
  "recommendations": [...]
}
```

## 🔍 Security Patterns Detected

### High Severity
- **RAPID_REQUESTS**: Excessive request frequency
- **KEY_SHARING**: Multiple IPs using same key
- **MODEL_ABUSE**: Excessive expensive model usage
- **EXCESSIVE_USAGE**: Requests exceed key limits

### Medium Severity
- **BURST_USAGE**: Unusual usage spikes
- **SUSPICIOUS_USER_AGENT**: Non-standard clients
- **GEOGRAPHIC_ANOMALY**: Unexpected locations
- **HIGH_TOKEN_USAGE**: Excessive token consumption

### Low Severity
- **UNUSUAL_HOURS**: Off-hours usage patterns
- **HIGH_COST**: Unusual spending patterns

## 💡 Security Recommendations

### Critical Risk (>70 points)
- 🚨 Immediate action required - consider rotating all keys
- 🔍 Investigate all detected anomalies immediately
- 🛡️ Implement additional security controls

### High Risk (40-70 points)
- ⚠️ Review and address anomalies promptly
- 🔄 Consider rotating affected keys
- 📊 Increase monitoring frequency

### Medium Risk (20-40 points)
- 📋 Monitor closely and address anomalies
- 🔍 Review usage patterns for affected keys

### Low Risk (<20 points)
- ✅ Continue regular monitoring

### Specific Recommendations
- **Key Sharing**: Investigate and implement IP restrictions
- **Model Abuse**: Review costs and implement spending limits
- **Rapid Requests**: Implement rate limiting
- **Geographic Anomalies**: Verify legitimate usage

## 🔧 Customization

### Adjusting Monitoring Frequency
Edit the cron schedules in workflow files:
```yaml
# Every 4 hours
- cron: '0 */4 * * *'

# Every 6 hours  
- cron: '0 */6 * * *'

# Daily at 2 AM
- cron: '0 2 * * *'
```

### Configuring Alert Thresholds
Set custom thresholds in workflow inputs:
```yaml
inputs:
  alert_threshold:
    description: 'Risk score threshold for alerts'
    default: '30'
```

### Adding Notifications
Add notification logic to workflow steps:
```yaml
- name: Send Slack Alert
  run: |
    curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"🚨 OpenRouter Security Alert!"}' \
    ${{ secrets.SLACK_WEBHOOK_URL }}
```

## 📈 Monitoring Dashboard

### GitHub Actions Artifacts
- **Security Reports**: Detailed JSON reports
- **Monitoring Logs**: Execution logs and debug info
- **Security Summary**: Markdown summary reports

### Key Metrics to Track
- **Risk Score Trends**: Monitor risk levels over time
- **Anomaly Frequency**: Track detection patterns
- **Key Usage Patterns**: Identify normal vs. suspicious usage
- **Cost Trends**: Monitor spending patterns

## 🛡️ Security Best Practices

### Regular Monitoring
- Review security reports daily
- Investigate all high-severity anomalies
- Monitor risk score trends
- Update thresholds based on usage patterns

### Incident Response
1. **Immediate**: Review security reports
2. **Investigate**: Check for unauthorized usage
3. **Contain**: Rotate affected keys if necessary
4. **Remediate**: Address root causes
5. **Monitor**: Increase monitoring frequency

### Preventive Measures
- Implement rate limiting
- Set spending limits
- Use IP restrictions
- Regular key rotation
- Monitor usage patterns

## 🔍 Troubleshooting

### Common Issues
1. **API Access Denied**: Check provisioning key validity
2. **No Data Available**: Verify API endpoints and permissions
3. **False Positives**: Adjust detection thresholds
4. **Missing Reports**: Check GitHub Actions logs

### Debug Mode
Enable detailed logging by setting environment variables:
```bash
export DEBUG=true
export LOG_LEVEL=debug
```

### Manual Testing
Test the monitoring system:
```bash
# Test usage monitoring
node scripts/openrouter-usage-monitor.js monitor

# Test anomaly detection  
node scripts/security-anomaly-detector.js detect
```

## 📚 API Reference

### OpenRouter API Endpoints Used
- `GET /keys` - List all API keys
- `GET /keys/{id}` - Get key details
- `GET /keys/{id}/usage` - Get key usage (if available)

### Custom Endpoints
- Usage monitoring uses fallback methods when detailed usage data isn't available
- Anomaly detection uses simulated data for demonstration

## 🤝 Contributing

### Adding New Detection Patterns
1. Add pattern to `SECURITY_PATTERNS` in anomaly detector
2. Implement detection logic in `detectAnomalies()`
3. Add severity scoring in `calculateRiskScore()`
4. Update documentation

### Improving Monitoring
1. Add new metrics to usage monitoring
2. Implement additional API endpoints
3. Enhance reporting formats
4. Add new notification channels

## 📞 Support

For issues or questions:
1. Check GitHub Actions logs
2. Review security reports
3. Test monitoring scripts manually
4. Verify API key permissions
5. Check workflow configuration

---

**🔒 This monitoring system provides comprehensive security oversight for OpenRouter API usage, helping detect and prevent unauthorized access and suspicious activity.**