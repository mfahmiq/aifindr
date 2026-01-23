/**
 * Update Logos Script
 * 
 * Re-visits scraped pages to extract the correct "site icon" (logo)
 * instead of the large screenshot image.
 */

import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const CONFIG = {
    inputFile: 'scraped-tools.json',
    outputFile: 'scraped-tools-updated.json',
    delayMs: 100, // Very fast since we construct URL directly
    maxRetries: 3,
};

interface ScrapedTool {
    name: string;
    slug: string;
    shortDescription: string;
    longDescription?: string;
    websiteUrl: string;
    logoUrl?: string; // This needs update
    categories: string[];
    tags: string[];
    pricingType: string;
    rating?: number;
    reviewCount?: number;
    sourceUrl: string;
}

// Sleep utility
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch with retry
async function fetchWithRetry(url: string, retries = CONFIG.maxRetries): Promise<string | null> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            if (i < retries - 1) await sleep(1000);
        }
    }
    return null;
}

// Get high-res icon from Google
function getGoogleFaviconUrl(url: string, size: number = 256): string {
    try {
        const hostname = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${hostname}&sz=${size}`;
    } catch (e) {
        return '';
    }
}

// Extract logo from page
async function getCorrectLogo(url: string): Promise<string | null> {
    // Strategy: Use Google Favicon API first for high-res icon (reliable & fast)
    // Fallback to scraping if needed (or stick to Google)

    if (!url) return null;

    // Try Google High Res First (user requested this)
    const googleIcon = getGoogleFaviconUrl(url, 256);

    // Validate if it actually exists? 
    // Google returns a default globe icon if not found. 
    // For now, we assume it's good or we can check header content-length if we want to be strict.
    // But simplistic approach: use Google ID.

    return googleIcon;

    /* 
    // OLD SCRAPING LOGIC (Backup if we want to mix)
    const html = await fetchWithRetry(url);
    if (!html) return googleIcon; // Fallback

    const $ = cheerio.load(html);
    let logoUrl = $('img.site-icon-singly').attr('src');
    if (!logoUrl) {
        logoUrl = $('.site-icon').attr('src');
    }
    return logoUrl || googleIcon;
    */
}

async function main() {
    console.log('🚀 Starting Logo Update...\n');

    const inputPath = path.join(process.cwd(), CONFIG.inputFile);
    if (!fs.existsSync(inputPath)) {
        console.error(`❌ File not found: ${CONFIG.inputFile}`);
        process.exit(1);
    }

    const tools: ScrapedTool[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    console.log(`📊 Tools to process: ${tools.length}\n`);

    // Create backup
    fs.copyFileSync(inputPath, inputPath + '.bak');

    let updatedCount = 0;
    let noChangeCount = 0;
    let errors = 0;

    // Batch processing
    const BATCH_SIZE = 20;
    const processTool = async (tool: ScrapedTool, index: number) => {
        try {
            const newLogo = await getCorrectLogo(tool.websiteUrl);

            if (newLogo) {
                if (tool.logoUrl !== newLogo) {
                    tool.logoUrl = newLogo;
                    updatedCount++;
                    // Optional: console.log(`✅ [${index + 1}] Updated: ${new URL(newLogo).searchParams.get('domain') || 'icon'}`);
                } else {
                    noChangeCount++;
                }
            } else {
                noChangeCount++;
            }
        } catch (error) {
            errors++;
        }
    };

    for (let i = 0; i < tools.length; i += BATCH_SIZE) {
        const batch = tools.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map((tool, batchIdx) => processTool(tool, i + batchIdx));

        await Promise.all(batchPromises);

        process.stdout.write(`\rProgress: ${Math.min(i + BATCH_SIZE, tools.length)}/${tools.length} | Updated: ${updatedCount} | Errors: ${errors}`);

        // Save periodically
        if (i % 100 === 0) {
            fs.writeFileSync(path.join(process.cwd(), CONFIG.outputFile), JSON.stringify(tools, null, 2));
        }
    }

    // Final save
    fs.writeFileSync(path.join(process.cwd(), CONFIG.outputFile), JSON.stringify(tools, null, 2));

    // Also overwrite original input for next step convenience
    fs.writeFileSync(inputPath, JSON.stringify(tools, null, 2));

    console.log('\n========================================');
    console.log(`✅ Logo Update complete!`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Unchanged: ${noChangeCount}`);
    console.log(`   Errors: ${errors}`);
    console.log('========================================\n');
}

main().catch(console.error);
