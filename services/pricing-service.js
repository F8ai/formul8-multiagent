const ConfigLoader = require('../config/loader');

class PricingService {
  constructor() {
    this.config = new ConfigLoader();
    this.pricingTiers = this.config.get('pricing_tiers')?.pricing_tiers || {};
  }

  // Get all available pricing tiers
  getAllTiers() {
    return this.pricingTiers;
  }

  // Get specific tier information
  getTier(tierName) {
    return this.pricingTiers[tierName] || null;
  }

  // Get agents available for a specific tier
  getTierAgents(tierName) {
    const tier = this.getTier(tierName);
    if (!tier) return [];

    return tier.agents || [];
  }

  // Check if user has access to specific agent
  hasAgentAccess(tierName, agentId) {
    const tierAgents = this.getTierAgents(tierName);
    return tierAgents.includes(agentId);
  }

  // Get tier limits
  getTierLimits(tierName) {
    const tier = this.getTier(tierName);
    if (!tier) return {};

    return tier.limits || {};
  }

  // Check if user has exceeded limits
  checkLimits(tierName, usage) {
    const limits = this.getTierLimits(tierName);
    const violations = [];

    Object.entries(limits).forEach(([key, limit]) => {
      if (limit === -1) return; // Unlimited
      
      const currentUsage = usage[key] || 0;
      if (currentUsage >= limit) {
        violations.push({
          limit: key,
          current: currentUsage,
          max: limit
        });
      }
    });

    return {
      withinLimits: violations.length === 0,
      violations
    };
  }

  // Get tier features
  getTierFeatures(tierName) {
    const tier = this.getTier(tierName);
    if (!tier) return [];

    return tier.features || [];
  }

  // Validate agent access for request
  validateAgentAccess(tierName, agentId, usage = {}) {
    // Check if agent exists
    const agent = this.config.getAgent(agentId);
    if (!agent) {
      return {
        allowed: false,
        reason: 'Agent not found'
      };
    }

    // Check tier restrictions
    if (agent.tier_restriction && agent.tier_restriction !== tierName) {
      return {
        allowed: false,
        reason: `Agent requires ${agent.tier_restriction} tier or higher`
      };
    }

    // Check if agent is available in tier
    if (!this.hasAgentAccess(tierName, agentId)) {
      return {
        allowed: false,
        reason: `Agent not available in ${tierName} tier`
      };
    }

    // Check usage limits
    const limitCheck = this.checkLimits(tierName, usage);
    if (!limitCheck.withinLimits) {
      return {
        allowed: false,
        reason: 'Usage limits exceeded',
        violations: limitCheck.violations
      };
    }

    return {
      allowed: true,
      reason: 'Access granted'
    };
  }

  // Get upgrade recommendations
  getUpgradeRecommendations(currentTier, requestedAgent) {
    const recommendations = [];
    
    Object.entries(this.pricingTiers).forEach(([tierName, tier]) => {
      if (tier.agents && tier.agents.includes(requestedAgent)) {
        recommendations.push({
          tier: tierName,
          name: tier.name,
          price: tier.price,
          description: tier.description,
          features: tier.features
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priceA = typeof a.price === 'number' ? a.price : 999999;
      const priceB = typeof b.price === 'number' ? b.price : 999999;
      return priceA - priceB;
    });
  }

  // Get pricing comparison
  getPricingComparison() {
    const comparison = [];
    
    Object.entries(this.pricingTiers).forEach(([tierName, tier]) => {
      comparison.push({
        id: tierName,
        name: tier.name,
        price: tier.price,
        currency: tier.currency,
        billing: tier.billing,
        description: tier.description,
        features: tier.features,
        agentCount: tier.agents ? tier.agents.length : 0,
        limits: tier.limits
      });
    });

    return comparison;
  }

  // Check if tier supports specific feature
  hasFeature(tierName, feature) {
    const tier = this.getTier(tierName);
    if (!tier) return false;

    return tier.features && tier.features.includes(feature);
  }

  // Get tier statistics
  getTierStats(tierName) {
    const tier = this.getTier(tierName);
    if (!tier) return null;

    return {
      name: tier.name,
      price: tier.price,
      agentCount: tier.agents ? tier.agents.length : 0,
      featureCount: tier.features ? tier.features.length : 0,
      hasUnlimitedLimits: tier.limits && Object.values(tier.limits).some(limit => limit === -1),
      isCustomPricing: tier.price === 'Custom'
    };
  }
}

module.exports = PricingService;