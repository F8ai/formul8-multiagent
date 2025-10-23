# Agent Data S3 Architecture

## Overview

All Formul8 agents with data directories sync to S3 for serverless access. Agents use AWS SDK to load data on-demand with in-memory caching.

## S3 Structure

```
s3://formul8-platform-deployments/data/
├── index.json                          ← Master index
├── compliance-agent/
│   ├── index.json
│   ├── regulations/
│   │   ├── CA/ CO/ NY/ FL/ ...        (3.3GB)
│   ├── compliance_resources/
│   ├── corpus/
│   └── baselines/
├── sourcing-agent/
│   ├── index.json
│   └── [supplier data]                 (12GB)
├── metabolomics-agent/
│   ├── index.json
│   └── [metabolite databases]          (1.3GB)
├── future-agent/
│   ├── index.json
│   └── [trend data]                    (410MB)
├── patent-agent/
│   ├── index.json
│   └── [patent records]                (4.2MB)
├── science-agent/
│   ├── index.json
│   └── [research papers]               (324KB)
├── mcr-agent/
│   ├── index.json
│   └── [documentation]                 (228KB)
├── formulation-agent/
│   ├── index.json
│   └── datasets/ models/ embeddings/   (4KB structure)
└── operations-agent/
    ├── index.json
    └── [facility templates]            (4KB)
```

## Agent Data Summary

| Agent | Size | Contents | Priority | RAG Usage |
|-------|------|----------|----------|-----------|
| **sourcing-agent** | 12GB | Supplier databases, pricing, availability | High | - |
| **compliance-agent** | 3.3GB | State regulations (30 jurisdictions) | ✅ Synced | - |
| **metabolomics-agent** | 1.3GB | Metabolite profiles, spectra | High | - |
| **future-agent** | 410MB | Market trends, forecasts | Medium | - |
| **patent-agent** | 4.2MB | Patent records, IP research | Medium | - |
| **science-agent** | 324KB | Research papers, studies | ✅ Synced | ⭐ RAG Source |
| **mcr-agent** | 228KB | Documentation, templates | Low | - |
| **formulation-agent** | 4KB | Directory structure (empty) | Low | ✅ Uses science-agent RAG |
| **operations-agent** | 4KB | Templates (minimal) | Low | - |

## Data Loading Pattern

Each agent implements the same S3 data loading pattern:

### 1. S3 Config (`s3-config.json`)

```json
{
  "s3": {
    "bucketName": "formul8-platform-deployments",
    "prefix": "data/compliance-agent",
    "region": "us-east-1"
  },
  "cache": {
    "enabled": true,
    "ttl": 3600
  }
}
```

### 2. Data Loader (`data-loader.js`)

```javascript
const AWS = require('aws-sdk');
const s3Config = require('./s3-config.json');

const s3 = new AWS.S3({ region: s3Config.s3.region });
const cache = {};

async function getData(key) {
  // Check cache
  if (cache[key]) {
    return cache[key];
  }

  // Load from S3
  const params = {
    Bucket: s3Config.s3.bucketName,
    Key: `${s3Config.s3.prefix}/${key}`,
  };
  
  const data = await s3.getObject(params).promise();
  const parsed = JSON.parse(data.Body.toString('utf-8'));
  
  // Cache it
  cache[key] = parsed;
  return parsed;
}

module.exports = { getData };
```

### 3. Agent Integration (`lambda.js`)

```javascript
const dataLoader = require('./data-loader');

// In chat handler
const context = await dataLoader.getData('relevant-data-key');
const enrichedPrompt = `${systemPrompt}\n\nContext: ${JSON.stringify(context)}`;
```

## Sync Process

### Automated Sync (Recommended)

```bash
cd /Users/danielmcshan/GitHub/formul8-multiagent
./scripts/sync-all-agent-data-to-s3.sh
```

This will:
1. ✅ Find all agent data directories
2. ✅ Check size and validate
3. ✅ Sync to S3 with intelligent tiering
4. ✅ Create index.json for each agent
5. ✅ Generate master index
6. ✅ Exclude temp files (.pyc, node_modules, etc.)

### Manual Sync (Per Agent)

```bash
# Sync specific agent
aws s3 sync /Users/danielmcshan/GitHub/compliance-agent/data \
  s3://formul8-platform-deployments/data/compliance-agent/ \
  --storage-class INTELLIGENT_TIERING
```

### Monitor Sync Progress

```bash
# Watch sync log
tail -f /tmp/agent-data-sync.log

# Check S3 status
aws s3 ls s3://formul8-platform-deployments/data/ --recursive --summarize

# Check master index
aws s3 cp s3://formul8-platform-deployments/data/index.json - | jq .
```

## Environment Variables

All agents with S3 data access need:

```bash
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
```

These are set via:
- **Vercel**: GitHub Actions workflow passes from secrets
- **Local**: `.env` file or environment

## Access Patterns

### Pattern 1: State/Jurisdiction Lookup (compliance-agent)

```javascript
const stateCode = detectStateFromMessage(message); // "CA"
const regulations = await dataLoader.getData(`regulations/${stateCode}/index.json`);
```

### Pattern 2: Entity Search (patent-agent)

```javascript
const patentId = extractPatentId(message); // "US10123456"
const patentData = await dataLoader.getData(`patents/${patentId}.json`);
```

### Pattern 3: Full Dataset (small agents)

```javascript
// For small datasets, load entire index
const allData = await dataLoader.getData('index.json');
const filtered = allData.filter(item => item.relevantTo(message));
```

### Pattern 4: Vector Search (future enhancement)

```javascript
// For large datasets, use AstraDB
const results = await astraDb.search({
  collection: 'regulations',
  query: message,
  limit: 5
});
```

### Pattern 5: RAG (Retrieval Augmented Generation) - Cross-Agent Data Access

**NEW**: Agents can now access data from other agents for RAG!

#### Example: formulation-agent uses science-agent data

```javascript
// formulation-agent/lambda.js
async function retrieveRelevantResearch(query) {
  const AWS = require('aws-sdk');
  const s3 = new AWS.S3({ region: 'us-east-1' });
  
  // Access science-agent's data
  const params = {
    Bucket: 'formul8-platform-deployments',
    Key: 'data/science/index.json'  // Cross-agent access!
  };
  
  const data = await s3.getObject(params).promise();
  const scienceIndex = JSON.parse(data.Body.toString('utf-8'));
  
  // Filter relevant papers
  const keywords = query.toLowerCase().split(' ').filter(w => w.length > 3);
  const relevantPapers = scienceIndex.papers?.filter(paper => {
    const paperText = `${paper.title} ${paper.abstract || ''}`.toLowerCase();
    return keywords.some(keyword => paperText.includes(keyword));
  }).slice(0, 3);
  
  return relevantPapers;
}

// In chat endpoint
const relevantResearch = await retrieveRelevantResearch(message);
const researchContext = relevantResearch.map(paper => 
  `${paper.title}\n${paper.abstract}`
).join('\n\n');

// Add to system prompt
const systemPrompt = `${basePrompt}\n\nRelevant research:\n${researchContext}`;
```

#### Benefits of RAG

1. **Enhanced Responses**: AI has access to real scientific data
2. **Transparency**: Users see which papers informed the response
3. **Cross-Agent Synergy**: Agents leverage each other's data
4. **Cost Effective**: No vector database needed for small datasets

#### Current RAG Implementations

| Agent | Uses RAG From | Status |
|-------|---------------|--------|
| **formulation-agent** | science-agent (PubMed papers) | ✅ Active |
| **operations-agent** | compliance-agent (regulations) | 🔄 Planned |
| **marketing-agent** | future-agent (trends) | 🔄 Planned |

## Storage Costs

AWS S3 Intelligent Tiering pricing (us-east-1):

| Tier | Price | Usage |
|------|-------|-------|
| Frequent Access | $0.023/GB/month | Recently accessed |
| Infrequent Access | $0.0125/GB/month | Not accessed 30+ days |
| Archive | $0.004/GB/month | Not accessed 90+ days |

**Estimated monthly cost** (total ~18GB):
- Frequent (5GB): $0.115
- Infrequent (10GB): $0.125
- Archive (3GB): $0.012
- **Total**: ~$0.25/month + transfer

Very affordable for production use!

## Performance

### Cold Start (first request)
- S3 GET request: ~50-200ms
- Parse JSON: ~10-100ms (depends on size)
- **Total**: ~60-300ms additional latency

### Warm Cache (subsequent requests)
- Memory lookup: <1ms
- **Total**: No additional latency

### Optimization Strategies

1. **Pre-warm cache** - Load common data at startup
2. **Compress JSON** - Use gzip for large files
3. **Use AstraDB** - For vector/semantic search
4. **Edge caching** - CloudFront for static resources
5. **Lazy loading** - Only load what's needed

## Security

### Access Control

1. ✅ S3 bucket is **private** (no public access)
2. ✅ Access via **IAM credentials** only
3. ✅ Credentials stored in **GitHub Secrets**
4. ✅ Passed to Vercel at **deploy time**
5. ✅ Never committed to git

### Data Privacy

- PII removed from all datasets
- Compliance data is public regulations
- No user data stored in S3
- Logs don't expose credentials

## Benefits

| Traditional (Local Files) | S3 Architecture |
|---------------------------|-----------------|
| ❌ Can't deploy to Vercel | ✅ Works on serverless |
| ❌ Git bloat (3GB+) | ✅ Git stays small |
| ❌ Deploy takes forever | ✅ Fast deploys |
| ❌ Limited by function size | ✅ Unlimited data |
| ❌ No version history | ✅ S3 versioning available |
| ❌ One copy per deployment | ✅ Shared across instances |

## Migration Checklist

For each agent with data:

- [ ] Create `s3-config.json`
- [ ] Create `data-loader.js`
- [ ] Update `lambda.js` to use loader
- [ ] Add `aws-sdk` to `package.json`
- [ ] Sync data to S3
- [ ] Test with sample queries
- [ ] Update deployment workflow
- [ ] Document data structure

## Monitoring

### Check Agent Data Access

```bash
# Test compliance agent
curl -X POST https://compliance-agent.f8.syzygyx.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are California licensing requirements?",
    "api_key": "sk-or-...",
    "plan": "free"
  }'

# Check logs
vercel logs compliance-agent --follow
```

### S3 Metrics

```bash
# List all agent data
aws s3 ls s3://formul8-platform-deployments/data/

# Check specific agent
aws s3 ls s3://formul8-platform-deployments/data/compliance-agent/ --recursive

# Download index
aws s3 cp s3://formul8-platform-deployments/data/index.json - | jq .
```

## Troubleshooting

### Agent can't access S3

```bash
# Check credentials
vercel env ls | grep AWS

# Test AWS access
aws s3 ls s3://formul8-platform-deployments/data/

# Verify IAM permissions
aws iam get-user
```

### Data not loading

```javascript
// Add debug logging to data-loader.js
console.log('Loading from S3:', {
  bucket: s3Config.s3.bucketName,
  key: key
});
```

### High latency

- Enable CloudFront caching
- Pre-warm frequently accessed data
- Use smaller JSON chunks
- Consider AstraDB for large datasets

---

**Last Updated**: 2025-10-23  
**Sync Status**: In progress (18GB total)  
**Contact**: dan@formul8.ai

