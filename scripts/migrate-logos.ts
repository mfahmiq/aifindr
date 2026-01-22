
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function migrateLogos() {
    console.log('Starting migration...')

    // 1. Fetch tools with external logos (specifically aixploria for now, or all)
    const { data: tools, error } = await supabase
        .from('tools')
        .select('id, slug, logo_url')
        .ilike('logo_url', '%aixploria%')
        .limit(50) // Process in batches to be safe

    if (error) {
        console.error('Error fetching tools:', error)
        return
    }

    console.log(`Found ${tools.length} tools to migrate.`)

    for (const tool of tools) {
        if (!tool.logo_url) continue;

        console.log(`Processing: ${tool.slug} (${tool.logo_url})`)

        try {
            // 2. Download image
            const response = await fetch(tool.logo_url)
            if (!response.ok) {
                console.error(`Failed to fetch image for ${tool.slug}: ${response.statusText}`)
                continue
            }

            const arrayBuffer = await response.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            // Determine content type
            const contentType = response.headers.get('content-type') || 'image/png'
            const ext = contentType.split('/')[1] || 'png'
            const filename = `logos/${tool.slug}-${Date.now()}.${ext}`

            // 3. Upload to Supabase Storage
            // Using 'images' bucket as found in submit/page.tsx
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('images')
                .upload(filename, buffer, {
                    contentType: contentType,
                    upsert: true
                })

            if (uploadError) {
                console.error(`Upload error for ${tool.slug}:`, uploadError)
                continue
            }

            // 4. Get Public URL
            const { data: { publicUrl } } = supabase
                .storage
                .from('images')
                .getPublicUrl(filename)

            console.log(`Uploaded to: ${publicUrl}`)

            // 5. Update Database within the loop
            const { error: updateError } = await supabase
                .from('tools')
                .update({ logo_url: publicUrl })
                .eq('id', tool.id)

            if (updateError) {
                console.error(`DB Update error for ${tool.slug}:`, updateError)
            } else {
                console.log(`Successfully updated ${tool.slug}`)
            }

        } catch (err) {
            console.error(`Unexpected error for ${tool.slug}:`, err)
        }
    }

    console.log('Batch complete. Run again if there are more.')
}

migrateLogos().catch(console.error)
