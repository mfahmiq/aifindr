import { createClient } from "@/lib/supabase/client"
import { BlogPost } from "@/lib/types"

export const blogService = {
    // Get published posts for public view
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

    // Get ALL posts for admin (including drafts)
    async getAllPosts() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as BlogPost[]
    },

    // Get post by slug
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
    },

    // Create new blog post
    async createPost(post: {
        title: string
        slug: string
        excerpt: string
        content: string
        category: string
        status?: string
        cover_image?: string
        read_time?: number
        author_name?: string
    }) {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('blog_posts')
            .insert({
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                content: post.content,
                category: post.category,
                status: post.status || 'draft',
                cover_image: post.cover_image || null,
                read_time: post.read_time || 5,
                author_name: post.author_name || 'Admin',
                published_at: post.status === 'published' ? new Date().toISOString() : null,
                view_count: 0
            })
            .select()
            .single()

        if (error) throw error
        return data as BlogPost
    },

    // Update blog post
    async updatePost(id: string, updates: {
        title?: string
        slug?: string
        excerpt?: string
        content?: string
        category?: string
        status?: string
        cover_image?: string
        read_time?: number
    }) {
        const supabase = createClient()

        // If publishing, set published_at
        const updateData: any = { ...updates }
        if (updates.status === 'published') {
            const { data: existing } = await supabase
                .from('blog_posts')
                .select('published_at')
                .eq('id', id)
                .single()

            if (!existing?.published_at) {
                updateData.published_at = new Date().toISOString()
            }
        }

        const { data, error } = await supabase
            .from('blog_posts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as BlogPost
    },

    // Delete blog post
    async deletePost(id: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    }
}
