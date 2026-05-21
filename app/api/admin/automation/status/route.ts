import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { socialPosterService } from "@/lib/services/social"

export async function GET() {
    try {
        const supabase = await createClient()

        // 1. Verify user is admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: userProfile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
        }

        // 2. Build detailed adapter status
        const adaptersConfig = [
            {
                id: "telegram",
                name: "Telegram Channel",
                icon: "Send",
                description: "Post elegant rich HTML cards with direct tool & UTM links to your Telegram Channel.",
                keys: [
                    { key: "TELEGRAM_BOT_TOKEN", isSet: !!process.env.TELEGRAM_BOT_TOKEN },
                    { key: "TELEGRAM_CHAT_ID", isSet: !!process.env.TELEGRAM_CHAT_ID }
                ],
                isEnabled: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
            },
            {
                id: "discord",
                name: "Discord Server",
                icon: "MessageSquare",
                description: "Send beautifully formatted embedded cards with colored buttons directly to a Discord text channel.",
                keys: [
                    { key: "DISCORD_WEBHOOK_URL", isSet: !!process.env.DISCORD_WEBHOOK_URL }
                ],
                isEnabled: !!process.env.DISCORD_WEBHOOK_URL
            },
            {
                id: "medium",
                name: "Medium Publication",
                icon: "BookOpen",
                description: "Publish SEO-optimized articles explaining the features and pricing of newly registered tools.",
                keys: [
                    { key: "MEDIUM_INTEGRATION_TOKEN", isSet: !!process.env.MEDIUM_INTEGRATION_TOKEN },
                    { key: "MEDIUM_AUTHOR_ID", isSet: !!process.env.MEDIUM_AUTHOR_ID }
                ],
                isEnabled: !!process.env.MEDIUM_INTEGRATION_TOKEN
            },
            {
                id: "twitter",
                name: "X (Twitter) Profile",
                icon: "Twitter",
                description: "Tweet short, engaging launch announcements with high-performing tags and short UTM links.",
                keys: [
                    { key: "TWITTER_API_KEY", isSet: !!process.env.TWITTER_API_KEY },
                    { key: "TWITTER_API_SECRET", isSet: !!process.env.TWITTER_API_SECRET },
                    { key: "TWITTER_ACCESS_TOKEN", isSet: !!process.env.TWITTER_ACCESS_TOKEN },
                    { key: "TWITTER_ACCESS_SECRET", isSet: !!process.env.TWITTER_ACCESS_SECRET }
                ],
                isEnabled: !!(process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET && process.env.TWITTER_ACCESS_TOKEN && process.env.TWITTER_ACCESS_SECRET)
            },
            {
                id: "linkedin",
                name: "LinkedIn Organization",
                icon: "Linkedin",
                description: "Post professional launch updates on your corporate or directory page with standard UTM variables.",
                keys: [
                    { key: "LINKEDIN_ACCESS_TOKEN", isSet: !!process.env.LINKEDIN_ACCESS_TOKEN },
                    { key: "LINKEDIN_ORGANIZATION_ID", isSet: !!process.env.LINKEDIN_ORGANIZATION_ID }
                ],
                isEnabled: !!(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_ORGANIZATION_ID)
            },
            {
                id: "pinterest",
                name: "Pinterest Boards",
                icon: "Pin",
                description: "Pin tool logo graphics or generated screenshots to designated boards to gain lifetime visual referral search traffic.",
                keys: [
                    { key: "PINTEREST_ACCESS_TOKEN", isSet: !!process.env.PINTEREST_ACCESS_TOKEN },
                    { key: "PINTEREST_BOARD_ID", isSet: !!process.env.PINTEREST_BOARD_ID }
                ],
                isEnabled: !!(process.env.PINTEREST_ACCESS_TOKEN && process.env.PINTEREST_BOARD_ID)
            }
        ]

        // 3. Fetch recent social posts activity logs (limit 20)
        const { data: logs, error: logsError } = await supabase
            .from("activity_logs")
            .select(`
                *,
                tools:entity_id (id, name, logo_url, slug)
            `)
            .eq("action", "social_auto_post")
            .order("created_at", { ascending: false })
            .limit(20)

        if (logsError) {
            console.error("Error fetching automation logs:", logsError)
        }

        return NextResponse.json({
            success: true,
            adapters: adaptersConfig,
            logs: logs || []
        })

    } catch (error) {
        console.error('Admin automation status error:', error)
        return NextResponse.json({ error: 'Failed to fetch automation stats' }, { status: 500 })
    }
}
