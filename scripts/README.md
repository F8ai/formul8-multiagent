# Baseline Integration Scripts

This directory contains scripts for fetching, merging, and testing baseline.json files from agent repositories across the F8ai organization.

## Scripts

### fetch-baselines.js
Fetches baseline.json files from all agent repositories in the F8ai organization.

**Usage:**
```bash
GITHUB_TOKEN=your_token node scripts/fetch-baselines.js
```

**Environment Variables:**
- `GITHUB_TOKEN` (optional): GitHub personal access token for higher API rate limits

**Output:**
- Creates `baselines-raw/` directory with individual baseline files
- Generates `baselines-raw/fetch-summary.json` with fetch statistics

### merge-baselines.js
Merges individual baseline.json files into a unified baseline.json.

**Usage:**
```bash
node scripts/merge-baselines.js
```

**Input:**
- Reads from `baselines-raw/` directory

**Output:**
- Creates/updates `baseline.json` in the root directory
- Removes duplicate questions
- Adds metadata about sources and merge statistics

### test-baselines.js
Tests the merged baseline.json against the /api/chat endpoint.

**Usage:**
```bash
API_ENDPOINT=https://f8.syzygyx.com/api/chat node scripts/test-baselines.js
```

**Environment Variables:**
- `API_ENDPOINT` (optional): API endpoint to test against (default: https://f8.syzygyx.com/api/chat)

**Output:**
- Creates `baseline-results.json` with detailed test results
- Includes pass/fail status for each question
- Calculates success rates and response times
- Grades overall performance (A+ to F)

## Baseline File Format

### Input Format (from agent repositories)
Individual agent repositories can have baseline.json in various formats:

**Format 1: Array of strings**
```json
[
  "What are the benefits of cannabis?",
  "How do I scale up production?"
]
```

**Format 2: Array of objects**
```json
[
  {
    "question": "What are the benefits of cannabis?",
    "expected_answer": "Cannabis has therapeutic benefits...",
    "category": "general"
  }
]
```

**Format 3: Object with questions array**
```json
{
  "questions": [
    {
      "question": "What are the benefits of cannabis?",
      "expected_answer": "..."
    }
  ]
}
```

**Format 4: Object with categorized arrays**
```json
{
  "compliance": ["What are compliance requirements?"],
  "formulation": ["How do I calculate THC dosage?"]
}
```

### Output Format (merged baseline.json)
```json
{
  "metadata": {
    "generatedAt": "2025-10-13T10:21:00.000Z",
    "sourceRepos": ["agent1", "agent2"],
    "totalSources": 2,
    "version": "1.0",
    "stats": {
      "totalSources": 2,
      "uniqueQuestions": 50,
      "questionsWithExpectedAnswers": 25,
      "questionsFromMultipleSources": 5,
      "categoryCounts": {
        "compliance": 10,
        "formulation": 8
      }
    }
  },
  "questions": [
    {
      "question": "What are the benefits of cannabis?",
      "expected_answer": "Cannabis has therapeutic benefits...",
      "category": "general",
      "sources": ["agent1", "agent2"],
      "metadata": {}
    }
  ]
}
```

### Results Format (baseline-results.json)
```json
{
  "timestamp": "2025-10-13T10:21:00.000Z",
  "endpoint": "https://f8.syzygyx.com/api/chat",
  "baselineMetadata": {},
  "overallStats": {
    "totalQuestions": 50,
    "totalSuccessful": 45,
    "totalFailed": 5,
    "totalValidated": 40,
    "successRate": "90.00",
    "validationRate": "80.00",
    "avgResponseTime": 1234,
    "minResponseTime": 500,
    "maxResponseTime": 3000
  },
  "categoryStats": {
    "compliance": {
      "total": 10,
      "successful": 9,
      "failed": 1,
      "validated": 8,
      "successRate": "90.00",
      "validationRate": "80.00",
      "avgResponseTime": 1200
    }
  },
  "results": [
    {
      "question": "What are the benefits of cannabis?",
      "category": "general",
      "expectedAnswer": "Cannabis has therapeutic benefits...",
      "status": 200,
      "success": true,
      "responseTime": 1234,
      "response": "Cannabis has various therapeutic benefits including...",
      "error": null,
      "comparison": {
        "matched": true,
        "score": 75.50,
        "matchedKeywords": 5,
        "totalKeywords": 7
      },
      "passedValidation": true
    }
  ]
}
```

## GitHub Actions Workflow

The `baseline-integration.yml` workflow automates this process:

1. **Scheduled runs**: Daily at 2 AM UTC
2. **Manual trigger**: Can be run manually via workflow_dispatch
3. **Steps**:
   - Fetch baseline.json files from all agent repos
   - Merge into unified baseline.json
   - Test against /api/chat endpoint
   - Generate results and upload as artifacts
   - Commit updated baseline.json (if changes detected)
   - Check success rate threshold (80% required)

## Validation and Grading

### Question Validation
When an `expected_answer` is provided, the script validates responses using keyword matching:
- Extracts keywords from the expected answer (words > 3 characters)
- Checks how many keywords appear in the actual response
- Calculates a match score (% of keywords found)
- Marks as validated if match score ≥ 50%

### Performance Grading
Overall performance is graded based on success rate:
- **A+** (95-100%): 🏆 Exceptional
- **A** (90-95%): 🌟 Excellent
- **B+** (85-90%): ✅ Very Good
- **B** (80-85%): 👍 Good
- **C+** (75-80%): ⚠️ Needs Improvement
- **C** (70-75%): ⚠️ Poor
- **F** (<70%): ❌ Failing

## Example Usage

### Run the complete workflow locally:
```bash
# 1. Fetch baselines from organization
GITHUB_TOKEN=your_token node scripts/fetch-baselines.js

# 2. Merge into unified baseline
node scripts/merge-baselines.js

# 3. Test against API endpoint
node scripts/test-baselines.js

# 4. View results
cat baseline-results.json
```

### Test existing baseline without fetching:
```bash
node scripts/test-baselines.js
```

### Use custom API endpoint:
```bash
API_ENDPOINT=https://custom.api.com/chat node scripts/test-baselines.js
```

## Troubleshooting

### GitHub API Rate Limiting
If you encounter rate limiting when fetching baselines:
- Set the `GITHUB_TOKEN` environment variable with a personal access token
- The token needs `repo` scope to read from private repositories
- Authenticated requests have a limit of 5,000 requests/hour vs 60 for unauthenticated

### No baseline.json files found
Make sure agent repositories have a `baseline.json` file in their root directory. The file can be in any of the supported formats listed above.

### Test failures
If tests are failing:
1. Check that the API endpoint is accessible
2. Verify the endpoint URL is correct
3. Review the `baseline-results.json` for specific error messages
4. Check response times - slow responses may indicate API issues

## Contributing

When adding new agent repositories:
1. Ensure they have a `baseline.json` file in the root directory
2. Use one of the supported formats
3. Include `expected_answer` fields for validation when possible
4. Categorize questions appropriately
5. The workflow will automatically pick them up on the next run
