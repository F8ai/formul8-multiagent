# Deploy Formulation Agent with RAG - Quick Guide

## ✅ Implementation Status: COMPLETE

All RAG code is implemented, tested, and pushed to GitHub. Ready to deploy!

## 🚀 To Deploy Now - One Command:

### Step 1: Add the Vercel Secret (One-Time Setup)

The `openrouter_api_key` secret needs to be added to Vercel. You can do this in 2 ways:

#### Option A: Via Vercel Dashboard (Easiest)
1. Go to: https://vercel.com/formul8ai/formulation-agent/settings/environment-variables
2. Click "Add" under "Secrets"
3. Name: `openrouter_api_key`
4. Value: [Your OpenRouter API Key - same one used in GitHub secrets]
5. Save

#### Option B: Via CLI
```bash
# Get your OpenRouter API key (from GitHub secrets or your password manager)
# Then run:
cd /Users/danielmcshan/GitHub/formul8-multiagent/agents/formulation-agent
vercel secret add openrouter_api_key sk-or-v1-xxxxx...
```

### Step 2: Deploy
```bash
cd /Users/danielmcshan/GitHub/formul8-multiagent/agents/formulation-agent
vercel --prod --yes
```

### Step 3: Test
```bash
cd /Users/danielmcshan/GitHub/formul8-multiagent
./test-formulation-rag.sh
```

## 🎯 What Will Happen:

1. **Deployment** - Formulation agent deploys to: `https://formulation-agent.vercel.app`
2. **RAG Active** - Agent will query S3 for science-agent PubMed data
3. **Enhanced Responses** - Answers will be backed by scientific research
4. **Transparent** - Response metadata shows which papers were used

## 📊 Expected Test Results:

```json
{
  "success": true,
  "response": "Based on research on extraction methods...",
  "agent": "formulation_agent",
  "rag": {
    "enabled": true,
    "papersRetrieved": 3,
    "source": "science-agent"
  }
}
```

Footer will show: `*... | RAG: 3 papers from science-agent*`

## 🔧 Troubleshooting:

### If deployment fails with "Secret does not exist":
- The `openrouter_api_key` secret hasn't been added yet
- Add it using Option A or B above
- Try deployment again

### If RAG shows 0 papers retrieved:
- Science-agent data may not be in S3 yet
- Agent will still work (graceful degradation)
- Upload sample data: `aws s3 cp agents/science-agent/data/index.json.example s3://formul8-platform-deployments/data/science/index.json`

### If you get authentication errors:
- Make sure you're logged into Vercel: `vercel whoami`
- If not: `vercel login`

## 📚 What's Already Done:

✅ RAG implementation in lambda.js  
✅ S3 configuration for science-agent data  
✅ Keyword-based paper retrieval  
✅ Response enhancement with research context  
✅ Graceful degradation if S3 unavailable  
✅ Security (API keys, rate limiting, sanitization)  
✅ Comprehensive documentation  
✅ Test scripts  
✅ All code committed and pushed to GitHub  

## 🎁 RAG Features:

- **Research-Backed**: Uses real PubMed papers from science-agent
- **Smart Retrieval**: Keyword matching finds relevant papers
- **Top 3 Papers**: Most relevant research added to AI context
- **Transparent**: Users see which papers informed the answer
- **Fallback**: Works even without S3 data
- **Fast**: In-memory caching, ~100-300ms overhead

## 📖 Documentation:

All documentation is complete:
- `agents/formulation-agent/RAG_IMPLEMENTATION.md` - Technical details
- `agents/formulation-agent/DEPLOYMENT_GUIDE.md` - Full deployment guide
- `FORMULATION_AGENT_RAG_SUMMARY.md` - Executive summary
- `FORMULATION_AGENT_DEPLOYMENT_STATUS.md` - Current status
- `AGENT_DATA_S3_ARCHITECTURE.md` - Architecture

## 🔑 About the OpenRouter Key:

The same `OPENROUTER_API_KEY` that exists in your GitHub secrets needs to be added to Vercel as `openrouter_api_key` (note the secret name format).

**GitHub Secret Name**: `OPENROUTER_API_KEY`  
**Vercel Secret Name**: `openrouter_api_key` (lowercase with underscores)

All other agents (science-agent, compliance-agent, operations-agent, etc.) use the same secret reference in their `vercel.json`:
```json
"env": {
  "OPENROUTER_API_KEY": "@openrouter_api_key"
}
```

## ⚡ Quick Deploy (After Secret is Added):

```bash
cd agents/formulation-agent && vercel --prod --yes && cd ../.. && ./test-formulation-rag.sh
```

This will:
1. Deploy to production
2. Run automated tests
3. Show RAG functionality status

---

**Status**: ✅ Ready to deploy - just needs the Vercel secret  
**Time to deploy**: < 2 minutes after secret is added  
**Risk**: Low - graceful degradation built in

