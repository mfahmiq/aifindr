/**
 * Update Logos in Database
 * 
 * Updates logo_url in database from scraped-tools.json
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

interface ScrapedTool {
    name: string;
    slug: string;
    websiteUrl: string;
    logoUrl?: string;
    [key: string]: any;
}

async function main() {
    console.log('🚀 Updating logos in database...\n');

    const inputPath = path.join(process.cwd(), 'scraped-tools.json');
    const tools: ScrapedTool[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

    console.log(`📊 Tools to update: ${tools.length}\n`);

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (let i = 0; i < tools.length; i++) {
        const tool = tools[i];

        if (!tool.logoUrl) {
            continue;
        }

        // Find by slug
        const { data, error } = await supabase
            .from('tools')
            .update({ logo_url: tool.logoUrl })
            .eq('slug', tool.slug)
            .select('id');

        if (error) {
            errors++;
        } else if (data && data.length > 0) {
            updated++;
        } else {
            // Try by website_url
            const { data: data2 } = await supabase
                .from('tools')
                .update({ logo_url: tool.logoUrl })
                .ilike('website_url', `%${new URL(tool.websiteUrl).hostname}%`)
                .select('id');

            if (data2 && data2.length > 0) {
                updated++;
            } else {
                notFound++;
            }
        }

        // Progress
        if ((i + 1) % 100 === 0) {
            console.log(`Progress: ${i + 1}/${tools.length} (Updated: ${updated})`);
        }
    }

    console.log('\n========================================');
    console.log(`✅ Database logo update complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Not Found: ${notFound}`);
    console.log(`   Errors: ${errors}`);
    console.log('========================================\n');
}

main().catch(console.error);
