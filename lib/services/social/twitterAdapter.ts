import { TwitterApi } from "twitter-api-v2"
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

export const twitterAdapter: SocialAdapter = {
    id: "twitter",
    name: "X (Twitter)",

    isEnabled(credentials?: any): boolean {
        const apiKey = credentials?.TWITTER_API_KEY || process.env.TWITTER_API_KEY
        const apiSecret = credentials?.TWITTER_API_SECRET || process.env.TWITTER_API_SECRET
        const accessToken = credentials?.TWITTER_ACCESS_TOKEN || process.env.TWITTER_ACCESS_TOKEN
        const accessSecret = credentials?.TWITTER_ACCESS_SECRET || process.env.TWITTER_ACCESS_SECRET
        return !!(apiKey && apiSecret && accessToken && accessSecret)
    },

    async post(tool: SocialToolPayload, credentials?: any): Promise<{ success: boolean; error?: string }> {
        const apiKey = credentials?.TWITTER_API_KEY || process.env.TWITTER_API_KEY
        const apiSecret = credentials?.TWITTER_API_SECRET || process.env.TWITTER_API_SECRET
        const accessToken = credentials?.TWITTER_ACCESS_TOKEN || process.env.TWITTER_ACCESS_TOKEN
        const accessSecret = credentials?.TWITTER_ACCESS_SECRET || process.env.TWITTER_ACCESS_SECRET

        if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
            return { success: false, error: "Twitter API credentials are not fully configured" }
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aifindr.com"

        // Build URLs with UTM parameters
        const utmWebsiteUrl = appendUTM(tool.website_url, "twitter", "social", "autopost")
        const utmDetailUrl = appendUTM(`${appUrl}/tool/${tool.slug}`, "twitter", "social", "autopost")

        // Build clean hashtag from category
        const hashtagCategory = tool.category_name 
            ? `#${tool.category_name.replace(/[^a-zA-Z0-9]/g, "")}` 
            : "#AI"

        const isVerifiedText = tool.is_verified ? " (Verified ✅)" : ""

        // Draft Twitter/X status (Character limit is 280)
        let tweetText = `🚀 AI Tool Baru: ${tool.name}${isVerifiedText} (${tool.pricing_type || "Free"})\n\n`
        
        // Safe-slice the description to ensure we do not exceed 280 characters
        const descriptionLimit = 110
        const shortDesc = tool.short_description.length > descriptionLimit
            ? `${tool.short_description.slice(0, descriptionLimit - 3)}...`
            : tool.short_description
            
        tweetText += `"${shortDesc}"\n\n`
        tweetText += `👉 Detail: ${utmDetailUrl}\n`
        tweetText += `🔗 Situs: ${utmWebsiteUrl}\n\n`
        tweetText += `${hashtagCategory} #AITools #AIFindr`

        try {
            const client = new TwitterApi({
                appKey: apiKey,
                appSecret: apiSecret,
                accessToken: accessToken,
                accessSecret: accessSecret,
            })

            const response = await client.v2.tweet(tweetText)

            if (!response.data || !response.data.id) {
                return { success: false, error: "Failed to post Tweet: Empty response from Twitter API" }
            }

            return { success: true }
        } catch (error: any) {
            console.error("Twitter post error:", error)
            return { success: false, error: error.message || "Failed to dispatch tweet to Twitter/X" }
        }
    }
}
