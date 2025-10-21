#!/usr/bin/env node
/**
 * Collect baseline.json from all agent repositories
 * Clones/pulls each agent repo and extracts baseline.json
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const GITHUB_ORG = 'F8ai';  // Change if different
const TEMP_DIR = path.join(__dirname, '..', '.agent-repos');

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
    sourceRepos: [],
    totalSources: 0,
    version: '1.0',
    description: 'Master baseline questions from all agent repositories',
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

console.log('🔄 Collecting baseline.json from agent repositories');
console.log('=' .repeat(70));
console.log('');

// Create temp directory
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

for (const agent of agents) {
  const repoUrl = `https://github.com/${GITHUB_ORG}/${agent}.git`;
  const repoPath = path.join(TEMP_DIR, agent);
  
  try {
    console.log(`📦 Processing ${agent}...`);
    
    // Clone or pull repository
    if (fs.existsSync(repoPath)) {
      console.log(`   ↻  Pulling latest changes...`);
      execSync('git pull', { cwd: repoPath, stdio: 'pipe' });
    } else {
      console.log(`   ⬇  Cloning repository...`);
      execSync(`git clone ${repoUrl} ${repoPath}`, { stdio: 'pipe' });
    }
    
    // Look for baseline.json in various locations
    const possiblePaths = [
      path.join(repoPath, 'baseline.json'),
      path.join(repoPath, 'test', 'baseline.json'),
      path.join(repoPath, 'tests', 'baseline.json'),
      path.join(repoPath, 'data', 'baseline.json'),
      path.join(repoPath, 'config', 'baseline.json')
    ];
    
    let baselineFound = false;
    
    for (const baselinePath of possiblePaths) {
      if (fs.existsSync(baselinePath)) {
        console.log(`   ✅ Found baseline.json`);
        
        const agentBaseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
        
        if (agentBaseline.questions && Array.isArray(agentBaseline.questions)) {
          // Add metadata to each question
          const questionsWithMeta = agentBaseline.questions.map((q, idx) => ({
            ...q,
            sourceAgent: agent,
            sourceRepo: repoUrl,
            id: q.id || `${agent}-${idx + 1}`,
            collectedAt: new Date().toISOString()
          }));
          
          masterBaseline.questions.push(...questionsWithMeta);
          masterBaseline.metadata.sourceRepos.push(agent);
          masterBaseline.metadata.totalSources++;
          
          console.log(`   📝 Added ${questionsWithMeta.length} questions`);
          baselineFound = true;
          break;
        }
      }
    }
    
    if (!baselineFound) {
      console.log(`   ⚠️  No baseline.json found in ${agent}`);
    }
    
    console.log('');
    
  } catch (error) {
    console.error(`   ❌ Error processing ${agent}: ${error.message}`);
    console.log('');
  }
}

console.log('📊 Processing Statistics');
console.log('=' .repeat(70));

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

// Count by tier
const tierCounts = {};
masterBaseline.questions.forEach(q => {
  if (q.tier) {
    tierCounts[q.tier] = (tierCounts[q.tier] || 0) + 1;
  }
});

// Count questions with expected answers
masterBaseline.metadata.stats.questionsWithExpectedAnswers = 
  masterBaseline.questions.filter(q => q.expectedAnswer || q.expectedAgent).length;

console.log(`Total Questions: ${masterBaseline.metadata.stats.uniqueQuestions}`);
console.log(`Total Sources: ${masterBaseline.metadata.stats.totalSources}`);
console.log(`Categories: ${Object.keys(categoryCounts).length}`);
console.log('');

if (Object.keys(categoryCounts).length > 0) {
  console.log('📂 Category Breakdown:');
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`  ${category.padEnd(25)} : ${count} questions`);
    });
  console.log('');
}

if (Object.keys(tierCounts).length > 0) {
  console.log('🎯 Tier Breakdown:');
  Object.entries(tierCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([tier, count]) => {
      console.log(`  ${tier.padEnd(25)} : ${count} questions`);
    });
  console.log('');
}

// Count by source agent
const agentCounts = {};
masterBaseline.questions.forEach(q => {
  if (q.sourceAgent) {
    agentCounts[q.sourceAgent] = (agentCounts[q.sourceAgent] || 0) + 1;
  }
});

if (Object.keys(agentCounts).length > 0) {
  console.log('🤖 Questions by Agent:');
  Object.entries(agentCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([agent, count]) => {
      console.log(`  ${agent.padEnd(25)} : ${count} questions`);
    });
  console.log('');
}

// Write master baseline
const outputPath = path.join(__dirname, '..', 'baseline.json');
fs.writeFileSync(outputPath, JSON.stringify(masterBaseline, null, 2));

console.log(`✅ Master baseline.json created at: ${outputPath}`);
console.log(`📦 Total questions collected: ${masterBaseline.questions.length}`);
console.log('');

// Create detailed summary
const summaryPath = path.join(__dirname, '..', 'baseline-summary.md');
let summary = `# Formul8 Baseline Questions Summary\n\n`;
summary += `**Generated:** ${masterBaseline.metadata.generatedAt}\n`;
summary += `**Total Questions:** ${masterBaseline.metadata.stats.uniqueQuestions}\n`;
summary += `**Total Sources:** ${masterBaseline.metadata.stats.totalSources}\n\n`;

summary += `## Source Repositories\n\n`;
masterBaseline.metadata.sourceRepos.forEach(repo => {
  const count = agentCounts[repo] || 0;
  summary += `- [${repo}](https://github.com/${GITHUB_ORG}/${repo}) - ${count} questions\n`;
});

summary += `\n## Questions by Category\n\n`;
Object.entries(categoryCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([category, count]) => {
    summary += `- **${category}**: ${count} questions\n`;
  });

summary += `\n## Questions by Tier\n\n`;
Object.entries(tierCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([tier, count]) => {
    summary += `- **${tier}**: ${count} questions\n`;
  });

summary += `\n## Sample Questions\n\n`;

// Get sample questions from different categories
const samplesByCategory = {};
masterBaseline.questions.forEach(q => {
  if (q.category && !samplesByCategory[q.category]) {
    samplesByCategory[q.category] = q;
  }
});

Object.values(samplesByCategory).slice(0, 10).forEach((q, idx) => {
  summary += `${idx + 1}. **${q.question}**\n`;
  summary += `   - Category: ${q.category || 'N/A'}\n`;
  summary += `   - Source: ${q.sourceAgent || 'N/A'}\n`;
  summary += `   - Tier: ${q.tier || 'N/A'}\n`;
  summary += `   - Expected Agent: ${q.expectedAgent || 'N/A'}\n\n`;
});

summary += `\n## Usage\n\n`;
summary += `The baseline questions are used by:\n`;
summary += `- Chat interface typewriter effect\n`;
summary += `- Automated testing\n`;
summary += `- Agent routing validation\n`;
summary += `- Performance benchmarking\n\n`;

summary += `## Updating\n\n`;
summary += `To update the master baseline.json:\n\n`;
summary += `\`\`\`bash\n`;
summary += `node scripts/collect-baselines-from-repos.js\n`;
summary += `\`\`\`\n\n`;
summary += `This will:\n`;
summary += `1. Clone/pull all agent repositories\n`;
summary += `2. Extract baseline.json from each\n`;
summary += `3. Concatenate into master baseline.json\n`;
summary += `4. Generate this summary\n`;

fs.writeFileSync(summaryPath, summary);
console.log(`📄 Summary created at: ${summaryPath}`);
console.log('');

// Create a .gitignore entry for temp repos
const gitignorePath = path.join(__dirname, '..', '.gitignore');
let gitignoreContent = '';
if (fs.existsSync(gitignorePath)) {
  gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
}

if (!gitignoreContent.includes('.agent-repos')) {
  fs.appendFileSync(gitignorePath, '\n# Temporary agent repositories\n.agent-repos/\n');
  console.log('📝 Updated .gitignore to exclude .agent-repos/');
}

console.log('🎉 Done!');
console.log('');
console.log('💡 Next steps:');
console.log('   1. Review baseline.json');
console.log('   2. Commit and push changes');
console.log('   3. Test chat interface with new questions');
