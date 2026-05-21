import { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"
import { SocialAdapter, SocialPostResult, SocialToolPayload } from "./types"
import { telegramAdapter } from "./telegramAdapter"
import { discordAdapter } from "./discordAdapter"
import { mediumAdapter } from "./mediumAdapter"
import { twitterAdapter } from "./twitterAdapter"
import { linkedinAdapter } from "./linkedinAdapter"
import { pinterestAdapter } from "./pinterestAdapter"

const ALL_ADAPTERS: SocialAdapter[] = [
    telegramAdapter,
    discordAdapter,
    mediumAdapter,
    twitterAdapter,
    linkedinAdapter,
    pinterestAdapter
]

export const socialPosterService = {
    /**
     * Get a list of all currently configured and enabled adapters
     */
    getEnabledAdapters(): string[] {
        return ALL_ADAPTERS.filter(a => a.isEnabled()).map(a => a.name)
    },

    /**
     * Post a newly approved tool to all active social media channels
     * 
     * @param toolId - The Supabase ID of the approved tool
     * @param client - Optional Supabase Client (falls back to Admin client)
     */
    async postNewToolAlert(toolId: string, client?: SupabaseClient): Promise<SocialPostResult[]> {
        const supabase = client || createAdminClient()
        
        try {
            console.log(`[SocialPoster] Triggered auto-post for Tool ID: ${toolId}`)

            // 1. Fetch complete tool record with categories and tags
            const { data: tool, error: fetchErr } = await supabase
                .from("tools")
                .select(`
                    *,
                    categories (name, slug),
                    tool_tags (
                        tags (name, slug)
                    )
                `)
                .eq("id", toolId)
                .single()

            if (fetchErr || !tool) {
                console.error(`[SocialPoster] Error fetching tool for posting (ID: ${toolId}):`, fetchErr)
                return []
            }

            // 2. Map Supabase tool record to standard SocialToolPayload
            const tags = tool.tool_tags
                ? tool.tool_tags.map((tt: any) => tt.tags?.name).filter(Boolean)
                : []

            const payload: SocialToolPayload = {
                id: tool.id,
                name: tool.name,
                slug: tool.slug,
                short_description: tool.short_description || "",
                long_description: tool.long_description || "",
                website_url: tool.website_url,
                logo_url: tool.logo_url || undefined,
                pricing_type: tool.pricing_type || "Free",
                plan: tool.plan || undefined,
                category_name: tool.categories?.name || undefined,
                tags: tags,
                is_verified: tool.is_verified || false
            }

            // 3. Filter only enabled adapters
            const activeAdapters = ALL_ADAPTERS.filter(adapter => adapter.isEnabled())

            if (activeAdapters.length === 0) {
                console.log("[SocialPoster] No social media credentials configured in .env. Skipping all posts.")
                return []
            }

            console.log(`[SocialPoster] Distributing posts to ${activeAdapters.length} active channels: ${activeAdapters.map(a => a.name).join(", ")}`)

            // 4. Run all postings in parallel (Promise.allSettled to prevent single-channel crashes from blocking others)
            const postPromises = activeAdapters.map(async (adapter) => {
                try {
                    const result = await adapter.post(payload)
                    return {
                        adapterId: adapter.id,
                        adapterName: adapter.name,
                        success: result.success,
                        error: result.error
                    }
                } catch (e: any) {
                    return {
                        adapterId: adapter.id,
                        adapterName: adapter.name,
                        success: false,
                        error: e.message || "Unhandled error during posting"
                    }
                }
            })

            const results = await Promise.all(postPromises)

            // 5. Log execution summary and create record in activity logs
            const successCount = results.filter(r => r.success).length
            console.log(`[SocialPoster] Completed postings. Success: ${successCount}/${results.length}`)

            const logNotes = results.map(r => `${r.adapterName}: ${r.success ? "SUCCESS" : `FAILED (${r.error})`}`).join("; ")
            
            await supabase.from("activity_logs").insert({
                action: "social_auto_post",
                entity_type: "tool",
                entity_id: toolId,
                notes: `Auto-posted to social networks. Summary: ${logNotes}`
            })

            return results

        } catch (globalError) {
            console.error("[SocialPoster] Critical failure in postNewToolAlert:", globalError)
            return []
        }
    }
}
