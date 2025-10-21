/**
 * Formul8 Multiagent Health Monitor & Watchdog
 * Monitors all agent health endpoints and reports status
 */

const agents = [
  { name: 'compliance-agent', url: 'https://compliance-agent.vercel.app' },
  { name: 'science-agent', url: 'https://science-agent.vercel.app' },
  { name: 'formulation-agent', url: 'https://formulation-agent.vercel.app' },
  { name: 'marketing-agent', url: 'https://marketing-agent.vercel.app' },
  { name: 'patent-agent', url: 'https://patent-agent.vercel.app' },
  { name: 'operations-agent', url: 'https://operations-agent.vercel.app' },
  { name: 'sourcing-agent', url: 'https://sourcing-agent.vercel.app' },
  { name: 'spectra-agent', url: 'https://spectra-agent.vercel.app' },
  { name: 'mcr-agent', url: 'https://mcr-agent.vercel.app' },
  { name: 'customer-success-agent', url: 'https://customer-success-agent.vercel.app' },
  { name: 'ad-agent', url: 'https://ad-agent.vercel.app' },
  { name: 'editor-agent', url: 'https://editor-agent.vercel.app' },
  { name: 'f8-slackbot', url: 'https://f8-slackbot.vercel.app' }
];

/**
 * Check health of a single agent
 */
async function checkAgentHealth(agent) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${agent.url}/api/health`, {
      method: 'GET',
      headers: { 'User-Agent': 'Formul8-HealthMonitor/1.0' },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    const data = await response.json();
    
    return {
      name: agent.name,
      url: agent.url,
      status: response.ok ? 'healthy' : 'unhealthy',
      statusCode: response.status,
      responseTime: responseTime,
      details: data,
      timestamp: new Date().toISOString(),
      error: null
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      name: agent.name,
      url: agent.url,
      status: 'down',
      statusCode: 0,
      responseTime: responseTime,
      details: null,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Check health of all agents
 */
async function checkAllAgents() {
  console.log('🏥 Formul8 Multiagent Health Check');
  console.log('===================================\n');
  
  const results = await Promise.all(
    agents.map(agent => checkAgentHealth(agent))
  );
  
  return results;
}

/**
 * Generate health report
 */
function generateReport(results) {
  const healthy = results.filter(r => r.status === 'healthy');
  const unhealthy = results.filter(r => r.status === 'unhealthy');
  const down = results.filter(r => r.status === 'down');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      healthy: healthy.length,
      unhealthy: unhealthy.length,
      down: down.length,
      uptime: ((healthy.length / results.length) * 100).toFixed(2) + '%'
    },
    agents: results,
    alerts: []
  };
  
  // Generate alerts for problems
  [...unhealthy, ...down].forEach(agent => {
    report.alerts.push({
      severity: agent.status === 'down' ? 'critical' : 'warning',
      agent: agent.name,
      message: agent.error || `Agent returned status ${agent.statusCode}`,
      timestamp: agent.timestamp
    });
  });
  
  return report;
}

/**
 * Print report to console
 */
function printReport(report) {
  console.log('📊 Health Summary');
  console.log('================');
  console.log(`Total Agents: ${report.summary.total}`);
  console.log(`✅ Healthy: ${report.summary.healthy}`);
  console.log(`⚠️  Unhealthy: ${report.summary.unhealthy}`);
  console.log(`❌ Down: ${report.summary.down}`);
  console.log(`📈 Uptime: ${report.summary.uptime}\n`);
  
  console.log('🤖 Agent Status');
  console.log('===============');
  
  report.agents.forEach(agent => {
    const statusIcon = agent.status === 'healthy' ? '✅' : 
                       agent.status === 'unhealthy' ? '⚠️' : '❌';
    const responseTime = agent.responseTime < 1000 ? 
                        `${agent.responseTime}ms` : 
                        `${(agent.responseTime / 1000).toFixed(2)}s`;
    
    console.log(`${statusIcon} ${agent.name.padEnd(25)} | ${agent.status.padEnd(10)} | ${responseTime.padStart(8)} | ${agent.statusCode}`);
    
    if (agent.error) {
      console.log(`   ↳ Error: ${agent.error}`);
    }
  });
  
  if (report.alerts.length > 0) {
    console.log('\n🚨 Alerts');
    console.log('=========');
    report.alerts.forEach(alert => {
      const icon = alert.severity === 'critical' ? '🔴' : '🟡';
      console.log(`${icon} [${alert.severity.toUpperCase()}] ${alert.agent}: ${alert.message}`);
    });
  }
  
  console.log('\n');
}

/**
 * Send alerts (Slack, email, etc.)
 */
async function sendAlerts(report) {
  if (report.alerts.length === 0) return;
  
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  
  if (slackWebhook) {
    try {
      const message = {
        text: `🚨 Formul8 Agent Alert`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🚨 Formul8 Agent Health Alert'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${report.alerts.length}* agent(s) need attention\n*Uptime:* ${report.summary.uptime}`
            }
          },
          {
            type: 'divider'
          }
        ]
      };
      
      report.alerts.forEach(alert => {
        message.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${alert.severity === 'critical' ? '🔴' : '🟡'} *${alert.agent}*\n${alert.message}`
          }
        });
      });
      
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      
      console.log('✅ Alerts sent to Slack');
    } catch (error) {
      console.error('❌ Failed to send Slack alert:', error.message);
    }
  }
}

/**
 * Save report to file
 */
function saveReport(report) {
  const fs = require('fs');
  const filename = `health-reports/health-${Date.now()}.json`;
  
  try {
    if (!fs.existsSync('health-reports')) {
      fs.mkdirSync('health-reports', { recursive: true });
    }
    
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`💾 Report saved to ${filename}`);
  } catch (error) {
    console.error('❌ Failed to save report:', error.message);
  }
  
  // Keep only last 100 reports
  try {
    const files = fs.readdirSync('health-reports')
      .filter(f => f.startsWith('health-'))
      .sort()
      .reverse();
    
    if (files.length > 100) {
      files.slice(100).forEach(file => {
        fs.unlinkSync(`health-reports/${file}`);
      });
    }
  } catch (error) {
    console.error('⚠️ Failed to cleanup old reports:', error.message);
  }
}

/**
 * Main function
 */
async function main() {
  const results = await checkAllAgents();
  const report = generateReport(results);
  
  printReport(report);
  saveReport(report);
  await sendAlerts(report);
  
  // Exit with error code if any agents are down
  const hasProblems = report.summary.unhealthy > 0 || report.summary.down > 0;
  process.exit(hasProblems ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  });
}

// Export for use in other scripts
module.exports = {
  checkAgentHealth,
  checkAllAgents,
  generateReport,
  agents
};
