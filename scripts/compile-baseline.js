#!/usr/bin/env node

/**
 * Compile all agent baseline.json files into the main baseline.json
 * 
 * This script:
 * 1. Scans all agent directories for baseline.json files
 * 2. Merges all questions into a single baseline.json
 * 3. Validates the structure
 * 4. Saves to the root baseline.json
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(__dirname, '..', 'agents');
const OUTPUT_FILE = path.join(__dirname, '..', 'baseline.json');
const PUBLIC_OUTPUT_FILE = path.join(__dirname, '..', 'public', 'baseline.json');

console.log('🔨 Compiling Baseline Questions');
console.log('='.repeat(80));

// Get all agent directories
const agentDirs = fs.readdirSync(AGENTS_DIR, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

console.log(`📁 Found ${agentDirs.length} agent directories`);

const compiledBaseline = {
  metadata: {
    generatedAt: new Date().toISOString(),
    sourceRepos: ['formul8-multiagent'],
    totalSources: agentDirs.length,
    version: '1.0',
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

const categoryCount = {};
const questionIds = new Set();
let totalQuestions = 0;
let questionsWithExpectedAnswers = 0;

// Process each agent directory
for (const agentDir of agentDirs) {
  const baselinePath = path.join(AGENTS_DIR, agentDir, 'baseline.json');
  
  if (!fs.existsSync(baselinePath)) {
    console.log(`  ⚠️  ${agentDir}: No baseline.json found`);
    continue;
  }

  try {
    const content = fs.readFileSync(baselinePath, 'utf8');
    const baseline = JSON.parse(content);

    if (!baseline.questions || !Array.isArray(baseline.questions)) {
      console.log(`  ⚠️  ${agentDir}: No questions array found`);
      continue;
    }

    console.log(`  ✅ ${agentDir}: ${baseline.questions.length} question(s)`);

    // Add each question to compiled baseline
    for (const question of baseline.questions) {
      // Ensure question has an ID
      if (!question.id) {
        console.log(`    ⚠️  Question missing ID: "${question.question}"`);
        continue;
      }

      // Check for duplicate IDs
      if (questionIds.has(question.id)) {
        console.log(`    ⚠️  Duplicate question ID: ${question.id}`);
        continue;
      }

      // Add source information
      question.source = agentDir;
      question.sourceAgent = baseline.metadata?.agent || agentDir;

      compiledBaseline.questions.push(question);
      questionIds.add(question.id);
      totalQuestions++;

      // Track category counts
      const category = question.category || 'uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;

      // Track expected answers
      if (question.expectedAnswer || question.expectedKeywords) {
        questionsWithExpectedAnswers++;
      }
    }

  } catch (error) {
    console.log(`  ❌ ${agentDir}: Error reading baseline.json - ${error.message}`);
  }
}

// Update metadata stats
compiledBaseline.metadata.stats = {
  totalSources: agentDirs.length,
  uniqueQuestions: totalQuestions,
  categoryCounts: categoryCount,
  questionsWithExpectedAnswers: questionsWithExpectedAnswers,
  questionsFromMultipleSources: 0 // For future when questions can come from multiple sources
};

// Save compiled baseline
console.log('\n' + '='.repeat(80));
console.log('📊 Compilation Summary');
console.log('='.repeat(80));
console.log(`Total Sources: ${compiledBaseline.metadata.stats.totalSources}`);
console.log(`Total Questions: ${totalQuestions}`);
console.log(`Questions with Expected Answers: ${questionsWithExpectedAnswers}`);
console.log('\nQuestions by Category:');
Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
  console.log(`  ${category}: ${count}`);
});

// Write to root baseline.json
try {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(compiledBaseline, null, 2));
  console.log(`\n✅ Saved to: ${OUTPUT_FILE}`);
} catch (error) {
  console.error(`\n❌ Error writing to ${OUTPUT_FILE}: ${error.message}`);
  process.exit(1);
}

// Also write to public/baseline.json if public directory exists
const publicDir = path.dirname(PUBLIC_OUTPUT_FILE);
if (fs.existsSync(publicDir)) {
  try {
    fs.writeFileSync(PUBLIC_OUTPUT_FILE, JSON.stringify(compiledBaseline, null, 2));
    console.log(`✅ Saved to: ${PUBLIC_OUTPUT_FILE}`);
  } catch (error) {
    console.error(`⚠️  Could not write to ${PUBLIC_OUTPUT_FILE}: ${error.message}`);
  }
}

console.log('\n🎉 Baseline compilation complete!');

// Export for use as module
module.exports = { compiledBaseline };

