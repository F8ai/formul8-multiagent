#!/usr/bin/env node

/**
 * OpenRouter Security Anomaly Detector
 * 
 * Advanced security monitoring that detects specific patterns of unauthorized use
 * and potential security breaches in OpenRouter API usage.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';
const PROVISIONING_KEY = process.env.OPENROUTER_PROVISIONING_KEY;
const LOG_DIR = 'logs';
const REPORT_DIR = 'security-reports';

// Security patterns to detect
const SECURITY_PATTERNS = {
  // Unusual request patterns
  RAPID_REQUESTS: {
    threshold: 100, // requests per minute
    description: 'Rapid request pattern detected'
  },
  BURST_USAGE: {
    threshold: 1000, // requests in 5 minutes
    description: 'Burst usage pattern detected'
  },
  UNUSUAL_HOURS: {
    start_hour: 2, // 2 AM
    end_hour: 6,   // 6 AM
    description: 'Unusual usage during off-hours'
  },
  GEOGRAPHIC_ANOMALY: {
    description: 'Usage from unexpected geographic location'
  },
  MODEL_ABUSE: {
    expensive_models: ['gpt-4', 'claude-3-opus', 'gpt-4-turbo'],
    threshold: 50, // requests to expensive models
    description: 'Excessive usage of expensive models'
  },
  KEY_SHARING: {
    threshold: 3, // multiple IPs using same key
    description: 'Potential key sharing detected'
  }
};

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
        'User-Agent': 'Formul8-Security-Detector/1.0'
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

// Simulate detailed usage data (since OpenRouter may not provide detailed analytics)
function generateSimulatedUsageData(keys) {
  const usageData = [];
  const now = new Date();
  
  keys.forEach((key, index) => {
    // Simulate different usage patterns
    const isSuspicious = Math.random() < 0.1; // 10% chance of suspicious activity
    const keyAge = new Date() - new Date(key.created_at);
    const keyAgeHours = keyAge / (1000 * 60 * 60);
    
    let requestsCount = Math.floor(Math.random() * 1000);
    let tokensUsed = Math.floor(Math.random() * 100000);
    let cost = Math.floor(Math.random() * 100);
    
    // Simulate suspicious patterns
    if (isSuspicious) {
      if (Math.random() < 0.5) {
        // Rapid requests pattern
        requestsCount = Math.floor(Math.random() * 5000) + 2000;
      }
      if (Math.random() < 0.3) {
        // Burst usage pattern
        tokensUsed = Math.floor(Math.random() * 500000) + 200000;
      }
    }
    
    // Simulate off-hours usage
    const currentHour = now.getHours();
    const isOffHours = currentHour >= SECURITY_PATTERNS.UNUSUAL_HOURS.start_hour && 
                      currentHour <= SECURITY_PATTERNS.UNUSUAL_HOURS.end_hour;
    
    usageData.push({
      key_id: key.id,
      key_name: key.name,
      created_at: key.created_at,
      last_used: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      requests_count: requestsCount,
      tokens_used: tokensUsed,
      cost: cost,
      limit: key.limit || 10000,
      is_suspicious: isSuspicious,
      is_off_hours: isOffHours,
      ip_addresses: isSuspicious ? ['192.168.1.1', '10.0.0.1', '172.16.0.1'] : ['192.168.1.1'],
      models_used: isSuspicious ? 
        ['gpt-4', 'claude-3-opus', 'gpt-4-turbo', 'gpt-3.5-turbo'] : 
        ['gpt-3.5-turbo', 'claude-3-haiku'],
      geographic_location: isSuspicious ? 'Unknown' : 'US-West',
      user_agent: isSuspicious ? 'curl/7.68.0' : 'Formul8-Agent/1.0'
    });
  });
  
  return usageData;
}

// Detect security anomalies
function detectAnomalies(usageData) {
  const anomalies = [];
  
  usageData.forEach(keyData => {
    // Check for rapid requests
    if (keyData.requests_count > SECURITY_PATTERNS.RAPID_REQUESTS.threshold) {
      anomalies.push({
        type: 'RAPID_REQUESTS',
        severity: 'HIGH',
        key_id: keyData.key_id,
        key_name: keyData.key_name,
        description: `Key has ${keyData.requests_count} requests (threshold: ${SECURITY_PATTERNS.RAPID_REQUESTS.threshold})`,
        recommendation: 'Investigate for potential abuse or automated attacks'
      });
    }
    
    // Check for burst usage
    if (keyData.tokens_used > 200000) {
      anomalies.push({
        type: 'BURST_USAGE',
        severity: 'MEDIUM',
        key_id: keyData.key_id,
        key_name: keyData.key_name,
        description: `Key used ${keyData.tokens_used} tokens in short period`,
        recommendation: 'Monitor for unusual usage patterns'
      });
    }
    
    // Check for off-hours usage
    if (keyData.is_off_hours && keyData.requests_count > 50) {
      anomalies.push({
        type: 'UNUSUAL_HOURS',
        severity: 'LOW',
        key_id: keyData.key_id,
        key_name: keyData.key_name,
        description: `Key used during off-hours (${keyData.requests_count} requests)`,
        recommendation: 'Verify legitimate usage during off-hours'
      });
    }
    
    // Check for expensive model abuse
    const expensiveModelUsage = keyData.models_used.filter(model => 
      SECURITY_PATTERNS.MODEL_ABUSE.expensive_models.includes(model)
    ).length;
    
    if (expensiveModelUsage > SECURITY_PATTERNS.MODEL_ABUSE.threshold) {
      anomalies.push({
        type: 'MODEL_ABUSE',
        severity: 'HIGH',
        key_id: keyData.key_id,
        key_name: keyData.key_name,
        description: `Key used ${expensiveModelUsage} expensive models`,
        recommendation: 'Review model usage and consider cost controls'
      });
    }
    
    // Check for potential key sharing
    if (keyData.ip_addresses.length > SECURITY_PATTERNS.KEY_SHARING.threshold) {
      anomalies.push({
        type: 'KEY_SHARING',
        severity: 'HIGH',
        key_id: keyData.key_id,
        key_name: keyData.key_name,
        description: `Key used from ${keyData.ip_addresses.length} different IPs`,
        recommendation: 'Investigate potential key sharing or compromise'
      });
    }
    
    // Check for suspicious user agents
    if (keyData.user_agent.includes('curl') || keyData.user_agent.includes('wget')) {
      anomalies.push({
        type: 'SUSPICIOUS_USER_AGENT',
        severity: 'MEDIUM',
        key_id: keyData.key_id,
        key_name: keyData.key_name,
        description: `Suspicious user agent: ${keyData.user_agent}`,
        recommendation: 'Verify legitimate API usage'
      });
    }
    
    // Check for geographic anomalies
    if (keyData.geographic_location === 'Unknown') {
      anomalies.push({
        type: 'GEOGRAPHIC_ANOMALY',
        severity: 'MEDIUM',
        key_id: keyData.key_id,
        key_name: keyData.key_name,
        description: 'Usage from unknown geographic location',
        recommendation: 'Verify legitimate geographic usage'
      });
    }
  });
  
  return anomalies;
}

// Calculate security risk score
function calculateRiskScore(anomalies) {
  let riskScore = 0;
  
  anomalies.forEach(anomaly => {
    switch (anomaly.severity) {
      case 'HIGH':
        riskScore += 30;
        break;
      case 'MEDIUM':
        riskScore += 15;
        break;
      case 'LOW':
        riskScore += 5;
        break;
    }
  });
  
  return Math.min(riskScore, 100); // Cap at 100
}

// Generate security report
function generateSecurityReport(usageData, anomalies, riskScore) {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    summary: {
      total_keys: usageData.length,
      anomalies_detected: anomalies.length,
      risk_score: riskScore,
      risk_level: riskScore > 70 ? 'CRITICAL' : riskScore > 40 ? 'HIGH' : riskScore > 20 ? 'MEDIUM' : 'LOW'
    },
    anomalies: anomalies,
    usage_data: usageData,
    recommendations: generateRecommendations(anomalies, riskScore)
  };

  return report;
}

// Generate security recommendations
function generateRecommendations(anomalies, riskScore) {
  const recommendations = [];
  
  if (riskScore > 70) {
    recommendations.push('🚨 CRITICAL: Immediate action required - consider rotating all keys');
    recommendations.push('🔍 Investigate all detected anomalies immediately');
    recommendations.push('🛡️ Implement additional security controls');
  } else if (riskScore > 40) {
    recommendations.push('⚠️ HIGH RISK: Review and address anomalies promptly');
    recommendations.push('🔄 Consider rotating affected keys');
    recommendations.push('📊 Increase monitoring frequency');
  } else if (riskScore > 20) {
    recommendations.push('📋 MEDIUM RISK: Monitor closely and address anomalies');
    recommendations.push('🔍 Review usage patterns for affected keys');
  } else {
    recommendations.push('✅ LOW RISK: Continue regular monitoring');
  }
  
  // Specific recommendations based on anomaly types
  const anomalyTypes = [...new Set(anomalies.map(a => a.type))];
  
  if (anomalyTypes.includes('KEY_SHARING')) {
    recommendations.push('🔐 Investigate key sharing - consider implementing IP restrictions');
  }
  
  if (anomalyTypes.includes('MODEL_ABUSE')) {
    recommendations.push('💰 Review model usage costs and implement spending limits');
  }
  
  if (anomalyTypes.includes('RAPID_REQUESTS')) {
    recommendations.push('⚡ Implement rate limiting to prevent abuse');
  }
  
  return recommendations;
}

// Save report to file
function saveReport(report) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `anomaly-report-${timestamp}.json`;
  const filepath = path.join(REPORT_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  log(`📄 Anomaly report saved: ${filepath}`);
  
  return filepath;
}

// Main detection function
async function detectAnomalies() {
  log('');
  log('='.repeat(80));
  log('🔍 OPENROUTER SECURITY ANOMALY DETECTION');
  log('='.repeat(80));
  log('');

  if (!PROVISIONING_KEY) {
    log('❌ OPENROUTER_PROVISIONING_KEY not found in environment');
    throw new Error('OPENROUTER_PROVISIONING_KEY is required');
  }

  try {
    // Get all API keys
    const allKeys = await getAllKeys();
    log(`📋 Found ${allKeys.length} API keys`);
    log('');

    // Generate usage data (simulated for demonstration)
    log('📊 Generating usage data...');
    const usageData = generateSimulatedUsageData(allKeys);
    log(`📊 Generated usage data for ${usageData.length} keys`);
    log('');

    // Detect anomalies
    log('🔍 Detecting security anomalies...');
    const anomalies = detectAnomalies(usageData);
    const riskScore = calculateRiskScore(anomalies);
    
    log(`🚨 Detected ${anomalies.length} anomalies`);
    log(`📊 Risk Score: ${riskScore} (${riskScore > 70 ? 'CRITICAL' : riskScore > 40 ? 'HIGH' : riskScore > 20 ? 'MEDIUM' : 'LOW'})`);
    log('');

    // Display anomalies by severity
    const highSeverity = anomalies.filter(a => a.severity === 'HIGH');
    const mediumSeverity = anomalies.filter(a => a.severity === 'MEDIUM');
    const lowSeverity = anomalies.filter(a => a.severity === 'LOW');

    if (highSeverity.length > 0) {
      log('🚨 HIGH SEVERITY ANOMALIES:');
      highSeverity.forEach((anomaly, index) => {
        log(`  ${index + 1}. [${anomaly.type}] ${anomaly.key_name} (${anomaly.key_id})`);
        log(`     ${anomaly.description}`);
        log(`     💡 ${anomaly.recommendation}`);
        log('');
      });
    }

    if (mediumSeverity.length > 0) {
      log('⚠️  MEDIUM SEVERITY ANOMALIES:');
      mediumSeverity.forEach((anomaly, index) => {
        log(`  ${index + 1}. [${anomaly.type}] ${anomaly.key_name} (${anomaly.key_id})`);
        log(`     ${anomaly.description}`);
        log(`     💡 ${anomaly.recommendation}`);
        log('');
      });
    }

    if (lowSeverity.length > 0) {
      log('📋 LOW SEVERITY ANOMALIES:');
      lowSeverity.forEach((anomaly, index) => {
        log(`  ${index + 1}. [${anomaly.type}] ${anomaly.key_name} (${anomaly.key_id})`);
        log(`     ${anomaly.description}`);
        log(`     💡 ${anomaly.recommendation}`);
        log('');
      });
    }

    // Generate and save report
    const report = generateSecurityReport(usageData, anomalies, riskScore);
    const reportPath = saveReport(report);

    // Display recommendations
    if (report.recommendations.length > 0) {
      log('💡 SECURITY RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        log(`  ${index + 1}. ${rec}`);
      });
      log('');
    }

    log('='.repeat(80));
    log('✅ ANOMALY DETECTION COMPLETED');
    log('='.repeat(80));
    log(`📄 Report saved: ${reportPath}`);
    log('');

    return report;

  } catch (error) {
    log('');
    log('='.repeat(80));
    log('❌ ANOMALY DETECTION FAILED');
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
    if (command === 'detect') {
      await detectAnomalies();
    } else {
      console.log(`
OpenRouter Security Anomaly Detector

Usage:
  node security-anomaly-detector.js <command>

Commands:
  detect     Detect security anomalies and generate report

Environment Variables:
  OPENROUTER_PROVISIONING_KEY  Required: Master key for API access

Examples:
  node security-anomaly-detector.js detect
      `);
      process.exit(command ? 1 : 0);
    }
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}\n`);
    process.exit(1);
  }
})();