import { createClient } from "@/lib/supabase/client"
import {
    ToolClaim,
    ToolClaimWithRelations,
    ClaimStatus,
    VerificationMethod,
    InsertTables,
    UpdateTables
} from "@/lib/types"
import { activityLogsService } from "./activityLogsService"

export const toolClaimsService = {
    /**
     * Create a new tool claim request
     */
    async createClaim(data: InsertTables<'tool_claims'>) {
        const supabase = createClient()

        // Check if claim already exists
        const existing = await this.getClaimByToolAndUser(
            data.tool_id!,
            data.user_id!
        )

        if (existing) {
            throw new Error('You have already submitted a claim for this tool')
        }

        const { data: claim, error } = await supabase
            .from('tool_claims')
            .insert({
                ...data,
                status: 'pending'
            })
            .select()
            .single()

        if (error) throw error
        return claim as ToolClaim
    },

    /**
     * Get claim by tool and user
     */
    async getClaimByToolAndUser(toolId: string, userId: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('tool_claims')
            .select('*')
            .eq('tool_id', toolId)
            .eq('user_id', userId)
            .single()

        if (error && error.code !== 'PGRST116') throw error
        return data as ToolClaim | null
    },

    /**
     * Get user's claims
     */
    async getUserClaims(userId: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('tool_claims')
            .select(`
                *,
                tools (id, name, slug, logo_url)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as ToolClaimWithRelations[]
    },

    /**
     * Get all pending claims (admin)
     */
    async getPendingClaims() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('tool_claims')
            .select(`
                *,
                tools (id, name, slug, logo_url, website_url),
                users:user_id (id, name, email)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: true })

        if (error) throw error
        return data as ToolClaimWithRelations[]
    },

    /**
     * Get all claims with filters (admin)
     */
    async getAllClaims(filters?: {
        status?: ClaimStatus
        limit?: number
        page?: number
    }) {
        const supabase = createClient()
        let query = supabase
            .from('tool_claims')
            .select(`
                *,
                tools (id, name, slug, logo_url),
                users:user_id (id, name, email),
                reviewer:reviewed_by (id, name)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })

        if (filters?.status) {
            query = query.eq('status', filters.status)
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
            claims: data as ToolClaimWithRelations[],
            count: count || 0
        }
    },

    /**
     * Approve a claim
     */
    async approveClaim(claimId: string, reviewerId: string) {
        const supabase = createClient()

        // Get the claim
        const { data: claim, error: claimError } = await supabase
            .from('tool_claims')
            .select('tool_id, user_id, verification_method')
            .eq('id', claimId)
            .single()

        if (claimError) throw claimError

        // Update the claim status
        const { error: updateError } = await supabase
            .from('tool_claims')
            .update({
                status: 'approved',
                reviewed_at: new Date().toISOString(),
                reviewed_by: reviewerId
            })
            .eq('id', claimId)

        if (updateError) throw updateError

        // Set the tool owner and set is_verified to true
        const { error: toolError } = await supabase
            .from('tools')
            .update({ 
                owner_id: claim.user_id,
                is_verified: true 
            })
            .eq('id', claim.tool_id)

        if (toolError) throw toolError

        // Log the activity
        await activityLogsService.log({
            user_id: reviewerId,
            action: 'claim.approve',
            entity_type: 'claim',
            entity_id: claimId,
            old_values: { status: 'pending', is_verified: false },
            new_values: { status: 'approved', is_verified: true },
            notes: `Admin approved claim manually. Verification method: ${claim.verification_method}`
        }, supabase)

        return true
    },

    /**
     * Reject a claim
     */
    async rejectClaim(claimId: string, reviewerId: string, reason: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('tool_claims')
            .update({
                status: 'rejected',
                rejection_reason: reason,
                reviewed_at: new Date().toISOString(),
                reviewed_by: reviewerId
            })
            .eq('id', claimId)

        if (error) throw error

        // Log the activity
        await activityLogsService.log({
            user_id: reviewerId,
            action: 'claim.reject',
            entity_type: 'claim',
            entity_id: claimId,
            old_values: { status: 'pending' },
            new_values: { status: 'rejected', rejection_reason: reason },
            notes: `Admin rejected claim. Reason: ${reason}`
        }, supabase)

        return true
    },

    /**
     * Get claim by ID
     */
    async getClaimById(id: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('tool_claims')
            .select(`
                *,
                tools (id, name, slug, logo_url, website_url),
                users:user_id (id, name, email),
                reviewer:reviewed_by (id, name)
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        return data as ToolClaimWithRelations
    },

    /**
     * Check if user owns a tool
     */
    async isToolOwner(toolId: string, userId: string): Promise<boolean> {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('tools')
            .select('owner_id')
            .eq('id', toolId)
            .single()

        if (error) return false
        return data?.owner_id === userId
    },

    /**
     * Get tools owned by user
     */
    async getOwnedTools(userId: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('tools')
            .select(`
                *,
                categories (name, slug, icon)
            `)
            .eq('owner_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    }
}
