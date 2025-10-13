# Baseline Integration Examples

This directory contains example baseline.json files showing the various formats supported by the baseline integration workflow.

## Supported Formats

The baseline integration scripts support four different formats for `baseline.json` files. Agent repositories can use any of these formats, and they will all be merged correctly.

### Format 1: Array of Strings
**File:** `baseline-formats/format1-array-strings.json`

The simplest format - just an array of question strings.

```json
[
  "What are the benefits of cannabis?",
  "How do I scale up my cannabis production?",
  "What is THC?"
]
```

**When to use:** Quick and simple baseline with no expected answers or categories.

### Format 2: Array of Objects
**File:** `baseline-formats/format2-array-objects.json`

An array of question objects with expected answers and categories.

```json
[
  {
    "question": "What are the benefits of cannabis?",
    "expected_answer": "Cannabis has various therapeutic benefits...",
    "category": "general"
  }
]
```

**When to use:** When you want to include expected answers for validation and organize by category.

### Format 3: Object with Questions Array
**File:** `baseline-formats/format3-object-with-questions.json`

An object containing a `questions` array with additional metadata support.

```json
{
  "questions": [
    {
      "question": "What are the compliance requirements?",
      "expected_answer": "California cannabis businesses must...",
      "category": "compliance",
      "metadata": {
        "difficulty": "intermediate",
        "tags": ["compliance", "california"]
      }
    }
  ]
}
```

**When to use:** When you need to include additional metadata like difficulty, tags, or other custom fields.

### Format 4: Categorized Arrays
**File:** `baseline-formats/format4-categorized-arrays.json`

An object with category keys containing arrays of questions.

```json
{
  "compliance": [
    "What are the compliance requirements?",
    "How do I maintain compliance records?"
  ],
  "formulation": [
    "How do I calculate THC dosage?",
    "How do I make cannabis edibles?"
  ]
}
```

**When to use:** When you want to organize questions by category without specifying expected answers.

## Testing the Workflow Locally

### Step 1: Set up sample baselines
```bash
# Copy example baselines to the raw directory
mkdir -p baselines-raw
cp examples/baseline-formats/format1-array-strings.json baselines-raw/agent1.json
cp examples/baseline-formats/format2-array-objects.json baselines-raw/agent2.json
cp examples/baseline-formats/format3-object-with-questions.json baselines-raw/agent3.json
cp examples/baseline-formats/format4-categorized-arrays.json baselines-raw/agent4.json
```

### Step 2: Merge the baselines
```bash
node scripts/merge-baselines.js
```

This will create a unified `baseline.json` file with all questions merged and deduplicated.

### Step 3: Test against API endpoint
```bash
# Test with default endpoint
node scripts/test-baselines.js

# Or test with custom endpoint
API_ENDPOINT=https://your-api.com/chat node scripts/test-baselines.js
```

### Step 4: View results
```bash
# View summary
cat baseline-results.json | jq '.overallStats'

# View detailed results
cat baseline-results.json | jq '.results'

# View category breakdown
cat baseline-results.json | jq '.categoryStats'
```

## Creating a baseline.json for Your Agent

### Recommended Format
We recommend using **Format 3** (Object with Questions Array) as it provides the most flexibility:

```json
{
  "questions": [
    {
      "question": "Your question here?",
      "expected_answer": "The expected response content...",
      "category": "your_agent_category",
      "metadata": {
        "difficulty": "beginner|intermediate|advanced",
        "tags": ["tag1", "tag2"],
        "priority": "high|medium|low"
      }
    }
  ]
}
```

### Best Practices

1. **Include Expected Answers**: This enables validation and quality checking
2. **Categorize Questions**: Use meaningful category names (e.g., "compliance", "formulation")
3. **Write Clear Questions**: Questions should be specific and unambiguous
4. **Test Before Committing**: Run your baseline through the test script locally
5. **Keep Questions Updated**: Review and update questions as your agent evolves

### Example Agent baseline.json

Here's a complete example for a cannabis compliance agent:

```json
{
  "questions": [
    {
      "question": "What are the licensing requirements for cannabis retail in California?",
      "expected_answer": "California requires a Type 10 license for cannabis retail, which involves local approval, state application, background checks, and compliance with security, tracking, and testing requirements.",
      "category": "compliance",
      "metadata": {
        "difficulty": "intermediate",
        "tags": ["licensing", "california", "retail"],
        "priority": "high"
      }
    },
    {
      "question": "How do I track cannabis inventory for compliance?",
      "expected_answer": "Cannabis inventory must be tracked using state-mandated track-and-trace systems, recording all movements from cultivation to sale, including weights, batch numbers, and timestamps.",
      "category": "compliance",
      "metadata": {
        "difficulty": "intermediate",
        "tags": ["tracking", "inventory", "metrc"],
        "priority": "high"
      }
    },
    {
      "question": "What are the packaging requirements for cannabis products?",
      "expected_answer": "Cannabis packaging must be child-resistant, opaque, resealable, and include required warnings, potency information, batch numbers, and testing results.",
      "category": "compliance",
      "metadata": {
        "difficulty": "beginner",
        "tags": ["packaging", "labeling", "safety"],
        "priority": "medium"
      }
    }
  ]
}
```

## Validation and Scoring

The test script validates responses using keyword matching:

1. Extracts keywords from `expected_answer` (words > 3 characters)
2. Checks how many keywords appear in the actual API response
3. Calculates match score (% of keywords found)
4. Marks as validated if match score ≥ 50%

**Example:**
- Expected: "Cannabis has therapeutic benefits including pain relief"
- Keywords: ["Cannabis", "therapeutic", "benefits", "including", "pain", "relief"]
- If response contains 4 out of 6 keywords, match score = 66.67%
- Validation = PASSED (≥ 50%)

## Performance Grading

Overall performance is graded:
- **A+** (95-100%): 🏆 Exceptional
- **A** (90-95%): 🌟 Excellent
- **B+** (85-90%): ✅ Very Good
- **B** (80-85%): 👍 Good
- **C+** (75-80%): ⚠️ Needs Improvement
- **C** (70-75%): ⚠️ Poor
- **F** (<70%): ❌ Failing

## Troubleshooting

### My baseline.json isn't being picked up
- Make sure the file is named exactly `baseline.json` (lowercase)
- Place it in the root directory of your repository
- Check that it's valid JSON using `jq . < baseline.json`
- Ensure your repository name includes "agent" or "formul8"

### Questions are being duplicated
- The merge script automatically deduplicates based on question text (case-insensitive)
- If duplicates remain, they have different text or formatting
- Check for extra spaces or punctuation differences

### Expected answers aren't working
- Make sure the field is named `expected_answer` (underscore, not camelCase)
- Include multiple relevant keywords in the expected answer
- Avoid very short expected answers (< 5 words)
- The keyword matching is case-insensitive

### Tests are failing
- First, verify the API endpoint is accessible
- Check if questions are formatted correctly
- Review the `baseline-results.json` for specific error messages
- Test individual questions manually using curl or Postman

## Contributing

To add your agent's baseline to the integration:

1. Create a `baseline.json` file in your agent repository root
2. Use one of the supported formats (Format 3 recommended)
3. Include expected answers for validation
4. Test locally using the scripts
5. Commit and push to your repository
6. The workflow will automatically pick it up on the next scheduled run

For questions or issues, check the main [scripts/README.md](../scripts/README.md) or open an issue.
