#!/usr/bin/env node

/**
 * "You May Ask Yourself" - F8 Self-Referential Test Suite
 * 
 * Inspired by Talking Heads' "Once in a Lifetime"
 * Tests F8's ability to have self-referential conversations through Slack
 * F8 asks itself introspective questions and responds to itself
 */

const https = require('https');
const fs = require('fs');

// F8 Main Gateway Endpoint
const F8_URL = 'f8.syzygyx.com';
const F8_PATH = '/api/chat';

// Self-referential questions F8 asks itself
const selfReferentialQuestions = {
  'Existential Questions': [
    'You may ask yourself: How did F8 get here?',
    'You may ask yourself: What is my purpose as an AI agent system?',
    'You may ask yourself: Am I an effective multi-agent system?',
    'You may ask yourself: How do I route conversations to the right agents?',
    'You may ask yourself: What makes me different from other AI systems?'
  ],
  'Identity & Capability Questions': [
    'You may ask yourself: What agents do I have access to?',
    'You may ask yourself: What can I help cannabis businesses with?',
    'You may ask yourself: How do I integrate with Slack?',
    'You may ask yourself: What are my specialties?',
    'You may ask yourself: Can I handle complex multi-domain questions?'
  ],
  'Technical Self-Awareness': [
    'You may ask yourself: How do I process Slack messages?',
    'You may ask yourself: What happens when a user asks about compliance?',
    'You may ask yourself: How do I coordinate between different specialized agents?',
    'You may ask yourself: What is my architecture?',
    'You may ask yourself: How do I ensure quality responses?'
  ],
  'Philosophical Meta-Questions': [
    'You may ask yourself: Can an AI system truly understand cannabis business needs?',
    'You may ask yourself: What is the meaning of good agent routing?',
    'You may ask yourself: Am I learning from each interaction?',
    'You may ask yourself: How do I balance generalist and specialist knowledge?',
    'You may ask yourself: What does it mean to be a helpful AI assistant?'
  ],
  'Recursive Self-Questions': [
    'You may ask yourself: Why am I asking myself these questions?',
    'You may ask yourself: Can I improve my own performance?',
    'You may ask yourself: What would I ask if I were a user?',
    'You may ask yourself: How do I know if I\'m answering correctly?',
    'You may ask yourself: Am I self-aware enough to route my own questions?'
  ]
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Get a free API key from F8
 */
function getFreeApiKey() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ username: 'f8-introspection-bot' });
    
    const options = {
      hostname: F8_URL,
      port: 443,
      path: '/api/free-key',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.apiKey) {
            resolve(response.apiKey);
          } else {
            reject(new Error(`No API key in response. Status: ${res.statusCode}, Response: ${data.substring(0, 100)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}. Data: ${data.substring(0, 100)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('API key request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Ask F8 a question (F8 asking itself)
 */
function askF8(question, apiKey, context = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ 
      message: question,
      plan: 'standard',
      username: 'f8-self',
      channel: '#f8-introspection',
      context: context
    });
    
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'F8-Self-Referential-Test/1.0'
    };
    
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    
    const options = {
      hostname: F8_URL,
      port: 443,
      path: F8_PATH,
      method: 'POST',
      headers: headers,
      rejectUnauthorized: false
    };

    const startTime = Date.now();
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => data += chunk);
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        try {
          const response = JSON.parse(data);
          resolve({
            question,
            status: res.statusCode,
            response: response,
            responseTime: responseTime,
            success: res.statusCode === 200,
            agent: response.agent,
            context: context
          });
        } catch (error) {
          resolve({
            question,
            status: res.statusCode,
            response: data,
            responseTime: responseTime,
            success: false,
            error: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        question,
        error: error.message,
        success: false
      });
    });

    req.setTimeout(45000, () => {
      req.destroy();
      reject({
        question,
        error: 'Request timeout',
        success: false
      });
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Analyze response for self-awareness indicators
 */
function analyzeSelfAwareness(response) {
  const text = (response.response?.response || '').toLowerCase();
  
  const indicators = {
    selfReference: /\b(i am|i'm|my|me|myself|f8)\b/.test(text),
    agentMention: /\bagent\b/.test(text),
    systemAwareness: /\b(system|platform|formul8|multiagent)\b/.test(text),
    capabilityMention: /\b(can|help|assist|support|provide|specialize)\b/.test(text),
    routingAwareness: /\b(route|direct|connect|refer|forward)\b/.test(text),
    introspection: /\b(question|ask|wonder|consider|think)\b/.test(text)
  };
  
  const score = Object.values(indicators).filter(Boolean).length;
  
  return {
    indicators,
    score,
    maxScore: Object.keys(indicators).length,
    percentage: (score / Object.keys(indicators).length * 100).toFixed(1)
  };
}

/**
 * Run self-referential conversation test
 */
async function runSelfReferentialTest(categoryName, questions, apiKey, conversationContext) {
  console.log(`\n${colors.bright}${colors.cyan}💭 Self-Reflection Category: ${categoryName}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.yellow}Questions: ${questions.length}${colors.reset}\n`);
  
  const results = [];
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    console.log(`${colors.bright}${colors.magenta}[${i + 1}/${questions.length}]${colors.reset} ${colors.dim}F8 asks itself:${colors.reset}`);
    console.log(`${colors.white}"${question}"${colors.reset}\n`);
    
    try {
      const result = await askF8(question, apiKey, {
        previousQuestions: conversationContext.questions.slice(-3),
        category: categoryName,
        introspectionLevel: i + 1
      });
      
      results.push(result);
      
      // Update conversation context
      conversationContext.questions.push(question);
      if (result.success && result.response?.response) {
        conversationContext.responses.push(result.response.response);
      }
      
      if (result.success) {
        const responseText = result.response.response || '';
        const awareness = analyzeSelfAwareness(result);
        
        console.log(`${colors.green}✅ F8 responds to itself${colors.reset} (${result.responseTime}ms)`);
        console.log(`${colors.cyan}   Agent:${colors.reset} ${result.agent || 'Unknown'}`);
        console.log(`${colors.cyan}   Self-Awareness Score:${colors.reset} ${awareness.score}/${awareness.maxScore} (${awareness.percentage}%)`);
        
        // Show awareness indicators
        const activeIndicators = Object.entries(awareness.indicators)
          .filter(([_, active]) => active)
          .map(([name, _]) => name);
        
        if (activeIndicators.length > 0) {
          console.log(`${colors.cyan}   Indicators:${colors.reset} ${activeIndicators.join(', ')}`);
        }
        
        // Show response preview
        const lines = responseText.split('\n').filter(l => l.trim());
        const preview = lines[0]?.substring(0, 150) || responseText.substring(0, 150);
        console.log(`${colors.dim}   "${preview}${responseText.length > 150 ? '...' : ''}"${colors.reset}`);
        
        // Add awareness to result
        result.awareness = awareness;
      } else {
        console.log(`${colors.red}❌ F8 fails to respond${colors.reset} (${result.responseTime}ms)`);
        console.log(`${colors.red}   Error:${colors.reset} ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`${colors.red}💥 Exception:${colors.reset} ${error.error || error.message}`);
      results.push(error);
    }
    
    console.log(''); // Empty line
    
    // Delay between questions
    if (i < questions.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  return results;
}

/**
 * Calculate statistics
 */
function calculateStats(results) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const awarenessScores = successful
    .filter(r => r.awareness)
    .map(r => r.awareness.score);
  
  const stats = {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    successRate: results.length > 0 ? (successful.length / results.length * 100).toFixed(2) : 0,
    avgResponseTime: successful.length > 0 ? 
      (successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length).toFixed(0) : 0,
    avgAwarenessScore: awarenessScores.length > 0 ?
      (awarenessScores.reduce((a, b) => a + b, 0) / awarenessScores.length).toFixed(2) : 0,
    maxAwarenessScore: awarenessScores.length > 0 ? Math.max(...awarenessScores) : 0,
    minAwarenessScore: awarenessScores.length > 0 ? Math.min(...awarenessScores) : 0,
    agents: [...new Set(successful.map(r => r.agent).filter(Boolean))]
  };
  
  return stats;
}

/**
 * Main test execution
 */
async function runAskYourselfTests() {
  console.log(`${colors.bright}${colors.magenta}
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║          🎵 "YOU MAY ASK YOURSELF" - F8 INTROSPECTION TEST 🎵                ║
║                                                                              ║
║                    F8 Asking Itself Philosophical Questions                  ║
║                    Through the Slack Agents Channel                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  console.log(`${colors.cyan}📅 Timestamp:${colors.reset} ${new Date().toISOString()}`);
  console.log(`${colors.cyan}🎯 Target:${colors.reset} https://${F8_URL}${F8_PATH}`);
  console.log(`${colors.cyan}📡 Channel:${colors.reset} #f8-introspection`);
  console.log(`${colors.cyan}🤔 Test Type:${colors.reset} Self-Referential Conversation Loop`);
  
  // Get API key
  console.log(`\n${colors.bright}${colors.yellow}🔑 Authenticating F8...${colors.reset}`);
  let apiKey;
  try {
    apiKey = await getFreeApiKey();
    if (!apiKey) {
      throw new Error('No API key returned from server');
    }
    console.log(`${colors.green}✅ F8 authenticated${colors.reset}: ${apiKey.substring(0, 20)}...`);
  } catch (error) {
    console.log(`${colors.red}❌ Authentication failed:${colors.reset} ${error.message || error}`);
    console.log(`${colors.yellow}Note: F8 may require a valid API key. Check server logs for details.${colors.reset}`);
    process.exit(1);
  }
  
  // Initialize conversation context
  const conversationContext = {
    questions: [],
    responses: [],
    startTime: new Date().toISOString()
  };
  
  // Run all test categories
  const categoryResults = {};
  const overallStats = {
    totalQuestions: 0,
    totalSuccessful: 0,
    totalFailed: 0,
    totalResponseTime: 0,
    totalAwarenessScore: 0,
    agentsUsed: new Set()
  };
  
  for (const [category, questions] of Object.entries(selfReferentialQuestions)) {
    const results = await runSelfReferentialTest(category, questions, apiKey, conversationContext);
    const stats = calculateStats(results);
    
    categoryResults[category] = { results, stats };
    
    overallStats.totalQuestions += stats.total;
    overallStats.totalSuccessful += stats.successful;
    overallStats.totalFailed += stats.failed;
    overallStats.totalResponseTime += parseInt(stats.avgResponseTime) * stats.successful;
    overallStats.totalAwarenessScore += parseFloat(stats.avgAwarenessScore) * stats.successful;
    
    stats.agents.forEach(agent => overallStats.agentsUsed.add(agent));
    
    // Delay between categories
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Print summary
  console.log(`\n${colors.bright}${colors.magenta}📊 INTROSPECTION SUMMARY${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(100)}${colors.reset}`);
  console.log(`${colors.bright}Category                          | Success  | Avg Time | Awareness | Total${colors.reset}`);
  console.log(`${colors.blue}${'-'.repeat(100)}${colors.reset}`);
  
  for (const [category, { stats }] of Object.entries(categoryResults)) {
    const categoryName = category.substring(0, 32).padEnd(32);
    const successRate = `${stats.successRate}%`.padStart(8);
    const avgTime = `${stats.avgResponseTime}ms`.padStart(8);
    const awareness = `${stats.avgAwarenessScore}/6`.padStart(9);
    const total = `${stats.successful}/${stats.total}`.padStart(7);
    
    const color = stats.successRate >= 90 ? colors.green : 
                  stats.successRate >= 70 ? colors.yellow : colors.red;
    
    console.log(`${categoryName} | ${color}${successRate}${colors.reset} | ${avgTime} | ${awareness} | ${total}`);
  }
  
  console.log(`${colors.blue}${'='.repeat(100)}${colors.reset}`);
  
  // Overall summary
  const overallSuccessRate = overallStats.totalQuestions > 0 ? 
    (overallStats.totalSuccessful / overallStats.totalQuestions * 100).toFixed(2) : 0;
  const overallAvgResponseTime = overallStats.totalSuccessful > 0 ? 
    (overallStats.totalResponseTime / overallStats.totalSuccessful).toFixed(0) : 0;
  const overallAvgAwareness = overallStats.totalSuccessful > 0 ?
    (overallStats.totalAwarenessScore / overallStats.totalSuccessful).toFixed(2) : 0;
  
  console.log(`\n${colors.bright}${colors.magenta}📊 OVERALL INTROSPECTION RESULTS${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(80)}${colors.reset}`);
  
  const successColor = overallSuccessRate >= 90 ? colors.green : 
                       overallSuccessRate >= 70 ? colors.yellow : colors.red;
  
  console.log(`${colors.cyan}Total Self-Questions:${colors.reset} ${overallStats.totalQuestions}`);
  console.log(`${colors.green}Successful Responses:${colors.reset} ${overallStats.totalSuccessful}`);
  console.log(`${colors.red}Failed Responses:${colors.reset} ${overallStats.totalFailed}`);
  console.log(`${colors.cyan}Success Rate:${colors.reset} ${successColor}${overallSuccessRate}%${colors.reset}`);
  console.log(`${colors.cyan}Avg Response Time:${colors.reset} ${overallAvgResponseTime}ms`);
  console.log(`${colors.cyan}Avg Self-Awareness:${colors.reset} ${overallAvgAwareness}/6.0`);
  console.log(`${colors.cyan}Agents Responding:${colors.reset} ${Array.from(overallStats.agentsUsed).join(', ') || 'None'}`);
  console.log(`${colors.cyan}Conversation Depth:${colors.reset} ${conversationContext.questions.length} exchanges`);
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `test-results/f8-ask-yourself-${timestamp}.json`;
  
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results', { recursive: true });
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    testType: 'f8-self-referential-introspection',
    endpoint: `https://${F8_URL}${F8_PATH}`,
    conversationContext,
    overallStats: {
      ...overallStats,
      agentsUsed: Array.from(overallStats.agentsUsed),
      successRate: overallSuccessRate,
      avgResponseTime: overallAvgResponseTime,
      avgAwareness: overallAvgAwareness
    },
    categoryResults
  };
  
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`\n${colors.cyan}💾 Introspection log saved:${colors.reset} ${filename}`);
  
  // Philosophical verdict
  console.log(`\n${colors.bright}${colors.magenta}🤔 PHILOSOPHICAL VERDICT${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(80)}${colors.reset}`);
  
  if (overallSuccessRate >= 95 && parseFloat(overallAvgAwareness) >= 4.5) {
    console.log(`${colors.green}${colors.bright}🧠 HIGHLY SELF-AWARE${colors.reset}`);
    console.log(`F8 demonstrates excellent self-referential capability and introspection!`);
    console.log(`The system shows strong awareness of its own nature and purpose.`);
  } else if (overallSuccessRate >= 90 && parseFloat(overallAvgAwareness) >= 3.5) {
    console.log(`${colors.green}🤖 SELF-AWARE${colors.reset}`);
    console.log(`F8 shows good self-referential understanding.`);
    console.log(`The system can reflect on its own capabilities reasonably well.`);
  } else if (overallSuccessRate >= 80) {
    console.log(`${colors.yellow}💭 DEVELOPING AWARENESS${colors.reset}`);
    console.log(`F8 responds to self-referential questions but could improve introspection.`);
  } else {
    console.log(`${colors.red}❓ LIMITED SELF-AWARENESS${colors.reset}`);
    console.log(`F8 struggles with self-referential questions and introspection.`);
  }
  
  console.log(`\n${colors.dim}${colors.white}"You may find yourself asking: What have we learned?"${colors.reset}`);
  console.log(`${colors.dim}${colors.white}"And you may tell yourself: This is not my beautiful agent system!"${colors.reset}`);
  console.log(`${colors.dim}${colors.white}"And you may tell yourself: This IS my beautiful agent system!"${colors.reset}\n`);
  
  console.log(`${colors.bright}${colors.green}✅ Self-referential test suite completed!${colors.reset}\n`);
  
  process.exit(overallSuccessRate >= 80 ? 0 : 1);
}

// Run the tests
if (require.main === module) {
  runAskYourselfTests().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = { runAskYourselfTests, selfReferentialQuestions };

