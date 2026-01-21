
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkStatus() {
    console.log('--- START JSON ---');
    const { data: tools, error } = await supabase
        .from('tools')
        .select('name, is_verified, plan, pricing_type')
        .in('name', ['Typli.ai', 'Nano Banana Pro Review: Is Google’s “Thinking” Model the Future of AI Imagery?']);

    if (error) {
        console.error(JSON.stringify({ error }));
        return;
    }

    console.log(JSON.stringify(tools, null, 2));
    console.log('--- END JSON ---');
}

checkStatus();
