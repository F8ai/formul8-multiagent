#!/usr/bin/env node

// Pricing per 1M tokens (approximate OpenRouter/OpenAI pricing)
const models = {
  "meta-llama/llama-3.1-8b-instruct": {
    name: "Llama 3.1 8B (Current)",
    input: 0.06,  // per 1M tokens
    output: 0.06
  },
  "openai/gpt-4o": {
    name: "GPT-4o",
    input: 2.50,  // per 1M tokens
    output: 10.00
  },
  "openai/gpt-4-turbo": {
    name: "GPT-4 Turbo",
    input: 10.00,
    output: 30.00
  },
  "meta-llama/llama-3.1-70b-instruct": {
    name: "Llama 3.1 70B",
    input: 0.35,
    output: 0.40
  },
  "meta-llama/llama-3.1-405b-instruct": {
    name: "Llama 3.1 405B",
    input: 2.70,
    output: 2.70
  },
  "anthropic/claude-3.5-sonnet": {
    name: "Claude 3.5 Sonnet",
    input: 3.00,
    output: 15.00
  }
};

// Test parameters
const totalQuestions = 438;
const avgPromptTokens = 3000;  // Routing prompt is ~3000 tokens
const avgQuestionTokens = 50;  // Average question length
const avgResponseTokens = 10;  // Response is just agent ID (5-15 tokens)

const inputTokensPerQuestion = avgPromptTokens + avgQuestionTokens;
const outputTokensPerQuestion = avgResponseTokens;

const totalInputTokens = inputTokensPerQuestion * totalQuestions;
const totalOutputTokens = outputTokensPerQuestion * totalQuestions;

console.log('🧮 Cost Analysis: Testing 438 Baseline Questions\n');
console.log('='.repeat(80));
console.log(`Questions: ${totalQuestions}`);
console.log(`Avg Prompt: ${avgPromptTokens} tokens`);
console.log(`Avg Question: ${avgQuestionTokens} tokens`);
console.log(`Avg Response: ${avgResponseTokens} tokens`);
console.log(`\nTotal Input: ${(totalInputTokens / 1000).toFixed(1)}K tokens`);
console.log(`Total Output: ${(totalOutputTokens / 1000).toFixed(1)}K tokens`);
console.log('='.repeat(80));
console.log('\n');

// Calculate costs for each model
const costs = [];
for (const [id, model] of Object.entries(models)) {
  const inputCost = (totalInputTokens / 1_000_000) * model.input;
  const outputCost = (totalOutputTokens / 1_000_000) * model.output;
  const totalCost = inputCost + outputCost;
  
  costs.push({
    id,
    name: model.name,
    inputCost,
    outputCost,
    totalCost
  });
}

// Sort by total cost
costs.sort((a, b) => a.totalCost - b.totalCost);

console.log('💰 Cost per Full Test Run (438 questions):\n');
console.log('Model'.padEnd(35) + ' | Input    | Output   | Total');
console.log('-'.repeat(80));

costs.forEach(c => {
  const current = c.id === "meta-llama/llama-3.1-8b-instruct" ? ' ✅' : '';
  console.log(
    c.name.padEnd(35) + ' | ' +
    `$${c.inputCost.toFixed(3)}`.padStart(8) + ' | ' +
    `$${c.outputCost.toFixed(3)}`.padStart(8) + ' | ' +
    `$${c.totalCost.toFixed(3)}`.padStart(8) +
    current
  );
});

console.log('-'.repeat(80));

// Calculate for 10 test runs (during optimization)
console.log('\n\n💰 Cost for 10 Full Test Runs (optimization phase):\n');
console.log('Model'.padEnd(35) + ' | Cost for 10 runs');
console.log('-'.repeat(80));

costs.forEach(c => {
  const current = c.id === "meta-llama/llama-3.1-8b-instruct" ? ' ✅' : '';
  const cost10 = c.totalCost * 10;
  console.log(
    c.name.padEnd(35) + ' | ' +
    `$${cost10.toFixed(2)}`.padStart(8) +
    current
  );
});

console.log('-'.repeat(80));

// Recommendations
console.log('\n\n🎯 Recommendations:\n');
console.log('1. **Current (Llama 3.1 8B)**: Very affordable, good for iterative testing');
console.log('2. **Llama 3.1 70B**: 6x more expensive but potentially better accuracy');
console.log('3. **GPT-4o**: 40x more expensive but best-in-class performance');
console.log('4. **GPT-4 Turbo**: 100x+ more expensive, likely overkill for routing');
console.log('\n💡 Suggestion: Start with current model (8B), test a few with 70B/GPT-4o if needed');

