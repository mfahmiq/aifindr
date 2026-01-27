import { createBrowserClient } from "@supabase/ssr"

export interface DashboardStats {
    totalViews: number
    totalFavorites: number
    totalTools: number
    activeDeals: number
    recentViews: { date: string, views: number }[]
    categoryDistribution: { name: string, count: number }[]
    topTools: { name: string, views: number }[]
}

export const analyticsService = {
    async getUserStats() {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        // 1. Fetch user's tools
        const { data: tools, error: toolsError } = await supabase
            .from('tools')
            .select('id, name, view_count, favorite_count, status, plan')
            .eq('owner_id', user.id)

        if (toolsError) throw toolsError

        // 2. Aggregate stats
        const stats = {
            totalTools: tools.length,
            totalViews: tools.reduce((sum, t) => sum + (t.view_count || 0), 0),
            totalFavorites: tools.reduce((sum, t) => sum + (t.favorite_count || 0), 0),
            publishedTools: tools.filter(t => t.status === 'approved').length,
            pendingTools: tools.filter(t => t.status !== 'approved' && t.status !== 'rejected').length,
            avgRating: 0 // We'd need to fetch reviews for this or store aggregate rating on tool
        }

        return { stats, tools }
    },

    async getDashboardStats(): Promise<DashboardStats> {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // 1. Basic counts
        const [
            { count: totalTools },
            { count: activeDeals },
            { data: toolsData },
            { data: categoriesData }
        ] = await Promise.all([
            supabase.from('tools').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
            supabase.from('deals').select('*', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('tools').select('name, view_count, favorite_count, category_id').eq('status', 'approved'),
            supabase.from('categories').select('id, name')
        ])

        const totalViews = toolsData?.reduce((sum, t) => sum + (t.view_count || 0), 0) || 0
        const totalFavorites = toolsData?.reduce((sum, t) => sum + (t.favorite_count || 0), 0) || 0

        // 2. Category distribution
        const catMap = new Map()
        categoriesData?.forEach(c => catMap.set(c.id, c.name))

        const distMap = new Map()
        toolsData?.forEach(t => {
            const catId = t.category_id as string
            const catName = catMap.get(catId) || 'Uncategorized'
            distMap.set(catName, (distMap.get(catName) || 0) + 1)
        })

        const categoryDistribution = Array.from(distMap.entries()).map(([name, count]) => ({ name, count }))

        // 3. Top tools
        const topTools = (toolsData || [])
            .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
            .slice(0, 5)
            .map(t => ({ name: t.name, views: t.view_count || 0 }))

        // 4. Mock weekly traffic (since we don't have historical views table data easily aggregated yet)
        const recentViews = [
            { date: 'Mon', views: Math.floor(totalViews * 0.1) },
            { date: 'Tue', views: Math.floor(totalViews * 0.15) },
            { date: 'Wed', views: Math.floor(totalViews * 0.12) },
            { date: 'Thu', views: Math.floor(totalViews * 0.2) },
            { date: 'Fri', views: Math.floor(totalViews * 0.18) },
            { date: 'Sat', views: Math.floor(totalViews * 0.12) },
            { date: 'Sun', views: Math.floor(totalViews * 0.13) }
        ]

        return {
            totalViews,
            totalFavorites,
            totalTools: totalTools || 0,
            activeDeals: activeDeals || 0,
            recentViews,
            categoryDistribution,
            topTools
        }
    }
}
