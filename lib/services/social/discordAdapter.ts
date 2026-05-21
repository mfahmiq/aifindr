import { SocialAdapter, SocialToolPayload } from "./types"

function appendUTM(url: string, source: string, medium = "social", campaign = "autopost"): string {
    try {
        const urlObj = new URL(url)
        urlObj.searchParams.set("utm_source", source)
        urlObj.searchParams.set("utm_medium", medium)
        urlObj.searchParams.set("utm_campaign", campaign)
        return urlObj.toString()
    } catch {
        return url
    }
}

export const discordAdapter: SocialAdapter = {
    id: "discord",
    name: "Discord Server Webhook",

    isEnabled(credentials?: any): boolean {
        const webhookUrl = credentials?.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL
        return !!webhookUrl
    },

    async post(tool: SocialToolPayload, credentials?: any): Promise<{ success: boolean; error?: string }> {
        const webhookUrl = credentials?.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL

        if (!webhookUrl) {
            return { success: false, error: "Discord Webhook URL is not configured" }
        }
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aifindr.com"

        // Build URLs with UTM parameters
        const utmWebsiteUrl = appendUTM(tool.website_url, "discord", "social", "autopost")
        const utmDetailUrl = appendUTM(`${appUrl}/tool/${tool.slug}`, "discord", "social", "autopost")

        // Premium color (Hex #5865F2 Blurple = Dec 5814783)
        const embedColor = 5814783 

        const fields = [
            {
                name: "🏷️ Kategori",
                value: tool.category_name || "General",
                inline: true
            },
            {
                name: "💰 Model Harga",
                value: tool.pricing_type || "Free",
                inline: true
            },
            {
                name: "🔗 Situs Resmi",
                value: `[Kunjungi Website](${utmWebsiteUrl})`,
                inline: true
            }
        ]

        if (tool.tags && tool.tags.length > 0) {
            fields.push({
                name: "🏷️ Tags",
                value: tool.tags.slice(0, 5).map(t => `\`${t}\``).join(", "),
                inline: false
            })
        }

        const isVerifiedText = tool.is_verified ? " ✅ [VERIFIED OWNER]" : ""

        const embedPayload = {
            embeds: [
                {
                    title: `🚀 AI Tool Baru Terdaftar: ${tool.name}${isVerifiedText}`,
                    description: tool.short_description || "Tidak ada deskripsi singkat.",
                    url: utmDetailUrl,
                    color: embedColor,
                    thumbnail: tool.logo_url ? { url: tool.logo_url } : undefined,
                    fields: fields,
                    footer: {
                        text: "AIFindr — Direktori AI Terbesar",
                        icon_url: `${appUrl}/logo.png`
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        }

        try {
            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(embedPayload)
            })

            if (!response.ok) {
                return { 
                    success: false, 
                    error: `Discord Webhook returned status code: ${response.status}` 
                }
            }

            return { success: true }
        } catch (error: any) {
            console.error("Discord post error:", error)
            return { success: false, error: error.message || "Failed to post to Discord Webhook" }
        }
    }
}
