import { createClient } from "@/lib/supabase/client"
import { Ad } from "@/lib/types"

export type { Ad }

export interface ActiveAd extends Ad {
    // Extended fields if needed
}

export const adsService = {
    /**
     * Get active ads by placement
     * @param placement - 'navbar' | 'sidebar' | 'hero' | 'inline'
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
                inline: 3 // Default for inline
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
        // Default max slots if not set
        const maxSlots = setting?.max_slots || (placement === 'sidebar' ? 5 : placement === 'navbar' ? 2 : 1)

        const ads = await this.getActiveAds(placement)
        return ads.slice(0, maxSlots)
    }
}
