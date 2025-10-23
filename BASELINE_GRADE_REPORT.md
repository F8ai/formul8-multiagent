# chat.formul8.ai Baseline Grade Report

**Test Date:** October 23, 2025  
**Questions Tested:** 23  
**Endpoint:** https://chat.formul8.ai

---

## 📊 FINAL GRADE: F (55.73%)

### Overall Performance Summary

| Metric | Result | Status |
|--------|--------|--------|
| **Overall Grade** | **F (55.73%)** | ⚠️ Needs Improvement |
| Success Rate | 100% (23/23) | ✅ Excellent |
| Avg Response Time | 7.85 seconds | ✅ Good |
| Avg Word Count | 476 words | ✅ Good |
| Keyword Matching | 75-87% | ✅ Good |
| **Topic Coverage** | **12-25%** | 🔴 **Critical Issue** |

---

## 📈 Grade Distribution

| Grade | Count | Percentage | Bar |
|-------|-------|------------|-----|
| A (Excellent) | 0 | 0.0% | |
| B (Good) | 2 | 8.7% | ██ |
| C (Satisfactory) | 1 | 4.3% | █ |
| D (Below Average) | 7 | 30.4% | ███████ |
| F (Failing) | 13 | 56.5% | █████████████ |

**Summary:** Over half the responses (56.5%) scored below 60%, indicating significant room for improvement.

---

## 📂 Category Grades

| Rank | Category | Questions | Avg Score | Grade | Assessment |
|------|----------|-----------|-----------|-------|------------|
| 🥇 1 | **Business** | 1 | 84.29% | **B** | ✅ Best performer |
| 2 | Science | 4 | 61.07% | D | ⚠️ Below average |
| 3 | Compliance | 4 | 57.38% | F | ⚠️ Needs improvement |
| 4 | General | 1 | 54.29% | F | ⚠️ Needs improvement |
| 5 | Marketing | 3 | 54.29% | F | ⚠️ Needs improvement |
| 6 | Formulation | 4 | 54.05% | F | ⚠️ Needs improvement |
| 7 | Off-topic | 2 | 50.84% | F | ⚠️ Inconsistent |
| 🥉 8 | **Operations** | 4 | 47.14% | **F** | 🔴 Worst performer |

---

## 🎯 Individual Question Scores

### Top 5 Best Responses

| # | Question | Score | Grade | Agent |
|---|----------|-------|-------|-------|
| 1 | What is the meaning of life? | 86.67% | B | compliance |
| 2 | I want to start a cannabis business | 84.29% | B | f8_agent |
| 3 | How do I make cannabis edibles? | 73.33% | C | formulation |
| 4 | What are terpenes? | 68.33% | D | science |
| 5 | What is THC? | 66.67% | D | formulation |

### Bottom 5 Worst Responses

| # | Question | Score | Grade | Agent |
|---|----------|-------|-------|-------|
| 1 | How do I optimize my cannabis facility operations? | 31.43% | F | compliance ❌ |
| 2 | Create a recipe for cannabis gummies with 10mg THC each | 40.00% | F | formulation |
| 3 | How do I build brand awareness for cannabis products? | 42.86% | F | compliance ❌ |
| 4 | What is the difference between indica and sativa? | 54.29% | F | compliance ❌ |
| 5 | How do I calculate THC dosage? | 48.57% | F | formulation |

**Key Observation:** Many low scores involve wrong agent routing (marked ❌)

---

## 🔍 Detailed Score Breakdown

### Scoring Components (100 points total)

| Component | Weight | Avg Score | Performance |
|-----------|--------|-----------|-------------|
| Keyword Matching | 40 pts | 30-35 pts | ✅ 75-87% (Good) |
| **Topic Coverage** | 40 pts | **5-10 pts** | 🔴 **12-25% (Critical)** |
| Response Quality | 20 pts | 20 pts | ✅ 100% (Excellent) |

**Analysis:** The low topic coverage is dragging down overall scores despite good keyword matching and quality.

---

## 🚨 Critical Issues Identified

### 1. Poor Topic Coverage (🔴 Critical)
- **Current:** Only 12-25% of expected topics addressed
- **Target:** 75%+
- **Impact:** Causing 60% of questions to fail
- **Example:** "What are the benefits of cannabis?" - Keywords ✅ (6/7) but Topics ❌ (0/3)

### 2. Agent Routing Problems (🟡 Important)
- **Issue:** Compliance agent handling ~60% of all questions
- **Impact:** Wrong agent = wrong focus = lower scores
- **Examples:**
  - Operations questions → compliance agent (should be operations)
  - Marketing questions → compliance agent (should be marketing)
  - Science questions → mixed agents (inconsistent)

### 3. Formulation Lacks Specificity (🟡 Important)
- **Issue:** Generic advice instead of concrete recipes
- **Impact:** Formulation category scores only 54.05%
- **Example:** "Create a recipe for cannabis gummies" - scored only 40%

---

## ✅ What's Working Well

1. **Perfect Reliability**
   - 100% success rate - no failures, timeouts, or errors
   - All 23 questions received responses

2. **Fast Response Times**
   - Average: 7.85 seconds
   - Range: 1.7s - 13.7s
   - Acceptable for AI chat

3. **Comprehensive Content**
   - Average: 476 words per response
   - All responses exceeded 50 words minimum
   - 85% include tables/structured formatting

4. **Strong Keyword Matching**
   - 75-87% of expected keywords found
   - Shows domain knowledge is present
   - Just needs deeper exploration

5. **Good Formatting**
   - Tables, bullet points, structured content
   - Easy to read and scan
   - Professional presentation

---

## 🎯 Improvement Roadmap

### Phase 1: Critical Fixes (Target: +20-25%)

1. **Fix Topic Coverage**
   - Update prompts to ensure multi-aspect responses
   - Require 3-4 topic areas per response
   - **Expected gain:** +15-20%

2. **Fix Agent Routing**
   - Review routing keywords
   - Tune routing logic
   - Add routing accuracy tests
   - **Expected gain:** +5-10%

### Phase 2: Content Enhancement (Target: +10-15%)

3. **Enhance Operations Content**
   - Add facility management guidance
   - Include operational best practices
   - **Expected gain:** +5-8%

4. **Add Formulation Specificity**
   - Include concrete recipes
   - Add measurement details
   - Provide step-by-step instructions
   - **Expected gain:** +5-7%

### Phase 3: Quality Improvements (Target: +5-10%)

5. **Increase Science Depth**
   - Add research references
   - Include technical details
   - **Expected gain:** +3-5%

6. **Improve Compliance Detail**
   - Add jurisdiction-specific info
   - Reference regulatory bodies
   - **Expected gain:** +2-3%

### Target After Improvements

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Overall Grade | F (55.73%) | B (80%+) | +24.27% |
| Topic Coverage | 12-25% | 75%+ | +50% |
| Operations Category | F (47.14%) | C (70%+) | +22.86% |
| Formulation Category | F (54.05%) | C (70%+) | +15.95% |

---

## 📁 Generated Files

All test results are available in these files:

1. **`chat-formul8-baseline-results-2025-10-23T21-59-36-684Z.json`**
   - Complete API responses
   - Full grading details
   - Timestamp and metadata

2. **`chat-formul8-baseline-summary-2025-10-23T21-59-36-684Z.md`**
   - Question-by-question breakdown
   - Individual scores and grades
   - Agent routing information

3. **`CHAT_FORMUL8_BASELINE_ANALYSIS.md`**
   - Executive summary
   - Strategic recommendations
   - Detailed analysis

4. **`BASELINE_TEST_QUICK_GUIDE.md`**
   - Quick reference
   - Visual charts
   - Action items

5. **`test-chat-formul8-baseline.js`**
   - Reusable test script
   - Run anytime to re-test

---

## 🔄 How to Re-Test

After implementing improvements:

```bash
cd /Users/danielmcshan/GitHub/formul8-multiagent
node test-chat-formul8-baseline.js
```

The script will automatically:
- Test all 23 questions
- Grade each response
- Generate new timestamped reports
- Show improvement vs baseline

---

## 📊 Agent Performance Analysis

### Agent Routing Accuracy

| Expected Agent | Actual Agent(s) | Match Rate | Issue |
|----------------|----------------|------------|-------|
| f8_agent | f8_agent | ✅ 100% | Good |
| formulation | formulation | ✅ 100% | Good |
| operations | **compliance** | ❌ 0% | Critical |
| marketing | **compliance** | ❌ 0% | Critical |
| science | mixed | ⚠️ 40% | Needs work |
| compliance | compliance/f8 | ⚠️ 50% | Needs work |

**Finding:** Compliance agent is handling too many questions outside its specialty.

---

## 💡 Key Insights

1. **System is Stable** ✅
   - No technical failures
   - Consistent response times
   - Good infrastructure

2. **Content Needs Depth** ⚠️
   - Keywords present but topics missing
   - Surface-level vs comprehensive coverage
   - Easy to fix with prompt updates

3. **Routing Needs Tuning** ⚠️
   - Over-reliance on compliance agent
   - Specialized agents underutilized
   - Fixable with routing logic updates

4. **Quick Wins Available** 💡
   - Fix topic coverage → +15-20%
   - Fix routing → +5-10%
   - Target B grade achievable

---

## 📝 Conclusion

**Current State:** chat.formul8.ai is functional and reliable (100% uptime) but responses lack the depth needed for comprehensive answers.

**Main Issue:** Only 12-25% of expected topics are covered, despite good keyword matching (75-87%).

**Recommendation:** Focus on improving topic coverage through prompt engineering and fixing agent routing. These two changes alone could improve the grade from F (55.73%) to B (80%+).

**Next Actions:**
1. ✅ Review this report
2. 🔄 Fix topic coverage in prompts
3. 🔄 Tune agent routing logic
4. 🔄 Re-test to measure improvement
5. 🔄 Iterate until B+ grade achieved

---

**Report Generated:** October 23, 2025  
**Test Script:** `test-chat-formul8-baseline.js`  
**Detailed Results:** `chat-formul8-baseline-results-2025-10-23T21-59-36-684Z.json`

