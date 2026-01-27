import { createBrowserClient } from "@supabase/ssr"

export const settingsService = {
    async getSettings() {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data, error } = await supabase
            .from('site_settings')
            .select('*')
            .eq('id', 'main')
            .single()

        if (error) throw error
        return data
    },

    async updateSettings(updates: any) {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data, error } = await supabase
            .from('site_settings')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', 'main')
            .select()
            .single()

        if (error) throw error
        return data
    }
}
