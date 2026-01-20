const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function check() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let allTools = [];
    let from = 0;
    const step = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('tools')
            .select('status, is_verified')
            .range(from, from + step - 1);

        if (error) {
            console.error(error);
            break;
        }

        allTools = allTools.concat(data);
        if (data.length < step) break;
        from += step;
    }

    const counts = allTools.reduce((acc, t) => {
        const key = `status:${t.status}, verified:${t.is_verified}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    console.log('Tool Status Distribution:');
    Object.entries(counts).forEach(([key, count]) => {
        console.log(`- ${key}: ${count}`);
    });

    const pendingTotal = tools.filter(t => !t.is_verified).length;
    console.log(`\nTotal Unverified (Pending): ${pendingTotal}`);
}

check();
