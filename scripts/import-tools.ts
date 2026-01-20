/**
 * Import Scraped Tools to Supabase Database
 * 
 * Reads scraped-tools.json and imports to Supabase database.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qrbeecfakoqovivatccm.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface ScrapedTool {
    name: string;
    slug: string;
    shortDescription: string;
    longDescription?: string;
    websiteUrl: string;
    logoUrl?: string;
    categories: string[];
    tags: string[];
    pricingType: 'Free' | 'Freemium' | 'Paid' | 'Trial';
    rating?: number;
    reviewCount?: number;
    sourceUrl: string;
}

// Category mapping to our database categories
const CATEGORY_SLUG_MAP: Record<string, string> = {
    'Chat': 'chat',
    'Image': 'image',
    'Video': 'video',
    'Coding': 'coding',
    'Audio': 'audio',
    'Productivity': 'productivity',
    'Writing': 'writing',
};

async function getOrCreateCategory(categoryName: string): Promise<string | null> {
    const slug = CATEGORY_SLUG_MAP[categoryName] || categoryName.toLowerCase().replace(/\s+/g, '-');

    // Check if exists
    const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .single();

    if (existing) return existing.id;

    // Create new
    const { data: created, error } = await supabase
        .from('categories')
        .insert({
            name: categoryName,
            slug: slug,
            icon: '🤖',
            color: 'blue',
        })
        .select('id')
        .single();

    if (error) {
        console.error(`Failed to create category ${categoryName}:`, error);
        return null;
    }

    return created?.id || null;
}

async function getOrCreateTag(tagName: string): Promise<string | null> {
    const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check if exists
    const { data: existing } = await supabase
        .from('tags')
        .select('id')
        .eq('slug', slug)
        .single();

    if (existing) return existing.id;

    // Create new
    const { data: created, error } = await supabase
        .from('tags')
        .insert({
            name: tagName,
            slug: slug,
        })
        .select('id')
        .single();

    if (error) {
        // Might already exist due to race condition
        const { data: retry } = await supabase
            .from('tags')
            .select('id')
            .eq('slug', slug)
            .single();
        return retry?.id || null;
    }

    return created?.id || null;
}

async function toolExists(websiteUrl: string): Promise<boolean> {
    const { data } = await supabase
        .from('tools')
        .select('id')
        .eq('website_url', websiteUrl)
        .single();

    return !!data;
}

async function importTool(tool: ScrapedTool): Promise<boolean> {
    try {
        // Check if already exists
        if (await toolExists(tool.websiteUrl)) {
            console.log(`  ⏭️ Skipped (already exists): ${tool.name}`);
            return false;
        }

        // Get or create category
        let categoryId: string | null = null;
        if (tool.categories.length > 0) {
            categoryId = await getOrCreateCategory(tool.categories[0]);
        }

        // Insert tool
        const { data: insertedTool, error } = await supabase
            .from('tools')
            .insert({
                name: tool.name,
                slug: tool.slug,
                short_description: tool.shortDescription,
                long_description: tool.longDescription || null,
                website_url: tool.websiteUrl,
                logo_url: tool.logoUrl || null,
                pricing_type: tool.pricingType,
                category_id: categoryId,
                status: 'approved',
                rating: tool.rating || 0,
                review_count: tool.reviewCount || 0,
                plan: 'Free',
                is_verified: false,
            })
            .select('id')
            .single();

        if (error) {
            console.error(`  ❌ Failed to insert ${tool.name}:`, error.message);
            return false;
        }

        if (!insertedTool) return false;

        // Add tags
        for (const tagName of tool.tags.slice(0, 5)) { // Max 5 tags
            const tagId = await getOrCreateTag(tagName);
            if (tagId) {
                await supabase
                    .from('tool_tags')
                    .insert({
                        tool_id: insertedTool.id,
                        tag_id: tagId,
                    })
                    .single();
            }
        }

        console.log(`  ✅ Imported: ${tool.name}`);
        return true;

    } catch (error) {
        console.error(`  ❌ Error importing ${tool.name}:`, error);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting Import to Supabase...\n');

    // Read scraped data
    const inputFile = path.join(process.cwd(), 'scraped-tools.json');

    if (!fs.existsSync(inputFile)) {
        console.error(`❌ File not found: ${inputFile}`);
        console.error('Please run scrape-aixploria.ts first.');
        process.exit(1);
    }

    const tools: ScrapedTool[] = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
    console.log(`📊 Tools to import: ${tools.length}\n`);

    // Import tools
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < tools.length; i++) {
        const tool = tools[i];
        console.log(`[${i + 1}/${tools.length}] ${tool.name}`);

        const success = await importTool(tool);
        if (success) {
            imported++;
        } else {
            skipped++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n========================================');
    console.log(`✅ Import complete!`);
    console.log(`   Imported: ${imported}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log('========================================\n');

    // Verify count
    const { count } = await supabase
        .from('tools')
        .select('*', { count: 'exact', head: true });

    console.log(`📊 Total tools in database: ${count}`);
}

// Run
main().catch(console.error);
