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
    [PLAN_NAMES.PRO]: 49000,       // ~$3/month
    [PLAN_NAMES.FEATURED]: 149000, // ~$10/month
    [PLAN_NAMES.SPONSOR]: 299000,  // ~$20/week
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
        border: 'border-slate-200 dark:border-slate-800',
        bg: 'bg-slate-50 dark:bg-slate-900',
        text: 'text-slate-600 dark:text-slate-400',
        gradient: 'from-slate-500 to-slate-600',
    },
    [PLAN_NAMES.PRO]: {
        border: 'border-indigo-500/20',
        bg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
        text: 'text-indigo-600 dark:text-indigo-400',
        gradient: 'from-indigo-600 to-violet-600',
    },
    [PLAN_NAMES.FEATURED]: {
        border: 'border-violet-500/20',
        bg: 'bg-violet-50/50 dark:bg-violet-950/20',
        text: 'text-violet-600 dark:text-violet-400',
        gradient: 'from-violet-600 to-fuchsia-600',
    },
    [PLAN_NAMES.SPONSOR]: {
        border: 'border-amber-500/20',
        bg: 'bg-amber-50/50 dark:bg-amber-950/20',
        text: 'text-amber-600 dark:text-amber-400',
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
