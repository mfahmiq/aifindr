import { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { Tool, ToolWithRelations } from "@/lib/types"

export const toolsService = {
    async getTools(filters?: {
        search?: string
        category?: string
        pricing?: string[]
        tags?: string[]
        features?: {
            hasFreeTrial?: boolean
            hasAPI?: boolean
            isOpenSource?: boolean
            isVerified?: boolean
        }
        status?: string // Allow filtering by status (approved, pending, etc)
        plan?: string // Filter by subscription plan (Free, Pro, Featured, Sponsor)
        sortBy?: 'rating' | 'newest' | 'trending' | 'popular'
        limit?: number
        page?: number
    }, client?: SupabaseClient) {
        const supabase = client || createClient()
        let query = supabase
            .from('tools')
            .select(`
        *,
        categories (name, slug, icon),
        tool_tags (
          tags (name, slug)
        )
      `)

        // Default to approved unless specific status requested
        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status)
        } else if (filters?.status !== 'all') {
            // Show approved OR verified tools for public listing
            query = query.or('status.eq.approved,is_verified.eq.true')
        }

        // Filter by subscription plan
        if (filters?.plan) {
            query = query.eq('plan', filters.plan)
        }

        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`)
        }

        if (filters?.category && filters.category !== 'All') {
            // We need to filter by category slug or ID
            // Assuming frontend passes slug or name
            const { data: category } = await supabase
                .from('categories')
                .select('id')
                .or(`name.eq.${filters.category},slug.eq.${filters.category}`)
                .single()

            if (category) {
                query = query.eq('category_id', category.id)
            }
        }

        if (filters?.pricing && filters.pricing.length > 0) {
            query = query.in('pricing_type', filters.pricing)
        }

        // Tag filtering needs special handling in Supabase with many-to-many
        // For simple implementation, we might filter client side or use a more complex query
        // Here we skip complex tag filtering for V1 or handle it if passing specific tag ID

        // Feature filters
        if (filters?.features?.hasFreeTrial) query = query.eq('has_free_trial', true)
        if (filters?.features?.hasAPI) query = query.eq('has_api', true)
        if (filters?.features?.isOpenSource) query = query.eq('is_open_source', true)
        if (filters?.features?.isVerified) query = query.eq('is_verified', true)

        // Sorting
        switch (filters?.sortBy) {
            case 'rating':
                query = query.order('rating', { ascending: false })
                break
            case 'newest':
                query = query.order('created_at', { ascending: false })
                break
            case 'trending':
                query = query.order('view_count', { ascending: false })
                break
            case 'popular':
            default:
                query = query.order('favorite_count', { ascending: false })
        }

        if (filters?.limit) {
            const page = filters.page || 1
            const from = (page - 1) * filters.limit
            const to = from + filters.limit - 1
            query = query.range(from, to)
        }

        const { data, error, count } = await query

        if (error) throw error

        // Transform data to match easier-to-use structure if needed
        // Map tool_tags -> tags array
        const tools = data.map((t: any) => ({
            ...t,
            category: t.categories,
            tags: t.tool_tags?.map((tt: any) => tt.tags) || []
        })) as ToolWithRelations[]

        return { tools, count }
    },

    async getToolBySlug(slug: string, client?: SupabaseClient) {
        const supabase = client || createClient()
        const { data, error } = await supabase
            .from('tools')
            .select(`
        *,
        categories (name, slug, icon),
        tool_tags (
          tags (name, slug)
        ),
        tool_features (feature, sort_order)
      `)
            .eq('slug', slug)
            // .eq('status', 'approved') // Allow fetching by slug even if not approved (e.g. preview)
            .single()

        if (error) return null

        return {
            ...data,
            category: data.categories,
            tags: data.tool_tags?.map((tt: any) => tt.tags) || [],
            features: data.tool_features?.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
        } as ToolWithRelations
    },

    async getFeaturedTools(limit = 6) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('tools')
            .select(`
        *,
        categories (name, slug, icon)
      `)
            .eq('status', 'approved')
            .eq('plan', 'Featured')
            .limit(limit)

        if (error) throw error
        return data as ToolWithRelations[]
    },

    async getRelatedTools(categoryId: string, currentToolId: string, limit = 3) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('tools')
            .select(`
        *,
        categories (name, slug, icon)
      `)
            .eq('status', 'approved')
            .eq('category_id', categoryId)
            .neq('id', currentToolId)
            .limit(limit)

        if (error) throw error
        return data as ToolWithRelations[]
    },

    async updateTool(id: string, updates: Partial<Tool>, client?: SupabaseClient) {
        const supabase = client || createClient()
        const { data, error } = await supabase
            .from('tools')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    }
}
