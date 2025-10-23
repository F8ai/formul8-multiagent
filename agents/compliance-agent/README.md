# Compliance Agent - S3 Integration

## Architecture

**No FUSE mounting needed!** This compliance agent reads directly from S3 using AWS SDK.

```
┌─────────────────────────────────────────┐
│  Vercel Serverless Function             │
│  ┌────────────────────────────────────┐ │
│  │ compliance-agent/lambda.js         │ │
│  │                                    │ │
│  │  1. Receives question              │ │
│  │  2. Detects state code (CA, CO)    │ │
│  │  3. Calls data-loader.js           │ │
│  │                                    │ │
│  │  ┌──────────────────────────────┐  │ │
│  │  │ data-loader.js               │  │ │
│  │  │ • Connects to S3             │  │ │
│  │  │ • Loads state data           │  │ │
│  │  │ • Caches in memory           │  │ │
│  │  └──────────────────────────────┘  │ │
│  │          ↓                          │ │
│  │  4. Enriches AI prompt with data   │ │
│  │  5. Calls OpenRouter API           │ │
│  │  6. Returns response               │ │
│  └────────────────────────────────────┘ │
└────────────────┬────────────────────────┘
                 │ AWS SDK
                 ↓
    ┌───────────────────────────┐
    │  S3 Bucket                │
    │  formul8-platform-        │
    │  deployments              │
    │                           │
    │  data/compliance/         │
    │  ├── regulations/         │
    │  │   ├── CA/  (498MB)     │
    │  │   ├── CO/  (108MB)     │
    │  │   ├── MO/  (757MB)     │
    │  │   └── ...              │
    │  ├── compliance_resources/│
    │  ├── corpus/              │
    │  └── baselines/           │
    └───────────────────────────┘
```

## Data Flow

1. **Question arrives**: "What are the licensing requirements for California?"
2. **State detection**: Regex finds "California" → `CA`
3. **S3 fetch**: `dataLoader.getStateData('CA')` 
4. **In-memory cache**: Cached for duration of this function instance
5. **AI enrichment**: Regulation data added to prompt
6. **Response**: Accurate, citation-backed answer

## Setup

### 1. Environment Variables

Add to Vercel project settings:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
OPENROUTER_API_KEY=sk-or-v1-...
```

### 2. Deploy

```bash
cd /Users/danielmcshan/GitHub/formul8-multiagent
vercel --prod
```

## Data Management

### Sync from compliance-agent repo to S3:

```bash
cd /Users/danielmcshan/GitHub/compliance-agent
./sync_to_s3.sh
```

This uploads:
- **~3GB** of regulation data
- **32 states** with full data
- **Organized by state code** (CA/, CO/, etc.)

### Update regulations:

```bash
# In compliance-agent repo
python download_regulations.py --state CA
python push_regulations_by_state.py --state CA

# Then sync to S3
./sync_to_s3.sh
```

## Performance

**Cold start**: ~500ms
**With S3 data**: +200-300ms first call per state
**Cached**: ~100ms subsequent calls (same state)

**Memory usage**: 
- Base: 128MB
- With data: 256MB recommended

## Benefits vs FUSE

| Aspect | FUSE Mount | AWS SDK (Current) |
|--------|------------|-------------------|
| **Serverless Support** | ❌ No | ✅ Yes |
| **Latency** | Very fast once mounted | Fast with cache |
| **Memory** | High (entire mount) | Low (on-demand) |
| **Complexity** | High (kernel module) | Low (JS library) |
| **Cost** | Higher (always-on VM) | Lower (serverless) |
| **Scalability** | Limited | Unlimited |

## Monitoring

Check logs in Vercel:
```bash
vercel logs compliance-agent-f8 --follow
```

Look for:
- ✅ `Cache hit for CA` - Good!
- ⚠️ `Could not load state data` - Check AWS credentials
- ❌ `AccessDenied` - Check S3 bucket permissions

## Future Enhancements

1. **AstraDB Integration**: For vector search across all regulations
2. **Edge Caching**: Use Vercel KV for distributed cache
3. **Preloading**: Warm up cache for top 10 states
4. **Compression**: Gzip regulation data in S3

## Files

- `lambda.js` - Main handler with S3 integration
- `data-loader.js` - S3 data access layer
- `s3-config.json` - Configuration
- `package.json` - Dependencies (includes @aws-sdk/client-s3)

## S3 Bucket Structure

```
s3://formul8-platform-deployments/data/compliance/
├── index.json                    # Metadata
├── regulation_baseline.json      # 213KB baseline
├── regulation_sizes.json         # Size info
├── regulations.json              # State list
├── regulations/
│   ├── CA/
│   │   ├── index.json
│   │   └── cannabis.ca.gov/...
│   ├── CO/
│   │   ├── index.json
│   │   └── [regulation files]
│   └── [50 more states]
├── compliance_resources/
│   ├── CA/
│   ├── CO/
│   └── ...
├── corpus/
│   └── [processed text data]
└── baselines/
    └── [test data]
```

## Questions?

Contact: dan@formul8.ai
Docs: https://formul8.ai/docs/compliance

