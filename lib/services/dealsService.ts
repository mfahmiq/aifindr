import { createClient } from "@/lib/supabase/client"
import { Deal } from "@/lib/types"

export interface DealWithTool extends Deal {
    tools: {
        name: string
        slug: string
        logo_url: string | null
    }
}

export const dealsService = {
    async getActiveDeals() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('deals')
            .select(`
        *,
        tools (name, slug, logo_url)
      `)
            .eq('is_active', true)
            .gt('expires_at', new Date().toISOString()) // filter expired
            .order('created_at', { ascending: false })

        if (error) throw error

        // Transform specifically because the type alias 'tools' returns an object, not array
        return data as unknown as DealWithTool[]
    }
}
