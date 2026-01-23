
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import getColors from 'get-image-colors'
import fetch from 'node-fetch'
import fs from 'fs'

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

async function runEfficientUpdate() {
    console.log('🚀 Starting Robust Bulk Color Update (TSX)...')

    // 1. Fetch ALL IDs with null color
    let allIds: any[] = []
    let hasMore = true
    let page = 0
    const pageSize = 1000

    while (hasMore) {
        console.log(`Fetching page ${page} of tools without dominant color...`)
        const { data, error } = await supabase
            .from('tools')
            .select('id, logo_url, name')
            .is('dominant_color', null)
            .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) {
            console.error("Error fetching tools:", error)
            break
        }

        if (!data || data.length === 0) {
            hasMore = false
        } else {
            allIds = [...allIds, ...data]
            page++
            if (data.length < pageSize) hasMore = false
        }
    }

    console.log(`\n📊 Total tools to process: ${allIds.length}`)

    if (allIds.length === 0) {
        console.log("No tools need updating.")
        return
    }

    let updated = 0
    let failed = 0
    let skipped = 0

    // Process sequentially
    for (let i = 0; i < allIds.length; i++) {
        const tool = allIds[i]

        if (!tool.logo_url) {
            process.stdout.write('s')
            skipped++
            continue;
        }

        try {
            await new Promise(r => setTimeout(r, 200)) // 200ms delay

            // Setup timeout
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000)

            const response = await fetch(tool.logo_url, { signal: controller.signal })
            clearTimeout(timeoutId)

            if (!response.ok) throw new Error(`Status ${response.status}`)

            const buf = await response.arrayBuffer()
            const buffer = Buffer.from(buf)

            if (buffer.length < 100) throw new Error('Buffer too small')

            // get-image-colors requires a buffer and mime type
            const colors = await getColors(buffer, 'image/png')

            if (!colors || colors.length === 0) throw new Error('No color extracted')

            const hex = colors[0].hex()

            // Update database
            const { error: dbErr } = await supabase
                .from('tools')
                .update({ dominant_color: hex })
                .eq('id', tool.id)

            if (dbErr) throw dbErr

            process.stdout.write('.')
            updated++
        } catch (e: any) {
            process.stdout.write('x')
            failed++
        }

        if (i > 0 && i % 50 === 0) {
            const percent = Math.round((i / allIds.length) * 100)
            console.log(`\n[${percent}%] Processed: ${i + 1}/${allIds.length} | Updated: ${updated} | Failed: ${failed}`)
        }
    }

    console.log('\n✅ Batch Process Complete!')
    // Summary
    console.log(`Updated: ${updated}`)
    console.log(`Failed: ${failed}`)
    console.log(`Skipped: ${skipped}`)
}

runEfficientUpdate()
