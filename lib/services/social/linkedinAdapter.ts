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

export const linkedinAdapter: SocialAdapter = {
    id: "linkedin",
    name: "LinkedIn Profile/Page",

    isEnabled(credentials?: any): boolean {
        const token = credentials?.LINKEDIN_ACCESS_TOKEN || process.env.LINKEDIN_ACCESS_TOKEN
        const orgId = credentials?.LINKEDIN_ORGANIZATION_ID || process.env.LINKEDIN_ORGANIZATION_ID
        return !!(token && orgId)
    },

    async post(tool: SocialToolPayload, credentials?: any): Promise<{ success: boolean; error?: string }> {
        const token = credentials?.LINKEDIN_ACCESS_TOKEN || process.env.LINKEDIN_ACCESS_TOKEN
        const orgId = credentials?.LINKEDIN_ORGANIZATION_ID || process.env.LINKEDIN_ORGANIZATION_ID

        if (!token || !orgId) {
            return { success: false, error: "LinkedIn Access Token or Organization ID is not configured" }
        }
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aifindr.com"

        const utmWebsiteUrl = appendUTM(tool.website_url, "linkedin", "social", "autopost")
        const utmDetailUrl = appendUTM(`${appUrl}/tool/${tool.slug}`, "linkedin", "social", "autopost")

        try {
            // 1. Fetch LinkedIn Member Profile to obtain URN ID
            const meResponse = await fetch("https://api.linkedin.com/v2/me", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            })

            const meData = await meResponse.json()

            if (!meResponse.ok || !meData.id) {
                return { 
                    success: false, 
                    error: meData.message || "Failed to fetch LinkedIn profile details" 
                }
            }

            const personId = meData.id
            const authorUrn = orgId ? `urn:li:organization:${orgId}` : `urn:li:person:${personId}`

            // 2. Draft Share Commentary
            const isVerifiedText = tool.is_verified ? " [Verified ✅]" : ""
            const shareText = `🚀 AI Tool Baru Terdaftar di AIFindr: ${tool.name}${isVerifiedText}\n\n` +
                `"${tool.short_description}"\n\n` +
                `🏷️ Kategori: ${tool.category_name || "General"}\n` +
                `💰 Model Harga: ${tool.pricing_type || "Free"}\n\n` +
                `👉 Detail Review: ${utmDetailUrl}\n` +
                `🔗 Situs Resmi: ${utmWebsiteUrl}\n\n` +
                `#AIFindr #AITools #LinkedInAI #Otomatisasi #Teknologi`

            // 3. Post UGC (User Generated Content) to LinkedIn
            const linkedinPayload = {
                author: authorUrn,
                lifecycleState: "PUBLISHED",
                specificContent: {
                    "com.linkedin.ugc.ShareContent": {
                        shareCommentary: {
                            text: shareText
                        },
                        shareMediaCategory: "ARTICLE",
                        media: [
                            {
                                status: "READY",
                                description: {
                                    text: tool.short_description || ""
                                },
                                originalUrl: utmDetailUrl,
                                title: {
                                    text: `Review AI Tool: ${tool.name} (${tool.pricing_type || "Free"})`
                                }
                            }
                        ]
                    }
                },
                visibility: {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }

            const postResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "X-Restli-Protocol-Version": "2.0.0"
                },
                body: JSON.stringify(linkedinPayload)
            })

            const postData = await postResponse.json()

            if (!postResponse.ok) {
                return { 
                    success: false, 
                    error: postData.message || `LinkedIn Share API failed with status: ${postResponse.status}` 
                }
            }

            return { success: true }
        } catch (error: any) {
            console.error("LinkedIn post error:", error)
            return { success: false, error: error.message || "Failed to publish share update to LinkedIn" }
        }
    }
}
