import { createClient } from "@/lib/supabase/client"
import { NewsletterSubscriber } from "@/lib/types"

export const subscribersService = {
    /**
     * Get all subscribers (admin)
     */
    async getSubscribers(filters?: {
        status?: 'active' | 'unsubscribed' | 'all'
        search?: string
        limit?: number
        offset?: number
    }) {
        const supabase = createClient()
        let query = supabase
            .from('newsletter_subscribers')
            .select('*')
            .order('subscribed_at', { ascending: false })

        // Filter by status
        if (filters?.status === 'active') {
            query = query.eq('is_active', true)
        } else if (filters?.status === 'unsubscribed') {
            query = query.eq('is_active', false)
        }

        if (filters?.search) {
            query = query.ilike('email', `%${filters.search}%`)
        }

        if (filters?.limit) {
            const offset = filters.offset || 0
            query = query.range(offset, offset + filters.limit - 1)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching subscribers:', error)
            return []
        }

        return data as NewsletterSubscriber[]
    },

    /**
     * Get subscriber stats
     */
    async getStats() {
        const supabase = createClient()

        // Get total
        const { count: total } = await supabase
            .from('newsletter_subscribers')
            .select('*', { count: 'exact', head: true })

        // Get active
        const { count: active } = await supabase
            .from('newsletter_subscribers')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)

        // Get this week (last 7 days)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const { count: thisWeek } = await supabase
            .from('newsletter_subscribers')
            .select('*', { count: 'exact', head: true })
            .gte('subscribed_at', weekAgo.toISOString())

        return {
            total: total || 0,
            active: active || 0,
            unsubscribed: (total || 0) - (active || 0),
            thisWeek: thisWeek || 0
        }
    },

    /**
     * Get subscribers by source
     */
    async getBySource() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('newsletter_subscribers')
            .select('source')

        if (error) return {}

        // Count by source
        const sourceStats: Record<string, number> = {}
        data?.forEach(sub => {
            const source = sub.source || 'Unknown'
            sourceStats[source] = (sourceStats[source] || 0) + 1
        })

        return sourceStats
    },

    /**
     * Unsubscribe a subscriber
     */
    async unsubscribe(email: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('newsletter_subscribers')
            .update({
                is_active: false,
                unsubscribed_at: new Date().toISOString()
            })
            .eq('email', email)

        if (error) throw error
    },

    /**
     * Export subscribers as CSV data
     */
    async exportCSV() {
        const subscribers = await this.getSubscribers({ status: 'all' })

        const csv = [
            'Email,Subscribed Date,Source,Status',
            ...subscribers.map(s =>
                `${s.email},${s.subscribed_at || ''},${s.source || ''},${s.is_active ? 'active' : 'unsubscribed'}`
            )
        ].join('\n')

        return csv
    }
}
