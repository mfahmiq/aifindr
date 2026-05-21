import { SocialAdapter, SocialToolPayload } from "./types"

function escapeHtml(text: string): string {
    if (!text) return ""
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
}

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

export const telegramAdapter: SocialAdapter = {
    id: "telegram",
    name: "Telegram Channel",

    isEnabled(credentials?: any): boolean {
        const token = credentials?.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN
        const chatId = credentials?.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID
        return !!(token && chatId)
    },

    async post(tool: SocialToolPayload, credentials?: any): Promise<{ success: boolean; error?: string }> {
        const botToken = credentials?.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN
        const chatId = credentials?.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID

        if (!botToken || !chatId) {
            return { success: false, error: "Telegram Bot Token or Chat ID is not configured" }
        }
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aifindr.com"

        // Build URLs with UTM parameters
        const utmWebsiteUrl = appendUTM(tool.website_url, "telegram_channel", "social", "autopost")
        const utmDetailUrl = appendUTM(`${appUrl}/tool/${tool.slug}`, "telegram_channel", "social", "autopost")

        // Build hashtags from category and tags
        const categoryHash = tool.category_name 
            ? `#${tool.category_name.replace(/[^a-zA-Z0-9]/g, "")}` 
            : ""
        const tagsHash = tool.tags
            ? tool.tags.map(t => `#${t.replace(/[^a-zA-Z0-9]/g, "")}`).slice(0, 3).join(" ")
            : ""

        const isVerifiedText = tool.is_verified ? " ✅ [VERIFIED OWNER]" : ""

        // Format beautiful message in Indonesian
        const messageText = `
🚀 <b>AI Tool Baru Terdaftar di AIFindr!</b>${isVerifiedText}

📌 <b>Nama:</b> <a href="${utmDetailUrl}"><b>${escapeHtml(tool.name)}</b></a>
🏷️ <b>Kategori:</b> ${escapeHtml(tool.category_name || "General")}
💰 <b>Tipe Harga:</b> 💸 <b>${escapeHtml(tool.pricing_type || "Free")}</b>

📝 <b>Deskripsi Singkat:</b>
<i>"${escapeHtml(tool.short_description)}"</i>

🔗 <b>Coba Sekarang:</b> <a href="${utmWebsiteUrl}">Kunjungi Situs Resmi</a>
👉 <b>Review & Detail:</b> <a href="${utmDetailUrl}">Lihat Selengkapnya di AIFindr</a>

${categoryHash} ${tagsHash} #AIFindr #AITools #KaryaAnakBangsa #Teknologi
`.trim()

        try {
            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: messageText,
                    parse_mode: "HTML",
                    disable_web_page_preview: false
                })
            })

            const resData = await response.json()

            if (!response.ok || !resData.ok) {
                return { 
                    success: false, 
                    error: resData.description || `HTTP error! Status: ${response.status}` 
                }
            }

            return { success: true }
        } catch (error: any) {
            console.error("Telegram post error:", error)
            return { success: false, error: error.message || "Failed to post to Telegram" }
        }
    }
}
