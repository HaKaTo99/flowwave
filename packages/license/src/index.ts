/**
 * FlowWave License & Tier Management
 * FREE + DONATION model with feature limits
 */

export type UserTier = 'free' | 'supporter' | 'backer' | 'organization';

export interface TierLimits {
    maxWorkflows: number;
    maxExecutionsPerDay: number;
    maxRetries: number;
    ragDocsPerMonth: number;
    textToWorkflowPerMonth: number;
    advancedScheduling: boolean;
    customAIModels: boolean;
    prioritySupport: boolean;
}

export interface UserUsage {
    workflowsCreated: number;
    executionsToday: number;
    ragDocsThisMonth: number;
    textToWorkflowThisMonth: number;
    lastReset: Date;
}

const TIER_LIMITS: Record<UserTier, TierLimits> = {
    free: {
        maxWorkflows: 10,
        maxExecutionsPerDay: 100,
        maxRetries: 3,
        ragDocsPerMonth: 100,
        textToWorkflowPerMonth: 10,
        advancedScheduling: false,
        customAIModels: false,
        prioritySupport: false
    },
    supporter: {
        maxWorkflows: 50,
        maxExecutionsPerDay: 1000,
        maxRetries: 10,
        ragDocsPerMonth: 1000,
        textToWorkflowPerMonth: 100,
        advancedScheduling: true,
        customAIModels: false,
        prioritySupport: true
    },
    backer: {
        maxWorkflows: -1, // Unlimited
        maxExecutionsPerDay: -1,
        maxRetries: 50,
        ragDocsPerMonth: -1,
        textToWorkflowPerMonth: -1,
        advancedScheduling: true,
        customAIModels: true,
        prioritySupport: true
    },
    organization: {
        maxWorkflows: -1,
        maxExecutionsPerDay: -1,
        maxRetries: -1,
        ragDocsPerMonth: -1,
        textToWorkflowPerMonth: -1,
        advancedScheduling: true,
        customAIModels: true,
        prioritySupport: true
    }
};

const TIER_PRICES: Record<UserTier, { monthly: number; yearly: number }> = {
    free: { monthly: 0, yearly: 0 },
    supporter: { monthly: 50000, yearly: 500000 }, // Rp 50k/month
    backer: { monthly: 200000, yearly: 2000000 }, // Rp 200k/month
    organization: { monthly: 1000000, yearly: 10000000 } // Rp 1M/month
};

// In-memory storage (replace with database in production)
const userTiers = new Map<string, { tier: UserTier; expiresAt?: Date }>();
const userUsage = new Map<string, UserUsage>();

export class FlowWaveLicense {
    /**
     * Get user's current tier
     */
    async getUserTier(userId: string): Promise<UserTier> {
        const userTierData = userTiers.get(userId);

        if (!userTierData) {
            return 'free';
        }

        // Check if tier has expired
        if (userTierData.expiresAt && userTierData.expiresAt < new Date()) {
            userTiers.delete(userId);
            return 'free';
        }

        return userTierData.tier;
    }

    /**
     * Set user's tier (after donation/payment)
     */
    async setUserTier(userId: string, tier: UserTier, durationDays: number = 30): Promise<void> {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);

        userTiers.set(userId, { tier, expiresAt });
    }

    /**
     * Get tier limits
     */
    getTierLimits(tier: UserTier): TierLimits {
        return TIER_LIMITS[tier];
    }

    /**
     * Get tier price
     */
    getTierPrice(tier: UserTier): { monthly: number; yearly: number } {
        return TIER_PRICES[tier];
    }

    /**
     * Check if user can use a feature
     */
    async checkFeatureAccess(userId: string, feature: keyof TierLimits): Promise<boolean> {
        const tier = await this.getUserTier(userId);
        const limits = this.getTierLimits(tier);

        const value = limits[feature];

        // Boolean features
        if (typeof value === 'boolean') {
            return value;
        }

        // -1 means unlimited
        if (value === -1) {
            return true;
        }

        // Check against usage
        const usage = await this.getUserUsage(userId);

        switch (feature) {
            case 'maxWorkflows':
                return usage.workflowsCreated < value;
            case 'maxExecutionsPerDay':
                return usage.executionsToday < value;
            case 'ragDocsPerMonth':
                return usage.ragDocsThisMonth < value;
            case 'textToWorkflowPerMonth':
                return usage.textToWorkflowThisMonth < value;
            default:
                return true;
        }
    }

    /**
     * Check usage limit for a specific feature
     */
    async checkLimit(userId: string, feature: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
        const tier = await this.getUserTier(userId);
        const limits = this.getTierLimits(tier);
        const usage = await this.getUserUsage(userId);

        const featureMap: Record<string, { limit: number; used: number }> = {
            'ragDocs': { limit: limits.ragDocsPerMonth, used: usage.ragDocsThisMonth },
            'textToWorkflow': { limit: limits.textToWorkflowPerMonth, used: usage.textToWorkflowThisMonth },
            'executions': { limit: limits.maxExecutionsPerDay, used: usage.executionsToday },
            'workflows': { limit: limits.maxWorkflows, used: usage.workflowsCreated },
            'retries': { limit: limits.maxRetries, used: 0 }
        };

        const featureData = featureMap[feature];
        if (!featureData) {
            return { allowed: true, remaining: -1, limit: -1 };
        }

        const { limit, used } = featureData;

        if (limit === -1) {
            return { allowed: true, remaining: -1, limit: -1 }; // Unlimited
        }

        return {
            allowed: used < limit,
            remaining: Math.max(0, limit - used),
            limit
        };
    }

    /**
     * Get user's usage stats
     */
    async getUserUsage(userId: string): Promise<UserUsage> {
        let usage = userUsage.get(userId);

        if (!usage) {
            usage = {
                workflowsCreated: 0,
                executionsToday: 0,
                ragDocsThisMonth: 0,
                textToWorkflowThisMonth: 0,
                lastReset: new Date()
            };
            userUsage.set(userId, usage);
        }

        // Reset daily counters if needed
        const now = new Date();
        const lastReset = new Date(usage.lastReset);

        if (now.getDate() !== lastReset.getDate()) {
            usage.executionsToday = 0;
        }

        // Reset monthly counters if needed
        if (now.getMonth() !== lastReset.getMonth()) {
            usage.ragDocsThisMonth = 0;
            usage.textToWorkflowThisMonth = 0;
        }

        usage.lastReset = now;
        userUsage.set(userId, usage);

        return usage;
    }

    /**
     * Increment usage counter
     */
    async incrementUsage(userId: string, feature: string, amount: number = 1): Promise<void> {
        const usage = await this.getUserUsage(userId);

        switch (feature) {
            case 'workflows':
                usage.workflowsCreated += amount;
                break;
            case 'executions':
                usage.executionsToday += amount;
                break;
            case 'ragDocs':
                usage.ragDocsThisMonth += amount;
                break;
            case 'textToWorkflow':
                usage.textToWorkflowThisMonth += amount;
                break;
        }

        userUsage.set(userId, usage);
    }

    /**
     * Get all available tiers for display
     */
    getAllTiers(): Array<{
        id: UserTier;
        name: string;
        price: { monthly: number; yearly: number };
        limits: TierLimits;
        features: string[];
    }> {
        return [
            {
                id: 'free',
                name: 'Free',
                price: TIER_PRICES.free,
                limits: TIER_LIMITS.free,
                features: [
                    '10 workflows',
                    '100 executions/day',
                    '3 retries per node',
                    '100 RAG docs/month',
                    '10 AI generations/month',
                    'Community support'
                ]
            },
            {
                id: 'supporter',
                name: 'Supporter',
                price: TIER_PRICES.supporter,
                limits: TIER_LIMITS.supporter,
                features: [
                    '50 workflows',
                    '1,000 executions/day',
                    '10 retries per node',
                    '1,000 RAG docs/month',
                    '100 AI generations/month',
                    'Advanced scheduling',
                    'Priority support',
                    'Name in README'
                ]
            },
            {
                id: 'backer',
                name: 'Backer',
                price: TIER_PRICES.backer,
                limits: TIER_LIMITS.backer,
                features: [
                    'Unlimited workflows',
                    'Unlimited executions',
                    '50 retries per node',
                    'Unlimited RAG docs',
                    'Unlimited AI generations',
                    'Custom AI models',
                    'Logo on website',
                    'Direct support channel'
                ]
            },
            {
                id: 'organization',
                name: 'Organization',
                price: TIER_PRICES.organization,
                limits: TIER_LIMITS.organization,
                features: [
                    'Everything in Backer',
                    'Unlimited retries',
                    'Custom connector development',
                    'Enterprise support',
                    'SLA guarantee',
                    'On-premise assistance',
                    'Co-branding opportunities'
                ]
            }
        ];
    }
}

// Export singleton
export const license = new FlowWaveLicense();
