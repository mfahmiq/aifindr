import { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { InsertTables } from "@/lib/types"

export const activityLogsService = {
    /**
     * Create an activity log entry
     */
    async log(data: Omit<InsertTables<'activity_logs'>, 'id' | 'created_at'>, client?: SupabaseClient) {
        const supabase = client || createClient()
        const { data: log, error } = await supabase
            .from('activity_logs')
            .insert(data)
            .select()
            .single()

        if (error) {
            console.error('Failed to write activity log:', error)
            return null
        }
        return log
    },

    /**
     * Get activity logs for admin dashboard
     */
    async getLogs(filters?: {
        action?: string
        entityType?: string
        userId?: string
        limit?: number
        page?: number
    }, client?: SupabaseClient) {
        const supabase = client || createClient()
        let query = supabase
            .from('activity_logs')
            .select(`
                *,
                users:user_id (id, name, email)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })

        if (filters?.action) {
            query = query.eq('action', filters.action)
        }
        if (filters?.entityType) {
            query = query.eq('entity_type', filters.entityType)
        }
        if (filters?.userId) {
            query = query.eq('user_id', filters.userId)
        }

        if (filters?.limit) {
            const page = filters.page || 1
            const from = (page - 1) * filters.limit
            const to = from + filters.limit - 1
            query = query.range(from, to)
        }

        const { data, error, count } = await query

        if (error) throw error
        return {
            logs: data,
            count: count || 0
        }
    }
}
