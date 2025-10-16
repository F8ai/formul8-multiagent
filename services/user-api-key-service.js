/**
 * User API Key Service
 * Manages per-user OpenRouter API keys in Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Get user's active API key
 */
export async function getUserApiKey(userId) {
  try {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user API key:', error);
    throw error;
  }
}

/**
 * Create a new API key for a user
 */
export async function createUserApiKey(userId, openrouterKeyId, keyName, monthlyLimit = null) {
  try {
    const { data, error } = await supabase
      .from('user_api_keys')
      .insert({
        user_id: userId,
        openrouter_key_id: openrouterKeyId,
        key_name: keyName,
        monthly_limit: monthlyLimit,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating user API key:', error);
    throw error;
  }
}

/**
 * Update user's API key
 */
export async function updateUserApiKey(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('user_api_keys')
      .update(updates)
      .eq('user_id', userId)
      .eq('status', 'active')
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating user API key:', error);
    throw error;
  }
}

/**
 * Deactivate user's current API key
 */
export async function deactivateUserApiKey(userId) {
  try {
    const { data, error } = await supabase
      .from('user_api_keys')
      .update({ status: 'inactive' })
      .eq('user_id', userId)
      .eq('status', 'active')
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error deactivating user API key:', error);
    throw error;
  }
}

/**
 * Check if user has exceeded their monthly limit
 */
export async function checkUserUsageLimit(userId) {
  try {
    const { data, error } = await supabase
      .rpc('check_usage_limit', { user_uuid: userId });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error checking usage limit:', error);
    throw error;
  }
}

/**
 * Get user's usage summary for current month
 */
export async function getUserUsageSummary(userId, monthDate = null) {
  try {
    const { data, error } = await supabase
      .rpc('get_user_usage_summary', { 
        user_uuid: userId,
        month_date: monthDate || new Date().toISOString().split('T')[0]
      });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching usage summary:', error);
    throw error;
  }
}

/**
 * Log API usage for a user
 */
export async function logApiUsage(userId, apiKeyId, usageData) {
  try {
    const { data, error } = await supabase
      .from('api_usage_logs')
      .insert({
        user_id: userId,
        api_key_id: apiKeyId,
        model: usageData.model,
        request_tokens: usageData.requestTokens || 0,
        response_tokens: usageData.responseTokens || 0,
        total_tokens: usageData.totalTokens || 0,
        cost_usd: usageData.costUsd || 0,
        endpoint: usageData.endpoint,
        agent_name: usageData.agentName,
        request_duration_ms: usageData.durationMs
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error logging API usage:', error);
    throw error;
  }
}

/**
 * Get all users with API keys (admin function)
 */
export async function getAllUsersWithKeys() {
  try {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          email
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching users with keys:', error);
    throw error;
  }
}

/**
 * Reset monthly usage for all users (run monthly)
 */
export async function resetAllMonthlyUsage() {
  try {
    const { data, error } = await supabase
      .rpc('reset_monthly_usage');

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error resetting monthly usage:', error);
    throw error;
  }
}

/**
 * Get user's subscription tier for determining API limits
 */
export async function getUserSubscriptionTier(userId) {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    throw error;
  }
}

/**
 * Get default monthly limit based on subscription tier
 */
export function getDefaultMonthlyLimit(subscriptionPlan) {
  const limits = {
    'free': 10.00,
    'standard': 50.00,
    'micro': 100.00,
    'operator': 250.00,
    'enterprise': 500.00,
    'beta': 1000.00,
    'admin': null, // Unlimited
    'future4200': null // Unlimited
  };

  return limits[subscriptionPlan] || 10.00; // Default to free tier
}

/**
 * Create API key for new user (called during user registration)
 */
export async function createApiKeyForNewUser(userId) {
  try {
    // Get user's subscription tier
    const subscription = await getUserSubscriptionTier(userId);
    const defaultLimit = getDefaultMonthlyLimit(subscription?.plan || 'free');

    // This would typically be called from the key manager
    // For now, we'll just prepare the data structure
    return {
      userId,
      monthlyLimit: defaultLimit,
      subscriptionPlan: subscription?.plan || 'free'
    };
  } catch (error) {
    console.error('Error preparing API key for new user:', error);
    throw error;
  }
}

export default {
  getUserApiKey,
  createUserApiKey,
  updateUserApiKey,
  deactivateUserApiKey,
  checkUserUsageLimit,
  getUserUsageSummary,
  logApiUsage,
  getAllUsersWithKeys,
  resetAllMonthlyUsage,
  getUserSubscriptionTier,
  getDefaultMonthlyLimit,
  createApiKeyForNewUser
};
