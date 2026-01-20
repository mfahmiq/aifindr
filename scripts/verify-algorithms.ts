

import { createClient } from "@supabase/supabase-js";
import * as fs from 'fs';
import * as path from 'path';
import { toolsService } from "../lib/services/toolsService";

// Load env vars manually simple way
const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars: any = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim().replace(/"/g, '');
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);


async function verifyAlgorithms() {
    console.log("--- Verifying Trending (Most Viewed) ---");
    const trending = await toolsService.getTools({ sortBy: 'trending', limit: 3 }, supabase);
    trending.tools.forEach((t: any) => console.log(`${t.name}: ${t.view_count} views`));

    console.log("\n--- Verifying Popular (Most Favorites) ---");
    const popular = await toolsService.getTools({ sortBy: 'popular', limit: 3 }, supabase);
    popular.tools.forEach((t: any) => console.log(`${t.name}: ${t.favorite_count} favorites`));

    console.log("\n--- Verifying Featured (IndoAI Selection) ---");
    const featured = await toolsService.getTools({ highlight: true, limit: 3 }, supabase);
    featured.tools.forEach((t: any) => console.log(`${t.name}: Plan=${t.plan}, Featured=${t.is_featured}, Priority=${t.is_priority}`));

    console.log("\n--- Verifying Latest ---");
    const latest = await toolsService.getTools({ sortBy: 'newest', limit: 3 }, supabase);
    latest.tools.forEach((t: any) => console.log(`${t.name}: Created=${t.created_at}`));
}

verifyAlgorithms().catch(console.error);
