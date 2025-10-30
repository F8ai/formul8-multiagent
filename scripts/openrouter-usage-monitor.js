#!/usr/bin/env node

/**
 * OpenRouter Usage Monitor
 * 
 * Monitors OpenRouter API usage for unauthorized activity and suspicious patterns.
 * This script analyzes usage data and generates security reports.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';
const PROVISIONING_KEY = process.env.OPENROUTER_PROVISIONING_KEY;
const LOG_DIR = 'logs';
const REPORT_DIR = 'security-reports';

// Ensure directories exist
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

// Logging function
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Make HTTP request to OpenRouter API
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, OPENROUTER_API_BASE);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${PROVISIONING_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Formul8-Security-Monitor/1.0'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Get usage statistics for a specific key
async function getKeyUsage(keyId, startDate, endDate) {
  try {
    log(`📊 Fetching usage for key ${keyId} from ${startDate} to ${endDate}`);
    
    // Note: This endpoint might not exist in OpenRouter API
    // We'll implement a fallback approach using available data
    const response = await makeRequest('GET', `/keys/${keyId}/usage?start=${startDate}&end=${endDate}`);
    
    if (response.status === 200) {
      return response.data;
    } else {
      log(`⚠️  Usage endpoint not available for key ${keyId}, using fallback method`);
      return await getKeyUsageFallback(keyId, startDate, endDate);
    }
  } catch (error) {
    log(`❌ Error fetching usage for key ${keyId}: ${error.message}`);
    return await getKeyUsageFallback(keyId, startDate, endDate);
  }
}

// Fallback method to estimate usage based on available data
async function getKeyUsageFallback(keyId, startDate, endDate) {
  try {
    // Get key details to check creation date and limits
    const keyResponse = await makeRequest('GET', `/keys/${keyId}`);
    
    if (keyResponse.status === 200) {
      const keyData = keyResponse.data;
      return {
        key_id: keyId,
        key_name: keyData.name,
        created_at: keyData.created_at,
        limit: keyData.limit || 10000,
        usage_estimate: 'estimated', // Flag that this is estimated data
        last_used: keyData.last_used || 'unknown',
        requests_count: 'unknown',
        tokens_used: 'unknown',
        cost: 'unknown'
      };
    }
  } catch (error) {
    log(`❌ Error in fallback method for key ${keyId}: ${error.message}`);
  }
  
  return null;
}

// Get all API keys
async function getAllKeys() {
  try {
    const response = await makeRequest('GET', '/keys');
    
    if (response.status === 200 && Array.isArray(response.data)) {
      return response.data;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    log(`❌ Error fetching keys: ${error.message}`);
    throw error;
  }
}

// Analyze usage patterns for suspicious activity
function analyzeUsagePatterns(usageData) {
  const analysis = {
    suspicious_activity: [],
    warnings: [],
    recommendations: [],
    risk_score: 0
  };

  // Check for unusual usage patterns
  usageData.forEach(keyData => {
    if (keyData.usage_estimate === 'estimated') {
      analysis.warnings.push(`Key ${keyData.key_name} (${keyData.key_id}): Using estimated data - consider implementing detailed usage tracking`);
    }

    // Check for keys created recently but with high usage
    const keyAge = new Date() - new Date(keyData.created_at);
    const keyAgeHours = keyAge / (1000 * 60 * 60);
    
    if (keyAgeHours < 24 && keyData.requests_count > 1000) {
      analysis.suspicious_activity.push({
        type: 'HIGH_USAGE_NEW_KEY',
        key_id: keyData.key_id,
        key_name: keyData.key_name,
        description: `New key (${keyAgeHours.toFixed(1)}h old) has high usage: ${keyData.requests_count} requests`,
        severity: 'HIGH'
      });
      analysis.risk_score += 30;
    }

    // Check for keys with unusual request patterns
    if (keyData.requests_count > 10000) {
      analysis.suspicious_activity.push({
        type: 'EXCESSIVE_USAGE',
        key_id: keyData.key_id,
        key_name: keyData.key_name,
        description: `Key has excessive usage: ${keyData.requests_count} requests`,
        severity: 'MEDIUM'
      });
      analysis.risk_score += 20;
    }

    // Check for keys approaching limits
    if (keyData.limit && keyData.requests_count > keyData.limit * 0.8) {
      analysis.warnings.push(`Key ${keyData.key_name} is approaching limit: ${keyData.requests_count}/${keyData.limit} requests`);
      analysis.risk_score += 10;
    }
  });

  // Check for multiple keys with similar patterns (potential key sharing)
  const keyNames = usageData.map(k => k.key_name);
  const duplicateNames = keyNames.filter((name, index) => keyNames.indexOf(name) !== index);
  
  if (duplicateNames.length > 0) {
    analysis.suspicious_activity.push({
      type: 'DUPLICATE_KEY_NAMES',
      description: `Found duplicate key names: ${duplicateNames.join(', ')}`,
      severity: 'MEDIUM'
    });
    analysis.risk_score += 15;
  }

  // Generate recommendations
  if (analysis.risk_score > 50) {
    analysis.recommendations.push('HIGH RISK: Consider immediate key rotation and investigation');
  } else if (analysis.risk_score > 20) {
    analysis.recommendations.push('MEDIUM RISK: Monitor closely and consider preventive measures');
  } else {
    analysis.recommendations.push('LOW RISK: Continue regular monitoring');
  }

  if (analysis.suspicious_activity.length > 0) {
    analysis.recommendations.push('Review suspicious activity and consider key rotation');
  }

  return analysis;
}

// Generate security report
function generateSecurityReport(usageData, analysis) {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    summary: {
      total_keys: usageData.length,
      suspicious_activities: analysis.suspicious_activity.length,
      warnings: analysis.warnings.length,
      risk_score: analysis.risk_score,
      risk_level: analysis.risk_score > 50 ? 'HIGH' : analysis.risk_score > 20 ? 'MEDIUM' : 'LOW'
    },
    usage_data: usageData,
    analysis,
    recommendations: analysis.recommendations
  };

  return report;
}

// Save report to file
function saveReport(report) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `security-report-${timestamp}.json`;
  const filepath = path.join(REPORT_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  log(`📄 Security report saved: ${filepath}`);
  
  return filepath;
}

// Main monitoring function
async function monitorUsage() {
  log('');
  log('='.repeat(80));
  log('🔍 OPENROUTER USAGE MONITORING');
  log('='.repeat(80));
  log('');

  if (!PROVISIONING_KEY) {
    log('❌ OPENROUTER_PROVISIONING_KEY not found in environment');
    throw new Error('OPENROUTER_PROVISIONING_KEY is required');
  }

  try {
    // Get date range for monitoring (last 24 hours)
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (24 * 60 * 60 * 1000));
    
    log(`📅 Monitoring period: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    log('');

    // Get all API keys
    const allKeys = await getAllKeys();
    log(`📋 Found ${allKeys.length} API keys`);
    log('');

    // Get usage data for each key
    const usageData = [];
    for (const key of allKeys) {
      const usage = await getKeyUsage(key.id, startDate.toISOString(), endDate.toISOString());
      if (usage) {
        usageData.push(usage);
      }
    }

    log(`📊 Collected usage data for ${usageData.length} keys`);
    log('');

    // Analyze usage patterns
    log('🔍 Analyzing usage patterns...');
    const analysis = analyzeUsagePatterns(usageData);
    
    log(`⚠️  Found ${analysis.suspicious_activity.length} suspicious activities`);
    log(`⚠️  Found ${analysis.warnings.length} warnings`);
    log(`📊 Risk Score: ${analysis.risk_score} (${analysis.risk_score > 50 ? 'HIGH' : analysis.risk_score > 20 ? 'MEDIUM' : 'LOW'})`);
    log('');

    // Display suspicious activities
    if (analysis.suspicious_activity.length > 0) {
      log('🚨 SUSPICIOUS ACTIVITIES:');
      analysis.suspicious_activity.forEach((activity, index) => {
        log(`  ${index + 1}. [${activity.severity}] ${activity.type}`);
        log(`     ${activity.description}`);
        if (activity.key_id) {
          log(`     Key: ${activity.key_name} (${activity.key_id})`);
        }
        log('');
      });
    }

    // Display warnings
    if (analysis.warnings.length > 0) {
      log('⚠️  WARNINGS:');
      analysis.warnings.forEach((warning, index) => {
        log(`  ${index + 1}. ${warning}`);
      });
      log('');
    }

    // Display recommendations
    if (analysis.recommendations.length > 0) {
      log('💡 RECOMMENDATIONS:');
      analysis.recommendations.forEach((rec, index) => {
        log(`  ${index + 1}. ${rec}`);
      });
      log('');
    }

    // Generate and save report
    const report = generateSecurityReport(usageData, analysis);
    const reportPath = saveReport(report);

    log('='.repeat(80));
    log('✅ MONITORING COMPLETED');
    log('='.repeat(80));
    log(`📄 Report saved: ${reportPath}`);
    log('');

    return report;

  } catch (error) {
    log('');
    log('='.repeat(80));
    log('❌ MONITORING FAILED');
    log('='.repeat(80));
    log(`Error: ${error.message}`);
    log('');
    throw error;
  }
}

// CLI
const command = process.argv[2];

(async () => {
  try {
    if (command === 'monitor') {
      await monitorUsage();
    } else {
      console.log(`
OpenRouter Usage Monitor

Usage:
  node openrouter-usage-monitor.js <command>

Commands:
  monitor    Monitor usage and generate security report

Environment Variables:
  OPENROUTER_PROVISIONING_KEY  Required: Master key for API access

Examples:
  node openrouter-usage-monitor.js monitor
      `);
      process.exit(command ? 1 : 0);
    }
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}\n`);
    process.exit(1);
  }
})();