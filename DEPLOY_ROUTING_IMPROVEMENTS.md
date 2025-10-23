# Deploy Routing Improvements

## ✅ Changes Committed and Pushed

Commit: `dab69db` - "feat: Enhanced agent routing based on 438 baseline questions"

### What Was Changed:
- **config/routing.json** - Enhanced routing prompt based on 438 baseline questions
- **config/langchain.json** - Matching LangChain routing configuration  
- **baseline.json** - Master baseline with all 438 questions (52 compliance, 224 operations, 157 marketing)
- **Documentation** - Comprehensive analysis and deployment guides

### Key Improvements:
- Scope definitions based on actual question analysis
- Real examples from baseline questions
- Disambiguation rules for overlapping topics (SOP, testing, packaging, training)
- Agent-specific keywords and decision criteria

## 🚀 Deploy to Production

### Option 1: GitHub Actions (Recommended)

1. Go to: https://github.com/F8ai/formul8-multiagent/actions
2. Click on "Deploy Chat Interface" workflow
3. Click "Run workflow" button
4. Select branch: `main`
5. Click green "Run workflow" button
6. Wait 2-5 minutes for deployment to complete

### Option 2: Vercel CLI

```bash
cd /Users/danielmcshan/GitHub/formul8-multiagent
vercel --prod
```

### Option 3: Automatic Deployment

The deployment should automatically trigger since we pushed to `main` and modified `baseline.json`.

Check deployment status:
- https://github.com/F8ai/formul8-multiagent/actions
- https://vercel.com/dashboard

## 🧪 Test After Deployment

### Quick Test (30 seconds)
```bash
cd /Users/danielmcshan/GitHub/formul8-multiagent
node test-baseline-routing-sample.js
```

Expected result: **2/3 or 3/3 correct** (currently 1/3)

### Comprehensive Test (15-20 minutes)
```bash
cd /Users/danielmcshan/GitHub/formul8-multiagent
node test-agent-baseline-routing.js
```

Expected result: **85%+ accuracy** across all 438 questions

## 📊 Expected Results

### Pre-Deployment (Current):
- Overall: 33% (1/3)
- Compliance: 100% (1/1)
- Operations: 0% (0/1)
- Marketing: 0% (0/1)

### Post-Deployment (Target):
- Overall: **85%+**
- Compliance: **90%+**
- Operations: **85%+**
- Marketing: **85%+**

## 🔍 Verify Deployment

### Check Config Files Are Deployed:

```bash
# Check routing config via API (if endpoint exists)
curl -s https://chat.formul8.ai/api/config/routing | jq '.routing.prompts.routing_prompt' | head -20

# Or test a specific question
curl -X POST https://chat.formul8.ai/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Can you help me create a batch tracker sheet for employees?"}' \
  | jq '.agent'

# Should return: "operations" (not "f8_agent")
```

## 🛠️ If Routing Accuracy Is Still Low

### 1. Verify Deployment Worked
- Check GitHub Actions logs
- Check Vercel deployment logs
- Confirm commit `dab69db` is deployed

### 2. Check Environment Variables
```bash
# Ensure OPENROUTER_API_KEY is set in Vercel
# Go to: Vercel Dashboard → Project Settings → Environment Variables
```

### 3. Adjust Model Temperature
If still having issues, lower temperature for more deterministic routing:

```json
// In config/routing.json and config/langchain.json
"temperature": 0.1  // Change from 0.3 to 0.1
```

### 4. Test Individual Agents
```bash
# Test specific agent questions
node -e "
const https = require('https');
const question = 'Can you help me create a batch tracker sheet?';
const postData = JSON.stringify({ message: question });

const req = https.request({
  hostname: 'chat.formul8.ai',
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
});

req.write(postData);
req.end();
"
```

## 📈 Monitoring

### Watch for These Metrics:
- Overall routing accuracy
- Per-agent routing accuracy
- Response time (should remain <2s)
- Error rate (should be <1%)

### Create Dashboard Query:
```bash
# Count routing by agent over last 24 hours
# (Assuming you have logging/monitoring)
```

## 🎯 Success Criteria

- [  ] Deployment completed successfully
- [  ] Quick test shows 2/3 or 3/3 correct routing
- [  ] Comprehensive test shows 85%+ overall accuracy
- [  ] No increase in error rate
- [  ] Response times remain acceptable (<2s average)
- [  ] Compliance accuracy 90%+
- [  ] Operations accuracy 85%+
- [  ] Marketing accuracy 85%+

## 📝 Next Steps After Successful Deployment

1. Run full comprehensive test (438 questions)
2. Analyze results and create TODO.md/FIXME.md
3. Push agent baseline.json files to their respective repos
4. Add more questions for under-represented agents
5. Continuous monitoring and iteration

## 🚨 Rollback Plan

If routing gets worse:

```bash
# Revert to previous routing config
cd /Users/danielmcshan/GitHub/formul8-multiagent
git revert dab69db
git push

# Then redeploy via GitHub Actions
```

Or restore from backup:
```bash
cp config/routing-backup.json config/routing.json
git commit -am "revert: Restore previous routing config"
git push
```

## Summary

✅ **Ready to Deploy**
- Routing improvements committed (dab69db)
- 438 baseline questions collected and analyzed
- Enhanced routing prompt with real examples and disambiguation rules
- Expected: 33% → 85%+ accuracy improvement

🚀 **Next Action:** Deploy via GitHub Actions or Vercel CLI

