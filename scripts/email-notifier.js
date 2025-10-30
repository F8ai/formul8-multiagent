#!/usr/bin/env node

/**
 * Email Notification System for OpenRouter Security Monitoring
 * 
 * Supports multiple email providers and notification types
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Email configuration
const EMAIL_CONFIG = {
  // SMTP Configuration
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },
  
  // SendGrid Configuration
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'security@formul8.ai',
    fromName: process.env.SENDGRID_FROM_NAME || 'Formul8 Security Monitor'
  },
  
  // Email settings
  to: process.env.NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL,
  cc: process.env.NOTIFICATION_CC_EMAIL,
  bcc: process.env.NOTIFICATION_BCC_EMAIL
};

// Logging function
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Send email via SendGrid API
async function sendEmailViaSendGrid(emailData) {
  if (!EMAIL_CONFIG.sendgrid.apiKey) {
    throw new Error('SendGrid API key not configured');
  }

  const payload = {
    personalizations: [
      {
        to: [{ email: EMAIL_CONFIG.to }],
        ...(EMAIL_CONFIG.cc && { cc: [{ email: EMAIL_CONFIG.cc }] }),
        ...(EMAIL_CONFIG.bcc && { bcc: [{ email: EMAIL_CONFIG.bcc }] }),
        subject: emailData.subject
      }
    ],
    from: {
      email: EMAIL_CONFIG.sendgrid.fromEmail,
      name: EMAIL_CONFIG.sendgrid.fromName
    },
    content: [
      {
        type: 'text/html',
        value: emailData.htmlContent
      }
    ]
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMAIL_CONFIG.sendgrid.apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, statusCode: res.statusCode });
        } else {
          reject(new Error(`SendGrid API error: ${res.statusCode} - ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Send email via SMTP (using nodemailer if available)
async function sendEmailViaSMTP(emailData) {
  try {
    // Try to use nodemailer if available
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      host: EMAIL_CONFIG.smtp.host,
      port: EMAIL_CONFIG.smtp.port,
      secure: EMAIL_CONFIG.smtp.secure,
      auth: EMAIL_CONFIG.smtp.auth
    });

    const mailOptions = {
      from: `${EMAIL_CONFIG.sendgrid.fromName} <${EMAIL_CONFIG.sendgrid.fromEmail}>`,
      to: EMAIL_CONFIG.to,
      cc: EMAIL_CONFIG.cc,
      bcc: EMAIL_CONFIG.bcc,
      subject: emailData.subject,
      html: emailData.htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    throw new Error(`SMTP error: ${error.message}`);
  }
}

// Generate HTML email template
function generateEmailTemplate(alertType, data) {
  const timestamp = new Date().toISOString();
  const riskLevel = data.riskLevel || 'UNKNOWN';
  const riskScore = data.riskScore || 0;
  const anomalies = data.anomalies || [];
  const recommendations = data.recommendations || [];

  let alertColor = '#28a745'; // Green for success
  let alertIcon = '✅';
  let alertTitle = 'Security Monitoring Complete';

  if (alertType === 'CRITICAL') {
    alertColor = '#dc3545';
    alertIcon = '🚨';
    alertTitle = 'CRITICAL SECURITY ALERT';
  } else if (alertType === 'HIGH') {
    alertColor = '#fd7e14';
    alertIcon = '⚠️';
    alertTitle = 'HIGH RISK DETECTED';
  } else if (alertType === 'ANOMALY') {
    alertColor = '#ffc107';
    alertIcon = '🔍';
    alertTitle = 'SECURITY ANOMALIES DETECTED';
  } else if (alertType === 'FAILURE') {
    alertColor = '#6c757d';
    alertIcon = '❌';
    alertTitle = 'MONITORING FAILED';
  }

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${alertTitle} - Formul8 Security Monitor</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: ${alertColor}; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .alert-box { background: #f8f9fa; border-left: 4px solid ${alertColor}; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
        .metric-label { font-weight: bold; }
        .metric-value { color: ${alertColor}; font-weight: bold; }
        .anomaly-list { margin: 20px 0; }
        .anomaly-item { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px 0; border-radius: 4px; }
        .anomaly-severity { font-weight: bold; color: #856404; }
        .recommendation-list { margin: 20px 0; }
        .recommendation-item { background: #d1ecf1; border: 1px solid #bee5eb; padding: 10px; margin: 10px 0; border-radius: 4px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        .action-button { display: inline-block; background: ${alertColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 5px; }
        .action-button:hover { opacity: 0.9; }
        .code { background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${alertIcon} ${alertTitle}</h1>
            <p>Formul8 OpenRouter Security Monitoring</p>
        </div>
        
        <div class="content">
            <div class="alert-box">
                <h3>📊 Security Summary</h3>
                <div class="metric">
                    <span class="metric-label">Risk Level:</span>
                    <span class="metric-value">${riskLevel}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Risk Score:</span>
                    <span class="metric-value">${riskScore}/200</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Anomalies Detected:</span>
                    <span class="metric-value">${anomalies.length}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Timestamp:</span>
                    <span class="metric-value">${timestamp}</span>
                </div>
            </div>

            ${anomalies.length > 0 ? `
            <div class="anomaly-list">
                <h3>🔍 Detected Anomalies</h3>
                ${anomalies.map(anomaly => `
                    <div class="anomaly-item">
                        <div class="anomaly-severity">[${anomaly.severity}] ${anomaly.type}</div>
                        <div><strong>Key:</strong> ${anomaly.key_name} (${anomaly.key_id})</div>
                        <div><strong>Description:</strong> ${anomaly.description}</div>
                        <div><strong>Recommendation:</strong> ${anomaly.recommendation}</div>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            ${recommendations.length > 0 ? `
            <div class="recommendation-list">
                <h3>💡 Security Recommendations</h3>
                ${recommendations.map((rec, index) => `
                    <div class="recommendation-item">
                        ${index + 1}. ${rec}
                    </div>
                `).join('')}
            </div>
            ` : ''}

            ${alertType === 'CRITICAL' || alertType === 'HIGH' ? `
            <div class="alert-box" style="background: #fff3cd; border-left-color: #ffc107;">
                <h3>🚨 Immediate Actions Required</h3>
                <ol>
                    <li>Review the security reports in GitHub Actions artifacts</li>
                    <li>Check for unauthorized key usage</li>
                    <li>Consider rotating affected keys immediately</li>
                    <li>Implement additional security controls</li>
                    <li>Monitor affected keys closely</li>
                </ol>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
                <a href="https://github.com/F8ai/formul8-multiagent/actions" class="action-button">
                    View GitHub Actions
                </a>
                <a href="https://github.com/F8ai/formul8-multiagent" class="action-button" style="background: #6c757d;">
                    View Repository
                </a>
            </div>

            <div class="code">
                <strong>Workflow Run:</strong> ${process.env.GITHUB_RUN_NUMBER || 'N/A'}<br>
                <strong>Commit:</strong> ${process.env.GITHUB_SHA || 'N/A'}<br>
                <strong>Branch:</strong> ${process.env.GITHUB_REF_NAME || 'N/A'}
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated security monitoring alert from Formul8.</p>
            <p>If you believe this is an error, please check the GitHub Actions logs.</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Send security alert email
async function sendSecurityAlert(alertType, data) {
  try {
    if (!EMAIL_CONFIG.to) {
      log('⚠️  No notification email configured, skipping email alert');
      return { success: false, reason: 'No email configured' };
    }

    log(`📧 Preparing ${alertType} security alert email...`);

    const emailData = {
      subject: `[Formul8 Security] ${alertType} Alert - Risk Level: ${data.riskLevel || 'UNKNOWN'}`,
      htmlContent: generateEmailTemplate(alertType, data)
    };

    let result;
    
    // Try SendGrid first if configured
    if (EMAIL_CONFIG.sendgrid.apiKey) {
      log('📧 Sending email via SendGrid...');
      result = await sendEmailViaSendGrid(emailData);
    }
    // Fall back to SMTP if configured
    else if (EMAIL_CONFIG.smtp.host && EMAIL_CONFIG.smtp.auth.user) {
      log('📧 Sending email via SMTP...');
      result = await sendEmailViaSMTP(emailData);
    }
    else {
      throw new Error('No email service configured (SendGrid or SMTP required)');
    }

    log(`✅ Email sent successfully: ${result.messageId || 'N/A'}`);
    return { success: true, result };

  } catch (error) {
    log(`❌ Failed to send email: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Send test email
async function sendTestEmail() {
  const testData = {
    riskLevel: 'LOW',
    riskScore: 15,
    anomalies: [
      {
        type: 'TEST_ANOMALY',
        severity: 'LOW',
        key_name: 'Test-Key',
        key_id: 'test-key-123',
        description: 'This is a test anomaly for email verification',
        recommendation: 'This is just a test - no action required'
      }
    ],
    recommendations: [
      'This is a test email to verify the notification system',
      'If you receive this, email notifications are working correctly'
    ]
  };

  return await sendSecurityAlert('TEST', testData);
}

// CLI
const command = process.argv[2];
const alertType = process.argv[3];

(async () => {
  try {
    if (command === 'test') {
      log('🧪 Sending test email...');
      const result = await sendTestEmail();
      if (result.success) {
        log('✅ Test email sent successfully!');
      } else {
        log(`❌ Test email failed: ${result.error || result.reason}`);
        process.exit(1);
      }
    } else if (command === 'alert') {
      if (!alertType) {
        console.error('Error: Alert type required (CRITICAL, HIGH, ANOMALY, SUCCESS, FAILURE)');
        process.exit(1);
      }

      // Read data from stdin or use default
      let data = {};
      try {
        const input = fs.readFileSync(0, 'utf8');
        if (input.trim()) {
          data = JSON.parse(input);
        }
      } catch (error) {
        // Use default data if no input
        data = {
          riskLevel: alertType,
          riskScore: alertType === 'CRITICAL' ? 85 : alertType === 'HIGH' ? 55 : 25,
          anomalies: [],
          recommendations: ['This is a test alert']
        };
      }

      const result = await sendSecurityAlert(alertType, data);
      if (result.success) {
        log('✅ Alert email sent successfully!');
      } else {
        log(`❌ Alert email failed: ${result.error || result.reason}`);
        process.exit(1);
      }
    } else {
      console.log(`
OpenRouter Email Notifier

Usage:
  node email-notifier.js <command> [alert_type]

Commands:
  test                    Send test email
  alert <type>            Send security alert email

Alert Types:
  CRITICAL               Critical security alert
  HIGH                   High risk alert  
  ANOMALY                Anomaly detection alert
  SUCCESS                Success notification
  FAILURE                Failure notification

Environment Variables:
  NOTIFICATION_EMAIL     Required: Email address to send alerts to
  SENDGRID_API_KEY       Optional: SendGrid API key
  SENDGRID_FROM_EMAIL    Optional: From email address
  SMTP_HOST              Optional: SMTP server host
  SMTP_USER              Optional: SMTP username
  SMTP_PASS              Optional: SMTP password

Examples:
  node email-notifier.js test
  node email-notifier.js alert CRITICAL
  echo '{"riskLevel":"HIGH","riskScore":75}' | node email-notifier.js alert HIGH
      `);
      process.exit(command ? 1 : 0);
    }
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}\n`);
    process.exit(1);
  }
})();