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

export const pinterestAdapter: SocialAdapter = {
    id: "pinterest",
    name: "Pinterest Pin",

    isEnabled(): boolean {
        return !!process.env.PINTEREST_ACCESS_TOKEN
    },

    async post(tool: SocialToolPayload): Promise<{ success: boolean; error?: string }> {
        if (!this.isEnabled()) {
            return { success: false, error: "Pinterest Access Token is not configured in .env" }
        }

        const token = process.env.PINTEREST_ACCESS_TOKEN!
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aifindr.com"
        let boardId = process.env.PINTEREST_BOARD_ID

        const utmDetailUrl = appendUTM(`${appUrl}/tool/${tool.slug}`, "pinterest", "social", "autopost")
        const pinImage = tool.logo_url || `${appUrl}/logo.png`

        try {
            // 1. Resolve Pinterest Board ID if not provided in environment
            if (!boardId) {
                const boardsResponse = await fetch("https://api.pinterest.com/v5/boards", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                })

                const boardsData = await boardsResponse.json()

                if (!boardsResponse.ok || !boardsData.items || boardsData.items.length === 0) {
                    return { 
                        success: false, 
                        error: "Pinterest Board ID not set, and failed to auto-fetch existing boards on profile" 
                    }
                }
                
                // Select first board as fallback
                boardId = boardsData.items[0].id
            }

            // 2. Draft Pin Payload
            const pinPayload = {
                link: utmDetailUrl,
                title: `Review AI Tool Baru: ${tool.name}`,
                description: tool.short_description || "Direktori AI Terbesar AIFindr",
                board_id: boardId,
                media_source: {
                    source_type: "image_url",
                    url: pinImage
                }
            }

            // 3. Dispatch to Pinterest API
            const response = await fetch("https://api.pinterest.com/v5/pins", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(pinPayload)
            })

            const resData = await response.json()

            if (!response.ok) {
                return { 
                    success: false, 
                    error: resData.message || `Pinterest Pin creation failed. HTTP Status: ${response.status}` 
                }
            }

            return { success: true }
        } catch (error: any) {
            console.error("Pinterest post error:", error)
            return { success: false, error: error.message || "Failed to create Pin on Pinterest" }
        }
    }
}
