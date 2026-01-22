
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyMigration() {
    // Check for any remaining tools with aixploria logos
    const { count, error } = await supabase
        .from('tools')
        .select('*', { count: 'exact', head: true })
        .ilike('logo_url', '%aixploria%')

    console.log(`Remaining tools with aixploria logos: ${count}`)

    // Check for tools with new supabase logos
    const { data: migratedTools } = await supabase
        .from('tools')
        .select('slug, logo_url')
        .ilike('logo_url', '%supabase%')
        .limit(5)

    console.log('Sample migrated tools:')
    migratedTools?.forEach(t => console.log(`- ${t.slug}: ${t.logo_url}`))
}

verifyMigration().catch(console.error)
