/**
 * Enrich Tools Script
 * 
 * Visits scraped pages to extract:
 * 1. Correct Logo (Icon) -> logoUrl
 * 2. Screenshot (Large) -> imageUrl
 * 3. Vote Count -> favoriteCount
 * 4. Rating -> rating
 */

import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const CONFIG = {
    inputFile: 'scraped-tools.json.bak', // Start from base backup
    outputFile: 'enriched-tools.json',
    delayMs: 800,
    maxRetries: 3,
};

interface ToolData {
    name: string;
    slug: string;
    websiteUrl: string;
    sourceUrl: string;
    logoUrl?: string;
    imageUrl?: string;
    favoriteCount?: number;
    voteCount?: number; // Alias for favoriteCount
    rating?: number;
    reviewCount?: number;
    [key: string]: any;
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = 3): Promise<string | null> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
            });
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
    const html = await fetchWithRetry(tool.sourceUrl);
    if (!html) return tool;

    const $ = cheerio.load(html);

    // 1. Logo (Icon)
    // Priority: .site-icon-singly > .site-icon
    let logoUrl = $('img.site-icon-singly').attr('src');
    if (!logoUrl) logoUrl = $('.site-icon').attr('src');

    // 2. Screenshot (Large Image)
    // Selector: .attachment-full.size-full.wp-post-image
    // Fallback: .post-thumb-con img
    let imageUrl = $('.attachment-full.size-full.wp-post-image').attr('src');
    if (!imageUrl) imageUrl = $('.post-thumb-con img').attr('src');

    // 3. Upvotes / Favorites
    // Selector: .numbers-upvote
    let favoriteCount = 0;
    const voteText = $('.numbers-upvote').text().trim();
    if (voteText) {
        favoriteCount = parseInt(voteText.replace(/,/g, ''), 10) || 0;
    }

    // 4. Rating
    // Selector: .kksr-legend (e.g. "4.4/5") or .rating
    let rating = 0;
    const ratingText = $('.kksr-legend').text().trim(); // "4.5/5"
    if (ratingText) {
        const match = ratingText.match(/([\d.]+)\/5/);
        if (match) rating = parseFloat(match[1]);
    } else {
        // Try structured data or other meta if needed, but let's stick to visible text first
    }

    return {
        ...tool,
        logoUrl: logoUrl || tool.logoUrl, // Prefer new, keep old if fail
        imageUrl: imageUrl || tool.logoUrl, // Use old logoUrl as fallback for screenshot if new crawl fails?
        // Actually, tool.logoUrl was indeed the screenshot in previous scrape.
        // So if new scraping fails to find imageUrl, we can use the OLD logoUrl.
        favoriteCount: favoriteCount || tool.favoriteCount || 0,
        rating: rating || tool.rating || 0,
    };
}

async function main() {
    console.log('🚀 Starting Enrichment Process...\n');

    const inputPath = path.join(process.cwd(), CONFIG.inputFile);
    const tools: ToolData[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

    // Try to load existing progress if any
    let enrichedTools: ToolData[] = [];
    try {
        if (fs.existsSync(CONFIG.outputFile)) {
            enrichedTools = JSON.parse(fs.readFileSync(CONFIG.outputFile, 'utf-8'));
            if (enrichedTools.length < tools.length) {
                console.log(`Resuming from ${enrichedTools.length}...`);
            }
        }
    } catch (e) { }

    // Map by slug for easy update
    const enrichedMap = new Map(enrichedTools.map(t => [t.slug, t]));

    let processed = 0;

    for (let i = 0; i < tools.length; i++) {
        const tool = tools[i];

        // Skip if already processed
        if (enrichedMap.has(tool.slug)) {
            continue;
        }

        process.stdout.write(`[${i + 1}/${tools.length}] ${tool.name}... `);

        // If we have "logoUrl" in input, it was the Screenshot.
        // So let's proactively save it as imageUrl potentially.
        // But we will re-scrape to be sure.
        const tempTool: ToolData = { ...tool };
        if (!tempTool.imageUrl && tempTool.logoUrl) {
            // The old scraper put screenshot in logoUrl
            tempTool.imageUrl = tempTool.logoUrl;
        }

        try {
            const enriched = await enrichTool(tempTool);

            enrichedMap.set(enriched.slug, enriched);
            enrichedTools.push(enriched);

            console.log(`✅ Votes: ${enriched.favoriteCount}, Rating: ${enriched.rating}`);
            processed++;
        } catch (e) {
            console.log(`❌ Error`);
            enrichedMap.set(tool.slug, tempTool); // Keep as is if error
            enrichedTools.push(tempTool);
        }

        // Save periodically
        if (processed % 20 === 0) {
            fs.writeFileSync(CONFIG.outputFile, JSON.stringify(enrichedTools, null, 2));
        }

        await sleep(CONFIG.delayMs);
    }

    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(enrichedTools, null, 2));
    console.log(`\n🎉 Enrichment Complete. Saved to ${CONFIG.outputFile}`);
}

main().catch(console.error);
