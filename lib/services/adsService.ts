import { createClient } from "@/lib/supabase/client"
import { Ad } from "@/lib/types"

export type { Ad }

export interface ActiveAd extends Ad {
    // Extended fields if needed
}

export type AdPlacement = 'sidebar' | 'banner' | 'navbar' | 'top_banner' | 'inline' | 'footer_cta'

export const adsService = {
    /**
     * Get ALL ads for admin (including inactive)
     */
    async getAllAds() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('ads')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as Ad[]
    },

    /**
     * Create new ad placement
     */
    async createAd(ad: {
        name: string
        placement: string
        link_url: string
        title?: string
        description?: string
        image_url?: string
        advertiser_name?: string
        advertiser_email?: string
        starts_at?: string
        ends_at?: string
        is_active?: boolean
    }) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('ads')
            .insert({
                name: ad.name,
                placement: ad.placement,
                link_url: ad.link_url,
                title: ad.title || null,
                description: ad.description || null,
                image_url: ad.image_url || null,
                advertiser_name: ad.advertiser_name || null,
                advertiser_email: ad.advertiser_email || null,
                starts_at: ad.starts_at || new Date().toISOString(),
                ends_at: ad.ends_at || null,
                is_active: ad.is_active !== false,
                impressions: 0,
                clicks: 0
            })
            .select()
            .single()

        if (error) throw error
        return data as Ad
    },

    /**
     * Update ad placement
     */
    async updateAd(id: string, updates: {
        name?: string
        placement?: string
        link_url?: string
        title?: string
        description?: string
        image_url?: string
        advertiser_name?: string
        starts_at?: string
        ends_at?: string
        is_active?: boolean
    }) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('ads')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Ad
    },

    /**
     * Delete ad placement
     */
    async deleteAd(id: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('ads')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    },

    /**
     * Get ads statistics
     */
    async getAdsStats() {
        const supabase = createClient()
        const { data: ads, error } = await supabase
            .from('ads')
            .select('id, is_active, starts_at, ends_at, impressions, clicks, placement')

        if (error) throw error

        const now = new Date()
        const activeAds = ads?.filter(ad => {
            if (!ad.is_active) return false
            const startsAt = ad.starts_at ? new Date(ad.starts_at) : new Date(0)
            const endsAt = ad.ends_at ? new Date(ad.ends_at) : new Date('2099-12-31')
            return now >= startsAt && now <= endsAt
        }) || []

        const scheduled = ads?.filter(ad => {
            if (!ad.is_active) return false
            const startsAt = ad.starts_at ? new Date(ad.starts_at) : null
            return startsAt && startsAt > now
        }) || []

        const totalImpressions = ads?.reduce((sum, ad) => sum + (ad.impressions || 0), 0) || 0
        const totalClicks = ads?.reduce((sum, ad) => sum + (ad.clicks || 0), 0) || 0

        return {
            total: ads?.length || 0,
            active: activeAds.length,
            scheduled: scheduled.length,
            totalImpressions,
            totalClicks
        }
    },

    /**
     * Get active ads by placement
     */
    async getActiveAds(placement?: string) {
        const supabase = createClient()
        let query = supabase
            .from('ads')
            .select('*')
            .eq('is_active', true)
            .lte('starts_at', new Date().toISOString())
            .gte('ends_at', new Date().toISOString())

        if (placement) {
            query = query.eq('placement', placement)
        }

        const { data, error } = await query.order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching ads:', error)
            return []
        }

        return data as ActiveAd[]
    },

    /**
     * Get a single ad for navbar (prioritized)
     */
    async getNavbarAd() {
        const ads = await this.getActiveAds('navbar')
        return ads.length > 0 ? ads[0] : null
    },

    /**
     * Get a single active ad by placement
     */
    async getActiveAdByPlacement(placement: string) {
        const ads = await this.getActiveAds(placement)
        return ads.length > 0 ? ads[0] : null
    },

    /**
     * Track ad click (alias for recordClick)
     */
    async trackClick(adId: string) {
        return this.recordClick(adId)
    },

    /**
     * Get sidebar ads
     */
    async getSidebarAds(limit = 2) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('ads')
            .select('*')
            .eq('is_active', true)
            .eq('placement', 'sidebar')
            .lte('starts_at', new Date().toISOString())
            .gte('ends_at', new Date().toISOString())
            .limit(limit)

        if (error) return []
        return data as ActiveAd[]
    },

    /**
     * Record an ad impression
     */
    async recordImpression(adId: string) {
        const supabase = createClient()
        const { error } = await supabase.rpc('increment_ad_impressions', { ad_id: adId })
        if (error) {
            // Fallback if RPC doesn't exist
            const { data: ad } = await supabase.from('ads').select('impressions').eq('id', adId).single()
            if (ad) {
                await supabase.from('ads').update({ impressions: (ad.impressions || 0) + 1 }).eq('id', adId)
            }
        }
    },

    /**
     * Record an ad click
     */
    async recordClick(adId: string) {
        const supabase = createClient()
        const { error } = await supabase.rpc('increment_ad_clicks', { ad_id: adId })
        if (error) {
            // Fallback if RPC doesn't exist
            const { data: ad } = await supabase.from('ads').select('clicks').eq('id', adId).single()
            if (ad) {
                await supabase.from('ads').update({ clicks: (ad.clicks || 0) + 1 }).eq('id', adId)
            }
        }
    },

    /**
     * Get ad settings/configuration
     */
    async getSettings() {
        const supabase = createClient()
        const { data, error } = await supabase.from('ad_settings').select('*')
        if (error) {
            console.error('Error fetching ad settings:', error)
            return []
        }
        return data
    },

    /**
     * Update ad settings
     */
    async updateSettings(placement: string, updates: { max_slots?: number, price_per_period?: number }) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('ad_settings')
            .update(updates)
            .eq('placement', placement)
            .select()
            .single()

        if (error) throw error
        return data
    },

    /**
     * Get remaining slots for all placements
     */
    async getRemainingSlots() {
        const settings = await this.getSettings()
        const activeAds = await this.getActiveAds()

        const placementCounts = activeAds.reduce((acc, ad) => {
            acc[ad.placement] = (acc[ad.placement] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const result = {
            sidebar: 0,
            navbar: 0,
            banner: 0,
            inline: 0
        }

        settings.forEach(setting => {
            const used = placementCounts[setting.placement] || 0
            const remaining = Math.max(0, setting.max_slots - used)
            if (setting.placement in result) {
                // @ts-ignore
                result[setting.placement] = remaining
            }
        })

        // Return default values if no settings found (fallback)
        if (settings.length === 0) {
            return {
                sidebar: 5,
                navbar: 2,
                banner: 1,
                inline: 3
            }
        }

        return result
    },

    /**
     * Get ads for display respecting max slots setting
     */
    async getAdsForDisplay(placement: string) {
        const settings = await this.getSettings()
        const setting = settings.find(s => s.placement === placement)
        const maxSlots = setting?.max_slots || (placement === 'sidebar' ? 5 : placement === 'navbar' ? 2 : 1)

        const ads = await this.getActiveAds(placement)
        return ads.slice(0, maxSlots)
    },

    /**
     * Get Featured/Sponsor Slots Status (Real-time)
     */
    async getFeaturedSlotsStatus() {
        const supabase = createClient()

        // 1. Get Settings for 'featured_tool'
        const { data: setting } = await supabase
            .from('ad_settings')
            .select('*')
            .eq('placement', 'featured_tool')
            .single()

        const maxSlots = setting?.max_slots || 10 // Default to 10 if not configured

        // 2. Count Active Tools with Premium Status
        const { count, error } = await supabase
            .from('tools')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved')
            .or('plan.eq.Featured,plan.eq.Sponsor,plan.eq.featured,plan.eq.sponsor')
        // Note: We don't check is_featured column as it doesn't exist

        if (error) {
            console.error('Error counting featured tools:', error)
            return { total: maxSlots, used: 0, remaining: maxSlots }
        }

        const used = count || 0
        const remaining = Math.max(0, maxSlots - used)

        return {
            total: maxSlots,
            used,
            remaining
        }
    },

    /**
     * Get ALL ads for a specific tool (including scheduled/inactive)
     */
    async getAdsByTool(slug: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('ads')
            .select('*')
            .ilike('link_url', `%${slug}%`)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching tool ads:', error)
            return []
        }
        return data as Ad[]
    },

    /**
     * Get ALL ads for a specific advertiser email
     */
    async getAdsByEmail(email: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('ads')
            .select('*')
            .eq('advertiser_email', email)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching email ads:', error)
            return []
        }
        return data as Ad[]
    }
}
