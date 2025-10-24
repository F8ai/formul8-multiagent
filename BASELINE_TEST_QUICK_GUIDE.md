# Quick Guide: chat.formul8.ai Baseline Testing

## What Was Tested

✅ **23 baseline questions** across 8 categories:
- General (1 question)
- Business (1 question)  
- Operations (4 questions)
- Compliance (4 questions)
- Formulation (4 questions)
- Science (4 questions)
- Marketing (3 questions)
- Off-topic (2 questions)

## Test Results Summary

### Overall Score: F (55.73%)

```
Grade Distribution:
█████████████ F (56.5%) - 13 questions
███████ D (30.4%) - 7 questions  
█ C (4.3%) - 1 question
██ B (8.7%) - 2 questions
  A (0.0%) - 0 questions
```

### Category Performance

| Category | Score | Grade | Status |
|----------|-------|-------|--------|
| 🏆 Business | 84.29% | B | Best |
| Science | 61.07% | D | Below Average |
| Compliance | 57.38% | F | Poor |
| General | 54.29% | F | Poor |
| Marketing | 54.29% | F | Poor |
| Formulation | 54.05% | F | Poor |
| Off-topic | 50.84% | F | Poor |
| ⚠️ Operations | 47.14% | F | **Worst** |

## Key Issues Found

### 1. Poor Topic Coverage (Main Issue) 🔴
- **Only 12-25% of expected topics covered**
- Responses include keywords but miss depth
- Need multi-faceted answers, not just keyword mentions

**Example:**
- Question: "What are the benefits of cannabis?"
- ✅ Keywords found: 6/7 (86%)
- ❌ Topics covered: 0/3 (0%)
- Result: F grade despite having keywords

### 2. Agent Routing Problems 🟡
- Compliance agent handling too many non-compliance questions
- Operations questions going to compliance agent
- Marketing questions going to compliance agent

**Example:**
- Question: "How do I optimize my cannabis facility operations?"
- Expected: Operations agent
- Actual: Compliance agent ❌
- Result: Response focused on compliance, not operations (31% score)

### 3. Formulation Lacks Specificity 🟡
- Missing concrete recipes with measurements
- Vague instructions instead of step-by-step guides
- Dosage calculations not specific enough

## What's Working Well ✅

1. **100% Success Rate** - All questions answered
2. **Fast Responses** - Average 7.8 seconds
3. **Long-form Content** - Average 476 words per response
4. **Good Formatting** - 85% include tables/structure
5. **Keyword Matching** - 75-87% of keywords found

## Top Performers

| Question | Grade | Score | Why It Worked |
|----------|-------|-------|---------------|
| "What is the meaning of life?" | B | 86.67% | All expected keywords + 2/3 topics |
| "I want to start a cannabis business" | B | 84.29% | Comprehensive coverage of business planning |
| "How do I make cannabis edibles?" | C | 73.33% | Practical instructions with process details |

## Bottom Performers

| Question | Grade | Score | What Went Wrong |
|----------|-------|-------|-----------------|
| "How do I optimize my cannabis facility operations?" | F | 31.43% | Wrong agent (compliance vs operations) |
| "Create a recipe for cannabis gummies with 10mg THC each" | F | 40.00% | Too generic, missing specific recipe |
| "How do I calculate THC dosage?" | F | 48.57% | Missing concrete calculation examples |

## Files Generated

1. **Detailed Results (JSON):**
   ```
   chat-formul8-baseline-results-2025-10-23T21-59-36-684Z.json
   ```
   - Full API responses
   - Detailed scoring breakdown
   - Timestamp and metadata

2. **Summary Report (Markdown):**
   ```
   chat-formul8-baseline-summary-2025-10-23T21-59-36-684Z.md
   ```
   - Question-by-question breakdown
   - Score details for each response
   - Easy to read format

3. **Analysis Document:**
   ```
   CHAT_FORMUL8_BASELINE_ANALYSIS.md
   ```
   - Executive summary
   - Recommendations
   - Strategic insights

4. **Test Script (Reusable):**
   ```
   test-chat-formul8-baseline.js
   ```
   - Run anytime to re-test
   - Automatic grading
   - Generates reports

## How to Run Tests Again

```bash
# Navigate to project directory
cd /Users/danielmcshan/GitHub/formul8-multiagent

# Run the test
node test-chat-formul8-baseline.js

# Or make it executable and run directly
chmod +x test-chat-formul8-baseline.js
./test-chat-formul8-baseline.js
```

## Grading Formula

Each response is scored out of 100 points:

- **40 points** - Keyword Matching
  - Checks if expected domain terms are present
  - Example: "THC", "compliance", "extraction"
  
- **40 points** - Topic Coverage  ⚠️ **Main weakness**
  - Checks if multiple aspects of topic are addressed
  - Example: Not just "licensing" but also "compliance", "funding", "planning"
  
- **20 points** - Response Quality
  - Word count (50+ = 10pts, 100+ = 15pts)
  - Formatting (tables/structure = 5pts)

### Grade Scale
- A: 90-100%
- B: 80-89%
- C: 70-79%
- D: 60-69%
- F: Below 60%

## Recommendations Priority

### 🔴 Critical (Do First)
1. **Improve topic coverage** - This is causing most failures
   - Update prompts to ensure multi-aspect responses
   - Target: 75%+ topic coverage (currently 12-25%)

2. **Fix agent routing**
   - Compliance agent is handling too many questions
   - Review routing keywords/logic
   - Test routing accuracy

### 🟡 Important (Do Soon)
3. **Enhance operations content** - Lowest scoring category
4. **Add formulation specificity** - Need concrete recipes
5. **Improve science depth** - Add technical details

### 🟢 Nice to Have (Do Eventually)
6. **Optimize response time** - Current 7.8s is acceptable but could be faster
7. **Better off-topic filtering**
8. **Add more marketing strategy depth**

## Quick Stats

- **Test Duration:** 3 minutes 44 seconds
- **Questions Tested:** 23
- **Success Rate:** 100% (all received answers)
- **Average Response Time:** 7.85 seconds
- **Average Word Count:** 476 words
- **Model Used:** openai/gpt-oss-120b

## Expected vs Actual Agents

| Category | Expected Agent | Actual Agent (Most Common) | Match? |
|----------|---------------|---------------------------|--------|
| Business | f8_agent | f8_agent | ✅ |
| Operations | operations | **compliance** | ❌ |
| Compliance | compliance | compliance/f8_agent | ~50% |
| Formulation | formulation | formulation | ✅ |
| Science | science | mixed (science/formulation/compliance) | ~40% |
| Marketing | marketing | **compliance** | ❌ |

**Finding:** Compliance agent is over-utilized, handling questions outside its domain.

## Next Actions

1. ✅ **Test Complete** - All 23 questions tested and graded
2. 📊 **Review Results** - Check detailed JSON for specific gaps
3. 🔧 **Fix Routing** - Adjust agent selection logic
4. 📝 **Improve Prompts** - Enhance topic coverage
5. 🔄 **Re-test** - Run again to measure improvement

---

**Generated:** October 23, 2025  
**Test Script:** `test-chat-formul8-baseline.js`  
**Full Analysis:** `CHAT_FORMUL8_BASELINE_ANALYSIS.md`

