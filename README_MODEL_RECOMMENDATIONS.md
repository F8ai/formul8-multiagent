# Agent Model Recommendations

This system tests each agent with multiple AI models and recommends the best one based on the agent's specific needs.

## How It Works

Each agent has different priorities:

### 🎯 Accuracy-Focused Agents
- **compliance** - Regulatory accuracy is critical
- **formulation** - Scientific accuracy for recipes/dosing
- **science** - Highest scientific accuracy needed
- **patent** - Legal/patent accuracy required
- **spectra** - Scientific accuracy for analysis

**Recommended:** GPT-4o or Llama 405B

### ⚖️ Balanced Agents
- **operations** - Practical accuracy with cost/speed balance
- **marketing** - Creative responses with good accuracy
- **customer_success** - Helpful responses, quick turnaround
- **mcr** - Balanced needs
- **editor** - Balanced content editing

**Recommended:** Llama 70B or Qwen 32B (gpt-oss-120b)

### 💰 Cost-Focused Agents
- **sourcing** - Simpler queries, high volume
- **ad** - Very high volume (50k+ queries/month)
- **f8_slackbot** - High volume Slack interactions

**Recommended:** Qwen 32B (gpt-oss-120b) or Llama 70B

## Usage

### 1. Generate Recommendations

```bash
# Test all agents with multiple models
node test-agent-model-recommendations.js
```

This will:
- Test each agent with GPT-4o, Qwen 32B, Llama 405B, and Llama 70B
- Score responses based on accuracy, cost, and speed
- Apply agent-specific weights (e.g., compliance prioritizes accuracy)
- Generate recommendations and cost estimates

Output files:
- `AGENT_MODEL_RECOMMENDATIONS.md` - Full report
- `agent-model-recommendations-*.json` - Raw data

### 2. Review Recommendations

```bash
cat AGENT_MODEL_RECOMMENDATIONS.md
```

The report includes:
- Individual agent recommendations
- Performance scores for each model
- Monthly cost estimates
- Reasoning for each recommendation

### 3. Apply Recommendations (Optional)

```bash
# Update agent default models based on recommendations
node scripts/apply-model-recommendations.js agent-model-recommendations-*.json

# Review changes
git diff

# Commit if satisfied
git add -A
git commit -m "feat: Apply model recommendations to agents"
git push
```

### 4. Deploy Updated Agents

Deploy each agent to production with its new default model.

## Agent Priorities & Weights

Each agent uses weighted scoring:

```javascript
{
  accuracy: 0.0-1.0,  // Response quality/correctness
  cost: 0.0-1.0,      // Cost per query
  speed: 0.0-1.0      // Response time
}
```

Examples:
- **compliance**: `{accuracy: 0.6, cost: 0.2, speed: 0.2}` - Accuracy matters most
- **ad**: `{accuracy: 0.3, cost: 0.5, speed: 0.2}` - Cost matters most (high volume)
- **operations**: `{accuracy: 0.4, cost: 0.3, speed: 0.3}` - Balanced

## Models Tested

1. **GPT-4o** - `openai/gpt-4o`
   - Best accuracy and reasoning
   - Most expensive ($0.0025/$0.01 per 1k tokens)
   - Great for compliance, science, formulation

2. **Qwen 2.5 Coder 32B** - `openai/gpt-oss-120b`
   - Excellent cost/performance ratio
   - Very cheap ($0.0001/$0.0002 per 1k tokens)
   - Good for high-volume agents

3. **Llama 3.1 405B** - `meta-llama/llama-3.1-405b-instruct`
   - Strong reasoning and analysis
   - Moderate cost ($0.0005/$0.0015 per 1k tokens)
   - Good middle ground

4. **Llama 3.1 70B** - `meta-llama/llama-3.1-70b-instruct`
   - Good reasoning, faster
   - Low cost ($0.0002/$0.0006 per 1k tokens)
   - Great for balanced needs

## Automated Testing

GitHub Actions runs monthly recommendations:

```yaml
# .github/workflows/model-recommendations.yml
on:
  schedule:
    - cron: '0 2 1 * *'  # 1st of each month at 2 AM UTC
```

Creates an issue with recommendations for review.

## Cost Estimates

Example monthly costs with recommended models:

| Agent | Queries/Month | Model | Monthly Cost |
|-------|---------------|-------|--------------|
| compliance | 5,000 | GPT-4o | $125.00 |
| operations | 8,000 | Llama 70B | $9.60 |
| marketing | 3,000 | Llama 70B | $3.60 |
| formulation | 2,000 | GPT-4o | $50.00 |
| ad | 50,000 | Qwen 32B | $7.50 |
| **TOTAL** | | | **~$300/month** |

*Note: Actual costs vary based on query complexity and response length*

## Manual Override

Users can still override the model per request:

```javascript
// Use agent's recommended default
{ "message": "How do I extract CBD?" }

// Override to GPT-4o for this query
{ 
  "message": "How do I extract CBD?",
  "model": "openai/gpt-4o"
}
```

## Best Practices

1. **Run recommendations monthly** - Model performance improves over time
2. **Review before applying** - Understand why each model was recommended
3. **A/B test in production** - Compare old vs new model performance
4. **Monitor costs** - Track actual spend vs estimates
5. **Adjust weights** - Tune agent priorities based on user feedback

## Questions?

- Review the full report: `AGENT_MODEL_RECOMMENDATIONS.md`
- Check detailed results: `agent-model-recommendations-*.json`
- See current defaults: `grep "selectedModel" agents/*/lambda.js`
