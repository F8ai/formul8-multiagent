# chat.formul8.ai Baseline Testing Results & Analysis

## Executive Summary

I've successfully tested **chat.formul8.ai** with **23 baseline questions** covering various cannabis industry topics. All questions received responses (100% success rate), but the quality assessment reveals areas for improvement.

### Overall Performance
- **Overall Grade: F (55.73%)**
- **Success Rate: 100%** - All questions received responses
- **Average Response Time: 7.85 seconds**
- **Response Time Range: 1.7s - 13.7s**

## Grade Distribution

| Grade | Count | Percentage | Description |
|-------|-------|------------|-------------|
| A (90-100%) | 0 | 0.0% | Excellent |
| B (80-89%) | 2 | 8.7% | Good |
| C (70-79%) | 1 | 4.3% | Satisfactory |
| D (60-69%) | 7 | 30.4% | Below Average |
| F (<60%) | 13 | 56.5% | Needs Improvement |

## Performance by Category

### 1. Business Questions (Best Performing)
- **Average Score: 84.29%**
- **Grade: B**
- Questions: 1
- **Analysis:** Strong performance in business planning topics with good keyword coverage and topic relevance.

### 2. Science Questions
- **Average Score: 61.07%**
- **Grade: D**
- Questions: 4
- **Analysis:** Moderate performance. Responses include relevant keywords but often miss deeper topic coverage.
  - "What is THC?" - D (66.67%)
  - "What are terpenes?" - D (68.33%)
  - "How do I test cannabis potency?" - F (55.00%)
  - "What is the difference between indica and sativa?" - F (54.29%)

### 3. Compliance Questions
- **Average Score: 57.38%**
- **Grade: F**
- Questions: 4
- **Analysis:** Below expectations. While keywords are present, responses lack specific regulatory details expected.

### 4. Formulation Questions
- **Average Score: 54.05%**
- **Grade: F**
- Questions: 4
- **Key Issue:** Missing specific formulation details and practical recipes.
- **Best Question:** "How do I make cannabis edibles?" - C (73.33%)
- **Weakest Question:** "Create a recipe for cannabis gummies with 10mg THC each" - F (40.00%)

### 5. Marketing Questions
- **Average Score: 54.29%**
- **Grade: F**
- Questions: 3
- **Analysis:** Good keyword coverage (40-60%) but missing strategic depth in topics.

### 6. General Questions
- **Average Score: 54.29%**
- **Grade: F**
- Questions: 1
- "What are the benefits of cannabis?" received keyword matches but lacked comprehensive topic coverage.

### 7. Operations Questions (Weakest Performing)
- **Average Score: 47.14%**
- **Grade: F**
- Questions: 4
- **Critical Issues:**
  - "How do I optimize my cannabis facility operations?" - F (31.43%) ⚠️ Lowest Score
  - Missing practical operational guidance
  - Low keyword matching (11-29%)

### 8. Off-Topic Questions
- **Average Score: 50.84%**
- **Grade: F**
- Questions: 2
- **Interesting:** "What is the meaning of life?" scored B (86.67%)
- System needs better filtering for non-cannabis questions

## Key Findings

### Strengths ✅
1. **100% Response Rate** - No failed requests or timeouts
2. **Appropriate Agent Routing** - System correctly routes to specialized agents
3. **Comprehensive Responses** - Average 450+ words per response
4. **Good Keyword Coverage** - Average 5-6 keywords matched per response
5. **Best Topics:** Business planning, philosophical questions

### Weaknesses ⚠️
1. **Topic Coverage** - Only 18% of responses covered multiple expected topics
2. **Operational Content Gap** - Weakest category at 47.14%
3. **Formulation Specificity** - Lacking concrete recipes and calculations
4. **Science Depth** - Missing technical details and research references
5. **Compliance Detail** - Not providing jurisdiction-specific regulatory information

## Grading Methodology

Responses were evaluated on a 100-point scale:

1. **Keyword Matching (40 points max)**
   - Measures presence of expected domain-specific terms
   - Average performance: 30-35 points (75-87% of max)

2. **Topic Coverage (40 points max)**
   - Evaluates coverage of expected subject areas
   - **Critical Gap:** Average only 5-10 points (12-25% of max) ⚠️
   - **Main issue causing low scores**

3. **Response Quality (20 points max)**
   - Word count (sufficient detail)
   - Formatting (tables, lists, structure)
   - Average performance: 20 points (100% of max) ✅

## Agent Routing Analysis

| Question Type | Expected Agent | Most Common Actual Agent | Match Rate |
|--------------|----------------|-------------------------|-----------|
| General | f8_agent | compliance | ❌ |
| Business | f8_agent | f8_agent | ✅ |
| Operations | operations | compliance | ❌ |
| Compliance | compliance | f8_agent/compliance | ~50% |
| Formulation | formulation | formulation | ✅ |
| Science | science | mixed | ~50% |
| Marketing | marketing | compliance | ❌ |

**Finding:** The compliance agent is being over-utilized, handling many questions outside its specialty.

## Recommendations for Improvement

### High Priority 🔴

1. **Improve Topic Coverage**
   - Current: 12-25% of expected topics covered
   - Target: 75%+ topic coverage
   - Action: Enhance prompts to ensure multi-topic responses

2. **Fix Agent Routing**
   - Issue: Compliance agent answering marketing, operations questions
   - Action: Review and tune routing keywords/logic

3. **Enhance Operations Content**
   - Lowest scoring category (47%)
   - Need more practical operational guidance
   - Add facility management best practices

4. **Formulation Specificity**
   - Add concrete recipes with measurements
   - Include step-by-step instructions
   - Provide dosage calculation examples

### Medium Priority 🟡

5. **Science Technical Depth**
   - Add more research references
   - Include chemical/botanical details
   - Provide lab methodology explanations

6. **Compliance Jurisdiction-Specific Details**
   - Include state-specific regulations
   - Reference actual regulatory bodies
   - Cite specific compliance requirements

7. **Off-Topic Filtering**
   - Improve detection of non-cannabis questions
   - Provide appropriate scope limitation responses

### Low Priority 🟢

8. **Response Time Optimization**
   - Current: 7.85s average
   - Consider caching common questions
   - Optimize model inference

9. **Marketing Strategy Depth**
   - Add more strategic frameworks
   - Include case studies
   - Provide actionable tactics

## Performance Metrics

### Response Times
- **Average:** 7,851ms (~8 seconds)
- **Minimum:** 1,727ms (off-topic question)
- **Maximum:** 13,744ms (extraction methods)
- **Median:** ~7,800ms

### Response Quality Metrics
- **Average Word Count:** 476 words
- **All responses:** 50+ words (minimum threshold met)
- **Formatted responses:** ~85% included tables or structured content

## Test Details

- **Test Date:** October 23, 2025
- **Endpoint:** https://chat.formul8.ai
- **Total Questions:** 23
- **Model Used:** openai/gpt-oss-120b
- **Test Duration:** ~3 minutes 44 seconds

## Files Generated

1. `chat-formul8-baseline-results-2025-10-23T21-59-36-684Z.json` - Full detailed results
2. `chat-formul8-baseline-summary-2025-10-23T21-59-36-684Z.md` - Markdown summary
3. `test-chat-formul8-baseline.js` - Reusable test script

## Running Future Tests

To run this test again:

```bash
cd /Users/danielmcshan/GitHub/formul8-multiagent
node test-chat-formul8-baseline.js
```

The script will:
- Test all 23 baseline questions
- Grade each response (0-100%)
- Generate detailed JSON and Markdown reports
- Show real-time progress and results

## Conclusion

The **chat.formul8.ai** system is functional with 100% uptime, but content quality needs improvement. The main issue is **insufficient topic coverage** (only 12-25% of expected topics), despite good keyword matching. Focusing on enhancing multi-topic responses and fixing agent routing will significantly improve the overall grade from **F (55.73%)** to a target of **B (80%+)**.

### Quick Wins
1. ✅ System is stable and responsive
2. ⚠️ Tune agent routing to reduce compliance agent over-utilization  
3. ⚠️ Enhance prompts to ensure comprehensive topic coverage
4. ⚠️ Add more operational and formulation-specific content

### Next Steps
1. Review the detailed JSON results to identify specific response gaps
2. Update agent prompts to cover expected topics more thoroughly
3. Refine routing logic to direct questions to appropriate specialized agents
4. Re-run baseline tests to measure improvement

