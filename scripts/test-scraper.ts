/**
 * Test Scraper - Scrapes only 5 tools for testing
 */

import * as cheerio from 'cheerio';

const TEST_URLS = [
    'https://www.aixploria.com/en/chatgpt/',
    'https://www.aixploria.com/en/midjourney/',
    'https://www.aixploria.com/en/claude-by-anthropic/',
    'https://www.aixploria.com/en/dall-e-3/',
    'https://www.aixploria.com/en/github-copilot/',
];

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

function cleanUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'referrer', 'source'].forEach(param => {
            urlObj.searchParams.delete(param);
        });
        return urlObj.toString();
    } catch {
        return url;
    }
}

function extractSlug(url: string): string {
    const match = url.match(/\/en\/([^\/]+)\/?$/);
    if (match) return match[1];
    const match2 = url.match(/\/([^\/]+)\/?$/);
    if (match2) return match2[1];
    return url.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
}

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

async function scrapeTool(url: string): Promise<ScrapedTool | null> {
    console.log(`\nScraping: ${url}`);

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
    });

    if (!response.ok) {
        console.log(`  HTTP Error: ${response.status}`);
        return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract JSON-LD
    let jsonLdData: any = null;
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const data = JSON.parse($(el).html() || '{}');
            if (data['@type'] === 'SoftwareApplication' || data['@type'] === 'Article') {
                jsonLdData = data;
            }
        } catch { }
    });

    // Name
    const name = $('h1').first().text().trim()
        .replace(/\s*\(Reviews?,?\s*Prices?\s*&?\s*Alternatives?\)\s*/gi, '')
        .replace(/\s*:\s*$/, '')
        .trim();

    if (!name) {
        console.log(`  No name found`);
        return null;
    }

    const slug = extractSlug(url);

    // Short description
    let shortDescription = $('.desc-text').text().trim();
    if (!shortDescription) {
        shortDescription = $('meta[property="og:description"]').attr('content') || '';
    }
    shortDescription = shortDescription.replace(/[«»]/g, '').trim();

    // Long description
    const longDescription = $('.entry-content p').slice(0, 3).map((_, el) => $(el).text().trim()).get().join('\n\n');

    // Website URL
    let websiteUrl = '';
    const visitButton = $('#specialButton').first().attr('href');
    if (visitButton) {
        if (visitButton.startsWith('http')) {
            websiteUrl = await getOriginalUrl(visitButton);
        } else if (visitButton.startsWith('/out/')) {
            websiteUrl = await getOriginalUrl(`https://www.aixploria.com${visitButton}`);
        }
    }

    if (!websiteUrl || websiteUrl.includes('aixploria.com')) {
        console.log(`  No valid website URL`);
        return null;
    }

    // Logo
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

    // Pricing
    let pricingType: 'Free' | 'Freemium' | 'Paid' | 'Trial' = 'Freemium';
    const pricingEl = $('[class*="website-type-"]').text().trim().toLowerCase();
    if (pricingEl.includes('free') && !pricingEl.includes('trial')) {
        pricingType = 'Free';
    } else if (pricingEl.includes('paid') || pricingEl.includes('premium')) {
        pricingType = 'Paid';
    } else if (pricingEl.includes('trial')) {
        pricingType = 'Trial';
    }

    // Rating
    let rating: number | undefined;
    let reviewCount: number | undefined;
    if (jsonLdData?.aggregateRating) {
        rating = parseFloat(jsonLdData.aggregateRating.ratingValue) || undefined;
        reviewCount = parseInt(jsonLdData.aggregateRating.ratingCount) || undefined;
    }

    const result: ScrapedTool = {
        name,
        slug,
        shortDescription: shortDescription || `${name} - AI Tool`,
        longDescription,
        websiteUrl: cleanUrl(websiteUrl),
        logoUrl,
        categories: categories.length > 0 ? categories : ['Productivity'],
        tags: categories.slice(0),
        pricingType,
        rating,
        reviewCount,
        sourceUrl: url,
    };

    console.log(`  ✅ Name: ${result.name}`);
    console.log(`  📌 URL: ${result.websiteUrl}`);
    console.log(`  📂 Categories: ${result.categories.join(', ')}`);
    console.log(`  💰 Pricing: ${result.pricingType}`);
    if (result.rating) console.log(`  ⭐ Rating: ${result.rating}/5`);

    return result;
}

async function main() {
    console.log('🧪 Test Scraper - 5 tools\n');

    const tools: ScrapedTool[] = [];

    for (const url of TEST_URLS) {
        try {
            const tool = await scrapeTool(url);
            if (tool) tools.push(tool);
        } catch (error) {
            console.log(`  ❌ Error: ${error}`);
        }
        await new Promise(r => setTimeout(r, 1500));
    }

    console.log('\n========================================');
    console.log(`📊 Scraped ${tools.length} tools successfully`);
    console.log('========================================\n');

    // Output JSON
    console.log('JSON Output:\n');
    console.log(JSON.stringify(tools, null, 2));
}

main().catch(console.error);
