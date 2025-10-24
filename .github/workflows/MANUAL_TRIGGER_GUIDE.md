# How to Manually Trigger Baseline Tests

## Quick Start

1. Go to [GitHub Actions](https://github.com/F8ai/formul8-multiagent/actions)
2. Click **"Baseline Testing"** workflow
3. Click **"Run workflow"** dropdown (top right)
4. Select branch: `main`
5. Choose test type:
   - **sample**: 3 questions (~10 sec, $0.02)
   - **comprehensive**: 438 questions (~10 min, $3.62)
6. Click green **"Run workflow"** button

## Visual Guide

```
GitHub → Actions → Baseline Testing → Run workflow ↓
                                          ↓
                                     [Branch: main]
                                     [Test type: sample ▼]
                                     [Run workflow]
```

## What Happens Next

1. **Job starts** (~30 seconds setup)
2. **Tests run** (depends on test type)
3. **Results uploaded** to artifacts
4. **Summary created** in job page

## Viewing Results

### Option 1: In-browser (fastest)
- Scroll to bottom of job page
- Read **Summary** section

### Option 2: Download artifacts
- Scroll to **Artifacts** section
- Click `baseline-results-{number}.zip`
- Download and extract

### Option 3: Raw logs
- Click **baseline-test** job
- Expand **Run baseline tests** step
- View console output

## Cost Control

**Sample tests (default)**:
- 3 questions
- ~$0.02 per run
- Use for quick checks

**Comprehensive tests**:
- 438 questions
- ~$3.62 per run
- Use before major deployments

## When to Run

✅ **Run sample tests**:
- After prompt changes
- After routing logic changes
- Quick sanity checks
- Daily (automated)

✅ **Run comprehensive tests**:
- Before production deploy
- After major refactoring
- Monthly full validation
- Measuring improvements

## Troubleshooting

**"API key not found"**:
- Check GitHub Secrets has `OPENROUTER_API_KEY`
- May need to rotate key

**"Tests fail immediately"**:
- Check if dependencies install correctly
- Review job logs for errors

**"Low accuracy results"**:
- Review `config/routing.json`
- Check model availability
- Verify prompt quality

## API Key Rotation

If API key expires:

1. Get new key from [OpenRouter](https://openrouter.ai/keys)
2. Go to repo **Settings** → **Secrets** → **Actions**
3. Update `OPENROUTER_API_KEY`
4. Re-run failed workflow

## Contact

For issues with the workflow, check:
- [Workflow file](.github/workflows/baseline-test.yml)
- [Test scripts](../../test-baseline-routing-sample.js)
- [Routing config](../../config/routing.json)
