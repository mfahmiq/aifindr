
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import getColors from 'get-image-colors'
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

async function retryFailedColors() {
    console.log('🚀 Starting Smart Retry for Failed Colors...')

    // 1. Fetch only tools that still have NO color
    const { data: tools, error } = await supabase
        .from('tools')
        .select('id, logo_url, website_url, image_url, name')
        .is('dominant_color', null)

    if (error || !tools) {
        console.error("Error fetching failed tools:", error)
        return
    }

    console.log(`📊 Found ${tools.length} failed tools to retry.`)

    if (tools.length === 0) {
        console.log("No tools left to retry! All done.")
        return
    }

    let fixed = 0
    let stillFailed = 0

    // Browser-like headers to bypass some 403s
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    }

    for (const tool of tools) {
        let buffer: Buffer | null = null
        let source = 'original'

        // Strategy 1: Try Original Logo with User-Agent
        if (tool.logo_url) {
            try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 8000)
                const res = await fetch(tool.logo_url, { headers, signal: controller.signal })
                clearTimeout(timeoutId)

                if (res.ok) {
                    const arrayBuffer = await res.arrayBuffer()
                    buffer = Buffer.from(arrayBuffer)
                }
            } catch (e) {
                // Ignore, try next strategy
            }
        }

        // Strategy 2: Try Google Favicon logic if Strategy 1 failed or no logo
        if (!buffer && tool.website_url) {
            source = 'favicon'
            try {
                // Try larger size first
                const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(tool.website_url).hostname}&sz=128`
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 5000)
                const res = await fetch(faviconUrl, { headers, signal: controller.signal })
                clearTimeout(timeoutId)

                if (res.ok) {
                    const arrayBuffer = await res.arrayBuffer()
                    buffer = Buffer.from(arrayBuffer)
                }
            } catch (e) {
                // Ignore
            }
        }

        if (buffer && buffer.length > 50) {
            try {
                const colors = await getColors(buffer, 'image/png') // Type hint helps sometimes
                if (colors && colors.length > 0) {
                    const hex = colors[0].hex()

                    const { error: updateError } = await supabase
                        .from('tools')
                        .update({ dominant_color: hex })
                        .eq('id', tool.id)

                    if (!updateError) {
                        fixed++
                        process.stdout.write('✓')
                        continue
                    }
                }
            } catch (e) {
                // Processing error
            }
        }

        // Strategy 3: Try Screenshot image (image_url)
        if (!buffer && tool.image_url) {
            source = 'screenshot'
            try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 10000)
                const res = await fetch(tool.image_url, { headers, signal: controller.signal })
                clearTimeout(timeoutId)

                if (res.ok) {
                    const arrayBuffer = await res.arrayBuffer()
                    buffer = Buffer.from(arrayBuffer)
                }
            } catch (e) {
                // Ignore
            }
        }

        if (buffer && buffer.length > 50) {
            try {
                const colors = await getColors(buffer, 'image/png')
                if (colors && colors.length > 0) {
                    const hex = colors[0].hex()

                    const { error: updateError } = await supabase
                        .from('tools')
                        .update({ dominant_color: hex })
                        .eq('id', tool.id)

                    if (!updateError) {
                        fixed++
                        process.stdout.write(source === 'screenshot' ? 'S' : '✓')
                        continue
                    }
                }
            } catch (e) {
                // Processing error
            }
        }

        // Strategy 4: FINAL FALLBACK - Set to Neutral Slate
        // If we really can't get any color, we shouldn't leave it NULL forever.
        // We set it to a nice dark slate color.
        try {
            const defaultColor = '#64748b' // Slate 500
            await supabase
                .from('tools')
                .update({ dominant_color: defaultColor })
                .eq('id', tool.id)

            fixed++ // Count as fixed because it's no longer NULL
            process.stdout.write('-') // Mark as defaulted
        } catch (e) {
            stillFailed++
            process.stdout.write('x')
        }
    }

    console.log('\n\n✅ Retry Complete!')
    console.log(`Fixed: ${fixed}`)
    console.log(`Still Failed: ${stillFailed}`)
}

retryFailedColors()
