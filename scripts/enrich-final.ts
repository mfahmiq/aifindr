/**
 * Enrich Final Script (Phase 2)
 * 
 * Scrapes additional details:
 * 1. Pricing Type (Free/Paid/Freemium)
 * 2. Date Added
 * 3. Video URL
 * 4. Fills in missing Votes/Ratings if Phase 1 missed them.
 */

import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const CONFIG = {
    inputFile: 'scraped-tools.json.bak', // Source of Truth
    outputFile: 'final-tools.json',
    batchSize: 5, // Concurrent requests
    delayMs: 1000,
};

interface ToolData {
    name: string;
    slug: string;
    sourceUrl: string;
    // ... fields ...
    pricing_type?: string;
    created_at?: string;
    video_url?: string;
    favorite_count?: number;
    rating?: number;
    [key: string]: any;
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = 3): Promise<string | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                },
            });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        } catch (e) {
            if (i === retries - 1) return null;
            await sleep(1000);
        }
    }
    return null;
}

async function enrichTool(tool: ToolData): Promise<ToolData> {
    // If we already have the data (from previous run), skip request
    if (tool.pricing_type && tool.created_at && tool.favorite_count) {
        return tool;
    }

    const html = await fetchWithRetry(tool.sourceUrl);
    if (!html) {
        console.log(`⚠️ Failed to fetch ${tool.name}`);
        return tool;
    }

    const $ = cheerio.load(html);

    // 1. Pricing Type
    let pricingType = 'Freemium'; // Default assumption
    const descr = $('.global-description .descr').text().trim();
    if (descr) {
        // Clean up text logic
        if (descr.toLowerCase().includes('free trial')) pricingType = 'Free Trial';
        else if (descr.toLowerCase().includes('freemium')) pricingType = 'Freemium';
        else if (descr.toLowerCase().includes('free')) pricingType = 'Free';
        else if (descr.toLowerCase().includes('paid')) pricingType = 'Paid';
        else if (descr.toLowerCase().includes('contact')) pricingType = 'Contact for Pricing';
        else pricingType = descr;
    }

    // 2. Date Added
    const dateMeta = $('meta[property="article:published_time"]').attr('content');

    // 3. Video URL
    let videoUrl = $('iframe[src*="youtube.com/embed"]').attr('src');
    // Clean URL usually: https://www.youtube.com/embed/VIDEO_ID?feature=oembed
    if (videoUrl) {
        videoUrl = videoUrl.split('?')[0];
    }

    // 4. Fallback Votes/Rating (if missing)
    let favoriteCount = tool.favorite_count || 0;
    if (!favoriteCount) {
        const voteText = $('.numbers-upvote').text().trim();
        if (voteText) favoriteCount = parseInt(voteText.replace(/,/g, ''), 10) || 0;
    }

    let rating = tool.rating || 0;
    if (!rating) {
        const ratingText = $('.kksr-legend').text().trim();
        const match = ratingText.match(/([\d.]+)\/5/);
        if (match) rating = parseFloat(match[1]);
    }

    return {
        ...tool,
        pricing_type: pricingType,
        created_at: dateMeta || tool.created_at, // Prefer scraped date
        video_url: videoUrl || tool.video_url,
        favorite_count: favoriteCount,
        rating: rating
    };
}

async function main() {
    console.log('🚀 Phase 2 Enrichment: Pricing, Date, Video...\n');

    const inputPath = path.join(process.cwd(), CONFIG.inputFile);
    const tools: ToolData[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

    // Load existing progress
    let finalTools: ToolData[] = [];
    try {
        if (fs.existsSync(CONFIG.outputFile)) {
            finalTools = JSON.parse(fs.readFileSync(CONFIG.outputFile, 'utf-8'));
            if (finalTools.length > 0) {
                console.log(`Resuming from ${finalTools.length} items...`);
            }
        }
    } catch (e) { }

    // Map for quick lookup
    const finalMap = new Map(finalTools.map(t => [t.slug, t]));

    let processedCount = 0;

    for (let i = 0; i < tools.length; i += CONFIG.batchSize) {
        const batch = tools.slice(i, i + CONFIG.batchSize);

        // Process batch
        const results = await Promise.all(batch.map(async (tool) => {
            if (finalMap.has(tool.slug)) {
                return finalMap.get(tool.slug)!;
            }
            const enriched = await enrichTool(tool);
            process.stdout.write('.'); // Simple progress indicator
            return enriched;
        }));

        // Update map and array
        results.forEach(t => {
            if (!finalMap.has(t.slug)) {
                finalTools.push(t);
                finalMap.set(t.slug, t);
                processedCount++;
            }
        });

        // Valid JSON Save every 20 items (4 batches)
        if (processedCount > 0 && processedCount % 20 === 0) {
            process.stdout.write(` [Saved ${finalTools.length}]\n`);
            fs.writeFileSync(CONFIG.outputFile, JSON.stringify(finalTools, null, 2));
        }

        await sleep(CONFIG.delayMs);
    }

    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(finalTools, null, 2));
    console.log(`\n🎉 Phase 2 Complete. Saved to ${CONFIG.outputFile}`);
}

main().catch(console.error);
