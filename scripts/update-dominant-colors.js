
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')
const Vibrant = require('node-vibrant')

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updateDominantColors() {
    console.log('🚀 Starting Dominant Color Update (using Vibrant CJS)...')

    // 1. Fetch count
    const { count } = await supabase.from('tools').select('*', { count: 'exact', head: true })
    console.log(`📊 Total tools: ${count}`)

    if (!count) return

    let updatedCount = 0
    let errorCount = 0
    let skippedCount = 0

    // Process in batches
    const BATCH_SIZE = 20
    const totalBatches = Math.ceil(count / BATCH_SIZE)

    for (let i = 0; i < totalBatches; i++) {
        const from = i * BATCH_SIZE
        const to = from + BATCH_SIZE - 1

        // Fetch batch
        const { data: tools, error } = await supabase
            .from('tools')
            .select('id, name, logo_url, dominant_color')
            // .is('dominant_color', null) // Commented out to force update all 
            .range(from, to)

        if (error) {
            console.error(`❌ Error fetching batch ${i}:`, error)
            continue
        }

        if (!tools || tools.length === 0) continue

        // Process batch in parallel
        const promises = tools.map(async (tool) => {
            if (!tool.logo_url) {
                skippedCount++
                return
            }

            try {
                // Fetch image buffer
                const response = await fetch(tool.logo_url)
                if (!response.ok) throw new Error(`Failed to fetch logo: ${response.statusText}`)

                const arrayBuffer = await response.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)

                // Extract colors using Vibrant
                // Vibrant.from can take Buffer directly
                const palette = await Vibrant.from(buffer).getPalette()

                // Prefer Vibrant, then others
                const dominantColor = palette.Vibrant?.hex ||
                    palette.DarkVibrant?.hex ||
                    palette.LightVibrant?.hex ||
                    palette.Muted?.hex ||
                    '#3b82f6'

                // Update DB (only if different or null)
                // Actually just update it
                const { error: updateError } = await supabase
                    .from('tools')
                    .update({ dominant_color: dominantColor })
                    .eq('id', tool.id)

                if (updateError) throw updateError

                updatedCount++
                process.stdout.write('.')

            } catch (err) {
                // console.error(`Failed ${tool.name}:`, err)
                errorCount++
                process.stdout.write('x')
            }
        })

        await Promise.all(promises)

        // print newline every batch
        process.stdout.write('\n')
        console.log(`Batch ${i + 1}/${totalBatches} completed.`)
    }

    console.log('\n✅ Update Complete!')
    console.log(`Updated: ${updatedCount}`)
    console.log(`Skipped: ${skippedCount}`)
    console.log(`Errors: ${errorCount}`)
}

updateDominantColors().catch(console.error)
