import { createClient } from "@/lib/supabase/client"

export const analyticsService = {
    async recordToolView(toolId: string) {
        const supabase = createClient()

        // We just fire and forget the insert into tool_views
        // RLS policy allows anon insert
        await supabase.from('tool_views').insert({
            tool_id: toolId,
            // user_agent, referrer, ip_hash would be ideal to capture server-side
            // but client-side capture is okay for now
        })

        // Also increment the denormalized counter on tools table
        // Ideally this is a database trigger, but for now we manually update or rely on background worker
        // Let's assume a background worker or trigger handles the count aggregation to avoid race conditions
        // But for immediate feedback, we might want to do it.
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
