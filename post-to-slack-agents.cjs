#!/usr/bin/env node

/**
 * Post "You May Ask Yourself" questions directly to Slack #agents channel
 * This will trigger F8 to respond in the channel
 */

const https = require('https');

// Get Slack Bot Token from environment
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL = '#agents'; // or use the channel ID

if (!SLACK_BOT_TOKEN) {
  console.error('❌ Error: SLACK_BOT_TOKEN environment variable not set');
  console.error('   Please set it: export SLACK_BOT_TOKEN="xoxb-your-token"');
  process.exit(1);
}

const questions = [
  "You may ask yourself: How did F8 get here?",
  "You may ask yourself: What is my purpose as an AI agent system?",
  "You may ask yourself: Am I an effective multi-agent system?",
  "You may ask yourself: How do I route conversations to the right agents?",
  "You may ask yourself: What makes me different from other AI systems?"
];

/**
 * Post a message to Slack
 */
async function postToSlack(message) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      channel: SLACK_CHANNEL,
      text: message,
      username: 'F8 Introspection Test',
      icon_emoji: ':thinking_face:'
    });

    const options = {
      hostname: 'slack.com',
      port: 443,
      path: '/api/chat.postMessage',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.ok) {
            resolve(response);
          } else {
            reject(new Error(`Slack API error: ${response.error}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Run the introspection test in Slack
 */
async function runIntrospectionTest() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║          🎵 "YOU MAY ASK YOURSELF" - POSTING TO SLACK 🎵                     ║');
  console.log('║                                                                              ║');
  console.log('║                    F8 Will Respond in #agents Channel                        ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`📡 Channel: ${SLACK_CHANNEL}`);
  console.log(`💭 Questions: ${questions.length}`);
  console.log('');

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    console.log(`\n[${i + 1}/${questions.length}] Posting to Slack:`);
    console.log(`"${question}"`);

    try {
      const response = await postToSlack(question);
      console.log(`✅ Posted successfully (ts: ${response.ts})`);
      
      // Wait 2 seconds between messages to avoid rate limiting
      if (i < questions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Failed to post: ${error.message}`);
    }
  }

  console.log('\n');
  console.log('================================================================================');
  console.log('✅ All questions posted to Slack!');
  console.log('📺 Check the #agents channel to see F8 respond!');
  console.log('================================================================================');
}

// Run the test
runIntrospectionTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});



