-- ========================================
-- Supabase Database Schema for User Authentication
-- ========================================
-- 
-- This schema creates the necessary tables and policies for
-- user authentication and authorization in the Formul8 system.
--
-- INSTRUCTIONS:
-- 1. Open your Supabase project dashboard
-- 2. Go to SQL Editor
-- 3. Create a new query
-- 4. Paste this entire file
-- 5. Run the query
--
-- @see f8-security/SUPABASE-USER-AUTH-GUIDE.md for complete documentation

-- ========================================
-- DROP EXISTING TABLES (optional - for clean slate)
-- ========================================
-- Uncomment these lines if you want to reset the database
-- WARNING: This will delete all data!

-- DROP TABLE IF EXISTS user_roles CASCADE;
-- DROP TABLE IF EXISTS subscriptions CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- ========================================
-- PROFILES TABLE
-- ========================================
-- Extends Supabase auth.users with additional user information

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 50),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Add comment
COMMENT ON TABLE profiles IS 'User profile information extending Supabase auth.users';

-- ========================================
-- SUBSCRIPTIONS TABLE
-- ========================================
-- Stores user subscription plans and status

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN (
    'free',
    'standard', 
    'micro',
    'operator',
    'enterprise',
    'beta',
    'admin',
    'future4200'
  )),
  status TEXT NOT NULL CHECK (status IN (
    'active',
    'inactive',
    'cancelled',
    'expired',
    'trial'
  )),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one subscription per user
  UNIQUE(user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);

-- Add comment
COMMENT ON TABLE subscriptions IS 'User subscription plans and billing status';

-- ========================================
-- USER_ROLES TABLE
-- ========================================
-- Stores user roles and permissions

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'user',
    'moderator',
    'admin',
    'superadmin'
  )),
  permissions TEXT[] NOT NULL DEFAULT ARRAY['read'],
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one role per user
  UNIQUE(user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Add comment
COMMENT ON TABLE user_roles IS 'User roles and permissions for authorization';

-- ========================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- ROW LEVEL SECURITY POLICIES - PROFILES
-- ========================================

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (for signup)
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Service role can manage all profiles (for admin operations)
CREATE POLICY "Service role can manage all profiles"
  ON profiles
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ========================================
-- ROW LEVEL SECURITY POLICIES - SUBSCRIPTIONS
-- ========================================

-- Allow users to view their own subscription
CREATE POLICY "Users can view their own subscription"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for admin/billing operations)
CREATE POLICY "Service role can manage all subscriptions"
  ON subscriptions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Allow admins to view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'superadmin')
    )
  );

-- ========================================
-- ROW LEVEL SECURITY POLICIES - USER_ROLES
-- ========================================

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
  ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all roles (for admin operations)
CREATE POLICY "Service role can manage all roles"
  ON user_roles
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Allow admins to view all user roles
CREATE POLICY "Admins can view all user roles"
  ON user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'superadmin')
    )
  );

-- ========================================
-- DATABASE FUNCTIONS
-- ========================================

-- Function to get user's current plan
CREATE OR REPLACE FUNCTION get_user_plan(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT plan FROM subscriptions WHERE user_id = $1 AND status = 'active' LIMIT 1),
    'free'
  );
$$;

COMMENT ON FUNCTION get_user_plan IS 'Get the current active plan for a user, defaults to free';

-- Function to check if user has minimum tier
CREATE OR REPLACE FUNCTION has_minimum_tier(user_id UUID, min_tier INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan TEXT;
  plan_tier INTEGER;
BEGIN
  -- Get user's current plan
  user_plan := get_user_plan(user_id);
  
  -- Map plan to tier level
  plan_tier := CASE user_plan
    WHEN 'free' THEN 1
    WHEN 'standard' THEN 2
    WHEN 'micro' THEN 3
    WHEN 'operator' THEN 4
    WHEN 'enterprise' THEN 5
    WHEN 'beta' THEN 6
    WHEN 'admin' THEN 7
    WHEN 'future4200' THEN 8
    ELSE 1
  END;
  
  RETURN plan_tier >= min_tier;
END;
$$;

COMMENT ON FUNCTION has_minimum_tier IS 'Check if user meets minimum tier requirement';

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM user_roles
    WHERE user_id = $1 AND permission = ANY(permissions)
  );
$$;

COMMENT ON FUNCTION has_permission IS 'Check if user has a specific permission';

-- Function to get user's tier level
CREATE OR REPLACE FUNCTION get_user_tier(user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT CASE get_user_plan(user_id)
    WHEN 'free' THEN 1
    WHEN 'standard' THEN 2
    WHEN 'micro' THEN 3
    WHEN 'operator' THEN 4
    WHEN 'enterprise' THEN 5
    WHEN 'beta' THEN 6
    WHEN 'admin' THEN 7
    WHEN 'future4200' THEN 8
    ELSE 1
  END;
$$;

COMMENT ON FUNCTION get_user_tier IS 'Get the tier level (1-8) for a user based on their plan';

-- ========================================
-- TRIGGERS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for subscriptions table
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_roles table
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  -- Create default subscription
  INSERT INTO subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  
  -- Create default role
  INSERT INTO user_roles (user_id, role, permissions)
  VALUES (NEW.id, 'user', ARRAY['read', 'write']);
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ========================================
-- SAMPLE DATA (optional)
-- ========================================
-- Uncomment to insert sample test data
-- WARNING: Only use in development/testing!

/*
-- Note: You'll need to create users through Supabase Auth first
-- Then you can update their profiles, subscriptions, and roles

-- Example: Update existing user to admin
-- UPDATE subscriptions SET plan = 'admin', status = 'active' 
-- WHERE user_id = 'your-user-uuid';

-- UPDATE user_roles SET role = 'admin', permissions = ARRAY['read', 'write', 'manage', 'admin']
-- WHERE user_id = 'your-user-uuid';
*/

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Run these to verify the schema was created correctly

-- Check if tables exist
SELECT tablename, schemaname 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'subscriptions', 'user_roles');

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'subscriptions', 'user_roles');

-- Check if functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_user_plan', 'has_minimum_tier', 'has_permission', 'get_user_tier');

-- ========================================
-- CLEANUP FUNCTIONS (optional)
-- ========================================

-- Function to clean up expired subscriptions
CREATE OR REPLACE FUNCTION cleanup_expired_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_subscriptions IS 'Mark expired subscriptions as expired';

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Schema creation completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - profiles';
  RAISE NOTICE '  - subscriptions';
  RAISE NOTICE '  - user_roles';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  - get_user_plan()';
  RAISE NOTICE '  - has_minimum_tier()';
  RAISE NOTICE '  - has_permission()';
  RAISE NOTICE '  - get_user_tier()';
  RAISE NOTICE '  - cleanup_expired_subscriptions()';
  RAISE NOTICE '';
  RAISE NOTICE 'Row Level Security: ENABLED';
  RAISE NOTICE 'Triggers: ENABLED';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Create test users via Supabase Auth';
  RAISE NOTICE '  2. Configure your application with Supabase credentials';
  RAISE NOTICE '  3. See SUPABASE-USER-AUTH-GUIDE.md for implementation';
  RAISE NOTICE '========================================';
END $$;
