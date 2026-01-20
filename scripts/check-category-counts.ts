
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function main() {
    console.log('Fetching categories and tools...');

    // Get all categories
    const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

    if (catError) {
        console.error('Error fetching categories:', catError);
        return;
    }

    // Get all tools (id and category_id only)
    const { data: tools, error: toolError } = await supabase
        .from('tools')
        .select('id, category_id, name');

    if (toolError) {
        console.error('Error fetching tools:', toolError);
        return;
    }

    console.log(`Total Categories: ${categories.length}`);
    console.log(`Total Tools: ${tools.length}`);

    // Count tools per category
    const counts: Record<string, number> = {};
    let unassignedCount = 0;

    tools.forEach(t => {
        if (t.category_id) {
            counts[t.category_id] = (counts[t.category_id] || 0) + 1;
        } else {
            unassignedCount++;
        }
    });

    console.log(`Unassigned tools: ${unassignedCount}`);

    console.log('\n--- Categories with 0 tools (Clean Names) ---');
    categories.filter(c => !c.name.startsWith('#') && !counts[c.id]).forEach(c => {
        console.log(`[0] ${c.name} (ID: ${c.id})`);
    });

    console.log('\n--- Top 10 Categories by Count ---');
    const sortedCats = categories
        .map(c => ({ name: c.name, count: counts[c.id] || 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    sortedCats.forEach(c => console.log(`[${c.count}] ${c.name}`));
}

main();
