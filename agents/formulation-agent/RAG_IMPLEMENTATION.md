# Formulation Agent - RAG Implementation

## Overview

The formulation-agent now uses **Retrieval Augmented Generation (RAG)** to enhance responses with scientific research data (PubMed papers). This agent has been enhanced to handle both product formulation AND scientific research queries, consolidating the capabilities of the deprecated science-agent.

## Architecture

```
┌─────────────────────┐
│ Formulation Agent   │
│  (lambda.js)        │
└──────────┬──────────┘
           │
           │ RAG Query
           ▼
┌─────────────────────────┐
│ S3 Bucket               │
│ data/science/index.json │
│ (PubMed papers)         │
└─────────────────────────┘
           │
           │ Retrieved Papers
           ▼
┌─────────────────────┐
│ OpenRouter API      │
│ (with context)      │
└─────────────────────┘
```

## How It Works

1. **User Query**: When a user asks a formulation or scientific research question, the query is analyzed
2. **Research Retrieval**: The agent searches S3 for relevant PubMed papers
3. **Context Building**: Top 3 most relevant papers are added to the system prompt
4. **Enhanced Response**: The AI model generates a response informed by scientific research
5. **Transparency**: Response metadata includes RAG information (number of papers used)

## RAG Function

```javascript
async function retrieveRelevantResearch(query) {
  // Loads scientific research data index from S3
  // Filters papers by keyword matching
  // Returns top 3 most relevant papers
}
```

### Keyword Matching

Currently uses simple keyword-based filtering:
- Extracts keywords from user query (words > 3 chars)
- Searches paper titles, abstracts, and keywords
- Returns top 3 matches

### Future Enhancements

- **Vector Embeddings**: Use semantic similarity instead of keyword matching
- **AstraDB Integration**: For large-scale vector search
- **Citation Tracking**: Include paper citations in responses
- **Source Links**: Provide PubMed URLs for referenced papers

## Configuration

### s3-config.json

```json
{
  "rag": {
    "enabled": true,
    "sources": [
      {
        "name": "science-agent",
        "prefix": "data/science",
        "description": "PubMed research papers and scientific studies"
      }
    ]
  }
}
```

## Response Format

### Without RAG
```json
{
  "response": "...",
  "agent": "formulation_agent",
  "rag": {
    "enabled": true,
    "papersRetrieved": 0,
    "source": "science-agent"
  }
}
```

### With RAG
```json
{
  "response": "...",
  "agent": "formulation_agent",
  "rag": {
    "enabled": true,
    "papersRetrieved": 3,
    "source": "science-agent"
  }
}
```

Footer includes RAG info:
```
*Agent: Formulation Agent | Plan: standard | Tokens: 450 (350→100) | Cost: $0.000000 | RAG: 3 papers from science-agent*
```

## Testing

### Test with formulation query:
```bash
curl -X POST https://formulation-agent.f8.syzygyx.com/api/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-key" \
  -d '{
    "message": "How do cannabinoids affect inflammation?",
    "plan": "standard"
  }'
```

Expected behavior:
- RAG retrieves relevant research papers about cannabinoids and inflammation
- Response is informed by scientific literature
- Response metadata shows papers retrieved

## Data Sources

### Science Agent Data Structure
```
s3://formul8-platform-deployments/data/science/
├── index.json          ← Main index of all papers
└── data/
    ├── paper1.json
    ├── paper2.json
    └── ...
```

### Required Fields in index.json
```json
{
  "papers": [
    {
      "id": "paper-id",
      "title": "Paper Title",
      "abstract": "Paper abstract text...",
      "keywords": ["keyword1", "keyword2"],
      "summary": "Brief summary (optional)"
    }
  ]
}
```

## Performance

- **Cache**: S3 responses are cached for 1 hour (configurable)
- **Latency**: RAG adds ~100-300ms to response time
- **Fallback**: If S3 fails, agent continues without RAG (graceful degradation)

## Environment Variables

Required for S3 access:
```bash
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
OPENROUTER_API_KEY=xxx
```

## Monitoring

### Logs
```bash
📚 Found 3 relevant research papers
⚠️  Could not retrieve research data: [error message]
```

### Health Check
```bash
curl https://formulation-agent.f8.syzygyx.com/health
```

## Version History

- **v1.0.0**: Basic formulation agent without RAG
- **v1.1.0**: Added RAG integration with science-agent data

## Related Agents

- **science-agent**: Provides PubMed research data
- **compliance-agent**: Uses similar S3 data loading pattern
- **patent-agent**: Future RAG integration planned

## Credits

Built using the Formul8 Multi-Agent S3 Data Architecture.

