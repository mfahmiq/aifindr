// Centralized constants for the The AI Select application
// All status values, plan features, and shared configurations

// ===============================
// TOOL STATUS CONSTANTS
// ===============================
export const TOOL_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    DRAFT: 'draft',
} as const

export type ToolStatus = typeof TOOL_STATUS[keyof typeof TOOL_STATUS]

// ===============================
// SUBSCRIPTION PLAN CONSTANTS
// ===============================
export const PLAN_NAMES = {
    FREE: 'Free',
    PRO: 'Pro',
    FEATURED: 'Featured',
    SPONSOR: 'Sponsor',
} as const

export type PlanName = typeof PLAN_NAMES[keyof typeof PLAN_NAMES]

// Plan pricing in IDR
export const PLAN_PRICING = {
    [PLAN_NAMES.FREE]: 0,
    [PLAN_NAMES.PRO]: 150000,      // ~$9/month
    [PLAN_NAMES.FEATURED]: 450000, // ~$29/month
    [PLAN_NAMES.SPONSOR]: 750000,  // ~$49/month
} as const

// Plan features - single source of truth
export const PLAN_FEATURES = {
    [PLAN_NAMES.FREE]: {
        basicListing: true,
        permanentListing: true,
        viewStats: false,
        replyReviews: false,
        verifiedBadge: false,
        priorityListing: false,
        featuredBadge: false,
        homepagePlacement: false,
        noCompetitorAds: false,
        bannerAds: false,
        doFollowBacklink: false,
        premiumSupport: false,
    },
    [PLAN_NAMES.PRO]: {
        basicListing: true,
        permanentListing: true,
        viewStats: true,
        replyReviews: true,
        verifiedBadge: true,
        priorityListing: true,
        featuredBadge: false,
        homepagePlacement: false,
        noCompetitorAds: false,
        bannerAds: false,
        doFollowBacklink: true,
        premiumSupport: true,
    },
    [PLAN_NAMES.FEATURED]: {
        basicListing: true,
        permanentListing: true,
        viewStats: true,
        replyReviews: true,
        verifiedBadge: true,
        priorityListing: true,
        featuredBadge: true,
        homepagePlacement: true,
        noCompetitorAds: false,
        bannerAds: false,
        doFollowBacklink: true,
        premiumSupport: true,
    },
    [PLAN_NAMES.SPONSOR]: {
        basicListing: true,
        permanentListing: true,
        viewStats: true,
        replyReviews: true,
        verifiedBadge: true,
        priorityListing: true,
        featuredBadge: true,
        homepagePlacement: true,
        noCompetitorAds: true,
        bannerAds: true,
        doFollowBacklink: true,
        premiumSupport: true,
    },
} as const

// Human-readable feature labels
export const FEATURE_LABELS: Record<string, string> = {
    basicListing: 'Basic Listing',
    permanentListing: 'Permanent Listing',
    viewStats: 'View Analytics & Stats',
    replyReviews: 'Reply to Reviews',
    verifiedBadge: 'Verified Badge (Blue Check)',
    priorityListing: 'Priority Listing (Jump to Top)',
    featuredBadge: 'Featured Badge',
    homepagePlacement: 'Homepage Placement',
    noCompetitorAds: 'No Competitor Ads on Profile',
    bannerAds: 'Exclusive Banner Ads',
    doFollowBacklink: 'Do-Follow Backlink',
    premiumSupport: 'Premium Support',
}

// Plan descriptions
export const PLAN_DESCRIPTIONS: Record<PlanName, string> = {
    [PLAN_NAMES.FREE]: 'Get listed in our directory. Perfect for new tools.',
    [PLAN_NAMES.PRO]: 'Stand out with a verified badge and priority ranking.',
    [PLAN_NAMES.FEATURED]: 'Maximum exposure with featured placement on homepage.',
    [PLAN_NAMES.SPONSOR]: 'Premium visibility with exclusive banner ads and more.',
}

// ===============================
// REVIEW STATUS CONSTANTS
// ===============================
export const REVIEW_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
} as const

export type ReviewStatus = typeof REVIEW_STATUS[keyof typeof REVIEW_STATUS]

// ===============================
// UI STYLING CONSTANTS
// ===============================
export const PLAN_COLORS = {
    [PLAN_NAMES.FREE]: {
        border: 'border-gray-200',
        bg: 'bg-gray-50',
        text: 'text-gray-600',
        gradient: 'from-gray-400 to-gray-500',
    },
    [PLAN_NAMES.PRO]: {
        border: 'border-blue-500',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        gradient: 'from-blue-500 to-cyan-500',
    },
    [PLAN_NAMES.FEATURED]: {
        border: 'border-purple-500',
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        gradient: 'from-purple-500 to-pink-500',
    },
    [PLAN_NAMES.SPONSOR]: {
        border: 'border-amber-500',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        gradient: 'from-amber-500 to-orange-500',
    },
}

// ===============================
// HELPER FUNCTIONS
// ===============================

// Get features for a plan
export function getPlanFeatures(planName: string): Record<string, boolean> {
    const normalizedPlan = planName as PlanName
    return PLAN_FEATURES[normalizedPlan] || PLAN_FEATURES[PLAN_NAMES.FREE]
}

// Check if a feature is included in a plan
export function hasFeature(planName: string, featureKey: string): boolean {
    const features = getPlanFeatures(planName)
    return features[featureKey as keyof typeof features] || false
}

// Get all features included in a plan
export function getIncludedFeatures(planName: string): string[] {
    const features = getPlanFeatures(planName)
    return Object.entries(features)
        .filter(([_, included]) => included)
        .map(([key]) => key)
}

// Get plan color configuration
export function getPlanColors(planName: string) {
    const normalizedPlan = planName as PlanName
    return PLAN_COLORS[normalizedPlan] || PLAN_COLORS[PLAN_NAMES.FREE]
}

// Check if plan is premium (Pro, Featured, or Sponsor)
export function isPremiumPlan(planName: string): boolean {
    const premiumPlans: string[] = [PLAN_NAMES.PRO, PLAN_NAMES.FEATURED, PLAN_NAMES.SPONSOR]
    return premiumPlans.includes(planName)
}

// Get plan display order (for sorting)
export function getPlanPriority(planName: string): number {
    const priorities: Record<string, number> = {
        [PLAN_NAMES.SPONSOR]: 0,
        [PLAN_NAMES.FEATURED]: 1,
        [PLAN_NAMES.PRO]: 2,
        [PLAN_NAMES.FREE]: 3,
    }
    return priorities[planName] ?? 4
}
