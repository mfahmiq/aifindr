
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updateAllColors() {
    console.log('🚀 Starting Bulk Dominant Color Update...')

    // Dynamic import for ESM package
    const { default: getColors } = await import('get-image-colors')

    // 1. Fetch count of tools without color or null
    const { count } = await supabase
        .from('tools')
        .select('*', { count: 'exact', head: true })
        .is('dominant_color', null)

    console.log(`📊 Total tools to update: ${count}`)

    if (!count) return

    let updatedCount = 0
    let errorCount = 0
    let skippedCount = 0 // No logo

    const BATCH_SIZE = 10
    const totalBatches = Math.ceil(count / BATCH_SIZE)

    for (let i = 0; i < totalBatches; i++) {
        // Fetch batch of tools with null color
        const { data: tools, error } = await supabase
            .from('tools')
            .select('id, name, logo_url')
            .is('dominant_color', null)
            .range(0, BATCH_SIZE - 1) // Always fetch from top since we are updating them

        if (error || !tools) {
            console.error(`❌ Error fetching batch ${i}:`, error)
            continue
        }

        if (tools.length === 0) break

        console.log(`Processing batch ${i + 1}/${totalBatches} (${tools.length} tools)...`)

        const promises = tools.map(async (tool) => {
            if (!tool.logo_url) {
                skippedCount++
                process.stdout.write('s')
                return
            }

            try {
                const response = await fetch(tool.logo_url)
                if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)

                const arrayBuffer = await response.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)

                // Extract
                const colors = await getColors(buffer, 'image/png')

                if (!colors || colors.length === 0) {
                    // Mark as updated with default to avoid infinite loop
                    throw new Error('No colors found')
                }

                const dominantColor = colors[0].hex()

                // Update
                const { error: updateError } = await supabase
                    .from('tools')
                    .update({ dominant_color: dominantColor })
                    .eq('id', tool.id)

                if (updateError) throw updateError

                updatedCount++
                process.stdout.write('.')

            } catch (err) {
                // If failed, maybe set a default color or flag to skip next time
                // For now just error
                errorCount++
                process.stdout.write('x')
                // console.error(`Failed ${tool.name}:`, err.message)
            }
        })

        await Promise.all(promises)
        process.stdout.write('\n')
    }

    console.log('\n✅ Bulk Update Complete!')
    console.log(`Updated: ${updatedCount}`)
    console.log(`Skipped (No Logo): ${skippedCount}`)
    console.log(`Errors: ${errorCount}`)
}

updateAllColors()
