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
        picks?: boolean // for "The AI Select Picks" (Priority + High Rating)
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
        ),
        reviews (
            rating,
            comment,
            guest_name,
            created_at
        )
      `, { count: 'exact' })

        // Admin filtering logic
        if (filters?.status === 'all') {
            // No filter
        } else if (filters?.status === 'pending') {
            // Show unverified tools that are NOT rejected
            query = query.eq('is_verified', false).neq('status', 'rejected')
        } else if (filters?.status === 'rejected') {
            query = query.eq('status', 'rejected')
        } else if (filters?.status === 'approved') {
            query = query.eq('status', 'approved').eq('is_verified', true)
        } else {
            // Default public listing
            query = query.eq('status', 'approved').eq('is_verified', true)
        }

        // Filter by subscription plan
        if (filters?.plan) {
            query = query.eq('plan', filters.plan)
        }

        // Highlight/Featured Filter (IndoAI Selection)
        // Includes tools that are 'featured' or 'sponsor' plan, or have is_featured=true
        if (filters?.highlight) {
            // Check for both Title Case (as in constants.ts) and lowercase (as in types.ts) to be safe
            query = query.or('plan.eq.Featured,plan.eq.Sponsor,plan.eq.featured,plan.eq.sponsor,is_featured.eq.true')
        }

        if (filters?.picks) {
            // Picks logic:
            // 1. Manually priority (is_priority = true)
            // 2. OR Sponsor Plan
            // 3. OR High Rating (> 4.8)
            query = query.or('is_priority.eq.true,plan.eq.Sponsor,plan.eq.sponsor,rating.gte.4.8')

            // Ensure they are approved
            query = query.eq('status', 'approved')
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

        // Helper: Get plan priority (lower = higher priority)
        const getPlanPriority = (plan: string | null | undefined): number => {
            const planLower = (plan || 'free').toLowerCase()
            switch (planLower) {
                case 'sponsor': return 0
                case 'featured': return 1
                case 'pro': return 2
                case 'free': return 3
                default: return 4
            }
        }

        // Transform data to match easier-to-use structure if needed
        // Map tool_tags -> tags array
        let tools = data.map((t: any) => ({
            ...t,
            category: t.categories,
            tags: t.tool_tags?.map((tt: any) => tt.tags) || []
        })) as ToolWithRelations[]

        // Client-side sort by plan priority (Sponsor > Featured > Pro > Free)
        // This ensures plan-based ordering is respected even with pagination
        tools = tools.sort((a, b) => {
            const priorityDiff = getPlanPriority(a.plan) - getPlanPriority(b.plan)
            if (priorityDiff !== 0) return priorityDiff
            // Secondary sort by the original criteria (favorite_count, etc) is already applied by DB
            return 0
        })

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

    async getRelatedTools(categoryId: string, currentToolId: string, currentToolTagIds: string[] = [], limit = 6) {
        const supabase = createClient()
        // Fetch candidates from same category
        // Prioritize "is_priority" (Sponsor/Featured) tools first
        const { data, error } = await supabase
            .from('tools')
            .select(`
                *,
                categories (name, slug, icon),
                tool_tags (tag_id)
            `)
            .eq('status', 'approved')
            .eq('is_verified', true)
            .eq('category_id', categoryId)
            .neq('id', currentToolId)
            // .order('is_priority', { ascending: false }) // Assuming this column exists based on getTools usage
            // Fallback: If is_priority doesn't exist, we rely on post-fetch sorting, but let's try to order by view_count for quality candidates
            .order('view_count', { ascending: false })
            .limit(50) // Get larger pool to find sponsors

        if (error) throw error

        if (!data || data.length === 0) return []

        // Calculate relevance score + Plan Priority
        const scoredTools = data.map((tool: any) => {
            let score = 0

            // 1. Plan Priority Bonus (Huge impact)
            const plan = (tool.plan || '').toLowerCase()
            if (plan === 'sponsor') score += 1000
            else if (plan === 'featured') score += 500
            else if (plan === 'pro') score += 100

            // 2. Tag overlap score (Relevance)
            if (currentToolTagIds.length > 0) {
                const toolTagIds = tool.tool_tags?.map((t: any) => t.tag_id) || []
                const intersection = toolTagIds.filter((id: string) => currentToolTagIds.includes(id))
                score += intersection.length * 10 // Increased weight for tag relevance
            }

            // 3. Popularity weight (Logarithmic)
            score += Math.log10(tool.view_count || 1) * 5

            return { tool, score }
        })

        // Sort by score descending
        scoredTools.sort((a, b) => b.score - a.score)

        return scoredTools.slice(0, limit).map(item => item.tool) as ToolWithRelations[]
    },

    async updateToolStatus(id: string, status: string, client?: SupabaseClient) {
        const supabase = client || createClient()
        const { data, error } = await supabase
            .from('tools')
            .update({ status })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async getAdminStats(client?: SupabaseClient) {
        const supabase = client || createClient()

        const [
            { count: totalCount },
            { count: publishedCount },
            { count: pendingCount },
            { count: rejectedCount },
            { count: premiumCount },
            { count: proCount },
            { count: featuredCount },
            { count: sponsorCount }
        ] = await Promise.all([
            supabase.from('tools').select('*', { count: 'exact', head: true }),
            supabase.from('tools').select('*', { count: 'exact', head: true }).eq('is_verified', true),
            supabase.from('tools').select('*', { count: 'exact', head: true }).eq('is_verified', false).neq('status', 'rejected'),
            supabase.from('tools').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
            supabase.from('tools').select('*', { count: 'exact', head: true }).neq('plan', 'Free'),
            supabase.from('tools').select('*', { count: 'exact', head: true }).eq('plan', 'Pro'),
            supabase.from('tools').select('*', { count: 'exact', head: true }).eq('plan', 'Featured'),
            supabase.from('tools').select('*', { count: 'exact', head: true }).eq('plan', 'Sponsor')
        ])

        return {
            total: totalCount || 0,
            published: publishedCount || 0,
            pending: pendingCount || 0,
            rejected: rejectedCount || 0,
            premium: premiumCount || 0,
            pro: proCount || 0,
            featured: featuredCount || 0,
            sponsor: sponsorCount || 0
        }
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
