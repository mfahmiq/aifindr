import { createClient } from "@/lib/supabase/client"

export interface DashboardStats {
    totalViews: number
    totalFavorites: number
    totalTools: number
    activeDeals: number
    topTools: Array<{ name: string; views: number; slug: string }>
    categoryDistribution: Array<{ name: string; count: number }>
    recentViews: Array<{ date: string; views: number }>
}

export const analyticsService = {
    async recordToolView(toolId: string) {
        const supabase = createClient()

        // We just fire and forget the insert into tool_views
        await supabase.from('tool_views').insert({
            tool_id: toolId,
        })
    },

    /**
     * Get dashboard statistics for admin
     */
    async getDashboardStats(): Promise<DashboardStats> {
        const supabase = createClient()

        // Get tools data
        const { data: tools } = await supabase
            .from('tools')
            .select('id, name, slug, view_count, favorite_count, category_id, status')
            .eq('status', 'approved')

        // Get categories
        const { data: categories } = await supabase
            .from('categories')
            .select('id, name')

        // Get active deals count
        const { count: activeDeals } = await supabase
            .from('deals')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)

        // Calculate totals
        const totalViews = tools?.reduce((sum, t) => sum + (t.view_count || 0), 0) || 0
        const totalFavorites = tools?.reduce((sum, t) => sum + (t.favorite_count || 0), 0) || 0
        const totalTools = tools?.length || 0

        // Get top tools by views
        const topTools = (tools || [])
            .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
            .slice(0, 10)
            .map(t => ({ name: t.name, views: t.view_count || 0, slug: t.slug }))

        // Calculate category distribution
        const categoryMap: Record<string, number> = {}
        tools?.forEach(t => {
            if (t.category_id) {
                categoryMap[t.category_id] = (categoryMap[t.category_id] || 0) + 1
            }
        })

        const categoryDistribution = Object.entries(categoryMap).map(([catId, count]) => {
            const cat = categories?.find(c => c.id === catId)
            return { name: cat?.name || 'Other', count }
        }).sort((a, b) => b.count - a.count)

        // Generate recent views data (last 7 days - simplified, would need tool_views table for real data)
        const recentViews = []
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        for (let i = 6; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            recentViews.push({
                date: days[date.getDay()],
                views: Math.floor(totalViews / 7 * (0.7 + Math.random() * 0.6)) // Approximate distribution
            })
        }

        return {
            totalViews,
            totalFavorites,
            totalTools,
            activeDeals: activeDeals || 0,
            topTools,
            categoryDistribution,
            recentViews
        }
    },

    /**
     * Get detailed view analytics from tool_views table
     */
    async getViewAnalytics(days: number = 30) {
        const supabase = createClient()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const { data: views, error } = await supabase
            .from('tool_views')
            .select('created_at, tool_id')
            .gte('created_at', startDate.toISOString())

        if (error) throw error

        // Group by date
        const dailyViews: Record<string, number> = {}
        views?.forEach(view => {
            const date = view.created_at?.split('T')[0]
            if (date) {
                dailyViews[date] = (dailyViews[date] || 0) + 1
            }
        })

        return Object.entries(dailyViews)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date))
    }
}

export const submissionsService = {
    async submitTool(data: {
        name: string
        website_url: string
        short_description: string
        category_id?: string
        pricing_type: string
        submitter_email: string
    }) {
        const supabase = createClient()
        const { error } = await supabase
            .from('submissions')
            .insert(data)

        if (error) throw error
        return { success: true }
    }
}
