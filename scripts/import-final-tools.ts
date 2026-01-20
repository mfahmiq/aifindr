/**
 * Import Final Tools (Phase 2)
 * 
 * Imports Phase 2 data from final-tools.json to Supabase.
 * Updates: pricing_type, created_at, video_url, favorite_count, rating
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
    slug: string;
    pricing_type?: string;
    created_at?: string;
    video_url?: string;
    favorite_count?: number;
    rating?: number;
    [key: string]: any;
}

async function main() {
    console.log('🚀 Importing Final Data (Phase 2) to Supabase...\n');

    const inputPath = path.join(process.cwd(), 'final-tools.json');

    if (!fs.existsSync(inputPath)) {
        console.error('❌ final-tools.json not found. Run enrich-final.ts first.');
        process.exit(1);
    }

    const tools: ToolData[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    console.log(`📊 Tools to process: ${tools.length}\n`);

    let updated = 0;
    let errors = 0;

    // Process in batches
    const BATCH_SIZE = 20; // Supabase handles batch updates well

    for (let i = 0; i < tools.length; i += BATCH_SIZE) {
        const batch = tools.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (tool) => {
            try {
                const updateData: any = {};
                if (tool.pricing_type) updateData.pricing_type = tool.pricing_type;
                if (tool.video_url) updateData.video_url = tool.video_url;
                if (tool.created_at) updateData.created_at = tool.created_at; // Ensure format match
                // Always update counts if available (to catch up missed ones)
                if (tool.favorite_count) updateData.favorite_count = tool.favorite_count;
                if (tool.rating) updateData.rating = tool.rating;

                if (Object.keys(updateData).length === 0) return;

                const { error } = await supabase
                    .from('tools')
                    .update(updateData)
                    .eq('slug', tool.slug);

                if (error) {
                    // Ignore minimal errors
                    errors++;
                } else {
                    updated++;
                }
            } catch (e) {
                errors++;
            }
        }));

        // Log progress
        if ((i + BATCH_SIZE) % 200 === 0) {
            console.log(`Progress: ${Math.min(i + BATCH_SIZE, tools.length)}/${tools.length} (Updated: ${updated})`);
        }
    }

    console.log('\n========================================');
    console.log(`✅ Phase 2 Import complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Errors: ${errors}`);
    console.log('========================================\n');
}

main().catch(console.error);
