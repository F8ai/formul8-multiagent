# FIXME - Critical Issues and Bugs

**Generated:** October 23, 2025  
**Test Date:** October 23, 2025  
**Test Results:** 43 questions tested, Grade F (43.62%)

---

## 🚨 CRITICAL BUGS (Fix Immediately)

### BUG #1: Agent Routing Complete Failure
**Severity:** 🔴 CRITICAL  
**Impact:** 79% of questions incorrectly routed  
**Status:** BROKEN

**Description:**
The LangChain routing system is routing 34 out of 43 questions (79%) to the compliance agent, even when questions are clearly about operations, marketing, sourcing, etc.

**Evidence:**
```
Routing Accuracy: 20.93% (9/43 correct)
- Operations: 0/3 correct (0%)
- Marketing: 0/3 correct (0%)
- Sourcing: 0/3 correct (0%)
- Patent: 0/3 correct (0%)
- Spectra: 0/3 correct (0%)
- Customer Success: 0/3 correct (0%)
- MCR: 0/2 correct (0%)
- Ad: 0/2 correct (0%)
- Editor Agent: 0/2 correct (0%)
- F8 Slackbot: 0/2 correct (0%)
```

**Examples of Incorrect Routing:**
- "How do I optimize my cannabis facility operations?" → compliance ❌ (should be operations)
- "How should I market my cannabis brand on social media?" → compliance ❌ (should be marketing)
- "Where can I source high-quality cannabis seeds?" → compliance ❌ (should be sourcing)

**Root Cause:**
1. LangChain routing prompt not specific enough
2. Agent descriptions too similar
3. No routing confidence scores
4. No fallback logic for low confidence

**Fix Applied:**
- ✅ Updated routing prompts in `config/routing.json`
- ✅ Updated LangChain config in `config/langchain.json`
- ✅ Enhanced agent descriptions in `config/loader.js`

**Still Needed:**
- [ ] Test the updated routing configuration
- [ ] Deploy updated routing to production
- [ ] Add routing confidence threshold
- [ ] Implement fallback keyword matching
- [ ] Add routing decision logging

**Files:**
- `services/langchain-service.js:86-111` - routeToAgent method
- `config/routing.json:29-30` - routing prompt
- `config/langchain.json:31-33` - LangChain routing template
- `config/loader.js:111-120` - getAgentsList method

---

### BUG #2: Baseline Questions Missing from Agent Files
**Severity:** 🔴 CRITICAL  
**Impact:** Cannot properly test or validate agents  
**Status:** BROKEN

**Description:**
Each agent's `baseline.json` file only contains 1 example question instead of the 3-5 real questions defined in `test-all-agents-baseline.js`.

**Evidence:**
```javascript
// agents/compliance-agent/baseline.json
{
  "questions": [
    {
      "id": "compliance-agent-001",
      "question": "Example question for compliance-agent",  // ← Not a real question!
      ...
    }
  ]
}
```

**Expected:**
```javascript
{
  "questions": [
    {
      "id": "compliance-001",
      "question": "What are the compliance requirements for cannabis businesses in California?",
      "category": "compliance",
      "expectedAgent": "compliance",
      "expectedKeywords": ["compliance", "california", "license", "regulation"]
    },
    // ... 3-4 more real questions
  ]
}
```

**Root Cause:**
Baseline files were never populated with actual questions from the test suite.

**Fix Needed:**
- [ ] Populate all 14 agent baseline.json files with real questions
- [ ] Run `scripts/compile-baseline.js` to generate root baseline.json
- [ ] Validate compiled baseline structure
- [ ] Update test scripts to use compiled baseline

**Files Affected:**
- `agents/*/baseline.json` - All 14 agent directories
- `baseline.json` - Root baseline (empty)
- `public/baseline.json` - Public baseline (empty)

---

### BUG #3: No Topic Coverage Validation
**Severity:** 🔴 CRITICAL  
**Impact:** 88% of responses fail to cover multiple topics  
**Status:** BROKEN

**Description:**
Agent responses only cover single topics instead of providing comprehensive multi-aspect answers. Only 5 out of 43 questions (11.6%) covered multiple expected topics.

**Evidence:**
```
Topic Coverage: 12-25% average
- 38 questions covered 0 expected topics
- 5 questions covered 1 topic
- 0 questions covered 2+ topics
```

**Example:**
```
Question: "What are the benefits of cannabis?"
Expected Topics: [medical benefits, therapeutic uses, pain management]
Topics Covered: 0/3
Response: Focused only on compliance requirements
```

**Root Cause:**
1. Agent prompts don't require multi-topic responses
2. No validation of topic coverage
3. Responses are too narrow in scope

**Fix Needed:**
- [ ] Update agent system prompts to require topic coverage
- [ ] Add topic validation logic
- [ ] Create topic coverage guidelines per agent
- [ ] Implement topic detection in grading
- [ ] Add topic coverage monitoring

**Files:**
- `config/langchain.json:35-38` - agent_system template
- `config/langchain-*.json` - All tier configs
- Agent lambda functions - Response generation

---

## 🟠 HIGH PRIORITY BUGS (Fix This Week)

### BUG #4: F8 Agent Over-Routing to Compliance
**Severity:** 🟠 HIGH  
**Impact:** Poor user experience, wrong answers

**Description:**
Questions that should go to f8_agent for general answers are being routed to compliance agent.

**Evidence:**
```
f8_agent routing accuracy: 40% (2/5)
- "What are the benefits of cannabis?" → compliance ❌
- "How do I scale up my cannabis production?" → compliance ❌
- "What is the meaning of life?" → compliance ❌
```

**Fix Needed:**
- [ ] Review f8_agent keywords
- [ ] Add general question detection
- [ ] Update routing rules for general topics

---

### BUG #5: Science Agent Poor Routing
**Severity:** 🟠 HIGH  
**Impact:** Scientific questions getting wrong responses

**Description:**
Science agent only routes correctly 25% of the time (1/4).

**Evidence:**
```
- "What is THC?" → formulation ❌ (should be science)
- "How do I test cannabis potency?" → compliance ❌ (should be science)
- "What is the difference between indica and sativa?" → compliance ❌ (should be science)
```

**Fix Needed:**
- [ ] Review science agent keywords
- [ ] Add scientific term detection
- [ ] Improve science vs formulation routing

---

### BUG #6: Formulation Content Too Generic
**Severity:** 🟠 HIGH  
**Impact:** Users not getting practical recipes/formulas

**Description:**
While formulation routing is 100% accurate, responses lack specific measurements and step-by-step instructions.

**Evidence:**
```
Question: "Create a recipe for cannabis gummies with 10mg THC each"
Grade: F (55%)
Issue: Generic advice without actual recipe, measurements, or instructions
```

**Fix Needed:**
- [ ] Add recipe database or templates
- [ ] Include specific measurements
- [ ] Add step-by-step procedures
- [ ] Include safety warnings

**Files:**
- `agents/formulation-agent/lambda.js` - Response generation
- Add: Recipe templates library

---

### BUG #7: Operations Agent Not Activated
**Severity:** 🟠 HIGH  
**Impact:** 0% routing accuracy, no operational guidance

**Description:**
Operations agent exists in config but never receives questions.

**Evidence:**
```
Operations routing: 0/3 (0%)
All operations questions → compliance agent
```

**Fix Needed:**
- [ ] Verify operations agent deployment status
- [ ] Test operations agent directly
- [ ] Add operations-specific routing examples
- [ ] Enhanced operations keywords

**Files:**
- `config/agents.json:61-75` - Operations agent config
- `config/routing.json` - Add operations routing examples

---

## 🟡 MEDIUM PRIORITY BUGS (Fix Next Week)

### BUG #8: Marketing Agent Not Activated
**Severity:** 🟡 MEDIUM  
**Impact:** Marketing questions getting compliance answers

**Evidence:**
```
Marketing routing: 0/3 (0%)
All marketing questions → compliance agent
```

**Fix Needed:**
- Same as BUG #7 for marketing agent

---

### BUG #9: Sourcing Agent Not Activated
**Severity:** 🟡 MEDIUM

**Evidence:**
```
Sourcing routing: 0/3 (0%)
All sourcing questions → compliance agent
```

**Fix Needed:**
- Same as BUG #7 for sourcing agent

---

### BUG #10: Specialized Agents (Patent, Spectra, etc.) Not Activated
**Severity:** 🟡 MEDIUM  
**Impact:** 8 specialized agents have 0% routing

**Affected Agents:**
- Patent: 0/3
- Spectra: 0/3
- Customer Success: 0/3
- F8 Slackbot: 0/2
- MCR: 0/2
- Ad: 0/2
- Editor Agent: 0/2

**Fix Needed:**
- [ ] Verify deployment status of each agent
- [ ] Test each agent endpoint
- [ ] Add agent-specific routing examples
- [ ] Review agent keywords and specialties

---

### BUG #11: No Routing Confidence Scores
**Severity:** 🟡 MEDIUM  
**Impact:** Cannot detect low-confidence routing decisions

**Description:**
LangChain routing returns only the agent ID without confidence score.

**Fix Needed:**
- [ ] Modify routing to return confidence score
- [ ] Add confidence threshold (e.g., 0.7)
- [ ] Implement fallback for low confidence
- [ ] Log confidence scores for analysis

**Files:**
- `services/langchain-service.js:86-111` - Add confidence scoring

---

### BUG #12: No Routing Decision Logging
**Severity:** 🟡 MEDIUM  
**Impact:** Cannot debug routing issues

**Description:**
Routing decisions are not logged in detail.

**Fix Needed:**
- [ ] Log routing input (question)
- [ ] Log routing output (agent + confidence)
- [ ] Log reasoning/keywords matched
- [ ] Add routing analytics dashboard

---

## 🔵 LOW PRIORITY BUGS (Nice to Fix)

### BUG #13: Response Times Variable
**Severity:** 🔵 LOW  
**Impact:** Inconsistent user experience

**Evidence:**
```
Avg: 6.7s
Min: 1.3s
Max: 10.5s
Range: 9.2s
```

**Fix Needed:**
- [ ] Implement response caching
- [ ] Add timeout warnings
- [ ] Optimize slow endpoints

---

### BUG #14: No Off-Topic Question Detection
**Severity:** 🔵 LOW  
**Impact:** Poor handling of non-cannabis questions

**Evidence:**
```
Question: "What is the meaning of life?"
Routed to: compliance agent
Grade: F (15%)
```

**Fix Needed:**
- [ ] Add off-topic detection
- [ ] Provide scope limitation message
- [ ] Track off-topic patterns

---

### BUG #15: No Error Recovery for Failed Routing
**Severity:** 🔵 LOW  
**Impact:** Edge case handling

**Description:**
If LangChain routing fails, fallback logic is basic keyword matching.

**Fix Needed:**
- [ ] Improve fallback routing logic
- [ ] Add multiple fallback strategies
- [ ] Track fallback usage

---

## 📊 Bug Statistics

### By Severity
- 🔴 Critical: 3 bugs (23%)
- 🟠 High: 4 bugs (31%)
- 🟡 Medium: 6 bugs (46%)
- 🔵 Low: 3 bugs (23%)

### By Category
- Routing: 8 bugs (62%)
- Content: 3 bugs (23%)
- Infrastructure: 2 bugs (15%)
- Monitoring: 2 bugs (15%)

### By Status
- Broken: 3 (23%)
- Partial Fix: 0 (0%)
- Fix In Progress: 0 (0%)
- Not Started: 12 (92%)

---

## 🔧 Quick Fixes Checklist

### Can Fix Today
- [ ] Test updated routing prompts (already deployed to config files)
- [ ] Populate one agent's baseline.json as example
- [ ] Add routing confidence logging

### Can Fix This Week
- [ ] Deploy routing improvements to production
- [ ] Populate all agent baseline.json files
- [ ] Run baseline compilation
- [ ] Test specialized agent routing

### Need More Work
- [ ] Add topic coverage validation
- [ ] Implement routing confidence scores
- [ ] Create routing analytics dashboard
- [ ] Build recipe/template libraries

---

## 🎯 Impact Assessment

### If Bugs Not Fixed
- Routing accuracy stays at 21% (unacceptable)
- 79% of users get wrong agent responses
- Grade stays at F (43.62%)
- User satisfaction low
- System not production-ready

### After Critical Bugs Fixed
- Expected routing accuracy: 70-80%
- Expected overall grade: C-B (70-80%)
- User satisfaction improved
- System production-ready

---

## 📞 Escalation

### Critical Bug Contact
- Owner: Development Team
- Escalate if: Routing accuracy < 50% after fixes
- Timeline: Fix critical bugs within 3 days

---

**Last Updated:** October 23, 2025  
**Next Bug Review:** After critical fixes deployed  
**Test File:** `chat-formul8-comprehensive-results-2025-10-23T22-26-05-509Z.json`

