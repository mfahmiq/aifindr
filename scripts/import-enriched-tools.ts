/**
 * Import Enriched Tools
 * 
 * Imports data from enriched-tools.json to Supabase.
 * Updates: image_url, favorite_count, rating, logo_url
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface ToolData {
    name: string;
    slug: string;
    websiteUrl: string;
    logoUrl?: string;     // Icon
    imageUrl?: string;    // Screenshot
    favoriteCount?: number;
    rating?: number;
    [key: string]: any;
}

async function main() {
    console.log('🚀 Importing Enriched Data to Supabase...\n');

    const inputPath = path.join(process.cwd(), 'enriched-tools.json');

    if (!fs.existsSync(inputPath)) {
        console.error('❌ enriched-tools.json not found. Run enrich-tools.ts first.');
        process.exit(1);
    }

    const tools: ToolData[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    console.log(`📊 Tools to process: ${tools.length}\n`);

    let updated = 0;
    let errors = 0;

    // Process in batches
    const BATCH_SIZE = 10;

    for (let i = 0; i < tools.length; i += BATCH_SIZE) {
        const batch = tools.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (tool) => {
            try {
                // Update by slug
                const { error } = await supabase
                    .from('tools')
                    .update({
                        logo_url: tool.logoUrl,
                        image_url: tool.imageUrl,
                        favorite_count: tool.favoriteCount || 0,
                        rating: tool.rating || 0
                    })
                    .eq('slug', tool.slug);

                if (error) {
                    console.error(`Error updating ${tool.name}:`, error.message);
                    errors++;
                } else {
                    updated++;
                }
            } catch (e) {
                errors++;
            }
        }));

        // Log progress
        if ((i + BATCH_SIZE) % 100 === 0) {
            console.log(`Progress: ${Math.min(i + BATCH_SIZE, tools.length)}/${tools.length} (Updated: ${updated})`);
        }
    }

    console.log('\n========================================');
    console.log(`✅ Import complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Errors: ${errors}`);
    console.log('========================================\n');
}

main().catch(console.error);
