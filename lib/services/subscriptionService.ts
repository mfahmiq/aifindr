import { createClient } from "@/lib/supabase/client"
import {
    Subscription,
    SubscriptionWithUser,
    SubscriptionPlan,
    InsertTables,
    UpdateTables
} from "@/lib/types"
import {
    PLAN_NAMES,
    PLAN_PRICING as UNIFIED_PRICING,
    PLAN_FEATURES as UNIFIED_FEATURES,
    FEATURE_LABELS,
    getPlanFeatures,
    hasFeature,
    isPremiumPlan
} from "@/lib/constants"

// Re-export for backward compatibility with lowercase keys
// The database and UI use capitalized values ("Pro", "Featured", etc.)
// but some parts of the codebase use lowercase ("pro", "featured", etc.)
export const PLAN_PRICING = {
    free: 0,
    pro: UNIFIED_PRICING[PLAN_NAMES.PRO],
    featured: UNIFIED_PRICING[PLAN_NAMES.FEATURED],
    sponsor: UNIFIED_PRICING[PLAN_NAMES.SPONSOR],
    // Capitalized versions for direct mapping from database
    Free: 0,
    Pro: UNIFIED_PRICING[PLAN_NAMES.PRO],
    Featured: UNIFIED_PRICING[PLAN_NAMES.FEATURED],
    Sponsor: UNIFIED_PRICING[PLAN_NAMES.SPONSOR],
} as const

// Plan features with both lowercase and capitalized keys for compatibility
export const PLAN_FEATURES = {
    free: {
        basicListing: true,
        viewStats: false,
        replyReviews: false,
        priorityListing: false,
        featuredBadge: false,
        homepagePlacement: false,
        noCompetitorAds: false,
        bannerAds: false
    },
    pro: {
        basicListing: true,
        viewStats: true,
        replyReviews: true,
        priorityListing: true,
        featuredBadge: false,
        homepagePlacement: false,
        noCompetitorAds: false,
        bannerAds: false
    },
    featured: {
        basicListing: true,
        viewStats: true,
        replyReviews: true,
        priorityListing: true,
        featuredBadge: true,
        homepagePlacement: true,
        noCompetitorAds: false,
        bannerAds: false
    },
    sponsor: {
        basicListing: true,
        viewStats: true,
        replyReviews: true,
        priorityListing: true,
        featuredBadge: true,
        homepagePlacement: true,
        noCompetitorAds: true,
        bannerAds: true
    },
    // Capitalized versions for direct mapping from database
    Free: UNIFIED_FEATURES[PLAN_NAMES.FREE],
    Pro: UNIFIED_FEATURES[PLAN_NAMES.PRO],
    Featured: UNIFIED_FEATURES[PLAN_NAMES.FEATURED],
    Sponsor: UNIFIED_FEATURES[PLAN_NAMES.SPONSOR],
} as const

// Re-export helpers from constants
export { PLAN_NAMES, FEATURE_LABELS, getPlanFeatures, hasFeature, isPremiumPlan }

export const subscriptionService = {
    /**
     * Create a new subscription for a user
     */
    async createSubscription(data: InsertTables<'subscriptions'>) {
        const supabase = createClient()
        const { data: subscription, error } = await supabase
            .from('subscriptions')
            .insert({
                ...data,
                status: data.status || 'pending',
                starts_at: data.starts_at || new Date().toISOString(),
                currency: data.currency || 'IDR'
            })
            .select()
            .single()

        if (error) throw error
        return subscription as Subscription
    },

    /**
     * Get user's active subscription
     */
    async getActiveSubscription(userId: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .or('ends_at.is.null,ends_at.gt.' + new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (error && error.code !== 'PGRST116') throw error
        return data as Subscription | null
    },

    /**
     * Get all subscriptions for a user
     */
    async getUserSubscriptions(userId: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as Subscription[]
    },

    /**
     * Get user's current plan
     */
    async getUserPlan(userId: string): Promise<SubscriptionPlan> {
        const subscription = await this.getActiveSubscription(userId)
        return subscription?.plan || 'free'
    },

    /**
     * Check if user has a specific plan or higher
     */
    async hasMinimumPlan(userId: string, minimumPlan: SubscriptionPlan): Promise<boolean> {
        const planHierarchy: SubscriptionPlan[] = ['free', 'pro', 'featured', 'sponsor']
        const userPlan = await this.getUserPlan(userId)
        return planHierarchy.indexOf(userPlan) >= planHierarchy.indexOf(minimumPlan)
    },

    /**
     * Check if user can access a specific feature
     */
    async canAccessFeature(userId: string, feature: keyof typeof PLAN_FEATURES.free): Promise<boolean> {
        const plan = await this.getUserPlan(userId)
        return PLAN_FEATURES[plan][feature]
    },

    /**
     * Update subscription
     */
    async updateSubscription(id: string, updates: UpdateTables<'subscriptions'>) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('subscriptions')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Subscription
    },

    /**
     * Cancel subscription
     */
    async cancelSubscription(id: string) {
        return this.updateSubscription(id, {
            status: 'cancelled',
            auto_renew: false
        })
    },

    /**
     * Activate subscription (after payment confirmation)
     */
    async activateSubscription(id: string, paymentId?: string) {
        const updates: UpdateTables<'subscriptions'> = {
            status: 'active',
            starts_at: new Date().toISOString()
        }
        if (paymentId) {
            updates.payment_id = paymentId
        }
        return this.updateSubscription(id, updates)
    },

    /**
     * Get all subscriptions (admin)
     */
    async getAllSubscriptions(filters?: {
        status?: string
        plan?: string
        limit?: number
        page?: number
    }) {
        const supabase = createClient()
        let query = supabase
            .from('subscriptions')
            .select(`
                *,
                users (id, name, email, avatar_url)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })

        if (filters?.status) {
            query = query.eq('status', filters.status)
        }

        if (filters?.plan) {
            query = query.eq('plan', filters.plan)
        }

        if (filters?.limit) {
            const page = filters.page || 1
            const from = (page - 1) * filters.limit
            const to = from + filters.limit - 1
            query = query.range(from, to)
        }

        const { data, error, count } = await query

        if (error) throw error
        return {
            subscriptions: data as SubscriptionWithUser[],
            count: count || 0
        }
    },

    /**
     * Get subscription revenue stats
     */
    async getRevenueStats() {
        const supabase = createClient()

        // Get active subscriptions grouped by plan
        const { data: activeByPlan, error: planError } = await supabase
            .from('subscriptions')
            .select('plan, amount')
            .eq('status', 'active')
            .or('ends_at.is.null,ends_at.gt.' + new Date().toISOString())

        if (planError) throw planError

        // Calculate stats
        const stats = {
            totalActive: activeByPlan?.length || 0,
            byPlan: {
                pro: 0,
                featured: 0,
                sponsor: 0
            },
            mrr: 0, // Monthly Recurring Revenue
            arr: 0  // Annual Recurring Revenue
        }

        activeByPlan?.forEach(sub => {
            if (sub.plan && sub.plan !== 'free') {
                stats.byPlan[sub.plan as keyof typeof stats.byPlan]++
                stats.mrr += sub.amount || PLAN_PRICING[sub.plan as keyof typeof PLAN_PRICING] || 0
            }
        })

        stats.arr = stats.mrr * 12

        return stats
    },

    /**
     * Get subscription by ID
     */
    async getSubscriptionById(id: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('subscriptions')
            .select(`
                *,
                users (id, name, email, avatar_url)
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        return data as SubscriptionWithUser
    }
}
