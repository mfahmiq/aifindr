import { createClient } from "@/lib/supabase/client"
import { Deal } from "@/lib/types"

export interface DealWithTool extends Deal {
    tools: {
        name: string
        slug: string
        logo_url: string | null
    }
}

export interface ToolForSelect {
    id: string
    name: string
    slug: string
}

export const dealsService = {
    // Get active deals (public)
    async getActiveDeals() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('deals')
            .select(`
                *,
                tools (name, slug, logo_url)
            `)
            .eq('is_active', true)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as unknown as DealWithTool[]
    },

    // Get ALL deals for admin
    async getAllDeals() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('deals')
            .select(`
                *,
                tools (name, slug, logo_url)
            `)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as unknown as DealWithTool[]
    },

    // Get tools list for select dropdown
    async getToolsForSelect() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('tools')
            .select('id, name, slug')
            .eq('status', 'approved')
            .order('name')

        if (error) throw error
        return data as ToolForSelect[]
    },

    // Create new deal
    async createDeal(deal: {
        tool_id: string
        discount: string
        code?: string
        description: string
        expires_at?: string
        is_active?: boolean
    }) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('deals')
            .insert({
                tool_id: deal.tool_id,
                discount: deal.discount,
                code: deal.code || null,
                description: deal.description,
                expires_at: deal.expires_at || null,
                is_active: deal.is_active !== false,
                starts_at: new Date().toISOString(),
                claim_count: 0
            })
            .select(`
                *,
                tools (name, slug, logo_url)
            `)
            .single()

        if (error) throw error
        return data as unknown as DealWithTool
    },

    // Update deal
    async updateDeal(id: string, updates: {
        tool_id?: string
        discount?: string
        code?: string
        description?: string
        expires_at?: string
        is_active?: boolean
    }) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('deals')
            .update(updates)
            .eq('id', id)
            .select(`
                *,
                tools (name, slug, logo_url)
            `)
            .single()

        if (error) throw error
        return data as unknown as DealWithTool
    },

    // Delete deal
    async deleteDeal(id: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('deals')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    },

    // Get deals stats
    async getDealsStats() {
        const supabase = createClient()

        const { data: deals, error } = await supabase
            .from('deals')
            .select('id, is_active, expires_at, claim_count')

        if (error) throw error

        const now = new Date()
        const activeDeals = deals?.filter(d => d.is_active) || []
        const withCodes = deals?.filter(d => d.is_active) || []
        const expiringThisWeek = deals?.filter(d => {
            if (!d.expires_at) return false
            const expires = new Date(d.expires_at)
            const diff = expires.getTime() - now.getTime()
            const days = diff / (1000 * 60 * 60 * 24)
            return days > 0 && days <= 7
        }) || []
        const totalClaims = deals?.reduce((sum, d) => sum + (d.claim_count || 0), 0) || 0

        return {
            total: deals?.length || 0,
            active: activeDeals.length,
            expiringThisWeek: expiringThisWeek.length,
            totalClaims
        }
    }
}
