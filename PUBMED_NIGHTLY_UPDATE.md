# PubMed Nightly Updates for Formulation Agent RAG

## Overview

The formulation-agent's RAG system stays current with the latest cannabis research through automated nightly updates from PubMed. This ensures responses are always backed by the most recent scientific literature.

## How It Works

### 1. Automated Fetch Script

**Script**: `scripts/fetch-pubmed-formulation.js`

Searches PubMed for formulation-relevant articles using targeted queries:
- Cannabis formulation
- Cannabinoid extraction
- THC/CBD formulation
- Terpene preservation
- Cannabis edibles
- Cannabis stability
- Cannabinoid degradation
- Cannabis product development
- Cannabis bioavailability

**Features**:
- Fetches 5 most recent articles per query (50 total daily)
- Deduplicates against existing index
- Maintains rolling window of 100 most recent papers
- Respects NCBI rate limits (3 requests/second)
- Extracts: title, abstract, authors, keywords, DOI, publication date
- Auto-categorizes by relevance (formulation, science, operations, compliance)

### 2. GitHub Actions Workflow

**Workflow**: `.github/workflows/update-pubmed-formulation.yml`

Runs nightly at 2 AM UTC:
1. Fetches latest articles from PubMed
2. Updates `agents/science-agent/data/index.json`
3. Uploads to S3: `s3://formul8-platform-deployments/data/science/index.json`
4. Commits changes to repository
5. Reports summary

## Schedule

- **Frequency**: Nightly at 2 AM UTC
- **Manual trigger**: Available via GitHub Actions UI
- **Duration**: ~15 seconds typical

## Data Flow

```
PubMed API (NCBI)
        ↓
fetch-pubmed-formulation.js
        ↓
agents/science-agent/data/index.json
        ↓
S3: data/science/index.json
        ↓
formulation-agent RAG queries
        ↓
Enhanced AI responses
```

## Index Structure

### Current Stats (Initial Run)
- **Total Papers**: 43
- **Categories**: 177 unique keywords
- **Sources**: PubMed via NCBI E-utilities API
- **Update Frequency**: Nightly
- **Retention**: 100 most recent papers

### Paper Format
```json
{
  "id": "pubmed-12345678",
  "title": "Article Title",
  "authors": ["Author A", "Author B"],
  "abstract": "Full abstract text...",
  "keywords": ["keyword1", "keyword2"],
  "pubmedId": "12345678",
  "doi": "10.1234/example.2024.001",
  "publishedDate": "2024-10-23",
  "journal": "Journal Name",
  "summary": "Brief summary...",
  "relevantTo": ["formulation", "science"],
  "fetchedDate": "2024-10-24T02:00:00Z"
}
```

## Manual Updates

### Run Script Locally
```bash
node scripts/fetch-pubmed-formulation.js
```

### Upload to S3
```bash
aws s3 cp agents/science-agent/data/index.json \
  s3://formul8-platform-deployments/data/science/index.json
```

### Trigger Workflow Manually
1. Go to: https://github.com/F8ai/formul8-multiagent/actions
2. Select "Update PubMed Articles for Formulation Agent"
3. Click "Run workflow"

## Monitoring

### Check Workflow Status
```bash
gh run list --workflow=update-pubmed-formulation.yml --limit 5
```

### View Latest Run Logs
```bash
gh run view --log
```

### Verify S3 Data
```bash
aws s3 ls s3://formul8-platform-deployments/data/science/
aws s3 cp s3://formul8-platform-deployments/data/science/index.json - | jq '.totalPapers'
```

## RAG Integration

### How Formulation-Agent Uses the Data

1. **User Query**: "What's the best extraction method for terpenes?"
2. **RAG Retrieval**: Searches index for relevant papers
3. **Context Building**: Top 3 papers added to AI prompt
4. **Enhanced Response**: AI answers using real research
5. **Transparency**: Response shows which papers were used

### Example Response
```json
{
  "response": "Based on recent research...",
  "rag": {
    "enabled": true,
    "papersRetrieved": 3,
    "source": "science-agent"
  }
}
```

Footer: `*... | RAG: 3 papers from science-agent*`

## Search Queries

Current queries target formulation-specific research:

| Query | Focus Area |
|-------|------------|
| cannabis formulation | General formulation science |
| cannabinoid extraction | Extraction methods and techniques |
| cannabis dosage | Dosing calculations and guidelines |
| THC CBD formulation | Cannabinoid-specific formulations |
| terpene preservation | Terpene retention methods |
| cannabis edibles | Edible product development |
| cannabis stability | Product shelf life and storage |
| cannabinoid degradation | Quality control over time |
| cannabis product development | New product creation |
| cannabis bioavailability | Absorption and efficacy |

### Adding New Queries

Edit `scripts/fetch-pubmed-formulation.js`:
```javascript
const SEARCH_QUERIES = [
  'cannabis formulation',
  // Add your new query here
  'new search term'
];
```

## PubMed API Details

### NCBI E-utilities
- **Base URL**: `eutils.ncbi.nlm.nih.gov`
- **Search**: `/entrez/eutils/esearch.fcgi`
- **Fetch**: `/entrez/eutils/efetch.fcgi`
- **Rate Limit**: 3 requests/second
- **Format**: XML for detailed data, JSON for search results

### Required Parameters
- `email`: contact@formul8.ai (NCBI requirement)
- `tool`: formul8-rag-updater (identifies our application)
- `db`: pubmed (database to search)
- `retmode`: xml/json (response format)

### API Documentation
https://www.ncbi.nlm.nih.gov/books/NBK25501/

## Performance

### Typical Run Stats
- **Duration**: 10-20 seconds
- **Articles Fetched**: 0-50 per run (depends on new publications)
- **API Calls**: ~20 (respects rate limits)
- **Output Size**: ~500KB (100 papers)
- **S3 Upload**: <1 second

### Optimization
- Deduplication prevents redundant storage
- Rolling window (100 papers) limits size
- In-memory processing (no database needed)
- Smart caching in formulation-agent (1 hour TTL)

## Troubleshooting

### No New Articles Found
```
ℹ️  No new articles found
📅 Next check: Tomorrow at 2 AM UTC
```
This is normal - PubMed publications aren't constant.

### API Rate Limit Error
The script includes delays to respect NCBI limits. If you see rate limit errors:
- Wait 1 minute
- Run again
- Check if you're running multiple instances

### S3 Upload Fails
Verify AWS credentials are set in GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### Workflow Fails
Check GitHub Actions logs:
```bash
gh run view --log
```

Common issues:
- Missing AWS credentials
- Network connectivity
- PubMed API temporarily down

## Benefits

### For Users
- ✅ Always current research
- ✅ Evidence-based responses
- ✅ Transparent sources
- ✅ Latest formulation techniques

### For System
- ✅ Automated updates (no manual work)
- ✅ Version controlled (Git history)
- ✅ Reliable (GitHub Actions SLA)
- ✅ Cost effective (free compute + minimal S3)

## Future Enhancements

### Planned
1. **Vector Embeddings**: Semantic search instead of keywords
2. **Citation Tracking**: Link directly to PubMed articles
3. **Quality Scoring**: Rank by impact factor/citations
4. **Multi-source**: Add other databases (Google Scholar, arXiv)
5. **Alerts**: Notify on high-impact papers

### Advanced Features
- Real-time updates (webhook from PubMed)
- Customized queries per agent
- User-specific paper recommendations
- Citation graphs and relationships

## Cost Analysis

### Current Costs
- **GitHub Actions**: Free (within limits)
- **PubMed API**: Free (NCBI public service)
- **S3 Storage**: ~$0.01/month (500KB)
- **S3 Requests**: ~$0.01/month (daily uploads)
- **Total**: ~$0.02/month

### Scalability
- Can handle 1000+ papers easily
- S3 costs scale linearly (~$0.02/GB/month)
- API limits: 3 req/s = 259,200 articles/day (way more than needed)

## Documentation

- **Technical**: `agents/formulation-agent/RAG_IMPLEMENTATION.md`
- **Deployment**: `agents/formulation-agent/DEPLOYMENT_GUIDE.md`
- **Architecture**: `AGENT_DATA_S3_ARCHITECTURE.md`
- **This Guide**: `PUBMED_NIGHTLY_UPDATE.md`

## Support

For issues or questions:
- GitHub Issues: [formul8-multiagent/issues](https://github.com/F8ai/formul8-multiagent/issues)
- Workflow Logs: `gh run view --log`
- Script: `scripts/fetch-pubmed-formulation.js`

---

**Status**: ✅ Active  
**Next Run**: Tonight at 2 AM UTC  
**Current Papers**: 43  
**Last Update**: 2024-10-24  

