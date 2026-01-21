
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);



fixBadges().catch(console.error);

async function fixBadges() {
    console.log('🔄 Starting badge fix...');

    const { data: beforeTools } = await supabase.from('tools').select('name, is_verified, plan').in('name', ['Typli.ai', 'Nano Banana Pro Review: Is Google’s “Thinking” Model the Future of AI Imagery?']);
    console.log('Before Status:', JSON.stringify(beforeTools, null, 2));

    // 1. Reset EVERYONE to is_verified = false first (clean slate)
    console.log('  - Resetting all tools to is_verified = false...');
    const { count: resetCount, error: resetSpecificError } = await supabase
        .from('tools')
        .update({ is_verified: false })
        .not('id', 'is', null); // Update all

    if (resetSpecificError) {
        console.error('  ❌ Error resetting badges:', resetSpecificError.message);
    } else {
        console.log(`  ✅ Successfully reset badges for ${resetCount ?? 'all'} tools.`);
    }

    // 2. Set is_verified = true for Premium plans (Sponsor, Featured, Pro)
    // Use lower() or case-insensitive validation if possible, but for now we list all variants
    const plansToVerify = ['sponsor', 'featured', 'pro', 'Sponsor', 'Featured', 'Pro', 'SPONSOR', 'FEATURED', 'PRO'];

    console.log(`  - Setting is_verified = true for plans: ${plansToVerify.join(', ')}...`);

    const { count: updateCount, error: updateError } = await supabase
        .from('tools')
        .update({ is_verified: true })
        .in('plan', plansToVerify);

    if (updateError) {
        console.error('  ❌ Error updating premium tools:', updateError.message);
    } else {
        console.log(`  ✅ Successfully verified ${updateCount ?? 'relevant'} premium tools.`);
    }

    // 3. Double check Typli.ai (Should be free/unverified)
    // If Typli.ai has plan 'Free' it should now be false.
    // If it has 'Paid' pricing_type but 'Free' plan, it should be false.

    // Explicitly fix Typli.ai if it's erroneously verified (Safety net)
    // We only want to verify if plan is premium.
    const { error: typliFixError } = await supabase
        .from('tools')
        .update({ is_verified: false })
        .eq('name', 'Typli.ai')
        .not('plan', 'in', `("${plansToVerify.join('","')}")`);

    if (typliFixError) console.error('Error fixing Typli:', typliFixError);

    const { data: afterTools } = await supabase.from('tools').select('name, is_verified, plan').in('name', ['Typli.ai', 'Nano Banana Pro Review: Is Google’s “Thinking” Model the Future of AI Imagery?']);
    console.log('After Status:', JSON.stringify(afterTools, null, 2));

    console.log('🎉 Badge fix complete!');
}
