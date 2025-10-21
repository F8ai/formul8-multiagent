#!/usr/bin/env node
/**
 * Concatenate baseline.json from all agent directories
 * Creates a master baseline.json at the root
 */

const fs = require('fs');
const path = require('path');

const agents = [
  'compliance-agent',
  'science-agent',
  'formulation-agent',
  'marketing-agent',
  'patent-agent',
  'operations-agent',
  'sourcing-agent',
  'spectra-agent',
  'mcr-agent',
  'customer-success-agent',
  'ad-agent',
  'editor-agent',
  'f8-slackbot'
];

const masterBaseline = {
  metadata: {
    generatedAt: new Date().toISOString(),
    sourceRepos: agents,
    totalSources: 0,
    version: '1.0',
    description: 'Master baseline questions for Formul8 multiagent system',
    stats: {
      totalSources: 0,
      uniqueQuestions: 0,
      categoryCounts: {},
      questionsWithExpectedAnswers: 0,
      questionsFromMultipleSources: 0
    }
  },
  questions: []
};

console.log('🔄 Concatenating baseline.json from all agents');
console.log('=' .repeat(60));

for (const agent of agents) {
  const baselinePath = path.join(__dirname, '..', 'agents', agent, 'baseline.json');
  
  try {
    if (fs.existsSync(baselinePath)) {
      console.log(`✅ Found baseline.json in ${agent}`);
      const agentBaseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      
      if (agentBaseline.questions && Array.isArray(agentBaseline.questions)) {
        // Add agent identifier to each question
        const questionsWithAgent = agentBaseline.questions.map(q => ({
          ...q,
          sourceAgent: agent,
          id: q.id || `${agent}-${masterBaseline.questions.length + 1}`
        }));
        
        masterBaseline.questions.push(...questionsWithAgent);
        masterBaseline.metadata.totalSources++;
        
        console.log(`   📝 Added ${questionsWithAgent.length} questions`);
      } else {
        console.log(`   ⚠️  No questions array found`);
      }
    } else {
      console.log(`⚠️  No baseline.json in ${agent} - creating template`);
      
      // Create a template baseline for the agent
      const template = {
        metadata: {
          generatedAt: new Date().toISOString(),
          agent: agent,
          version: '1.0',
          description: `Baseline questions for ${agent}`
        },
        questions: [
          {
            id: `${agent}-001`,
            question: `Example question for ${agent}`,
            category: agent.replace('-agent', '').replace('f8-', ''),
            expectedAgent: agent,
            tier: 'standard'
          }
        ]
      };
      
      // Create the template file
      fs.writeFileSync(baselinePath, JSON.stringify(template, null, 2));
      console.log(`   ✅ Created template baseline.json for ${agent}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${agent}:`, error.message);
  }
}

console.log('');
console.log('📊 Processing Statistics');
console.log('=' .repeat(60));

// Calculate statistics
masterBaseline.metadata.stats.uniqueQuestions = masterBaseline.questions.length;
masterBaseline.metadata.stats.totalSources = masterBaseline.metadata.totalSources;

// Count by category
const categoryCounts = {};
masterBaseline.questions.forEach(q => {
  if (q.category) {
    categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1;
  }
});
masterBaseline.metadata.stats.categoryCounts = categoryCounts;

// Count questions with expected answers
masterBaseline.metadata.stats.questionsWithExpectedAnswers = 
  masterBaseline.questions.filter(q => q.expectedAnswer || q.expectedAgent).length;

console.log(`Total Questions: ${masterBaseline.metadata.stats.uniqueQuestions}`);
console.log(`Total Sources: ${masterBaseline.metadata.stats.totalSources}`);
console.log(`Categories: ${Object.keys(categoryCounts).length}`);
console.log('');
console.log('Category Breakdown:');
Object.entries(categoryCounts).forEach(([category, count]) => {
  console.log(`  ${category.padEnd(20)} : ${count} questions`);
});

// Write master baseline
const outputPath = path.join(__dirname, '..', 'baseline.json');
fs.writeFileSync(outputPath, JSON.stringify(masterBaseline, null, 2));

console.log('');
console.log(`✅ Master baseline.json created at ${outputPath}`);
console.log(`📦 Total questions: ${masterBaseline.questions.length}`);
console.log('');

// Create a summary file
const summaryPath = path.join(__dirname, '..', 'baseline-summary.md');
let summary = `# Formul8 Baseline Questions Summary\n\n`;
summary += `**Generated:** ${masterBaseline.metadata.generatedAt}\n\n`;
summary += `**Total Questions:** ${masterBaseline.metadata.stats.uniqueQuestions}\n`;
summary += `**Total Sources:** ${masterBaseline.metadata.stats.totalSources}\n\n`;
summary += `## Questions by Category\n\n`;

Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
  summary += `- **${category}**: ${count} questions\n`;
});

summary += `\n## Questions by Agent\n\n`;

const agentCounts = {};
masterBaseline.questions.forEach(q => {
  if (q.sourceAgent) {
    agentCounts[q.sourceAgent] = (agentCounts[q.sourceAgent] || 0) + 1;
  }
});

Object.entries(agentCounts).sort((a, b) => b[1] - a[1]).forEach(([agent, count]) => {
  summary += `- **${agent}**: ${count} questions\n`;
});

summary += `\n## Sample Questions\n\n`;

// Get 5 random questions
const sampleSize = Math.min(5, masterBaseline.questions.length);
const samples = [];
for (let i = 0; i < sampleSize; i++) {
  const idx = Math.floor(Math.random() * masterBaseline.questions.length);
  samples.push(masterBaseline.questions[idx]);
}

samples.forEach((q, idx) => {
  summary += `${idx + 1}. **${q.question}**\n`;
  summary += `   - Category: ${q.category || 'N/A'}\n`;
  summary += `   - Source: ${q.sourceAgent || 'N/A'}\n`;
  summary += `   - Tier: ${q.tier || 'N/A'}\n\n`;
});

fs.writeFileSync(summaryPath, summary);
console.log(`📄 Summary created at ${summaryPath}`);
console.log('');
console.log('🎉 Done!');
