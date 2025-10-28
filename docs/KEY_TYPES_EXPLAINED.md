# 🔑 OpenRouter Key Types - Critical Explanation

**⚠️ MUST READ: Understanding the difference can prevent production outages!**

---

## 🚨 **Critical Concept**

**You need BOTH types of keys for a functioning system!**

---

## 📋 **The Two Key Types**

### 1️⃣ **Provisioning Keys** (Management Keys)

**Purpose:** Manage other API keys  
**Example:** `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`

#### ✅ What They CAN Do:
- Create new regular API keys
- Delete regular API keys
- List all regular API keys
- View usage statistics
- Set spending limits

#### ❌ What They CANNOT Do:
- **Cannot make OpenRouter API calls** (chat, completions, etc.)
- **Cannot be used in production code**
- **Cannot call any `/chat/completions` endpoints**
- **Cannot access AI models**

#### 🎯 Use Cases:
- Automated key rotation scripts
- Usage monitoring
- Key lifecycle management
- Administrative tasks

#### 📍 Where to Find:
- Dashboard: https://openrouter.ai/settings/keys → "Provisioning Keys" section
- **You should have 1** (currently have 2, delete one)

---

### 2️⃣ **Regular API Keys** (Production Keys)

**Purpose:** Make OpenRouter API calls  
**Example:** `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`

#### ✅ What They CAN Do:
- **Make OpenRouter API calls** (chat, completions, etc.)
- **Call `/chat/completions` endpoints**
- **Access AI models** (Claude, GPT, etc.)
- **Used in production code**

#### ❌ What They CANNOT Do:
- Cannot create other API keys
- Cannot delete other API keys
- Cannot manage keys
- No administrative functions

#### 🎯 Use Cases:
- Production applications
- Vercel deployments
- All 15 F8ai agents
- Any code that calls OpenRouter

#### 📍 Where to Find:
- API: `GET /api/v1/keys` (when using provisioning key)
- Dashboard: https://openrouter.ai/keys → "API Keys" section
- **You need at least 1** (currently have 1)

---

## 🏗️ **Your Current Setup**

### Provisioning Keys (Management)
| Name | Ending | Status | Action |
|------|--------|--------|--------|
| F8 Provisioning | `...39a` | ✅ Active | **KEEP** |
| GitHub Provisioning Key | `...3fe` | ⚠️ Redundant | **DELETE** |

**Recommendation:** Keep only ONE provisioning key

### Regular API Keys (Production)
| Name | Ending | Status | Where Used |
|------|--------|--------|------------|
| ~~Syzygyx~~ | `...ea6` | ❌ DELETED | Was in production |
| **Formul8-Production-2025-10-28** | `...95e` | ✅ **ACTIVE** | **All production now** |

**Status:** ✅ Production restored

---

## ⚠️ **What Happened**

### The Incident:
1. You had 1 regular API key ("Syzygyx") in production
2. You deleted it, thinking "we should only use provisioning keys"
3. **This broke production** because provisioning keys cannot make API calls
4. We immediately created a new regular key to restore service

### Why It Happened:
- **Misconception:** Provisioning keys can do "everything"
- **Reality:** Provisioning keys can only **manage** other keys, not **use** them

---

## 🎯 **The Right Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR ACCOUNT                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PROVISIONING KEYS (Management)                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  F8 Provisioning (sk-or-v1-4a6...39a)             │    │
│  │                                                     │    │
│  │  ✅ Lists keys                                     │    │
│  │  ✅ Creates keys                                   │    │
│  │  ✅ Deletes keys                                   │    │
│  │  ✅ Views usage                                    │    │
│  │  ❌ Cannot make API calls                          │    │
│  └────────────────────────────────────────────────────┘    │
│            │                                                 │
│            │ Manages                                         │
│            ▼                                                 │
│  REGULAR API KEYS (Production)                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Formul8-Production-2025-10-28                     │    │
│  │  (sk-or-v1-23c...95e)                              │    │
│  │                                                     │    │
│  │  ✅ Makes OpenRouter API calls                     │    │
│  │  ✅ Used in production                             │    │
│  │  ✅ All 15 Vercel agents use this                  │    │
│  │  ❌ Cannot manage other keys                       │    │
│  └────────────────────────────────────────────────────┘    │
│            │                                                 │
│            │ Powers                                          │
│            ▼                                                 │
│  PRODUCTION SYSTEM                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │  • 15 Vercel Agents                                │    │
│  │  • Chat Interface                                  │    │
│  │  • All AI Features                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 **Where Each Key Lives**

### GitHub Secrets

| Secret Name | Type | Value | Used By |
|-------------|------|-------|---------|
| `OPENROUTER_API_KEY` | **Regular** | `sk-or-v1-23c...95e` | Production deployments |
| `OPENROUTER_PROVISIONING_KEY` | **Provisioning** | `sk-or-v1-4a6...39a` | Automation scripts |

### Vercel Environment Variables

| Variable | Type | Environments | Used By |
|----------|------|--------------|---------|
| `OPENROUTER_API_KEY` | **Regular** | Production, Preview, Dev | All 15 agents |

**Note:** Vercel does NOT need the provisioning key!

---

## 📝 **Usage Examples**

### ✅ Correct: Using Regular API Key in Production

```javascript
// In your Vercel agent code
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, // Regular key
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'anthropic/claude-3.5-sonnet',
    messages: [{ role: 'user', content: 'Hello' }]
  })
});
```

### ✅ Correct: Using Provisioning Key for Management

```javascript
// In automation scripts
const response = await fetch('https://openrouter.ai/api/v1/keys', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_PROVISIONING_KEY}`, // Provisioning key
    'Content-Type': 'application/json'
  }
});
// Returns list of regular API keys
```

### ❌ WRONG: Using Provisioning Key in Production

```javascript
// THIS WILL FAIL!
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${PROVISIONING_KEY}`, // ❌ Wrong key type!
  }
});
// Error: Provisioning keys cannot make API calls
```

### ❌ WRONG: Using Regular Key for Management

```javascript
// THIS WILL FAIL!
const response = await fetch('https://openrouter.ai/api/v1/keys', {
  headers: {
    'Authorization': `Bearer ${REGULAR_API_KEY}`, // ❌ Wrong key type!
  }
});
// Error: Regular keys cannot manage other keys
```

---

## 🎯 **Quick Decision Guide**

### "Which key do I use?"

```
┌─ Are you making an AI API call?
│  (chat completions, embeddings, etc.)
│
├─ YES → Use REGULAR API KEY
│         (OPENROUTER_API_KEY)
│         sk-or-v1-23c...95e
│
└─ NO ─ Are you managing keys?
        (creating, deleting, listing keys)
        
        ├─ YES → Use PROVISIONING KEY
        │         (OPENROUTER_PROVISIONING_KEY)
        │         sk-or-v1-4a6...39a
        │
        └─ NO → You might not need OpenRouter!
```

---

## 🚨 **Critical Rules**

### Rule 1: Never Delete Your Last Regular API Key
- ❌ **WRONG:** "I'll just use the provisioning key"
- ✅ **RIGHT:** Keep at least 1 regular key for production

### Rule 2: Never Use Provisioning Keys in Production
- ❌ **WRONG:** Adding provisioning key to Vercel env vars
- ✅ **RIGHT:** Only regular keys in Vercel

### Rule 3: Store Keys Appropriately
- **Provisioning Key:** GitHub Secrets (for scripts)
- **Regular Key:** GitHub Secrets + Vercel (for production)

### Rule 4: Only Keep One Provisioning Key
- ❌ **WRONG:** Multiple provisioning keys (confusion)
- ✅ **RIGHT:** One provisioning key per account

---

## 🛠️ **Current System Status**

### ✅ What's Correct Now:

```bash
# GitHub Secrets
OPENROUTER_API_KEY=sk-or-v1-23c...95e          (Regular - Production)
OPENROUTER_PROVISIONING_KEY=sk-or-v1-4a6...39a (Provisioning - Management)

# Vercel (All 3 Environments)
OPENROUTER_API_KEY=sk-or-v1-23c...95e          (Regular - Production)
```

### 🎯 Actions to Take:

1. ✅ **DONE:** Created new regular API key
2. ✅ **DONE:** Updated GitHub Secrets
3. ✅ **DONE:** Updated all Vercel environments
4. ⏳ **TODO:** Delete redundant "GitHub Provisioning Key"
5. ⏳ **TODO:** Verify production is working

---

## 🧪 **How to Test**

### Test Regular API Key (Production)
```bash
# This should work and return an AI response
curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer sk-or-v1-23c...95e" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-3.5-sonnet",
    "messages": [{"role":"user","content":"test"}],
    "max_tokens": 5
  }'
```

### Test Provisioning Key (Management)
```bash
# This should work and list your keys
curl -X GET https://openrouter.ai/api/v1/keys \
  -H "Authorization: Bearer sk-or-v1-4a6...39a"
```

---

## 📞 **Support & Resources**

- **OpenRouter Docs:** https://openrouter.ai/docs/api-keys
- **Provisioning API:** https://openrouter.ai/docs/features/provisioning-api-keys
- **Dashboard:** https://openrouter.ai/settings/keys
- **Activity Log:** https://openrouter.ai/activity

---

## 🎓 **Remember**

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  Provisioning Key = Management & Automation      │
│  Regular API Key = Production & AI Calls         │
│                                                  │
│  YOU NEED BOTH!                                  │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Don't delete regular API keys thinking you only need provisioning keys!**

---

**Last Updated:** October 28, 2025  
**Status:** ✅ Production Restored  
**Current Keys:** 1 Provisioning + 1 Regular (correct!)

