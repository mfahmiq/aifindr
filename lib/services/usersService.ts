import { createClient } from "@/lib/supabase/client"
import { User } from "@/lib/types"

export const usersService = {
    /**
     * Get all users (admin only)
     */
    async getUsers(filters?: {
        role?: string
        search?: string
        limit?: number
    }) {
        const supabase = createClient()
        let query = supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })

        if (filters?.role) {
            query = query.eq('role', filters.role)
        }

        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
        }

        if (filters?.limit) {
            query = query.limit(filters.limit)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching users:', error)
            return []
        }

        return data as User[]
    },

    /**
     * Get user by ID
     */
    async getUserById(id: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single()

        if (error) return null
        return data as User
    },

    /**
     * Update user role
     */
    async updateUserRole(userId: string, role: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('users')
            .update({ role, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single()

        if (error) throw error
        return data
    },

    /**
     * Get user count
     */
    async getUserCount() {
        const supabase = createClient()
        const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })

        if (error) return 0
        return count || 0
    }
}
