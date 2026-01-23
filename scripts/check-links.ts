
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fetch from 'node-fetch'

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local')
dotenv.config({ path: envPath })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Timeout config
const CHECK_TIMEOUT = 10000 // 10 seconds

async function checkUrl(url: string): Promise<boolean> {
    try {
        // Encode URL to handle special characters properly
        const encodedUrl = encodeURI(url)

        // Try HEAD first
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT)

        try {
            const res = await fetch(encodedUrl, {
                method: 'HEAD',
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ToolHealthCheck/1.0' },
                signal: controller.signal as any
            })
            clearTimeout(timeout)

            if (res.ok) return true
            if (res.status === 405 || res.status === 403) {
                // If HEAD is blocked/not allowed, try GET
                throw new Error('Try GET')
            }
            return res.status < 400
        } catch (e: any) {
            clearTimeout(timeout)
            if (e.message !== 'Try GET') throw e
        }

        // Try GET if HEAD failed/blocked
        const controllerGet = new AbortController()
        const timeoutGet = setTimeout(() => controllerGet.abort(), CHECK_TIMEOUT)

        const resGet = await fetch(encodedUrl, {
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ToolHealthCheck/1.0' },
            signal: controllerGet.signal as any
        })
        clearTimeout(timeoutGet)

        return resGet.ok
    } catch (error) {
        return false
    }
}

async function runHealthCheck() {
    console.log('🏥 Starting Link Health Check...')

    // Fetch all tools that haven't been checked in the last 24 hours
    // OR fetch all tools if it's the first run (no last_checked_at)
    // For now, let's process all tools in batches

    let page = 0
    const pageSize = 50
    let hasMore = true
    let processed = 0
    let deactivated = 0

    while (hasMore) {
        const { data: tools, error } = await supabase
            .from('tools')
            .select('id, website_url, name')
            .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) {
            console.error('Error fetching tools:', error)
            break
        }

        if (!tools || tools.length === 0) {
            hasMore = false
            break
        }

        console.log(`Checking batch ${page + 1} (${tools.length} tools)...`)

        const updates = []

        // Process batch in parallel-ish
        for (const tool of tools) {
            if (!tool.website_url) continue

            const isActive = await checkUrl(tool.website_url)

            updates.push(
                supabase
                    .from('tools')
                    .update({
                        is_active: isActive,
                        last_checked_at: new Date().toISOString()
                    })
                    .eq('id', tool.id)
            )

            if (!isActive) {
                process.stdout.write('x')
                deactivated++
            } else {
                process.stdout.write('.')
            }
        }

        await Promise.all(updates)
        console.log('') // Newline
        processed += tools.length
        page++
    }

    console.log('\n✅ Health Check Complete!')
    console.log(`Total Checked: ${processed}`)
    console.log(`Found Dead Links: ${deactivated}`)
}

runHealthCheck()
