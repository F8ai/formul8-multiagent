# Formulation Agent

**Cannabis Product Formulation and Scientific Research Specialist**

## Overview

The Formulation Agent is a specialized AI agent that handles:
- Cannabis product formulation and recipe development
- Scientific research analysis and interpretation
- Lab results (COA) interpretation
- Cannabinoid and terpene profiles
- Extraction methods and techniques
- Dosage calculations for THC/CBD products

**Note**: As of October 2024, this agent has been enhanced to include all scientific research capabilities previously provided by the deprecated science-agent.

## Capabilities

### Product Formulation
- Recipe development and customization
- Dosage calculations for THC/CBD
- Extraction methods and techniques
- Ingredient selection and sourcing
- Quality control and consistency
- Product stability and shelf life

### Scientific Research (formerly science-agent)
- Scientific research analysis
- Cannabinoid and terpene profiles
- Lab results interpretation (COAs)
- Research trends and findings
- Chemical analysis and testing
- Product quality assessment

## Enhanced Features

### Retrieval Augmented Generation (RAG)
The agent uses RAG to access and incorporate scientific research data from PubMed papers, providing research-backed responses for both formulation and scientific queries.

See [RAG_IMPLEMENTATION.md](./RAG_IMPLEMENTATION.md) for technical details.

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment instructions.

## Keywords

The agent responds to queries containing these keywords:

**Formulation**: formulation, recipe, dosage, extraction, ingredient, thc, cbd, concentrate, edible, tincture

**Science**: science, research, cannabinoid, terpene, lab, testing, coa, analysis, study, clinical

## API Usage

```bash
POST https://formulation-agent.f8.syzygyx.com/query
Content-Type: application/json

{
  "message": "What is the optimal extraction method for CBD isolate?",
  "user_id": "user123"
}
```

## Environment Variables

Required:
- `OPENROUTER_API_KEY` - API key for AI model access
- `AWS_ACCESS_KEY_ID` - AWS credentials for S3 access
- `AWS_SECRET_ACCESS_KEY` - AWS credentials for S3 access
- `AWS_REGION` - AWS region (default: us-east-1)

## Version

**Current Version**: 1.1.0

## Migration from Science Agent

If you were previously using the science-agent:
- All science-related queries should now be directed to this agent
- The science-agent has been deprecated and is no longer maintained
- See `/agents/science-agent/DEPRECATED.md` for migration details

## Support

For questions or issues, please contact the Formul8 development team.

