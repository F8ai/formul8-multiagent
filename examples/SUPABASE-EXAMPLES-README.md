# Supabase Integration Examples

This directory contains example implementations for Supabase user authentication and authorization in the Formul8 Multiagent system.

## 📁 Files

### 1. `supabase-integration-example.js`
Complete Express.js server implementation demonstrating:
- User authentication with Supabase
- JWT token verification
- Role-based access control (RBAC)
- Permission-based authorization
- Integration with Formul8 Security SDK
- Secure API endpoints

**Usage:**
```bash
# Install dependencies
npm install express cors @supabase/supabase-js dotenv

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run the server
node examples/supabase-integration-example.js
```

**Endpoints:**
- `GET /health` - Health check (public)
- `GET /api/user` - Get current user data (authenticated)
- `GET /api/user/plan` - Get user plan and features (authenticated)
- `POST /api/chat` - Secure chat endpoint (authenticated)
- `POST /api/admin/update-subscription` - Update user subscription (admin only)
- `POST /api/admin/check-permission` - Check user permission (requires 'manage' permission)
- `GET /api/public/info` - Public information (optional auth)

### 2. `supabase-schema.sql`
Complete SQL schema for Supabase database setup:
- User profiles table
- Subscriptions table
- User roles and permissions table
- Row Level Security (RLS) policies
- Database functions for user management
- Triggers for automatic data management

**Usage:**
1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the entire `supabase-schema.sql` file
5. Execute the query

**Features:**
- ✅ Secure row-level security policies
- ✅ Automatic profile creation on user signup
- ✅ Subscription plan management
- ✅ Role and permission system
- ✅ Helper functions for common operations
- ✅ Automatic timestamp updates

## 📚 Documentation

For complete implementation guides, see:
- [Supabase User Authentication Guide](../f8-security/SUPABASE-USER-AUTH-GUIDE.md) - Comprehensive guide
- [Formul8 Security SDK](../f8-security/README.md) - Security SDK documentation
- [Agent Implementation Guide](../f8-security/AGENT-IMPLEMENTATION-GUIDE.md) - How to implement agents
- [Examples](../f8-security/EXAMPLES.md) - More code examples

## 🎨 Demo Pages

See the `/docs` directory for interactive HTML demos:
- `docs/supabase-user-demo.html` - Interactive user authentication demo with mock data

## 🔒 Security Best Practices

### Environment Variables

**Required:**
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**⚠️ Security Warnings:**
1. **Never commit `.env` files** to version control
2. **Never expose service role keys** to the client
3. **Always use HTTPS** in production
4. **Validate all user input** on both client and server
5. **Implement rate limiting** to prevent abuse
6. **Enable Row Level Security** in Supabase
7. **Regularly rotate API keys** and secrets

### .gitignore

Make sure your `.gitignore` includes:
```
.env
.env.local
.env.production
*.key
```

## 🚀 Quick Start

### 1. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase-schema.sql`
3. Create a test user via Supabase Auth dashboard
4. Copy your project URL and API keys

### 2. Configure Environment

```bash
# Create .env file
cat > .env << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
EOF
```

### 3. Install Dependencies

```bash
npm install express cors @supabase/supabase-js dotenv
```

### 4. Run Example Server

```bash
node examples/supabase-integration-example.js
```

### 5. Test Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Login to get token (you'll need to implement this)
# Then use token for authenticated requests

# Get user data
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/user

# Send chat message
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}' \
  http://localhost:3000/api/chat
```

## 🧪 Testing

### Using Mock Data

The demo page (`docs/supabase-user-demo.html`) includes mock data for testing without Supabase setup:

```bash
# Open in browser
open docs/supabase-user-demo.html
```

### Unit Tests

Create test files using Jest or Mocha:

```javascript
// test/supabase-integration.test.js
const request = require('supertest');
const { app } = require('../examples/supabase-integration-example');

describe('Supabase Integration', () => {
  test('Health check returns 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });
  
  // Add more tests...
});
```

Run tests:
```bash
npm test
```

## 📖 Database Schema

### Tables

#### profiles
Extends Supabase auth.users with additional user information:
- `id` (UUID, primary key) - References auth.users
- `username` (TEXT, unique, required)
- `email` (TEXT, required)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### subscriptions
Manages user subscription plans:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to profiles)
- `plan` (TEXT) - free, standard, micro, operator, enterprise, beta, admin, future4200
- `status` (TEXT) - active, inactive, cancelled, expired, trial
- `started_at` (TIMESTAMPTZ)
- `expires_at` (TIMESTAMPTZ, optional)

#### user_roles
Manages user roles and permissions:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to profiles)
- `role` (TEXT) - user, moderator, admin, superadmin
- `permissions` (TEXT[]) - Array of permissions
- `granted_at` (TIMESTAMPTZ)
- `granted_by` (UUID, optional foreign key to profiles)

### Functions

- `get_user_plan(user_id UUID)` - Get user's current plan
- `has_minimum_tier(user_id UUID, min_tier INTEGER)` - Check if user meets tier requirement
- `has_permission(user_id UUID, permission TEXT)` - Check if user has specific permission
- `get_user_tier(user_id UUID)` - Get user's tier level (1-8)
- `cleanup_expired_subscriptions()` - Mark expired subscriptions

### Triggers

- `update_profiles_updated_at` - Auto-update timestamps on profiles
- `update_subscriptions_updated_at` - Auto-update timestamps on subscriptions
- `update_user_roles_updated_at` - Auto-update timestamps on user_roles
- `on_auth_user_created` - Auto-create profile, subscription, and role on user signup

## 🔧 Troubleshooting

### Common Issues

#### 1. Connection Refused
**Problem:** Cannot connect to Supabase

**Solution:**
```javascript
// Check your environment variables
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Missing');

// Verify URL format
const urlPattern = /^https:\/\/[a-z0-9-]+\.supabase\.co$/;
console.log('Valid URL:', urlPattern.test(process.env.SUPABASE_URL));
```

#### 2. Authentication Failed
**Problem:** JWT token verification fails

**Solution:**
- Check token expiration
- Verify token format (must start with "Bearer ")
- Ensure user exists in database
- Check RLS policies

#### 3. Permission Denied
**Problem:** User cannot access resources

**Solution:**
- Verify RLS policies are correct
- Check user's role and permissions
- Ensure proper authentication middleware order

#### 4. CORS Errors
**Problem:** CORS errors when calling API from frontend

**Solution:**
```javascript
// Update CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 📊 Plan Tiers

The system supports 8 plan tiers:

| Plan | Tier | Description |
|------|------|-------------|
| free | 1 | Basic features only |
| standard | 2 | Standard features |
| micro | 3 | Micro business features |
| operator | 4 | Operator features |
| enterprise | 5 | Enterprise features |
| beta | 6 | Beta testing features |
| admin | 7 | Admin access |
| future4200 | 8 | Community integration |

## 🎯 Use Cases

### 1. User Registration
```javascript
// Client-side: Sign up with Supabase
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password'
});

// Server automatically creates profile, subscription, and role via trigger
```

### 2. Authenticated Request
```javascript
// Client-side: Get current user data
const token = session.access_token;
const response = await fetch('/api/user', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 3. Permission Check
```javascript
// Server-side: Check if user has permission
app.post('/api/restricted', 
  supabaseAuthMiddleware,
  requirePermission('manage'),
  async (req, res) => {
    // User has 'manage' permission
  }
);
```

### 4. Role-Based Access
```javascript
// Server-side: Restrict to admins
app.post('/api/admin/users', 
  supabaseAuthMiddleware,
  requireRole('admin', 'superadmin'),
  async (req, res) => {
    // Only admins and superadmins can access
  }
);
```

## 🤝 Contributing

To contribute new examples:

1. Create your example in the `examples/` directory
2. Add comprehensive comments and documentation
3. Include error handling and security best practices
4. Update this README with your example
5. Add tests if applicable
6. Submit a pull request

## 📄 License

See the [LICENSE](../LICENSE) file in the root directory.

## 📞 Support

- **Documentation:** [f8-security/](../f8-security/)
- **Issues:** [GitHub Issues](https://github.com/F8ai/formul8-multiagent/issues)
- **Email:** security@formul8.ai

---

**Last Updated:** October 2025  
**Maintained by:** Formul8 Team
