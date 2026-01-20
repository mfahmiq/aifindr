/**
 * AIxploria Scraper Script
 * 
 * Scrapes AI tool data from https://www.aixploria.com/en/
 * and saves to JSON file for database import.
 */

import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const CONFIG = {
    // Sitemap URLs for English pages (2024-2026)
    sitemapUrls: [
        'https://www.aixploria.com/en/sitemap-posttype-post.202601.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202512.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202511.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202510.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202509.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202508.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202507.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202506.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202505.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202504.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202503.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202502.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202501.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202412.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202411.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202410.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202409.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202408.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202407.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202406.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202405.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202404.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202403.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202402.xml',
        'https://www.aixploria.com/en/sitemap-posttype-post.202401.xml',
    ],
    delayMs: 1500, // Delay between requests to avoid rate limiting
    outputFile: 'scraped-tools.json',
    maxRetries: 3,
};

// Category mapping from AIxploria to our categories
const CATEGORY_MAP: Record<string, string> = {
    'AI Chat & Assistant': 'Chat',
    'ChatBots': 'Chat',
    'AI Chatbot': 'Chat',
    'Image Generation': 'Image',
    'AI Image': 'Image',
    'Photo Editing': 'Image',
    'Video Generation': 'Video',
    'AI Video': 'Video',
    'Video Editing': 'Video',
    'Coding & Development': 'Coding',
    'AI Code': 'Coding',
    'Developer Tools': 'Coding',
    'Audio & Music': 'Audio',
    'AI Music': 'Audio',
    'Voice & Speech': 'Audio',
    'Productivity': 'Productivity',
    'AI Productivity': 'Productivity',
    'Business': 'Productivity',
    'Writing & Content': 'Writing',
    'AI Writing': 'Writing',
    'Content Creation': 'Writing',
    'Copywriting': 'Writing',
};

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

// Sleep utility
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Clean URL by removing tracking parameters
function cleanUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        // Remove common tracking parameters
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'referrer', 'source'].forEach(param => {
            urlObj.searchParams.delete(param);
        });
        return urlObj.toString();
    } catch {
        return url;
    }
}

// Extract slug from URL
function extractSlug(url: string): string {
    const match = url.match(/\/en\/([^\/]+)\/?$/);
    if (match) return match[1];

    const match2 = url.match(/\/([^\/]+)\/?$/);
    if (match2) return match2[1];

    return url.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
}

// Fetch with retry
async function fetchWithRetry(url: string, retries = CONFIG.maxRetries): Promise<string | null> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            console.log(`  Retry ${i + 1}/${retries} for ${url}: ${error}`);
            if (i < retries - 1) await sleep(2000);
        }
    }
    return null;
}

// Parse sitemap XML
async function parseSitemap(sitemapUrl: string): Promise<string[]> {
    console.log(`Fetching sitemap: ${sitemapUrl}`);

    const xml = await fetchWithRetry(sitemapUrl);
    if (!xml) {
        console.log(`  Failed to fetch sitemap`);
        return [];
    }

    const urls: string[] = [];
    const locMatches = xml.match(/<loc>([^<]+)<\/loc>/g);

    if (locMatches) {
        for (const match of locMatches) {
            const urlMatch = match.match(/<loc>([^<]+)<\/loc>/);
            if (urlMatch && urlMatch[1]) {
                const url = urlMatch[1];
                // Filter for English tool pages only
                if (url.includes('/en/') && !url.includes('sitemap') && !url.includes('/page/')) {
                    urls.push(url);
                }
            }
        }
    }

    console.log(`  Found ${urls.length} tool URLs`);
    return urls;
}

// Follow redirect to get original URL
async function getOriginalUrl(redirectUrl: string): Promise<string> {
    try {
        const response = await fetch(redirectUrl, {
            method: 'HEAD',
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });
        return cleanUrl(response.url);
    } catch {
        return redirectUrl;
    }
}

// Scrape single tool page
async function scrapeTool(url: string): Promise<ScrapedTool | null> {
    const html = await fetchWithRetry(url);
    if (!html) return null;

    const $ = cheerio.load(html);

    // Extract JSON-LD data
    let jsonLdData: any = null;
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const data = JSON.parse($(el).html() || '{}');
            if (data['@type'] === 'SoftwareApplication' || data['@type'] === 'Article') {
                jsonLdData = data;
            }
        } catch { }
    });

    // Extract basic info
    const name = $('h1').first().text().trim()
        .replace(/\s*\(Reviews?,?\s*Prices?\s*&?\s*Alternatives?\)\s*/gi, '')
        .replace(/\s*:\s*$/, '')
        .trim();

    if (!name) return null;

    const slug = extractSlug(url);

    // Short description
    let shortDescription = $('.desc-text').text().trim();
    if (!shortDescription) {
        shortDescription = $('meta[property="og:description"]').attr('content') || '';
    }
    shortDescription = shortDescription.replace(/[«»]/g, '').trim();

    // Long description (first few paragraphs)
    const longDescription = $('.entry-content p').slice(0, 3).map((_, el) => $(el).text().trim()).get().join('\n\n');

    // Website URL (follow redirect)
    let websiteUrl = '';
    const visitButton = $('#specialButton').first().attr('href');
    if (visitButton) {
        if (visitButton.startsWith('http')) {
            websiteUrl = await getOriginalUrl(visitButton);
        } else if (visitButton.startsWith('/out/')) {
            websiteUrl = await getOriginalUrl(`https://www.aixploria.com${visitButton}`);
        }
    }

    // If no website URL found, skip this tool
    if (!websiteUrl || websiteUrl.includes('aixploria.com')) {
        console.log(`  No valid website URL found for ${name}`);
        return null;
    }

    // Logo URL
    let logoUrl = $('.post-thumb-con .wp-post-image').attr('src') || '';
    if (!logoUrl) {
        logoUrl = $('meta[property="og:image"]').attr('content') || '';
    }

    // Categories
    const categories: string[] = [];
    $('.link-cat-single').each((_, el) => {
        const cat = $(el).text().trim();
        if (cat) {
            const mappedCat = CATEGORY_MAP[cat] || cat;
            if (!categories.includes(mappedCat)) {
                categories.push(mappedCat);
            }
        }
    });

    // Pricing type
    let pricingType: 'Free' | 'Freemium' | 'Paid' | 'Trial' = 'Freemium';
    const pricingEl = $('[class*="website-type-"]').text().trim().toLowerCase();
    if (pricingEl.includes('free') && !pricingEl.includes('trial')) {
        pricingType = 'Free';
    } else if (pricingEl.includes('paid') || pricingEl.includes('premium')) {
        pricingType = 'Paid';
    } else if (pricingEl.includes('trial')) {
        pricingType = 'Trial';
    }

    // Rating from JSON-LD
    let rating: number | undefined;
    let reviewCount: number | undefined;
    if (jsonLdData?.aggregateRating) {
        rating = parseFloat(jsonLdData.aggregateRating.ratingValue) || undefined;
        reviewCount = parseInt(jsonLdData.aggregateRating.ratingCount) || undefined;
    }

    // Extract tags from categories
    const tags = categories.slice(0); // Copy categories as tags

    return {
        name,
        slug,
        shortDescription: shortDescription || `${name} - AI Tool`,
        longDescription,
        websiteUrl: cleanUrl(websiteUrl),
        logoUrl,
        categories: categories.length > 0 ? categories : ['Productivity'],
        tags,
        pricingType,
        rating,
        reviewCount,
        sourceUrl: url,
    };
}

// Main scraping function
async function main() {
    console.log('🚀 Starting AIxploria Scraper...\n');

    // Collect all URLs from sitemaps
    const allUrls: string[] = [];

    for (const sitemapUrl of CONFIG.sitemapUrls) {
        const urls = await parseSitemap(sitemapUrl);
        allUrls.push(...urls);
        await sleep(500);
    }

    console.log(`\n📊 Total URLs to scrape: ${allUrls.length}\n`);

    // Remove duplicates
    const uniqueUrls = [...new Set(allUrls)];
    console.log(`📊 Unique URLs: ${uniqueUrls.length}\n`);

    // Scrape tools
    const tools: ScrapedTool[] = [];
    const errors: string[] = [];

    for (let i = 0; i < uniqueUrls.length; i++) {
        const url = uniqueUrls[i];
        console.log(`[${i + 1}/${uniqueUrls.length}] Scraping: ${url}`);

        try {
            const tool = await scrapeTool(url);
            if (tool) {
                tools.push(tool);
                console.log(`  ✅ ${tool.name} -> ${tool.websiteUrl}`);
            } else {
                errors.push(url);
                console.log(`  ⚠️ Skipped (no valid data)`);
            }
        } catch (error) {
            errors.push(url);
            console.log(`  ❌ Error: ${error}`);
        }

        // Rate limiting
        await sleep(CONFIG.delayMs);

        // Save progress every 50 tools
        if (tools.length > 0 && tools.length % 50 === 0) {
            const progressFile = path.join(process.cwd(), `scraped-progress-${tools.length}.json`);
            fs.writeFileSync(progressFile, JSON.stringify(tools, null, 2));
            console.log(`\n💾 Progress saved: ${tools.length} tools\n`);
        }
    }

    // Save final results
    const outputPath = path.join(process.cwd(), CONFIG.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(tools, null, 2));

    console.log('\n========================================');
    console.log(`✅ Scraping complete!`);
    console.log(`   Total scraped: ${tools.length} tools`);
    console.log(`   Errors/Skipped: ${errors.length}`);
    console.log(`   Output: ${outputPath}`);
    console.log('========================================\n');

    // Save errors log
    if (errors.length > 0) {
        fs.writeFileSync(path.join(process.cwd(), 'scrape-errors.json'), JSON.stringify(errors, null, 2));
    }
}

// Run
main().catch(console.error);
