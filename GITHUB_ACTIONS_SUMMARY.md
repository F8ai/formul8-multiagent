# GitHub Actions - Baseline Testing Setup ✅

## Summary

Automated baseline testing is now configured and ready to use!

### What Was Set Up

1. **Automated Testing Workflow** (`.github/workflows/baseline-test.yml`)
   - Runs on routing config changes
   - Daily scheduled tests (2 AM UTC)
   - Manual trigger available
   - Uploads results as artifacts
   - Auto-comments on commits

2. **Documentation**
   - Workflow README (`.github/workflows/README.md`)
   - Manual trigger guide (`.github/workflows/MANUAL_TRIGGER_GUIDE.md`)
   - This summary

3. **API Key** 
   - Already configured in GitHub Secrets: `OPENROUTER_API_KEY`
   - Rotated regularly by team

## Quick Links

- **Run Tests**: [GitHub Actions](https://github.com/F8ai/formul8-multiagent/actions/workflows/baseline-test.yml) → "Run workflow"
- **View Results**: Check workflow runs for artifacts and summaries
- **Documentation**: `.github/workflows/README.md`

## How to Use

### Automatic Runs

Tests run automatically when you:
- Push changes to routing configs (`config/routing.json`, etc.)
- Wait for daily scheduled run (2 AM UTC)

### Manual Runs

1. Go to [Actions tab](https://github.com/F8ai/formul8-multiagent/actions)
2. Select "Baseline Testing" workflow
3. Click "Run workflow"
4. Choose test type:
   - `sample`: 3 questions (~10 sec, $0.02)
   - `comprehensive`: 438 questions (~10 min, $3.62)
5. Click "Run workflow"

### View Results

**In-browser**:
- Job page → Scroll to bottom → Read summary

**Download**:
- Job page → Artifacts section → Download zip

**Commit comments**:
- Automated comments on routing changes

## What Gets Tested

**Sample Test** (default):
```
[1/3] compliance
    Q: "Can you make me a compliant SOP for Cannabis Transport..."
    ✅ Got: compliance | Expected: compliance

[2/3] operations
    Q: "Can you help me create a batch tracker sheet..."
    ❌ Got: f8_agent | Expected: operations

[3/3] marketing
    Q: "What makes our cannabis brand stand out..."
    ✅ Got: marketing | Expected: marketing

📊 Result: 2/3 questions routed correctly (67%)
```

**Comprehensive Test**:
- All 438 questions from `baseline.json`
- Detailed accuracy metrics by agent
- Grade report with actionable insights

## Cost Management

| Frequency | Test Type | Cost/Run | Monthly Cost |
|-----------|-----------|----------|--------------|
| Daily (auto) | Sample | $0.02 | ~$0.60 |
| Weekly (manual) | Comprehensive | $3.62 | ~$14.48 |
| On-demand | Sample | $0.02 | Variable |

**Total estimated**: ~$15-20/month with regular usage

## Success Metrics

**Current Baseline**: TBD (run first test to establish)

**Target**: 85%+ routing accuracy

**Thresholds**:
- ✅ **85-100%**: Production ready
- ⚠️ **70-84%**: Acceptable, monitor
- ❌ **<70%**: Needs fixes

## Next Steps

1. **Run first manual test** to establish baseline
   - Go to Actions → Baseline Testing → Run workflow
   - Use "comprehensive" for complete baseline
   
2. **Review results**
   - Check routing accuracy
   - Identify problem areas
   - Note any API issues

3. **Monitor automatic runs**
   - Daily sample tests will track changes
   - Check for regressions
   - Review commit comments

4. **Iterate improvements**
   - Adjust prompts based on failures
   - Re-run comprehensive tests after changes
   - Track improvement over time

## Files Created

```
.github/
└── workflows/
    ├── baseline-test.yml                    # Main workflow
    ├── README.md                            # Workflow documentation
    └── MANUAL_TRIGGER_GUIDE.md             # Step-by-step guide

GITHUB_ACTIONS_SUMMARY.md                   # This file
ROUTING_IMPROVEMENTS_COMPLETE.md            # Technical analysis
```

## Troubleshooting

**"Workflow not showing up"**:
- Refresh Actions page
- Check if branch is `main`
- Verify workflow file is committed

**"API key error"**:
- Check GitHub Secrets has `OPENROUTER_API_KEY`
- Verify key is valid on OpenRouter
- Rotate key if expired

**"Tests always fail"**:
- Check if OpenRouter API is accessible
- Verify test scripts are present
- Review job logs for details

**"Low accuracy"**:
- Review `config/routing.json` prompt
- Check model availability (Llama 405B)
- Ensure LangChain service is properly integrated

## Support

- **Workflow issues**: Check `.github/workflows/baseline-test.yml`
- **Test failures**: Review job logs in Actions tab
- **Routing issues**: See `ROUTING_IMPROVEMENTS_COMPLETE.md`
- **Configuration**: Check `config/routing.json` and `config/langchain.json`

---

**Status**: ✅ Fully configured and ready to use
**Next Action**: Run first comprehensive test to establish baseline
**Documentation**: Complete
**API Key**: Configured in GitHub Secrets

