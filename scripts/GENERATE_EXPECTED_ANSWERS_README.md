# Generate Expected Answers Per Agent

This script generates high-quality expected answers for all 438 baseline questions by:

1. **Querying each agent directly** with their RAG/KB to get real responses
2. **Using GPT-5 (gpt-4o)** to analyze those responses and create evaluation criteria
3. **Saving both** the expected answer AND evaluation criteria to baseline

## 🚨 Prerequisites

### 1. Fix OpenRouter Billing (CRITICAL)

**Current Status:** `chat.formul8.ai` is returning `402 Payment Required`

**To Fix:**
1. Go to https://openrouter.ai/settings/billing
2. Add credits OR update payment method
3. Verify the API is working:
   ```bash
   curl -X POST https://chat.formul8.ai/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"test"}'
   ```
   Should return a real response, not an error

### 2. Set Environment Variable

```bash
export OPENROUTER_API_KEY="your-key-here"
```

## 🚀 Usage

### Test Run (3 questions)

```bash
# Test with first 3 questions to verify everything works
node scripts/generate-expected-answers-per-agent.js | head -100
```

Then check `baseline-with-expected-answers.json` to see the results.

### Full Run (All 438 questions)

```bash
# Run all questions (will take ~30-45 minutes)
node scripts/generate-expected-answers-per-agent.js
```

**Time Estimate:**
- ~438 questions
- ~3-4 seconds per question (agent query + GPT-5 analysis)
- ~30-45 minutes total
- Progress is saved after each question (resumable)

### Resume After Interruption

The script automatically resumes from where it left off if interrupted:

```bash
# If interrupted, just run again - it will continue from last saved progress
node scripts/generate-expected-answers-per-agent.js
```

## 📊 Output

Creates `baseline-with-expected-answers.json` with:

```json
{
  "questions": [
    {
      "question": "Can you make me a compliant SOP for Cannabis Transport?",
      "category": "sop-generation-compliance-documentation",
      "expectedAnswer": "[Full response from compliance_agent using their RAG/KB]",
      "expectedAgent": "compliance_agent",
      "evaluationCriteria": {
        "expectedKeywords": ["SOP", "compliance", "transport", "cannabis"],
        "mustIncludeConcepts": ["regulatory requirements", "documentation"],
        "qualityIndicators": ["specific regulations", "step-by-step"],
        "minLength": 500,
        "expectedDepth": "advanced",
        "keyPoints": ["licensing", "tracking", "security"]
      },
      "metadata": {
        "generatedAt": "2025-10-28T...",
        "actualAgent": "compliance_agent",
        "generatedBy": "gpt-4o"
      }
    }
  ]
}
```

## 🔄 Next Steps After Generation

1. **Review Results:**
   ```bash
   jq '.questions[0] | {question, expectedAnswer: .expectedAnswer[0:100], criteria: .evaluationCriteria}' baseline-with-expected-answers.json
   ```

2. **Replace baseline.json:**
   ```bash
   cp baseline.json baseline-backup.json
   cp baseline-with-expected-answers.json baseline.json
   ```

3. **Update Test Script:**
   The test script (`tests/test-baseline-e2e.spec.js`) will automatically use the new `expectedAnswer` and `evaluationCriteria` fields.

4. **Run Baseline Tests:**
   ```bash
   TEST_SAMPLE=10 npx playwright test tests/test-baseline-e2e.spec.js --project=chromium
   ```

## ⚙️ Configuration

Edit the script to adjust:

```javascript
const BATCH_SIZE = 5;        // Questions per batch
const DELAY_MS = 3000;       // Delay between batches (ms)
const AGENT_TIMEOUT = 90000; // Agent response timeout (90s)
```

## 📈 Features

- ✅ **Per-Agent Routing** - Each question goes to the correct specialized agent
- ✅ **Real RAG/KB Responses** - Uses actual agent knowledge, not synthetic data
- ✅ **GPT-5 Analysis** - Extracts evaluation criteria from real responses
- ✅ **Progress Saving** - Saves after each question, resumable if interrupted
- ✅ **Error Handling** - Gracefully handles agent failures
- ✅ **Batch Processing** - Avoids overwhelming agents or hitting rate limits

## 🛟 Troubleshooting

### "402 Payment Required"
Fix OpenRouter billing (see Prerequisites above)

### "Agent request timeout"
Increase `AGENT_TIMEOUT` in the script (RAG queries can be slow)

### Script Crashes Mid-Run
Just run it again - it will resume from the last saved question

### Want to Start Over
```bash
rm baseline-with-expected-answers.json
node scripts/generate-expected-answers-per-agent.js
```

## 💰 Cost Estimate

- **Agent queries:** Free (your own infrastructure)
- **GPT-5 analysis:** ~$0.005 per question
- **Total for 438 questions:** ~$2.19

Using `gpt-4o` (GPT-5) for high-quality criteria generation.

