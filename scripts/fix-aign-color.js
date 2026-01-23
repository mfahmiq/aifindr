
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testColor() {
    console.log('Testing color extraction for AIGNE DocSmith using get-image-colors...')

    // Dynamic import for ESM package
    const { default: getColors } = await import('get-image-colors')

    // 1. Fetch specific tool
    const { data: tools, error } = await supabase
        .from('tools')
        .select('*')
        .ilike('name', '%AIGNE DocSmith%')

    if (error || !tools.length) {
        console.error('Tool not found or error:', error)
        return
    }

    const tool = tools[0]
    console.log(`Found tool: ${tool.name} (ID: ${tool.id})`)
    console.log(`Logo URL: ${tool.logo_url}`)

    try {
        const response = await fetch(tool.logo_url)
        console.log(`Fetch status: ${response.status}`)

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        console.log('Buffer created, size:', buffer.length)

        // Extract
        // get-image-colors returns an array of chroma-js color objects
        const colors = await getColors(buffer, 'image/png')

        if (!colors || colors.length === 0) {
            console.error('No colors extracted')
            return
        }

        // Use the first color
        const dominantColor = colors[0].hex()
        console.log(`Dominant Color Extracted: ${dominantColor}`)

        // Update
        const { error: updateError } = await supabase
            .from('tools')
            .update({ dominant_color: dominantColor })
            .eq('id', tool.id)

        if (updateError) {
            console.error('Update failed:', updateError)
        } else {
            console.log('✅ Database updated successfully!')
        }

    } catch (e) {
        console.error('Processing failed:', e)
    }
}

testColor()
