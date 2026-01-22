import { createClient } from "@/lib/supabase/client"
import { Category } from "@/lib/types"

export interface CategoryWithCount extends Category {
    tool_count: number
}

export const categoriesService = {
    // Get all categories
    async getCategories() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name')

        if (error) throw error
        return data as Category[]
    },

    // Get categories with actual tool count from tools table
    async getCategoriesWithToolCount() {
        const supabase = createClient()

        // Get categories
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('*')
            .order('name')

        if (catError) throw catError

        // Get tool counts per category (include approved and verified tools)
        const { data: toolCounts, error: countError } = await supabase
            .from('tools')
            .select('category_id')
            .eq('status', 'approved')
            .eq('is_verified', true)

        if (countError) throw countError

        // Calculate counts
        const countMap: Record<string, number> = {}
        toolCounts?.forEach(t => {
            if (t.category_id) {
                countMap[t.category_id] = (countMap[t.category_id] || 0) + 1
            }
        })

        // Merge counts into categories
        return (categories || []).map(cat => ({
            ...cat,
            tool_count: countMap[cat.id] || 0
        })) as CategoryWithCount[]
    },

    // Get category by slug
    async getCategoryBySlug(slug: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('slug', slug)
            .single()

        if (error) return null
        return data as Category
    },

    // Create new category
    async createCategory(category: {
        name: string
        slug: string
        icon?: string
        color?: string
        description?: string
    }) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('categories')
            .insert({
                name: category.name,
                slug: category.slug,
                icon: category.icon || '📁',
                color: category.color || 'blue',
                description: category.description || null,
                tool_count: 0
            })
            .select()
            .single()

        if (error) throw error
        return data as Category
    },

    // Update category
    async updateCategory(id: string, updates: {
        name?: string
        slug?: string
        icon?: string
        color?: string
        description?: string
    }) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Category
    },

    // Delete category
    async deleteCategory(id: string) {
        const supabase = createClient()

        // Check if category has tools
        const { count } = await supabase
            .from('tools')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', id)

        if (count && count > 0) {
            throw new Error(`Cannot delete category with ${count} tools assigned`)
        }

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    }
}
