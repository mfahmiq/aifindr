import { createClient } from "@/lib/supabase/client"

export const newsletterService = {
    async subscribe(email: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('newsletter_subscribers')
            .insert({ email })
            .select()
            .single()

        if (error) {
            if (error.code === '23505') { // Unique violation
                return { message: 'Already subscribed' }
            }
            throw error
        }
        return data
    }
}
