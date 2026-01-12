import { createClient } from "@/lib/supabase/client"
import { Review, ReviewWithUser } from "@/lib/types"


export const reviewsService = {
    async getReviewsByToolId(toolId: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('reviews')
            .select(`
        *,
        users!reviews_user_id_fkey (name, avatar_url)
      `)
            .eq('tool_id', toolId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as ReviewWithUser[]
    },

    async createReview(review: {
        tool_id: string
        rating: number
        comment: string
        title?: string
        guest_name?: string
        guest_email?: string
    }) {
        const supabase = createClient()

        // Check auth status
        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('reviews')
            .insert({
                ...review,
                user_id: user?.id || null, // Link to user if logged in
                status: 'pending' // Default to pending moderation
            })
            .select()
            .single()

        if (error) throw error
        return data
    },

    async markHelpful(reviewId: string) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) throw new Error("Must be logged in to vote")

        // Check if already voted
        const { data: existingVote } = await supabase
            .from('review_votes')
            .select('*')
            .eq('review_id', reviewId)
            .eq('user_id', user.id)
            .single()

        if (existingVote) {
            // Remove vote (toggle)
            await supabase
                .from('review_votes')
                .delete()
                .eq('review_id', reviewId)
                .eq('user_id', user.id)

            // Decrement counter
            await supabase.rpc('decrement_review_helpful', { review_id: reviewId })
        } else {
            // Add vote
            await supabase
                .from('review_votes')
                .insert({ review_id: reviewId, user_id: user.id, is_helpful: true })

            // Increment counter (could use db trigger, but hypothetical RPC for now or simple update)
            // For simplicy: just let the trigger handle it or do client side update.
            // We'll trust the trigger `update_reviews_updated_at` but logic for helpful_count isn't in trigger list.
            // We should ideally assume a trigger handles count, or do it manually:

            const { data: review } = await supabase
                .from('reviews')
                .select('helpful_count')
                .eq('id', reviewId)
                .single()

            if (review) {
                await supabase
                    .from('reviews')
                    .update({ helpful_count: (review.helpful_count || 0) + 1 })
                    .eq('id', reviewId)
            }
        }
    },

    /**
     * Get all reviews for admin (with tool name)
     */
    async getAdminReviews(status?: 'pending' | 'approved' | 'rejected' | 'flagged') {
        const supabase = createClient()
        let query = supabase
            .from('reviews')
            .select(`
                *,
                users!reviews_user_id_fkey (name, avatar_url),
                tools (name, slug)
            `)
            .order('created_at', { ascending: false })

        if (status) {
            query = query.eq('status', status)
        }

        const { data, error } = await query

        if (error) throw error
        return data
    },

    /**
     * Update review status
     */
    async updateStatus(reviewId: string, status: 'approved' | 'rejected' | 'flagged') {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('reviews')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', reviewId)
            .select()
            .single()

        if (error) throw error
        return data
    },

    /**
     * Get review stats for admin
     */
    async getStats() {
        const supabase = createClient()

        const { count: total } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })

        const { count: pending } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')

        const { count: approved } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved')

        const { count: flagged } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'flagged')

        const { count: rejected } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'rejected')

        return {
            total: total || 0,
            pending: pending || 0,
            approved: approved || 0,
            flagged: flagged || 0,
            rejected: rejected || 0
        }
    }
}
