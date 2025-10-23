/**
 * Compliance Data Loader for Vercel Serverless
 * Loads data from S3 without FUSE mounting
 */

const { S3Client, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

class ComplianceDataLoader {
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    this.bucket = 'formul8-platform-deployments';
    this.prefix = 'data/compliance';
    this.cache = new Map(); // In-memory cache for this function instance
  }

  /**
   * Get regulation data for a specific state
   * @param {string} stateCode - Two-letter state code (e.g., 'CA', 'CO')
   * @returns {Promise<Object>} Regulation data
   */
  async getStateData(stateCode) {
    const cacheKey = `state_${stateCode}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log(`Cache hit for ${stateCode}`);
      return this.cache.get(cacheKey);
    }

    try {
      // Read from S3
      const key = `${this.prefix}/regulations/${stateCode}/index.json`;
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const response = await this.s3Client.send(command);
      const data = await this.streamToString(response.Body);
      const parsed = JSON.parse(data);

      // Cache for this function instance
      this.cache.set(cacheKey, parsed);
      
      return parsed;
    } catch (error) {
      console.error(`Error loading data for ${stateCode}:`, error);
      throw new Error(`Could not load compliance data for ${stateCode}`);
    }
  }

  /**
   * Search regulations by keyword
   * @param {string} query - Search query
   * @param {string} stateCode - Optional state filter
   * @returns {Promise<Array>} Search results
   */
  async searchRegulations(query, stateCode = null) {
    // If state specified, search that state only
    if (stateCode) {
      const stateData = await this.getStateData(stateCode);
      return this.filterByQuery(stateData, query);
    }

    // Otherwise, search across all states
    // For production, this should use AstraDB vector search instead
    const states = await this.listAvailableStates();
    const results = [];

    for (const state of states.slice(0, 5)) { // Limit to prevent timeout
      try {
        const data = await this.getStateData(state);
        const matches = this.filterByQuery(data, query);
        results.push(...matches);
      } catch (error) {
        console.warn(`Skipping ${state}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Get list of states with available data
   * @returns {Promise<Array<string>>} List of state codes
   */
  async listAvailableStates() {
    const cacheKey = 'available_states';
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: `${this.prefix}/regulations/`,
        Delimiter: '/'
      });

      const response = await this.s3Client.send(command);
      const states = (response.CommonPrefixes || [])
        .map(p => p.Prefix.split('/').slice(-2, -1)[0])
        .filter(s => s.length === 2); // Only 2-letter state codes

      this.cache.set(cacheKey, states);
      return states;
    } catch (error) {
      console.error('Error listing states:', error);
      return ['CA', 'CO', 'WA', 'OR', 'NY']; // Fallback to known states
    }
  }

  /**
   * Helper: Convert stream to string
   */
  async streamToString(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
  }

  /**
   * Helper: Filter data by query
   */
  filterByQuery(data, query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    if (data.regulations) {
      for (const reg of data.regulations) {
        if (
          reg.title?.toLowerCase().includes(lowerQuery) ||
          reg.summary?.toLowerCase().includes(lowerQuery) ||
          reg.code?.toLowerCase().includes(lowerQuery)
        ) {
          results.push(reg);
        }
      }
    }

    return results;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
module.exports = new ComplianceDataLoader();

