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
    delayMs: 1000, // Faster delay since we just parse HTML
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

// Extract logo from page
async function getCorrectLogo(url: string): Promise<string | null> {
    const html = await fetchWithRetry(url);
    if (!html) return null;

    const $ = cheerio.load(html);

    // Priority 1: Site Icon Singly (Detail Page specific)
    let logoUrl = $('img.site-icon-singly').attr('src');

    // Priority 2: Site Icon generic (if any)
    if (!logoUrl) {
        logoUrl = $('.site-icon').attr('src');
    }

    // Note: Do NOT use .favicon-cat-brand as it often contains related tools or ads

    // Priority 4: Fallback to original logic (screenshot) if absolutely no icon found
    // BUT user specifically requested icon, so let's try to stick to icons.
    // If no icon found, maybe keep existing?

    return logoUrl || null;
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

    for (let i = 0; i < tools.length; i++) {
        const tool = tools[i];
        process.stdout.write(`[${i + 1}/${tools.length}] ${tool.name}... `);

        try {
            const newLogo = await getCorrectLogo(tool.sourceUrl);

            if (newLogo) {
                // Check if different (ignoring query params if any)
                if (tool.logoUrl !== newLogo) {
                    tool.logoUrl = newLogo;
                    updatedCount++;
                    console.log(`✅ Updated: ${newLogo.substring(newLogo.lastIndexOf('/') + 1)}`);
                } else {
                    noChangeCount++;
                    console.log(`⏹️ Same`);
                }
            } else {
                console.log(`⚠️ No icon found, keeping old`);
                noChangeCount++;
            }

        } catch (error) {
            console.log(`❌ Error`);
            errors++;
        }

        // Periodically save
        if (i > 0 && i % 50 === 0) {
            fs.writeFileSync(path.join(process.cwd(), CONFIG.outputFile), JSON.stringify(tools, null, 2));
        }

        // Small delay
        await sleep(CONFIG.delayMs);
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
