const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
    const supabaseFile = path.join(__dirname, '..', 'database', 'migrations', '003_add_count_triggers.sql');
    const sql = fs.readFileSync(supabaseFile, 'utf8');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Applying migration...');
    const { error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
        // If exec_sql RPC doesn't exist, we might need another way or just report it.
        // Usually, in a clean Supabase setup, you'd use the CLI or SQL Editor.
        // Let's try to run the SQL directly via the API if possible, but Supabase doesn't expose a raw SQL endpoint via the client.
        console.error('Error applying migration via RPC:', error);
        console.log('Note: This script requires a "exec_sql" function in your database.');
        process.exit(1);
    }

    console.log('Migration applied successfully!');
}

applyMigration();
