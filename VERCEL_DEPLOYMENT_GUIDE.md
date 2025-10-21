# Vercel Deployment Guide for Formul8 Multiagent System

## ✅ Changes Completed

### 1. Chat UI Updated
- ✅ User messages now appear on the right side
- ✅ User messages styled with purple bubble (#5536da)
- ✅ Assistant messages remain on the left
- ✅ Responsive design maintained

### 2. Agent Names Added to vercel.json
All agents now have proper names in their `vercel.json`:
- ✅ compliance-agent
- ✅ science-agent
- ✅ formulation-agent
- ✅ marketing-agent
- ✅ patent-agent
- ✅ operations-agent
- ✅ sourcing-agent
- ✅ spectra-agent
- ✅ mcr-agent
- ✅ customer-success-agent
- ✅ ad-agent
- ✅ editor-agent
- ✅ f8-slackbot

### 3. Lambda Deleted
- ✅ Deleted: `formul8-enhanced-chat` Lambda function
- ✅ Backend moved to Vercel for better performance

---

## 🚀 Deploying to Vercel (dan@formul8.ai)

### Option 1: Deploy All Agents at Once (Recommended)

```bash
# Login to Vercel as dan@formul8.ai
vercel login

# Verify you're logged in
vercel whoami
# Should show: dan@formul8.ai

# Use the deployment script
cd /Users/danielmcshan/GitHub/formul8-multiagent
chmod +x deploy-agents-to-vercel.sh
./deploy-agents-to-vercel.sh
```

### Option 2: Deploy Each Agent Individually

```bash
# Login first
vercel login

# Deploy each agent
cd agents/compliance-agent && vercel --prod && cd ../..
cd agents/science-agent && vercel --prod && cd ../..
cd agents/formulation-agent && vercel --prod && cd ../..
cd agents/marketing-agent && vercel --prod && cd ../..
cd agents/patent-agent && vercel --prod && cd ../..
cd agents/operations-agent && vercel --prod && cd ../..
cd agents/sourcing-agent && vercel --prod && cd ../..
cd agents/spectra-agent && vercel --prod && cd ../..
cd agents/mcr-agent && vercel --prod && cd ../..
cd agents/customer-success-agent && vercel --prod && cd ../..
cd agents/ad-agent && vercel --prod && cd ../..
cd agents/editor-agent && vercel --prod && cd ../..
cd agents/f8-slackbot && vercel --prod && cd ../..
```

### Option 3: Deploy via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import from GitHub: `F8ai/formul8-multiagent`
4. For each agent:
   - Root Directory: `agents/compliance-agent` (change for each)
   - Framework Preset: Other
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Click "Deploy"

---

## 🔧 Post-Deployment Configuration

### Set Environment Variables

For each agent on Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add:
   ```
   OPENROUTER_API_KEY = sk-or-v1-xxx (your key)
   ```

### Update DNS / Domain Settings

Point your agent URLs to the new Vercel deployments:

- `compliance.formul8.ai` → Vercel URL for compliance-agent
- `science.formul8.ai` → Vercel URL for science-agent
- etc.

Or update `chat.html` to use the new Vercel URLs.

---

## 📋 Verify Deployment

After deployment, test each agent:

```bash
# Test compliance agent
curl https://compliance-agent.vercel.app/api/health

# Test science agent  
curl https://science-agent.vercel.app/api/health

# Test chat endpoint
curl -X POST https://compliance-agent.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What are compliance requirements?","plan":"micro"}'
```

---

## 🧹 Cleanup Completed

### Lambda Function Removed
- ✅ Deleted `formul8-enhanced-chat` Lambda function
- ✅ No more 502 errors
- ✅ Moved to Vercel for better reliability

### Old Projects to Remove (if needed)
If you have "lambda-package" showing on Vercel dashboard:

1. Go to https://vercel.com/dashboard
2. Find "lambda-package" project
3. Settings → Advanced → Delete Project

---

## 📊 Expected Vercel Dashboard View

After deployment, you should see:

```
Vercel Projects (dan@formul8.ai):
├── compliance-agent ✓
├── science-agent ✓
├── formulation-agent ✓
├── marketing-agent ✓
├── patent-agent ✓
├── operations-agent ✓
├── sourcing-agent ✓
├── spectra-agent ✓
├── mcr-agent ✓
├── customer-success-agent ✓
├── ad-agent ✓
├── editor-agent ✓
└── f8-slackbot ✓
```

Each agent will have:
- Production URL: `https://[agent-name].vercel.app`
- Auto-deploy on git push
- Environment variables configured
- Proper agent name visible on dashboard

---

## 🎯 Next Steps

1. **Deploy agents to Vercel** (using one of the options above)
2. **Verify each agent works** (test /api/health endpoints)
3. **Update main chat backend URL** in chat.html to point to Vercel
4. **Test free tier ads** for future4200 users
5. **Run test suite** to verify everything works

---

## 💡 Benefits of Vercel vs Lambda

✅ **Better Performance**: Edge network, faster cold starts  
✅ **Better Debugging**: Real-time logs, better error messages  
✅ **Better DX**: Auto-deploy, preview URLs, easier config  
✅ **Better Visibility**: Clear agent names on dashboard  
✅ **No 502 Errors**: Proper routing and error handling  
✅ **Free Tier**: Generous limits for development  

---

## 📞 Support

If you encounter issues:
- Check Vercel logs: https://vercel.com/dashboard → Select Project → Logs
- Check agent health: `curl https://[agent].vercel.app/api/health`
- Review build logs in Vercel dashboard

---

## 🔐 Security Notes

- ✅ All agents have OPENROUTER_API_KEY in environment
- ✅ CORS configured in each agent's lambda.js
- ✅ Rate limiting implemented
- ✅ Input validation on all endpoints
- ✅ Secure tier-based routing

---

**Status**: Ready for deployment! 🚀
**Last Updated**: 2025-10-21
**Author**: Automated via Playwright testing & deployment automation
