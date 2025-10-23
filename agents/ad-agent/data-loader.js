/**
 * S3 Data Loader Template for Formul8 Agents
 * 
 * This module loads agent-specific data from S3 with in-memory caching.
 * Replace {{AGENT_NAME}} with your agent name (e.g., "compliance", "sourcing")
 */

const AWS = require('aws-sdk');
const s3Config = require('./s3-config.json');

// Initialize S3 client
const s3 = new AWS.S3({ 
  region: s3Config.s3.region,
  // Credentials come from environment variables:
  // AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
});

// In-memory cache
const cache = {
  data: {},
  timestamps: {},
  ttl: s3Config.cache?.ttl || 3600000 // Default 1 hour
};

/**
 * Get data from S3 with caching
 * @param {string} key - S3 key relative to agent prefix (e.g., "regulations/CA/index.json")
 * @returns {Promise<any>} - Parsed JSON data
 */
async function getData(key) {
  const cacheKey = key;
  const now = Date.now();
  
  // Check cache
  if (s3Config.cache?.enabled !== false) {
    if (cache.data[cacheKey] && cache.timestamps[cacheKey]) {
      const age = now - cache.timestamps[cacheKey];
      if (age < cache.ttl) {
        console.log(`✅ Cache hit for ${key} (age: ${Math.round(age/1000)}s)`);
        return cache.data[cacheKey];
      }
    }
  }
  
  // Load from S3
  console.log(`📥 Loading from S3: ${key}`);
  
  try {
    const params = {
      Bucket: s3Config.s3.bucketName,
      Key: `${s3Config.s3.prefix}/${key}`,
    };
    
    const data = await s3.getObject(params).promise();
    const parsed = JSON.parse(data.Body.toString('utf-8'));
    
    // Cache it
    if (s3Config.cache?.enabled !== false) {
      cache.data[cacheKey] = parsed;
      cache.timestamps[cacheKey] = now;
      console.log(`💾 Cached ${key}`);
    }
    
    return parsed;
  } catch (error) {
    console.error(`❌ Error loading ${key} from S3:`, error.message);
    
    // Return cached data if available (stale is better than nothing)
    if (cache.data[cacheKey]) {
      console.log(`⚠️  Returning stale cache for ${key}`);
      return cache.data[cacheKey];
    }
    
    throw new Error(`Failed to load data: ${key}`);
  }
}

/**
 * List objects in S3 path
 * @param {string} prefix - S3 prefix to list (relative to agent prefix)
 * @returns {Promise<string[]>} - Array of object keys
 */
async function listData(prefix = '') {
  try {
    const params = {
      Bucket: s3Config.s3.bucketName,
      Prefix: `${s3Config.s3.prefix}/${prefix}`,
      MaxKeys: 1000
    };
    
    const data = await s3.listObjectsV2(params).promise();
    return data.Contents?.map(item => item.Key) || [];
  } catch (error) {
    console.error(`❌ Error listing ${prefix}:`, error.message);
    throw new Error(`Failed to list data: ${prefix}`);
  }
}

/**
 * Check if data exists in S3
 * @param {string} key - S3 key to check
 * @returns {Promise<boolean>} - True if exists
 */
async function exists(key) {
  try {
    await s3.headObject({
      Bucket: s3Config.s3.bucketName,
      Key: `${s3Config.s3.prefix}/${key}`,
    }).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
}

/**
 * Clear cache (useful for development/testing)
 */
function clearCache() {
  cache.data = {};
  cache.timestamps = {};
  console.log('🗑️  Cache cleared');
}

/**
 * Get cache stats
 */
function getCacheStats() {
  return {
    size: Object.keys(cache.data).length,
    keys: Object.keys(cache.data),
    oldestEntry: Math.min(...Object.values(cache.timestamps)),
    newestEntry: Math.max(...Object.values(cache.timestamps))
  };
}

module.exports = {
  getData,
  listData,
  exists,
  clearCache,
  getCacheStats
};

