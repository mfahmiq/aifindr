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

export const mediumAdapter: SocialAdapter = {
    id: "medium",
    name: "Medium Publisher",

    isEnabled(): boolean {
        return !!process.env.MEDIUM_INTEGRATION_TOKEN
    },

    async post(tool: SocialToolPayload): Promise<{ success: boolean; error?: string }> {
        if (!this.isEnabled()) {
            return { success: false, error: "Medium Integration Token is not configured in .env" }
        }

        const token = process.env.MEDIUM_INTEGRATION_TOKEN!
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aifindr.com"
        const publishStatus = process.env.MEDIUM_PUBLISH_STATUS || "public" // public or draft

        const utmWebsiteUrl = appendUTM(tool.website_url, "medium", "social", "autopost")
        const utmDetailUrl = appendUTM(`${appUrl}/tool/${tool.slug}`, "medium", "social", "autopost")

        try {
            // 1. Fetch Author ID from Medium
            const meResponse = await fetch("https://api.medium.com/v1/me", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            })

            const meData = await meResponse.json()

            if (!meResponse.ok || !meData.data || !meData.data.id) {
                return { 
                    success: false, 
                    error: meData.errors ? meData.errors[0].message : "Failed to fetch Medium profile details" 
                }
            }

            const authorId = meData.data.id

            // 2. Format HTML content for Medium Article
            const tagsList = tool.tags ? tool.tags.map(t => `<li>#${t}</li>`).join("") : ""
            const articleContent = `
                <h2>Review AI Tool Baru: ${tool.name}</h2>
                <p>Direktori AI terbesar <a href="${utmDetailUrl}">AIFindr</a> baru saja merilis dan memverifikasi tool AI terbaru yang sangat menarik.</p>
                
                <blockquote>
                    <strong>Deskripsi:</strong><br/>
                    <em>"${tool.short_description}"</em>
                </blockquote>
                
                <h3>Informasi Tambahan:</h3>
                <ul>
                    <li><strong>Kategori:</strong> ${tool.category_name || "General"}</li>
                    <li><strong>Tipe Harga:</strong> ${tool.pricing_type || "Free"}</li>
                </ul>
                
                ${tool.long_description ? `<h3>Review Mendalam:</h3><p>${tool.long_description}</p>` : ""}
                
                ${tagsList ? `<h3>Tags:</h3><ul>${tagsList}</ul>` : ""}
                
                <hr/>
                <p>🚀 <strong>Coba website resminya sekarang juga:</strong> <a href="${utmWebsiteUrl}">Kunjungi Situs Resmi ${tool.name}</a></p>
                <p>👉 <strong>Lihat review, alternatif, dan detail lainnya di AIFindr:</strong> <a href="${utmDetailUrl}">Review ${tool.name} di AIFindr</a></p>
                
                <br/>
                <p><em>Diterbitkan secara otomatis oleh AIFindr Native Automation Engine.</em></p>
            `.trim()

            // 3. Post to Medium
            const postResponse = await fetch(`https://api.medium.com/v1/users/${authorId}/posts`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    title: `Review AI Tool Baru: ${tool.name} (${tool.pricing_type || "Free"})`,
                    contentFormat: "html",
                    content: articleContent,
                    tags: ["artificial-intelligence", "ai-tools", "technology"],
                    publishStatus: publishStatus
                })
            })

            const postData = await postResponse.json()

            if (!postResponse.ok) {
                return { 
                    success: false, 
                    error: postData.errors ? postData.errors[0].message : `Failed to publish to Medium. HTTP Status: ${postResponse.status}` 
                }
            }

            return { success: true }
        } catch (error: any) {
            console.error("Medium post error:", error)
            return { success: false, error: error.message || "Failed to publish article to Medium" }
        }
    }
}
