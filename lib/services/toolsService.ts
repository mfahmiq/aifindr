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
        highlight?: boolean // for "IndoAI Selection" (Featured + Sponsor)
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
      `, { count: 'exact' })

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

        // Highlight/Featured Filter (IndoAI Selection)
        // Includes tools that are 'featured' or 'sponsor' plan, or have is_featured=true
        if (filters?.highlight) {
            query = query.or('plan.eq.featured,plan.eq.sponsor,is_featured.eq.true')
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
        // Always prioritize Sponsor/Featured tools (is_priority) unless sorting by specific metric that overrides it (optional)
        // For now, let's keep priority as primary sort for default lists, but usually secondary for specific sorts?
        // Actually, if sorting by 'newest', a sponsor from 2 years ago shouldn't be at top?
        // Let's make priority secondary if a specific sort is requested, or PRIMARY if no sort.
        // HOWEVER, based on typical business logic, Sponsors often want to be on top.
        // The current implementation `query.order('is_priority', { ascending: false })` applies it as first order.
        query = query.order('is_priority', { ascending: false })

        switch (filters?.sortBy) {
            case 'rating':
                query = query.order('rating', { ascending: false, nullsFirst: false })
                break
            case 'newest':
                query = query.order('created_at', { ascending: false })
                break
            case 'trending':
                query = query.order('view_count', { ascending: false, nullsFirst: false })
                break
            case 'popular':
                query = query.order('favorite_count', { ascending: false, nullsFirst: false })
                break
            default:
                // Default sort: maybe by date or favorites if no specific sort
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

    async getRelatedTools(categoryId: string, currentToolId: string, currentToolTagIds: string[] = [], limit = 3) {
        const supabase = createClient()
        // Fetch candidates from same category, fetch tool_tags to compare
        const { data, error } = await supabase
            .from('tools')
            .select(`
                *,
                categories (name, slug, icon),
                tool_tags (tag_id)
            `)
            .eq('status', 'approved')
            .eq('category_id', categoryId)
            .neq('id', currentToolId)
            .order('view_count', { ascending: false }) // Initial ordering by popularity
            .limit(20) // Get pool of candidates

        if (error) throw error

        if (!data || data.length === 0) return []

        // If no tags to compare, just return top by popularity (limit)
        if (currentToolTagIds.length === 0) {
            return data.slice(0, limit) as ToolWithRelations[]
        }

        // Calculate relevance score
        const scoredTools = data.map((tool: any) => {
            let score = 0
            // Base score for same category (already filtered)

            // Tag overlap score
            const toolTagIds = tool.tool_tags?.map((t: any) => t.tag_id) || []
            const intersection = toolTagIds.filter((id: string) => currentToolTagIds.includes(id))
            score += intersection.length * 5 // Weight for each matching tag

            // Add popularity weight (logarithmic to prevent view count dominance)
            score += Math.log10(tool.view_count || 1)

            return { tool, score }
        })

        // Sort by score descending
        scoredTools.sort((a, b) => b.score - a.score)

        // Return top tools
        return scoredTools.slice(0, limit).map(item => item.tool) as ToolWithRelations[]
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
