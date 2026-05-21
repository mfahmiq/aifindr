import { createClient } from "@/lib/supabase/client"

export const newsletterService = {
    async subscribe(email: string, source: string = 'homepage', supabaseClient?: any) {
        const supabase = supabaseClient || createClient()
        const { error } = await supabase
            .from('newsletter_subscribers')
            .insert({
                email,
                source,
                is_verified: true,
                is_active: true
            })

        if (error) {
            if (error.code === '23505') { // Unique violation
                return { message: 'Already subscribed' }
            }
            throw error
        }
        return { success: true }
    }
}

