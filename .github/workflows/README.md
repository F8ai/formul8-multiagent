# GitHub Actions Workflows

## Baseline Testing (`baseline-test.yml`)

Automatically tests the routing accuracy of the multi-agent system.

### When it runs:

1. **On Push** - When routing configuration files are modified:
   - `config/routing.json`
   - `config/langchain.json`
   - `services/langchain-service.js`
   - `lambda.js`

2. **On Schedule** - Daily at 2 AM UTC

3. **Manual Trigger** - Via GitHub Actions UI
   - Options: `sample` (3 questions) or `comprehensive` (438 questions)

### What it does:

- ✅ Installs dependencies
- ✅ Runs baseline routing tests
- ✅ Uploads results as artifacts (30-day retention)
- ✅ Comments on commits with test results (routing changes only)
- ✅ Creates job summary with key metrics

### Required Secrets:

- `OPENROUTER_API_KEY` - API key for OpenRouter (already configured)

### Manual Trigger:

1. Go to **Actions** tab in GitHub
2. Select **Baseline Testing** workflow
3. Click **Run workflow**
4. Choose test type:
   - **sample**: Fast (3 questions, ~10 seconds)
   - **comprehensive**: Complete (438 questions, ~5-10 minutes)
5. Click **Run workflow**

### Viewing Results:

**Option 1: Job Summary**
- Click on the workflow run
- View the summary at the bottom of the page

**Option 2: Artifacts**
- Click on the workflow run
- Scroll to **Artifacts** section
- Download `baseline-results-{run-number}.zip`

**Option 3: Commit Comments** (routing changes only)
- View commit in GitHub
- See automated comment with test results

### Test Files:

- **Sample**: `test-baseline-routing-sample.js` (3 questions)
- **Comprehensive**: `test-chat-formul8-comprehensive.js` (438 questions)

### Cost Estimation:

| Test Type | Questions | Model | Est. Cost |
|-----------|-----------|-------|-----------|
| Sample | 3 | Llama 405B | $0.02 |
| Comprehensive | 438 | Llama 405B | $3.62 |

**Daily automatic runs** use sample tests to minimize costs (~$0.60/month).

### Interpreting Results:

```
📊 Result: 85/100 questions routed correctly (85%)
```

**Target:** 85%+ accuracy
- ✅ **85-100%**: Excellent
- ⚠️ **70-84%**: Good, minor improvements needed
- ❌ **<70%**: Needs attention

### Common Issues:

1. **API Key Invalid** - Rotate `OPENROUTER_API_KEY` in GitHub Secrets
2. **Tests Failing** - Check if API endpoint is accessible
3. **Low Accuracy** - Review routing prompt in `config/routing.json`

### Debugging:

View detailed logs:
1. Click on workflow run
2. Click on **baseline-test** job
3. Expand **Run baseline tests** step
4. Review console output

### Related Files:

- Workflow: `.github/workflows/baseline-test.yml`
- Config: `config/routing.json`, `config/langchain.json`
- Service: `services/langchain-service.js`
- Tests: `test-baseline-routing-sample.js`, `test-chat-formul8-comprehensive.js`
- Baseline: `baseline.json` (438 questions)
