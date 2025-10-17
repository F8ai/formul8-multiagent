# Per-User OpenRouter API Keys Implementation Guide

This guide explains how to implement per-user OpenRouter API keys for better cost attribution, usage tracking, and security isolation in the Formul8 multi-agent platform.

## 🎯 Overview

### Benefits of Per-User Keys

1. **Cost Attribution**: Track and bill usage per user
2. **Usage Limits**: Set individual spending limits per user
3. **Security**: Isolate user data and prevent cross-user access
4. **Compliance**: Better audit trails and data governance
5. **Scalability**: Distribute API load across multiple keys
6. **Analytics**: Detailed usage analytics per user

### Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Request  │───►│  Auth Middleware│───►│ User API Key    │
│                 │    │                 │    │ Middleware      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Supabase      │    │   OpenRouter    │
                       │   User Data     │    │   API Call      │
                       └─────────────────┘    └─────────────────┘
```

## 📋 Implementation Steps

### Step 1: Database Schema Setup

1. **Run the main Supabase schema** (if not already done):
   ```bash
   # In Supabase SQL Editor, run:
   # examples/supabase-schema.sql
   ```

2. **Add the user API keys extension**:
   ```bash
   # In Supabase SQL Editor, run:
   # examples/supabase-user-api-keys-schema.sql
   ```

### Step 2: Environment Variables

Add these to your `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter Configuration
OPENROUTER_PROVISIONING_KEY=sk-or-v1-your-provisioning-key
```

### Step 3: Install Dependencies

```bash
npm install @supabase/supabase-js
```

### Step 4: Update Your Application

#### 4.1 Add Middleware to Your Express App

```javascript
// server.js or app.js
import { setupUserApiKeyMiddleware } from './middleware/user-api-key-middleware.js';

// Setup user API key middleware
setupUserApiKeyMiddleware(app);
```

#### 4.2 Update Agent Code to Use User Keys

```javascript
// In your agent code
export async function makeOpenRouterRequest(userId, requestData) {
  // The middleware will automatically inject the user's API key
  // Just make sure to include the user context in your request
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId, // This will be used by middleware
      // 'X-OpenRouter-API-Key' will be injected by middleware
    },
    body: JSON.stringify(requestData)
  });
  
  return response.json();
}
```

### Step 5: Create API Keys for Users

#### 5.1 For New Users (Automatic)

Update your user registration flow:

```javascript
// In your user registration handler
import { createApiKeyForNewUser } from './services/user-api-key-service.js';
import { createUserKey } from './scripts/openrouter-key-manager.js';

export async function handleUserRegistration(userId) {
  // Create OpenRouter key
  const keyData = await createUserKey(userId);
  
  // Store in Supabase
  await createUserApiKey(
    userId,
    keyData.id,
    keyData.name,
    keyData.monthlyLimit
  );
}
```

#### 5.2 For Existing Users (Manual)

```bash
# Create key for specific user
node scripts/openrouter-key-manager.js create-user "user-uuid-here" 50.00

# Then manually store in Supabase using the returned key data
```

### Step 6: Usage Monitoring

#### 6.1 Check User Status

```javascript
// GET /api/user-api-key/status
// Returns user's API key status and usage
```

#### 6.2 Admin Dashboard

```javascript
// Get all users with API keys
import { getAllUsersWithKeys } from './services/user-api-key-service.js';

const usersWithKeys = await getAllUsersWithKeys();
```

## 🔧 Configuration

### Subscription Tier Limits

Default monthly limits by subscription tier:

| Tier | Monthly Limit |
|------|---------------|
| free | $10 |
| standard | $50 |
| micro | $100 |
| operator | $250 |
| enterprise | $500 |
| beta | $1,000 |
| admin | Unlimited |
| future4200 | Unlimited |

### Custom Limits

Users can have custom limits set by admins:

```javascript
import { updateUserApiKey } from './services/user-api-key-service.js';

// Set custom limit for user
await updateUserApiKey(userId, {
  monthly_limit: 200.00
});
```

## 📊 Usage Tracking

### Automatic Logging

The middleware automatically logs:
- Request tokens
- Response tokens
- Total tokens
- Cost in USD
- Model used
- Agent name
- Request duration

### Usage Analytics

```javascript
// Get user's monthly usage
import { getUserUsageSummary } from './services/user-api-key-service.js';

const usage = await getUserUsageSummary(userId);
console.log(usage);
// {
//   total_requests: 150,
//   total_tokens: 45000,
//   total_cost: 45.50,
//   model_breakdown: {
//     "anthropic/claude-3.5-sonnet": {
//       requests: 100,
//       tokens: 30000,
//       cost: 30.00
//     }
//   }
// }
```

## 🔄 Key Rotation

### Automatic Rotation (Monthly)

The GitHub Action will rotate all system keys monthly. For user keys, you can:

```bash
# Rotate specific user's key
node scripts/openrouter-key-manager.js rotate-user "user-uuid" --delete-old
```

### Manual Rotation

```bash
# Create new key for user
node scripts/openrouter-key-manager.js create-user "user-uuid" 100.00

# Update in Supabase
# Deactivate old key
# Activate new key
```

## 🛡️ Security Considerations

### 1. Key Storage

- **Never store actual API keys** in the database
- Store only the OpenRouter key ID
- Use Supabase RLS policies for access control

### 2. Access Control

- Users can only access their own keys
- Admins can view all keys
- Service role can manage all keys

### 3. Rate Limiting

- Each user has their own rate limits
- Prevents one user from affecting others
- Better isolation and security

## 🚨 Error Handling

### Common Errors

1. **No API Key Found**
   ```json
   {
     "error": "No API key found",
     "message": "User does not have an API key configured"
   }
   ```

2. **Usage Limit Exceeded**
   ```json
   {
     "error": "Monthly usage limit exceeded",
     "message": "You have exceeded your monthly API usage limit",
     "limit": 50.00,
     "currentUsage": 52.30
   }
   ```

3. **Invalid API Key**
   ```json
   {
     "error": "Invalid API key",
     "message": "Your API key is invalid or has expired"
   }
   ```

## 📈 Monitoring & Alerts

### Usage Alerts

Set up alerts for:
- Users approaching their limits (80% threshold)
- Users who have exceeded limits
- Unusual usage patterns

### Cost Monitoring

- Daily cost reports
- Monthly usage summaries
- Per-user cost breakdowns

## 🔧 Troubleshooting

### User Can't Make API Calls

1. Check if user has an active API key
2. Verify usage limit hasn't been exceeded
3. Check OpenRouter key is still valid
4. Review middleware logs

### High Costs

1. Check for users with unlimited limits
2. Review usage patterns
3. Consider implementing stricter limits
4. Monitor for abuse

### Performance Issues

1. Check database indexes
2. Monitor query performance
3. Consider caching frequently accessed data
4. Review middleware overhead

## 📚 API Reference

### Database Functions

- `get_user_api_key(user_uuid)` - Get user's active API key
- `check_usage_limit(user_uuid)` - Check if user is within limit
- `get_user_usage_summary(user_uuid, month_date)` - Get usage summary
- `reset_monthly_usage()` - Reset all monthly usage (run monthly)

### Service Functions

- `getUserApiKey(userId)` - Get user's API key
- `createUserApiKey(userId, openrouterKeyId, keyName, monthlyLimit)` - Create new key
- `updateUserApiKey(userId, updates)` - Update key settings
- `logApiUsage(userId, apiKeyId, usageData)` - Log usage
- `checkUserUsageLimit(userId)` - Check usage limit

## 🎯 Next Steps

1. **Implement the database schema**
2. **Add middleware to your application**
3. **Create API keys for existing users**
4. **Set up monitoring and alerts**
5. **Test with a few users first**
6. **Gradually roll out to all users**

## 📞 Support

For issues or questions:
1. Check the logs in `logs/`
2. Review Supabase logs
3. Test with the health check endpoint
4. Contact the F8 DevOps team

This implementation provides a robust, scalable solution for per-user API key management with comprehensive tracking and security features.

