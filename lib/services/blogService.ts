import { createClient } from "@/lib/supabase/client"
import { BlogPost } from "@/lib/types"

export const blogService = {
    async getPosts(limit?: number) {
        const supabase = createClient()
        let query = supabase
            .from('blog_posts')
            .select('*')
            .eq('status', 'published')
            .order('published_at', { ascending: false })

        if (limit) {
            query = query.limit(limit)
        }

        const { data, error } = await query
        if (error) throw error
        return data as BlogPost[]
    },

    async getPostBySlug(slug: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('slug', slug)
            .eq('status', 'published')
            .single()

        if (error) return null

        // Increment view count
        const { error: viewError } = await supabase.rpc('increment_blog_view', { post_slug: slug })

        if (viewError) {
            // Fallback if RPC doesn't exist
            const newCount = (data.view_count || 0) + 1
            await supabase.from('blog_posts').update({ view_count: newCount }).eq('id', data.id)
        }

        return data as BlogPost
    }
}
