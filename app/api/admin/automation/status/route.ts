import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

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

        // Fetch database-stored credentials
        const { data: settingsData } = await supabase
            .from("site_settings")
            .select("feature_flags")
            .eq("id", "main")
            .single()

        const dbCreds = (settingsData?.feature_flags as any)?.automation_credentials || {}
        const blogGeneratorSettings = (settingsData?.feature_flags as any)?.blog_generator_settings || {
            format: 'listicle',
            status: 'draft',
            category: 'Listicles'
        }

        // 2. Build detailed adapter status
        const adaptersConfig = [
            {
                id: "gemini",
                name: "Gemini AI Core",
                icon: "Sparkles",
                description: "Powered by Gemini 1.5 Flash. Used for daily blog post generation and smart metadata extraction.",
                keys: [
                    { key: "GEMINI_API_KEY", isSet: !!(process.env.GEMINI_API_KEY || dbCreds.gemini?.GEMINI_API_KEY) }
                ],
                isEnabled: !!(process.env.GEMINI_API_KEY || dbCreds.gemini?.GEMINI_API_KEY)
            },
            {
                id: "telegram",
                name: "Telegram Channel",
                icon: "Send",
                description: "Post elegant rich HTML cards with direct tool & UTM links to your Telegram Channel.",
                keys: [
                    { key: "TELEGRAM_BOT_TOKEN", isSet: !!(process.env.TELEGRAM_BOT_TOKEN || dbCreds.telegram?.TELEGRAM_BOT_TOKEN) },
                    { key: "TELEGRAM_CHAT_ID", isSet: !!(process.env.TELEGRAM_CHAT_ID || dbCreds.telegram?.TELEGRAM_CHAT_ID) }
                ],
                isEnabled: !!((process.env.TELEGRAM_BOT_TOKEN || dbCreds.telegram?.TELEGRAM_BOT_TOKEN) && (process.env.TELEGRAM_CHAT_ID || dbCreds.telegram?.TELEGRAM_CHAT_ID))
            },
            {
                id: "discord",
                name: "Discord Server",
                icon: "MessageSquare",
                description: "Send beautifully formatted embedded cards with colored buttons directly to a Discord text channel.",
                keys: [
                    { key: "DISCORD_WEBHOOK_URL", isSet: !!(process.env.DISCORD_WEBHOOK_URL || dbCreds.discord?.DISCORD_WEBHOOK_URL) }
                ],
                isEnabled: !!(process.env.DISCORD_WEBHOOK_URL || dbCreds.discord?.DISCORD_WEBHOOK_URL)
            },
            {
                id: "medium",
                name: "Medium Publication",
                icon: "BookOpen",
                description: "Publish SEO-optimized articles explaining the features and pricing of newly registered tools.",
                keys: [
                    { key: "MEDIUM_INTEGRATION_TOKEN", isSet: !!(process.env.MEDIUM_INTEGRATION_TOKEN || dbCreds.medium?.MEDIUM_INTEGRATION_TOKEN) },
                    { key: "MEDIUM_PUBLISH_STATUS", isSet: !!(process.env.MEDIUM_PUBLISH_STATUS || dbCreds.medium?.MEDIUM_PUBLISH_STATUS || process.env.MEDIUM_PUBLISH_STATUS) }
                ],
                isEnabled: !!(process.env.MEDIUM_INTEGRATION_TOKEN || dbCreds.medium?.MEDIUM_INTEGRATION_TOKEN)
            },
            {
                id: "twitter",
                name: "X (Twitter) Profile",
                icon: "Twitter",
                description: "Tweet short, engaging launch announcements with high-performing tags and short UTM links.",
                keys: [
                    { key: "TWITTER_API_KEY", isSet: !!(process.env.TWITTER_API_KEY || dbCreds.twitter?.TWITTER_API_KEY) },
                    { key: "TWITTER_API_SECRET", isSet: !!(process.env.TWITTER_API_SECRET || dbCreds.twitter?.TWITTER_API_SECRET) },
                    { key: "TWITTER_ACCESS_TOKEN", isSet: !!(process.env.TWITTER_ACCESS_TOKEN || dbCreds.twitter?.TWITTER_ACCESS_TOKEN) },
                    { key: "TWITTER_ACCESS_SECRET", isSet: !!(process.env.TWITTER_ACCESS_SECRET || dbCreds.twitter?.TWITTER_ACCESS_SECRET) }
                ],
                isEnabled: !!(
                    (process.env.TWITTER_API_KEY || dbCreds.twitter?.TWITTER_API_KEY) &&
                    (process.env.TWITTER_API_SECRET || dbCreds.twitter?.TWITTER_API_SECRET) &&
                    (process.env.TWITTER_ACCESS_TOKEN || dbCreds.twitter?.TWITTER_ACCESS_TOKEN) &&
                    (process.env.TWITTER_ACCESS_SECRET || dbCreds.twitter?.TWITTER_ACCESS_SECRET)
                )
            },
            {
                id: "linkedin",
                name: "LinkedIn Organization",
                icon: "Linkedin",
                description: "Post professional launch updates on your corporate or directory page with standard UTM variables.",
                keys: [
                    { key: "LINKEDIN_ACCESS_TOKEN", isSet: !!(process.env.LINKEDIN_ACCESS_TOKEN || dbCreds.linkedin?.LINKEDIN_ACCESS_TOKEN) },
                    { key: "LINKEDIN_ORGANIZATION_ID", isSet: !!(process.env.LINKEDIN_ORGANIZATION_ID || dbCreds.linkedin?.LINKEDIN_ORGANIZATION_ID) }
                ],
                isEnabled: !!(
                    (process.env.LINKEDIN_ACCESS_TOKEN || dbCreds.linkedin?.LINKEDIN_ACCESS_TOKEN) &&
                    (process.env.LINKEDIN_ORGANIZATION_ID || dbCreds.linkedin?.LINKEDIN_ORGANIZATION_ID)
                )
            },
            {
                id: "pinterest",
                name: "Pinterest Boards",
                icon: "Pin",
                description: "Pin tool logo graphics or generated screenshots to designated boards to gain lifetime visual referral search traffic.",
                keys: [
                    { key: "PINTEREST_ACCESS_TOKEN", isSet: !!(process.env.PINTEREST_ACCESS_TOKEN || dbCreds.pinterest?.PINTEREST_ACCESS_TOKEN) },
                    { key: "PINTEREST_BOARD_ID", isSet: !!(process.env.PINTEREST_BOARD_ID || dbCreds.pinterest?.PINTEREST_BOARD_ID) }
                ],
                isEnabled: !!(
                    (process.env.PINTEREST_ACCESS_TOKEN || dbCreds.pinterest?.PINTEREST_ACCESS_TOKEN) &&
                    (process.env.PINTEREST_BOARD_ID || dbCreds.pinterest?.PINTEREST_BOARD_ID)
                )
            }
        ]

        // 3. Fetch recent automation activity logs (limit 20)
        const { data: logs, error: logsError } = await supabase
            .from("activity_logs")
            .select(`
                *,
                tools:entity_id (id, name, logo_url, slug)
            `)
            .in("action", ["social_auto_post", "auto_blog_generate", "auto_aggregate"])
            .order("created_at", { ascending: false })
            .limit(20)

        if (logsError) {
            console.error("Error fetching automation logs:", logsError)
        }

        return NextResponse.json({
            success: true,
            adapters: adaptersConfig,
            blogGeneratorSettings,
            logs: logs || []
        })

    } catch (error) {
        console.error('Admin automation status error:', error)
        return NextResponse.json({ error: 'Failed to fetch automation stats' }, { status: 500 })
    }
}

export async function POST(req: Request) {
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

        // 2. Parse request
        const { adapterId, keys, blogSettings } = await req.json()
        if (!adapterId && !blogSettings) {
            return NextResponse.json({ error: 'Missing required fields: adapterId or blogSettings' }, { status: 400 })
        }

        // 3. Fetch existing site_settings using Admin Client (to bypass RLS write restrictions)
        const adminClient = createAdminClient()
        const { data: settings, error: fetchErr } = await adminClient
            .from('site_settings')
            .select('*')
            .eq('id', 'main')
            .single()

        if (fetchErr) {
            return NextResponse.json({ error: `Failed to fetch settings: ${fetchErr.message}` }, { status: 500 })
        }

        const featureFlags = (settings.feature_flags as any) || {}

        // 4. Update credentials if provided
        if (adapterId && keys) {
            const automationCredentials = featureFlags.automation_credentials || {}
            automationCredentials[adapterId] = {
                ...(automationCredentials[adapterId] || {}),
                ...keys
            }
            featureFlags.automation_credentials = automationCredentials
        }

        // 5. Update blog settings if provided
        if (blogSettings) {
            featureFlags.blog_generator_settings = {
                ...(featureFlags.blog_generator_settings || {}),
                ...blogSettings
            }
        }

        // 6. Update site_settings table
        const { error: updateErr } = await adminClient
            .from('site_settings')
            .update({
                feature_flags: featureFlags,
                updated_at: new Date().toISOString()
            })
            .eq('id', 'main')

        if (updateErr) {
            return NextResponse.json({ error: `Failed to update settings: ${updateErr.message}` }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Save credentials/settings error:', error)
        return NextResponse.json({ error: error.message || 'Failed to save configuration' }, { status: 500 })
    }
}
