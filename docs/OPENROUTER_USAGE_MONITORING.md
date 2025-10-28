# OpenRouter Usage Monitoring

Automated monitoring and alerting for OpenRouter API usage to detect anomalies, budget overruns, and potential security issues.

---

## 🎯 Overview

The usage monitoring system provides:
- **Automated tracking** of API usage every 6 hours
- **Budget alerts** when spending exceeds thresholds
- **Anomaly detection** for unusual usage patterns
- **GitHub Issues** for tracking and resolution
- **Historical metrics** for trend analysis

---

## 🚀 Quick Start

### View Current Usage

```bash
# Set your provisioning key
export OPENROUTER_PROVISIONING_KEY="sk-or-v1-..."

# Run the monitor
node scripts/monitor-openrouter-usage.js
```

### Customize Thresholds

```bash
# Set custom alert threshold (daily spending limit)
node scripts/monitor-openrouter-usage.js --alert-threshold=75

# With environment variables
export OPENROUTER_DAILY_BUDGET=200
export OPENROUTER_MONTHLY_BUDGET=2000
node scripts/monitor-openrouter-usage.js
```

---

## 📊 What Gets Monitored

### Per-Key Metrics
- ✅ Total usage (all-time)
- ✅ Daily usage
- ✅ Weekly usage  
- ✅ Monthly usage
- ✅ Limit utilization
- ✅ Active/disabled status

### Alert Conditions

| Condition | Severity | Action |
|-----------|----------|--------|
| Daily usage > $50 (configurable) | Warning | Create issue |
| Daily usage > 2x weekly average | Warning | Create issue |
| Daily budget exceeded (90%+) | Critical | Create issue + fail workflow |
| Monthly budget exceeded (90%+) | Critical | Create issue + fail workflow |
| Key limit > 90% used | Critical | Create issue |
| Key limit > 75% used | Warning | Create issue |
| Sudden usage spike (>2x average) | Warning | Create issue |

---

## ⚙️ Configuration

### GitHub Secrets Required

| Secret | Required | Description |
|--------|----------|-------------|
| `OPENROUTER_PROVISIONING_KEY` | ✅ Yes | For accessing usage data |
| `SLACK_WEBHOOK_URL` | ⬜ Optional | For Slack notifications |

### Environment Variables

```bash
# Budget limits (USD)
OPENROUTER_DAILY_BUDGET=100          # Default: $100/day
OPENROUTER_MONTHLY_BUDGET=1000       # Default: $1000/month
```

### Workflow Inputs

When manually triggering the workflow:
- **alert_threshold**: Daily alert threshold (default: $50)
- **daily_budget**: Daily budget limit (default: $100)
- **monthly_budget**: Monthly budget limit (default: $1000)

---

## 📅 Monitoring Schedule

### Automated Runs

| Frequency | Purpose |
|-----------|---------|
| **Every 6 hours** | Real-time monitoring and alerting |
| **Manual trigger** | On-demand analysis with custom parameters |

### Data Retention

- **Metrics**: Saved in `logs/usage-metrics/` (90 days as artifacts)
- **Artifacts**: Usage reports uploaded for each run
- **Historical**: Committed to repository for long-term tracking

---

## 🚨 Alert Types

### Critical Alerts (🚨)

**Triggers workflow failure and creates high-priority issue**

- Budget exceeded (>100% of daily/monthly budget)
- Key limit exceeded (>90%)
- Suspicious usage patterns

### Warning Alerts (⚠️)

**Creates issue for tracking**

- High usage (above threshold)
- Budget warning (75-90%)
- Usage spike detected

### Info Alerts (ℹ️)

**Logged but no action taken**

- Normal usage patterns
- Keys approaching limits (50-75%)

---

## 📈 Usage Metrics

### Output Format

```json
{
  "timestamp": "2025-10-28T10:00:00.000Z",
  "totalKeys": 1,
  "activeKeys": 1,
  "totalUsage": 150.50,
  "dailyUsage": 12.30,
  "weeklyUsage": 45.60,
  "monthlyUsage": 150.50,
  "dailyBudget": 100,
  "monthlyBudget": 1000,
  "dailyBudgetPercent": 12.3,
  "monthlyBudgetPercent": 15.1,
  "alerts": 0
}
```

### Metrics Stored

- **Location**: `logs/usage-metrics/usage-YYYY-MM-DD.json`
- **Format**: JSON with full usage breakdown
- **Includes**: All alerts, key-by-key breakdown, budget status

---

## 🔔 Alert Delivery

### GitHub Issues

Automatically creates/updates issues with:
- Alert summary and severity
- Current usage breakdown
- Budget utilization
- Recommended actions
- Historical trend data

**Labels applied:**
- `openrouter-usage`
- `automated`
- `monitoring`

### Slack Notifications

If `SLACK_WEBHOOK_URL` is configured:
- Real-time notifications on critical alerts
- Link to full details in GitHub
- Summary of key metrics

---

## 📊 Example Outputs

### Normal Usage

```
🔍 OpenRouter Usage Monitor
================================================================================

ℹ️  Fetching API keys and usage data...
✅ Found 1 API key(s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Key 1: Syzygyx
Label: sk-or-v1-a20...ea6
Created: 10/14/2025, 1:45:32 PM
  Total Usage: $13.54
  Daily: $2.50
  Weekly: $8.20
  Monthly: $13.54
  ✅ Status: Active

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 OVERALL USAGE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Total Usage (All Time): $13.54
  Today: $2.50
  This Week: $8.20
  This Month: $13.54

  Daily Budget: $100 (2.5% used) ✅
  Monthly Budget: $1000 (1.4% used) ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ NO ALERTS - Everything looks good!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### High Usage Alert

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  3 ALERT(S) DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🚨 Critical: 1
     - Budget Exceeded: Daily usage ($105.50) exceeds budget ($100)
  
  ⚠️  Warnings: 2
     - High Daily Usage: Syzygyx used $105.50 today (threshold: $50)
     - Usage Spike: Syzygyx daily usage ($105.50) is 3.2x the weekly average
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔍 Anomaly Detection

### Usage Spike Detection

Flags when daily usage exceeds 2x the weekly average:
```javascript
const weeklyAverage = weeklyUsage / 7;
if (dailyUsage > weeklyAverage * 2 && weeklyAverage > 1) {
  // Alert on spike
}
```

### Budget Monitoring

Tracks spending against configurable budgets:
- **Warning**: 75-90% of budget used
- **Critical**: >90% of budget used or exceeded

### Limit Tracking

Monitors per-key spending limits:
- Alerts when approaching or exceeding limits
- Tracks remaining credit

---

## 🛠️ Manual Usage

### Run Locally

```bash
# Basic usage check
node scripts/monitor-openrouter-usage.js

# With custom threshold
node scripts/monitor-openrouter-usage.js --alert-threshold=75

# With custom budgets
export OPENROUTER_DAILY_BUDGET=200
export OPENROUTER_MONTHLY_BUDGET=3000
node scripts/monitor-openrouter-usage.js
```

### Trigger GitHub Action

```bash
# Via GitHub CLI
gh workflow run monitor-openrouter-usage.yml

# With inputs
gh workflow run monitor-openrouter-usage.yml \
  -f alert_threshold=75 \
  -f daily_budget=200 \
  -f monthly_budget=2000
```

### Via GitHub UI

1. Go to: **Actions** → **Monitor OpenRouter Usage**
2. Click **Run workflow**
3. Set custom parameters (optional)
4. Click **Run workflow**

---

## 📁 Output Files

### Metrics Files

**Location**: `logs/usage-metrics/usage-YYYY-MM-DD.json`

Contains:
- Full usage breakdown
- All alerts triggered
- Budget utilization
- Timestamp

### Alert Files

**Location**: `logs/usage-alert.json`

Contains:
- GitHub issue title
- Issue body content
- Alert details

---

## 🔐 Security Best Practices

### Provisioning Key

- ✅ Store in GitHub Secrets only
- ✅ Never commit to code
- ✅ Rotate periodically
- ✅ Use least-privilege access

### Usage Monitoring

- ✅ Review alerts promptly
- ✅ Investigate unusual spikes
- ✅ Check for unauthorized usage
- ✅ Audit key access patterns

---

## 🆘 Troubleshooting

### "OPENROUTER_PROVISIONING_KEY not set"

```bash
# Set the secret in GitHub
gh secret set OPENROUTER_PROVISIONING_KEY

# Or export locally
export OPENROUTER_PROVISIONING_KEY="sk-or-v1-..."
```

### "Failed to parse response"

- Check that the provisioning key is valid
- Verify the key has permission to access usage data
- Check OpenRouter API status

### No Alerts Being Created

- Verify `issues: write` permission in workflow
- Check that alert thresholds are appropriate
- Review workflow logs for errors

---

## 📊 Dashboard Integration

### View Metrics

```bash
# View today's usage
cat logs/usage-metrics/usage-$(date +%Y-%m-%d).json | jq '.'

# View alerts
cat logs/usage-alert.json | jq '.'
```

### Historical Analysis

```bash
# Total spending this month
find logs/usage-metrics -name "usage-2025-10-*.json" \
  -exec jq -r '.dailyUsage' {} \; | \
  awk '{sum+=$1} END {print "Total: $"sum}'
```

---

## 🎓 Best Practices

### Setting Budgets

1. **Review historical usage** over 30 days
2. **Add 20% buffer** for growth
3. **Set daily limit** to monthly/30
4. **Adjust seasonally** based on usage patterns

### Alert Thresholds

- **Development**: $10-25/day
- **Staging**: $25-50/day
- **Production**: $50-100/day

### Response Plan

1. **Critical Alert**: Investigate within 1 hour
2. **Warning Alert**: Review within 24 hours
3. **Trend Analysis**: Weekly review of metrics

---

## 📞 Support

- **View Metrics**: `logs/usage-metrics/`
- **GitHub Actions**: https://github.com/F8ai/formul8-multiagent/actions/workflows/monitor-openrouter-usage.yml
- **OpenRouter Dashboard**: https://openrouter.ai/activity
- **Issues**: Search for label `openrouter-usage`

---

**Monitor Active!** 🎉 Your OpenRouter usage is now tracked and protected.

