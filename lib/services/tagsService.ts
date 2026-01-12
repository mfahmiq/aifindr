import { createClient } from "@/lib/supabase/client"
import { Tag } from "@/lib/types"

export const tagsService = {
    async getTags() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('tags')
            .select('*')
            .order('usage_count', { ascending: false })

        if (error) throw error
        return data as Tag[]
    }
}
