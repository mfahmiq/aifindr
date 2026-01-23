
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyMigration() {
    // Check for any remaining tools with aixploria logos OR images
    const { count: logoCount } = await supabase
        .from('tools')
        .select('*', { count: 'exact', head: true })
        .ilike('logo_url', '%aixploria%')

    const { count: imageCount } = await supabase
        .from('tools')
        .select('*', { count: 'exact', head: true })
        .ilike('image_url', '%aixploria%')

    console.log(`Remaining tools with aixploria logos: ${logoCount}`)
    console.log(`Remaining tools with aixploria images: ${imageCount}`)

    // Check for tools with new supabase assets
    const { data: migratedTools } = await supabase
        .from('tools')
        .select('slug, logo_url, image_url')
        .ilike('image_url', '%supabase%')
        .limit(5)

    console.log('Sample migrated tools (with images):')
    migratedTools?.forEach(t => {
        console.log(`- ${t.slug}`)
        console.log(`  Logo: ${t.logo_url?.substring(0, 50)}...`)
        console.log(`  Image: ${t.image_url?.substring(0, 50)}...`)
    })
}

verifyMigration().catch(console.error)
