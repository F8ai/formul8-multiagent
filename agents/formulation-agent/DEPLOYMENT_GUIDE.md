# Formulation Agent - Deployment Guide with RAG

## Prerequisites

1. **AWS Credentials** configured with S3 access
2. **Science-agent data** synced to S3 at `s3://formul8-platform-deployments/data/science/`
3. **OpenRouter API key** for AI model access

## Environment Variables

Required environment variables for deployment:

```bash
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
OPENROUTER_API_KEY=your-openrouter-key
```

## Pre-Deployment: Science Agent Data Setup

### 1. Check Science Agent Data

```bash
# Verify science-agent data exists in S3
aws s3 ls s3://formul8-platform-deployments/data/science/

# Expected output:
# index.json
# data/
```

### 2. Validate index.json Structure

The science-agent's `index.json` must have the following structure:

```json
{
  "papers": [
    {
      "id": "paper-id",
      "title": "Paper Title",
      "abstract": "Abstract text...",
      "keywords": ["keyword1", "keyword2"],
      "summary": "Optional summary"
    }
  ]
}
```

### 3. Upload Sample Data (if needed)

If science-agent data doesn't exist yet:

```bash
# Copy example structure
cp agents/science-agent/data/index.json.example /tmp/index.json

# Upload to S3
aws s3 cp /tmp/index.json s3://formul8-platform-deployments/data/science/index.json
```

## Deployment Options

### Option 1: Vercel Deployment (Recommended)

```bash
cd agents/formulation-agent

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
vercel env add AWS_ACCESS_KEY_ID
vercel env add AWS_SECRET_ACCESS_KEY
vercel env add AWS_REGION
vercel env add OPENROUTER_API_KEY
```

### Option 2: GitHub Actions (Automated)

The deployment is automated via GitHub Actions when changes are pushed:

1. **Push changes to main branch**:
   ```bash
   git add agents/formulation-agent/
   git commit -m "feat: Add RAG integration to formulation-agent"
   git push origin main
   ```

2. **GitHub Secrets** (must be configured):
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `OPENROUTER_API_KEY`
   - `VERCEL_TOKEN`

3. **Workflow monitors**:
   - `.github/workflows/deploy-formulation-agent.yml`

### Option 3: AWS Lambda Direct Deploy

```bash
cd agents/formulation-agent

# Install dependencies
npm install

# Package for Lambda
zip -r formulation-agent.zip . -x "*.git*" "node_modules/aws-sdk/*"

# Upload to Lambda
aws lambda update-function-code \
  --function-name formulation-agent \
  --zip-file fileb://formulation-agent.zip

# Update environment variables
aws lambda update-function-configuration \
  --function-name formulation-agent \
  --environment Variables="{
    AWS_REGION=us-east-1,
    OPENROUTER_API_KEY=your-key
  }"
```

## Post-Deployment Testing

### 1. Health Check

```bash
curl https://formulation-agent.f8.syzygyx.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "formulation-agent",
  "version": "1.1.0"
}
```

### 2. Test RAG Functionality

```bash
curl -X POST https://formulation-agent.f8.syzygyx.com/api/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "message": "What is the best extraction method for preserving terpenes?",
    "plan": "standard",
    "username": "test-user"
  }'
```

Expected response should include:
- `"rag": { "enabled": true, "papersRetrieved": 1-3, "source": "science-agent" }`
- Footer: `*... | RAG: X papers from science-agent*`

### 3. Verify S3 Access Logs

Check Lambda/Vercel logs for:
```
📚 Found 3 relevant research papers
📥 Loading from S3: index.json
💾 Cached index.json
```

## Troubleshooting

### Issue: No RAG papers retrieved

```
📚 Found 0 relevant research papers
```

**Solution**:
1. Verify science-agent data exists in S3
2. Check AWS credentials have S3 read permissions
3. Validate index.json structure

### Issue: S3 Access Denied

```
❌ Error loading index.json from S3: Access Denied
```

**Solution**:
1. Verify AWS credentials are correct
2. Check IAM policy includes `s3:GetObject` permission
3. Ensure bucket policy allows cross-agent access

### Issue: RAG not working

```
⚠️ Could not retrieve research data: [error]
```

**Solution**:
- Agent continues without RAG (graceful degradation)
- Check S3 connectivity
- Verify index.json is valid JSON

## Monitoring

### Key Metrics to Monitor

1. **RAG Success Rate**: % of requests with papers retrieved
2. **S3 Latency**: Time to retrieve from S3
3. **Cache Hit Rate**: % of cached vs S3 requests
4. **Error Rate**: Failed S3 retrievals

### CloudWatch Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/formulation-agent --follow

# Filter for RAG logs
aws logs filter-pattern "RAG" /aws/lambda/formulation-agent
```

### Vercel Logs

```bash
# View deployment logs
vercel logs formulation-agent.f8.syzygyx.com
```

## Rollback Procedure

If issues occur with RAG integration:

### Quick Rollback

```bash
# Revert to previous version without RAG
git revert HEAD
git push origin main
```

### Disable RAG

Edit `s3-config.json`:
```json
{
  "rag": {
    "enabled": false
  }
}
```

Then redeploy.

## Performance Optimization

### 1. Enable S3 Transfer Acceleration

```bash
aws s3api put-bucket-accelerate-configuration \
  --bucket formul8-platform-deployments \
  --accelerate-configuration Status=Enabled
```

### 2. Adjust Cache TTL

Edit `s3-config.json`:
```json
{
  "cache": {
    "enabled": true,
    "ttl": 7200000  // 2 hours instead of 1
  }
}
```

### 3. Use CloudFront for S3

- Set up CloudFront distribution for S3 bucket
- Update data-loader.js to use CloudFront URL

## Security Considerations

1. **S3 Bucket Policy**: Ensure least-privilege access
2. **API Key Validation**: Required for all chat endpoints
3. **Rate Limiting**: 30 requests/minute per IP
4. **Input Sanitization**: XSS and injection protection enabled

## Next Steps

1. **Vector Embeddings**: Upgrade from keyword matching to semantic search
2. **AstraDB Integration**: For larger datasets and better relevance
3. **Citation Tracking**: Include paper citations in responses
4. **Cross-Agent RAG**: Enable more agents to use science-agent data

## Support

For issues or questions:
- GitHub Issues: [formul8-multiagent/issues](https://github.com/your-org/formul8-multiagent/issues)
- Documentation: `agents/formulation-agent/RAG_IMPLEMENTATION.md`
- Architecture: `AGENT_DATA_S3_ARCHITECTURE.md`

