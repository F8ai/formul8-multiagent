#!/usr/bin/env node

/**
 * Merge baseline.json files from multiple agent repositories into a single unified baseline.json
 */

const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.join(process.cwd(), 'baselines-raw');
const OUTPUT_FILE = path.join(process.cwd(), 'baseline.json');

/**
 * Load all baseline files from the input directory
 */
function loadBaselineFiles() {
  console.log(`📂 Loading baseline files from: ${INPUT_DIR}`);
  
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`❌ Input directory not found: ${INPUT_DIR}`);
    return [];
  }

  const files = fs.readdirSync(INPUT_DIR)
    .filter(file => file.endsWith('.json') && file !== 'fetch-summary.json');
  
  console.log(`✅ Found ${files.length} baseline files`);

  const baselines = [];
  
  for (const file of files) {
    try {
      const filePath = path.join(INPUT_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const baseline = JSON.parse(content);
      
      // Extract agent name from filename (remove .json extension)
      const agentName = file.replace('.json', '');
      
      baselines.push({
        agentName,
        baseline,
        file
      });
      
      console.log(`  ✅ Loaded ${file}`);
    } catch (error) {
      console.error(`  ❌ Error loading ${file}: ${error.message}`);
    }
  }

  return baselines;
}

/**
 * Merge baseline files into a unified structure
 */
function mergeBaselines(baselines) {
  console.log('\n🔄 Merging baseline files...');
  
  const merged = {
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceRepos: baselines.map(b => b.agentName),
      totalSources: baselines.length,
      version: '1.0'
    },
    questions: []
  };

  const questionMap = new Map(); // Use Map to track unique questions

  for (const { agentName, baseline } of baselines) {
    // Handle different baseline structures
    let questions = [];
    
    if (Array.isArray(baseline)) {
      questions = baseline;
    } else if (baseline.questions && Array.isArray(baseline.questions)) {
      questions = baseline.questions;
    } else if (typeof baseline === 'object') {
      // Handle cases where baseline is an object with agent categories
      for (const [key, value] of Object.entries(baseline)) {
        if (Array.isArray(value)) {
          questions.push(...value.map(q => typeof q === 'string' ? { question: q, category: key } : q));
        }
      }
    }

    console.log(`  📝 Processing ${questions.length} questions from ${agentName}`);

    for (const item of questions) {
      let question, expectedAnswer, category, metadata;

      // Handle different question formats
      if (typeof item === 'string') {
        question = item;
        category = agentName;
      } else if (typeof item === 'object') {
        question = item.question || item.text || item.prompt;
        expectedAnswer = item.expected_answer || item.expectedAnswer || item.answer;
        category = item.category || item.agent || agentName;
        metadata = item.metadata || {};
      }

      if (!question) continue;

      // Create a unique key for deduplication
      const questionKey = question.toLowerCase().trim();

      if (!questionMap.has(questionKey)) {
        questionMap.set(questionKey, {
          question,
          expected_answer: expectedAnswer || '',
          category,
          sources: [agentName],
          metadata: metadata || {}
        });
      } else {
        // Question already exists, add source
        const existing = questionMap.get(questionKey);
        if (!existing.sources.includes(agentName)) {
          existing.sources.push(agentName);
        }
        // If this version has an expected answer and the existing doesn't, use it
        if (expectedAnswer && !existing.expected_answer) {
          existing.expected_answer = expectedAnswer;
        }
      }
    }
  }

  // Convert Map to array
  merged.questions = Array.from(questionMap.values());

  console.log(`\n✅ Merged ${merged.questions.length} unique questions (removed duplicates)`);
  
  return merged;
}

/**
 * Generate merge statistics
 */
function generateStats(merged, baselines) {
  console.log('\n📊 MERGE STATISTICS');
  console.log('='.repeat(60));
  
  const stats = {
    totalSources: baselines.length,
    uniqueQuestions: merged.questions.length,
    categoryCounts: {},
    questionsWithExpectedAnswers: 0,
    questionsFromMultipleSources: 0
  };

  for (const question of merged.questions) {
    // Count by category
    const cat = question.category || 'uncategorized';
    stats.categoryCounts[cat] = (stats.categoryCounts[cat] || 0) + 1;
    
    // Count questions with expected answers
    if (question.expected_answer) {
      stats.questionsWithExpectedAnswers++;
    }
    
    // Count questions from multiple sources
    if (question.sources && question.sources.length > 1) {
      stats.questionsFromMultipleSources++;
    }
  }

  console.log(`Total source repositories: ${stats.totalSources}`);
  console.log(`Unique questions: ${stats.uniqueQuestions}`);
  console.log(`Questions with expected answers: ${stats.questionsWithExpectedAnswers}`);
  console.log(`Questions from multiple sources: ${stats.questionsFromMultipleSources}`);
  
  console.log('\nQuestions by category:');
  for (const [category, count] of Object.entries(stats.categoryCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${category}: ${count}`);
  }

  return stats;
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting baseline merge');
  console.log('='.repeat(60));

  // Load baseline files
  const baselines = loadBaselineFiles();
  
  if (baselines.length === 0) {
    console.error('❌ No baseline files to merge');
    process.exit(1);
  }

  // Merge baselines
  const merged = mergeBaselines(baselines);
  
  // Generate statistics
  const stats = generateStats(merged, baselines);
  
  // Add stats to merged object
  merged.metadata.stats = stats;

  // Save merged baseline
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(merged, null, 2));
  console.log(`\n💾 Merged baseline saved to: ${OUTPUT_FILE}`);
  
  console.log('\n✅ Baseline merge completed!');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, loadBaselineFiles, mergeBaselines };
