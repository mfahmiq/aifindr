
import * as cheerio from 'cheerio';

const URLS = [
    'https://www.aixploria.com/en/chatgpt/',
    'https://www.aixploria.com/en/midjourney/',
    'https://www.aixploria.com/en/claude-by-anthropic/',
];

async function test() {
    for (const url of URLS) {
        console.log(`Checking: ${url}`);
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = await res.text();
        const $ = cheerio.load(html);

        const iconSingly = $('img.site-icon-singly').attr('src');
        const iconBrand = $('.favicon-cat-brand img').attr('src');
        const screenshot = $('.post-thumb-con .wp-post-image').attr('src');

        console.log(`  Screenshot (Old): ${screenshot?.substring(screenshot.lastIndexOf('/') + 1)}`);
        console.log(`  Icon Singly (New): ${iconSingly?.substring(iconSingly.lastIndexOf('/') + 1)}`);
        console.log(`  Icon Brand: ${iconBrand?.substring(iconBrand.lastIndexOf('/') + 1)}`);
        console.log('---');
    }
}

test();
