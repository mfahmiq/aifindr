
import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import { validateNoteContent } from '@/lib/utils/validation'

export const collectionService = {
    // 1. Create a new collection
    async createCollection(name: string, description: string = "", isPublic: boolean = true) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("User not authenticated")

        // Generate a slug: name-randomSuffix
        const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uuidv4().slice(0, 6)}`

        const { data, error } = await supabase
            .from('collections')
            .insert({
                user_id: user.id,
                name,
                description,
                slug,
                is_public: isPublic
            })
            .select()
            .single()

        if (error) throw error
        return data
    },

    // 2. Get user's collections (for the "Add to Playlist" modal)
    async getUserCollections() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        const { data, error } = await supabase
            .from('collections')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    },

    // 3. Add a tool to a collection
    async addToCollection(collectionId: string, toolId: string, note: string = "") {
        const supabase = createClient()

        // Validate Note
        const validation = validateNoteContent(note)
        if (!validation.isValid) throw new Error(validation.error)

        const { error } = await supabase
            .from('collection_items')
            .insert({
                collection_id: collectionId,
                tool_id: toolId,
                note: note
            })

        if (error) throw error
        return true
    },

    // 4. Get Public Collection by Slug
    // Now fetches relations consistently
    async getCollectionBySlug(slug: string) {
        const supabase = createClient()

        // Fetch Collection Metadata
        const { data: collection, error } = await supabase
            .from('collections')
            .select('*, users(name, avatar_url)')
            .eq('slug', slug)
            .single()

        if (error) return null

        // Fetch Items with Tool Details
        const { data: items, error: itemsError } = await supabase
            .from('collection_items')
            .select(`
                *,
                tools (
                    id, name, slug, logo_url, short_description, plan, 
                    is_verified, is_featured, rating, review_count, dominant_color,
                    categories(name, slug)
                )
            `)
            .eq('collection_id', collection.id)
            .order('created_at', { ascending: true }) // Oldest first (playlist style?) or newest? Let's go Oldest first as "order" default

        if (itemsError) throw itemsError

        return {
            ...collection,
            items: items || []
        }
    }
}
