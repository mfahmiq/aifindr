import { createClient } from "@/lib/supabase/client"
import { Category } from "@/lib/types"

export const categoriesService = {
    async getCategories() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name')

        if (error) throw error
        return data as Category[]
    },

    async getCategoryBySlug(slug: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('slug', slug)
            .single()

        if (error) return null
        return data as Category
    }
}
