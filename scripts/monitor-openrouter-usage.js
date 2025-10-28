#!/usr/bin/env node

/**
 * OpenRouter Usage Monitor
 * Monitors API usage and alerts on unusual patterns
 * 
 * Usage:
 *   node scripts/monitor-openrouter-usage.js [--alert-threshold=50]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const PROVISIONING_KEY = process.env.OPENROUTER_PROVISIONING_KEY;
const ALERT_THRESHOLD = parseInt(process.argv.find(arg => arg.startsWith('--alert-threshold='))?.split('=')[1] || '50', 10);
const DAILY_BUDGET = parseFloat(process.env.OPENROUTER_DAILY_BUDGET || '100');
const MONTHLY_BUDGET = parseFloat(process.env.OPENROUTER_MONTHLY_BUDGET || '1000');

// Colors
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

class UsageMonitor {
  constructor() {
    this.alerts = [];
    this.metrics = {};
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  error(message) {
    this.log(`❌ ${message}`, 'red');
  }

  success(message) {
    this.log(`✅ ${message}`, 'green');
  }

  warning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  info(message) {
    this.log(`ℹ️  ${message}`, 'cyan');
  }

  alert(severity, title, message) {
    this.alerts.push({ severity, title, message, timestamp: new Date().toISOString() });
    const icon = severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
    this.log(`${icon} ${title}: ${message}`, severity === 'critical' ? 'red' : 'yellow');
  }

  async makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'openrouter.ai',
        path: `/api/v1${path}`,
        method: method,
        headers: {
          'Authorization': `Bearer ${PROVISIONING_KEY}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const json = body ? JSON.parse(body) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(json);
            } else {
              reject(new Error(`API Error ${res.statusCode}: ${JSON.stringify(json)}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${body}`));
          }
        });
      });

      req.on('error', reject);
      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async getKeys() {
    const response = await this.makeRequest('GET', '/keys');
    return response.data || [];
  }

  async analyzeUsage() {
    this.log('\n🔍 OpenRouter Usage Monitor', 'blue');
    this.log('='.repeat(80), 'blue');
    this.log('');

    if (!PROVISIONING_KEY) {
      this.error('OPENROUTER_PROVISIONING_KEY not set');
      this.info('Set it with: export OPENROUTER_PROVISIONING_KEY="sk-or-v1-..."');
      process.exit(1);
    }

    try {
      // Fetch all keys and their usage
      this.info('Fetching API keys and usage data...');
      const keys = await this.getKeys();
      
      if (keys.length === 0) {
        this.warning('No API keys found');
        return;
      }

      this.success(`Found ${keys.length} API key(s)`);
      this.log('');

      let totalUsage = 0;
      let totalDailyUsage = 0;
      let totalWeeklyUsage = 0;
      let totalMonthlyUsage = 0;

      // Analyze each key
      keys.forEach((key, index) => {
        const keyName = key.name || 'Unnamed';
        const keyLabel = key.label || '(no label)';
        
        this.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
        this.log(`Key ${index + 1}: ${keyName}`, 'bold');
        this.log(`Label: ${keyLabel}`, 'cyan');
        this.log(`Created: ${new Date(key.created_at).toLocaleString()}`, 'cyan');
        
        // Usage stats
        const usage = parseFloat(key.usage || 0);
        const dailyUsage = parseFloat(key.usage_daily || 0);
        const weeklyUsage = parseFloat(key.usage_weekly || 0);
        const monthlyUsage = parseFloat(key.usage_monthly || 0);

        totalUsage += usage;
        totalDailyUsage += dailyUsage;
        totalWeeklyUsage += weeklyUsage;
        totalMonthlyUsage += monthlyUsage;

        this.log(`  Total Usage: $${usage.toFixed(2)}`, 'reset');
        this.log(`  Daily: $${dailyUsage.toFixed(2)}`, 'reset');
        this.log(`  Weekly: $${weeklyUsage.toFixed(2)}`, 'reset');
        this.log(`  Monthly: $${monthlyUsage.toFixed(2)}`, 'reset');

        // Check limits
        if (key.limit) {
          const remaining = parseFloat(key.limit_remaining || 0);
          const limitPercent = ((key.limit - remaining) / key.limit * 100).toFixed(1);
          this.log(`  Limit: $${key.limit} (${limitPercent}% used)`, 'reset');
          
          if (limitPercent > 90) {
            this.alert('critical', 'Limit Alert', `${keyName} has used ${limitPercent}% of its limit`);
          } else if (limitPercent > 75) {
            this.alert('warning', 'Limit Warning', `${keyName} has used ${limitPercent}% of its limit`);
          }
        }

        // Disabled key check
        if (key.disabled) {
          this.log(`  ⚠️  Status: DISABLED`, 'yellow');
        } else {
          this.log(`  ✅ Status: Active`, 'green');
        }

        // Usage anomaly detection
        if (dailyUsage > ALERT_THRESHOLD) {
          this.alert('warning', 'High Daily Usage', `${keyName} used $${dailyUsage.toFixed(2)} today (threshold: $${ALERT_THRESHOLD})`);
        }

        // Sudden spike detection (daily > 2x weekly average)
        const weeklyAverage = weeklyUsage / 7;
        if (dailyUsage > weeklyAverage * 2 && weeklyAverage > 1) {
          this.alert('warning', 'Usage Spike', `${keyName} daily usage ($${dailyUsage.toFixed(2)}) is ${(dailyUsage / weeklyAverage).toFixed(1)}x the weekly average`);
        }

        this.log('');
      });

      // Overall summary
      this.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'magenta');
      this.log('📊 OVERALL USAGE SUMMARY', 'bold');
      this.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'magenta');
      this.log('');
      this.log(`  Total Usage (All Time): $${totalUsage.toFixed(2)}`, 'bold');
      this.log(`  Today: $${totalDailyUsage.toFixed(2)}`, 'reset');
      this.log(`  This Week: $${totalWeeklyUsage.toFixed(2)}`, 'reset');
      this.log(`  This Month: $${totalMonthlyUsage.toFixed(2)}`, 'reset');
      this.log('');

      // Budget checks
      const dailyPercent = (totalDailyUsage / DAILY_BUDGET * 100).toFixed(1);
      const monthlyPercent = (totalMonthlyUsage / MONTHLY_BUDGET * 100).toFixed(1);

      this.log(`  Daily Budget: $${DAILY_BUDGET} (${dailyPercent}% used)`, dailyPercent > 90 ? 'red' : dailyPercent > 75 ? 'yellow' : 'green');
      this.log(`  Monthly Budget: $${MONTHLY_BUDGET} (${monthlyPercent}% used)`, monthlyPercent > 90 ? 'red' : monthlyPercent > 75 ? 'yellow' : 'green');
      this.log('');

      if (totalDailyUsage > DAILY_BUDGET) {
        this.alert('critical', 'Budget Exceeded', `Daily usage ($${totalDailyUsage.toFixed(2)}) exceeds budget ($${DAILY_BUDGET})`);
      } else if (totalDailyUsage > DAILY_BUDGET * 0.9) {
        this.alert('warning', 'Budget Warning', `Daily usage ($${totalDailyUsage.toFixed(2)}) is at ${dailyPercent}% of budget`);
      }

      if (totalMonthlyUsage > MONTHLY_BUDGET) {
        this.alert('critical', 'Budget Exceeded', `Monthly usage ($${totalMonthlyUsage.toFixed(2)}) exceeds budget ($${MONTHLY_BUDGET})`);
      } else if (totalMonthlyUsage > MONTHLY_BUDGET * 0.9) {
        this.alert('warning', 'Budget Warning', `Monthly usage ($${totalMonthlyUsage.toFixed(2)}) is at ${monthlyPercent}% of budget`);
      }

      // Store metrics
      this.metrics = {
        timestamp: new Date().toISOString(),
        totalKeys: keys.length,
        activeKeys: keys.filter(k => !k.disabled).length,
        totalUsage,
        dailyUsage: totalDailyUsage,
        weeklyUsage: totalWeeklyUsage,
        monthlyUsage: totalMonthlyUsage,
        dailyBudget: DAILY_BUDGET,
        monthlyBudget: MONTHLY_BUDGET,
        dailyBudgetPercent: parseFloat(dailyPercent),
        monthlyBudgetPercent: parseFloat(monthlyPercent),
        alerts: this.alerts.length,
      };

      // Summary
      this.generateReport();

      // Exit code based on alerts
      const criticalAlerts = this.alerts.filter(a => a.severity === 'critical').length;
      return criticalAlerts > 0 ? 1 : 0;

    } catch (error) {
      this.error(`Failed to analyze usage: ${error.message}`);
      throw error;
    }
  }

  generateReport() {
    this.log('');
    this.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'yellow');
    
    if (this.alerts.length === 0) {
      this.log('✅ NO ALERTS - Everything looks good!', 'green');
    } else {
      this.log(`⚠️  ${this.alerts.length} ALERT(S) DETECTED`, 'yellow');
      this.log('');
      
      const critical = this.alerts.filter(a => a.severity === 'critical');
      const warnings = this.alerts.filter(a => a.severity === 'warning');
      
      if (critical.length > 0) {
        this.log(`  🚨 Critical: ${critical.length}`, 'red');
        critical.forEach(alert => {
          this.log(`     - ${alert.title}: ${alert.message}`, 'red');
        });
      }
      
      if (warnings.length > 0) {
        this.log(`  ⚠️  Warnings: ${warnings.length}`, 'yellow');
        warnings.forEach(alert => {
          this.log(`     - ${alert.title}: ${alert.message}`, 'yellow');
        });
      }
    }
    
    this.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'yellow');
    this.log('');

    // Save metrics to file
    const metricsDir = path.join(__dirname, '..', 'logs', 'usage-metrics');
    if (!fs.existsSync(metricsDir)) {
      fs.mkdirSync(metricsDir, { recursive: true });
    }

    const metricsFile = path.join(metricsDir, `usage-${new Date().toISOString().split('T')[0]}.json`);
    const report = {
      ...this.metrics,
      alerts: this.alerts,
    };
    
    fs.writeFileSync(metricsFile, JSON.stringify(report, null, 2));
    this.info(`Metrics saved to: ${metricsFile}`);
    this.log('');
  }

  generateGitHubIssue() {
    if (this.alerts.length === 0) {
      return null;
    }

    const critical = this.alerts.filter(a => a.severity === 'critical');
    const warnings = this.alerts.filter(a => a.severity === 'warning');

    const title = critical.length > 0 
      ? `🚨 OpenRouter Usage Alert: ${critical.length} Critical Issue(s)`
      : `⚠️ OpenRouter Usage Warning: ${warnings.length} Issue(s)`;

    let body = `## OpenRouter Usage Alert\n\n`;
    body += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    
    body += `### Summary\n\n`;
    body += `- **Total Usage (Today):** $${this.metrics.dailyUsage.toFixed(2)}\n`;
    body += `- **Total Usage (Month):** $${this.metrics.monthlyUsage.toFixed(2)}\n`;
    body += `- **Daily Budget:** $${this.metrics.dailyBudget} (${this.metrics.dailyBudgetPercent}% used)\n`;
    body += `- **Monthly Budget:** $${this.metrics.monthlyBudget} (${this.metrics.monthlyBudgetPercent}% used)\n`;
    body += `- **Active Keys:** ${this.metrics.activeKeys} of ${this.metrics.totalKeys}\n\n`;

    if (critical.length > 0) {
      body += `### 🚨 Critical Alerts (${critical.length})\n\n`;
      critical.forEach(alert => {
        body += `- **${alert.title}:** ${alert.message}\n`;
      });
      body += `\n`;
    }

    if (warnings.length > 0) {
      body += `### ⚠️ Warnings (${warnings.length})\n\n`;
      warnings.forEach(alert => {
        body += `- **${alert.title}:** ${alert.message}\n`;
      });
      body += `\n`;
    }

    body += `### Recommended Actions\n\n`;
    body += `1. Review API usage patterns at https://openrouter.ai/activity\n`;
    body += `2. Check for any unauthorized access or key compromise\n`;
    body += `3. Consider increasing budgets or optimizing usage\n`;
    body += `4. Review which models are being used most frequently\n\n`;
    
    body += `### Monitoring Details\n\n`;
    body += `- **Alert Threshold:** $${ALERT_THRESHOLD}/day\n`;
    body += `- **Metrics File:** \`logs/usage-metrics/usage-${new Date().toISOString().split('T')[0]}.json\`\n`;

    return { title, body };
  }
}

// Execute if run directly
if (require.main === module) {
  const monitor = new UsageMonitor();
  monitor.analyzeUsage()
    .then(exitCode => {
      // Output GitHub issue content if there are alerts
      if (monitor.alerts.length > 0) {
        const issue = monitor.generateGitHubIssue();
        
        // Write to output file for GitHub Actions
        const outputDir = path.join(__dirname, '..', 'logs');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        fs.writeFileSync(
          path.join(outputDir, 'usage-alert.json'),
          JSON.stringify(issue, null, 2)
        );
        
        console.log('');
        monitor.info('GitHub issue content saved to: logs/usage-alert.json');
      }
      
      process.exit(exitCode);
    })
    .catch(error => {
      console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
      process.exit(1);
    });
}

module.exports = UsageMonitor;

