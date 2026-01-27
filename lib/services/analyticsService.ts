import { createBrowserClient } from "@supabase/ssr"

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
            .eq('user_id', user.id)

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
    }
}
