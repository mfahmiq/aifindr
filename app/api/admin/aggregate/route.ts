import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { socialPosterService } from "@/lib/services/social"

// Robust HTML scraper that strips scripts and styles to clean text
async function scrapeUrlContent(url: string): Promise<{ title: string; metaDescription: string; bodyText: string }> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            next: { revalidate: 0 } // Bypass caching
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        const html = await response.text()
        
        // Extract title
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
        const title = titleMatch ? titleMatch[1].trim() : ""

        // Extract meta description
        let metaDescription = ""
        const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i) ||
                          html.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["']/i) ||
                          html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']/i)
        if (descMatch) {
            metaDescription = descMatch[1].trim()
        }

        // Clean body text
        let bodyHtml = html
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
        if (bodyMatch) {
            bodyHtml = bodyMatch[1]
        }

        let cleanText = bodyHtml
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "")
            .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()

        cleanText = cleanText.substring(0, 6000) // limit context length

        return {
            title,
            metaDescription,
            bodyText: cleanText
        }
    } catch (error: any) {
        console.error(`Error scraping ${url}:`, error)
        throw new Error(`Failed to scrape website contents: ${error.message}`)
    }
}

// Fetch logo with fallbacks
async function getLogoUrl(domain: string): Promise<string> {
    const clearbitUrl = `https://logo.clearbit.com/${domain}`
    try {
        const res = await fetch(clearbitUrl, { method: "HEAD" })
        if (res.ok) return clearbitUrl
    } catch (e) {}
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

// Call Gemini 1.5 Flash to extract metadata
async function callGeminiExtractor(title: string, metaDescription: string, bodyText: string): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in environmental variables.")
    }

    const systemInstruction = `You are an expert AI tool curator and data extraction model. 
Analyze the scraped website text and title, then extract high-quality structured metadata.
Return a valid JSON object matching the following structure EXACTLY:
{
  "name": "Name of the AI tool",
  "short_description": "Catchy, professional description of the tool in English (max 150 characters)",
  "long_description": "Detailed overview of the tool, its core features, and target audience (1-2 paragraphs, HTML tags like <p>, <ul>, <li> allowed)",
  "pricing_type": "Must be exactly one of: 'Free', 'Freemium', 'Paid', 'Free Trial', 'Subscription'",
  "category_name": "Propose the most suitable category name from the website context (e.g. Chatbots, Productivity, Coding, Design, Copywriting, Video, Audio, Analytics, Other)",
  "has_api": true,
  "has_free_trial": true,
  "is_open_source": false,
  "tags": ["tag1", "tag2"],
  "features": ["feature1", "feature2"],
  "monthly_price": null,
  "yearly_price": null,
  "currency": "USD"
}`

    const prompt = `Website Title: ${title}\nMeta Description: ${metaDescription}\n\nWebsite Homepage Content:\n${bodyText}\n\nExtract and return the JSON object matching the instruction above.`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: `${systemInstruction}\n\n${prompt}` }]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Gemini API Error (HTTP ${response.status}): ${errorText}`)
    }

    const resJson = await response.json()
    const textContent = resJson.candidates?.[0]?.content?.parts?.[0]?.text
    if (!textContent) {
        throw new Error("Failed to get response text from Gemini API")
    }

    return JSON.parse(textContent)
}

// Generate unique slug
async function generateUniqueSlug(supabase: any, name: string): Promise<string> {
    const nameSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

    let slug = nameSlug
    let exists = true
    let counter = 0

    while (exists) {
        const { count } = await supabase
            .from('tools')
            .select('*', { count: 'exact', head: true })
            .eq('slug', slug)
            
        if (count === 0) {
            exists = false
        } else {
            counter++
            slug = `${nameSlug}-${counter}`
        }
    }
    return slug
}

export async function POST(request: Request) {
    try {
        // 1. Parse Body Parameters
        let body
        try {
            body = await request.json()
        } catch (e) {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
        }
        const { url, action, autoPublish = false, saveToDb = true } = body

        // 2. Authorization Verification
        const authHeader = request.headers.get("Authorization")
        let isAuthorized = false

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7)
            if (token === process.env.CRON_SECRET) {
                isAuthorized = true
            }
        }

        const supabase = await createClient()

        if (!isAuthorized) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                if (saveToDb === false) {
                    // Any authenticated user can trigger a saveToDb: false auto-fill extraction
                    isAuthorized = true
                } else {
                    const { data: userProfile } = await supabase
                        .from('users')
                        .select('role')
                        .eq('id', user.id)
                        .single()
                    if (userProfile?.role === 'admin') {
                        isAuthorized = true
                    }
                }
            }
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Unauthorized: Admin access or authenticated user (for auto-fill) required' }, { status: 401 })
        }

        // Action: Product Hunt RSS Aggregation
        if (action === 'rss') {
            console.log("Starting Product Hunt Ingest RSS feed processing...")
            const rssRes = await fetch("https://www.producthunt.com/feed?category=artificial-intelligence", {
                next: { revalidate: 0 }
            })
            if (!rssRes.ok) {
                return NextResponse.json({ error: "Failed to fetch Product Hunt RSS feed" }, { status: 500 })
            }

            const xmlText = await rssRes.text()
            const items: { title: string; link: string }[] = []
            const itemRegex = /<item>([\s\S]*?)<\/item>/g
            let match

            while ((match = itemRegex.exec(xmlText)) !== null) {
                const itemContent = match[1]
                const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/)
                const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/)
                if (linkMatch) {
                    const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : 'Unknown'
                    const link = linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim()
                    items.push({ title, link })
                }
            }

            // Ingest new tools from Product Hunt posts
            const results = []
            // Process at most 5 items in a single cron run to avoid Gemini RPM limits & timeouts
            const itemsToProcess = items.slice(0, 5)

            for (const item of itemsToProcess) {
                try {
                    // Follow redirects if it's redirecting to the actual outbound tool URL
                    // Product Hunt links like https://www.producthunt.com/r/p/XXXXX redirects to actual site
                    let outboundUrl = item.link
                    try {
                        const redirectRes = await fetch(item.link, {
                            method: "HEAD",
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                            },
                            redirect: 'follow'
                        })
                        outboundUrl = redirectRes.url
                    } catch (err) {}

                    // Extract Domain
                    const parsedUrl = new URL(outboundUrl)
                    const cleanUrl = parsedUrl.origin // e.g. https://domain.com

                    // Check duplicate
                    const { count: dupCount } = await supabase
                        .from('tools')
                        .select('*', { count: 'exact', head: true })
                        .ilike('website_url', `%${parsedUrl.hostname}%`)

                    if (dupCount && dupCount > 0) {
                        results.push({ name: item.title, url: cleanUrl, success: false, reason: "Duplicate" })
                        continue
                    }

                    // Scrape & Enrich
                    const scraped = await scrapeUrlContent(cleanUrl)
                    const extracted = await callGeminiExtractor(scraped.title, scraped.metaDescription, scraped.bodyText)
                    
                    const domain = parsedUrl.hostname.replace(/^www\./, "")
                    const logoUrl = await getLogoUrl(domain)

                    // Find matching category
                    const { data: dbCategories } = await supabase.from('categories').select('id, name, slug')
                    let categoryId = null
                    if (dbCategories && dbCategories.length > 0) {
                        const catNameLower = (extracted.category_name || "Other").toLowerCase()
                        let matched = dbCategories.find((c: any) => c.name.toLowerCase() === catNameLower || c.slug.toLowerCase() === catNameLower)
                        if (!matched) {
                            matched = dbCategories.find((c: any) => catNameLower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(catNameLower))
                        }
                        if (matched) {
                            categoryId = matched.id
                        } else {
                            const fallback = dbCategories.find((c: any) => c.name.toLowerCase() === 'other' || c.slug.toLowerCase() === 'other')
                            categoryId = fallback ? fallback.id : dbCategories[0].id
                        }
                    }

                    // Generate unique slug
                    const slug = await generateUniqueSlug(supabase, extracted.name || item.title)

                    // Save
                    const toolObj = {
                        name: extracted.name || item.title,
                        slug,
                        website_url: cleanUrl,
                        logo_url: logoUrl,
                        short_description: extracted.short_description || scraped.metaDescription || item.title,
                        long_description: extracted.long_description || scraped.metaDescription,
                        pricing_type: extracted.pricing_type || 'Free',
                        category_id: categoryId,
                        has_api: extracted.has_api || false,
                        has_free_trial: extracted.has_free_trial || false,
                        is_open_source: extracted.is_open_source || false,
                        monthly_price: extracted.monthly_price || null,
                        yearly_price: extracted.yearly_price || null,
                        currency: extracted.currency || "USD",
                        status: autoPublish ? 'approved' : 'pending',
                        is_verified: autoPublish,
                        favorite_count: 0,
                        rating: 0,
                        review_count: 0,
                        view_count: 0
                    }

                    const { data: newTool, error: insertErr } = await supabase
                        .from('tools')
                        .insert(toolObj)
                        .select('id')
                        .single()

                    if (insertErr) throw insertErr

                    // Auto-post to social media channels if autoPublish is true
                    if (newTool && autoPublish) {
                        socialPosterService.postNewToolAlert(newTool.id, supabase).catch(err => {
                            console.error("Failed to auto-post Product Hunt tool:", err)
                        })
                    }

                    // Associate Tags & Features
                    if (newTool) {
                        if (extracted.tags && extracted.tags.length > 0) {
                            for (const tag of extracted.tags) {
                                const tagSlug = tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
                                let { data: tagObj } = await supabase.from('tags').select('id').eq('slug', tagSlug).maybeSingle()
                                if (!tagObj) {
                                    const { data: insertedTag } = await supabase.from('tags').insert({ name: tag, slug: tagSlug }).select('id').single()
                                    tagObj = insertedTag
                                }
                                if (tagObj) {
                                    await supabase.from('tool_tags').insert({ tool_id: newTool.id, tag_id: tagObj.id })
                                }
                            }
                        }

                        if (extracted.features && extracted.features.length > 0) {
                            const featuresData = extracted.features.map((f: string, idx: number) => ({
                                tool_id: newTool.id,
                                feature: f,
                                sort_order: idx + 1
                            }))
                            await supabase.from('tool_features').insert(featuresData)
                        }

                        // Add to Audit logs
                        await supabase.from('activity_logs').insert({
                            action: 'auto_aggregate',
                            entity_type: 'tool',
                            entity_id: newTool.id,
                            notes: `Automatically aggregated from Product Hunt: ${toolObj.name}`
                        })
                    }

                    results.push({ name: toolObj.name, url: cleanUrl, success: true })
                } catch (e: any) {
                    console.error("Failed to ingest Product Hunt item:", item.title, e)
                    results.push({ name: item.title, url: item.link, success: false, reason: e.message })
                }
            }

            return NextResponse.json({
                success: true,
                message: `Processed ${results.length} feeds.`,
                results
            })
        }

        // Action: Single URL Aggregation
        if (!url) {
            return NextResponse.json({ error: "Missing required parameter 'url'" }, { status: 400 })
        }

        // Parse URL
        let parsedUrl
        try {
            parsedUrl = new URL(url.trim())
        } catch (e) {
            return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
        }

        const cleanUrl = parsedUrl.origin // e.g. https://domain.com

        // Check duplicates
        const { data: existingTool } = await supabase
            .from('tools')
            .select('id, name, slug')
            .ilike('website_url', `%${parsedUrl.hostname}%`)
            .maybeSingle()

        if (existingTool) {
            return NextResponse.json({
                success: false,
                duplicate: true,
                message: `Tool already exists in directory: ${existingTool.name}`,
                tool: existingTool
            })
        }

        // 1. Scrape URL
        const scraped = await scrapeUrlContent(cleanUrl)

        // 2. Call Gemini for extraction
        const extracted = await callGeminiExtractor(scraped.title, scraped.metaDescription, scraped.bodyText)

        // 3. Logo fetching
        const domain = parsedUrl.hostname.replace(/^www\./, "")
        const logoUrl = await getLogoUrl(domain)

        // Find Category
        const { data: dbCategories } = await supabase.from('categories').select('id, name, slug')
        let categoryId = null
        if (dbCategories && dbCategories.length > 0) {
            const catNameLower = (extracted.category_name || "Other").toLowerCase()
            let matched = dbCategories.find((c: any) => c.name.toLowerCase() === catNameLower || c.slug.toLowerCase() === catNameLower)
            if (!matched) {
                matched = dbCategories.find((c: any) => catNameLower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(catNameLower))
            }
            if (matched) {
                categoryId = matched.id
            } else {
                const fallback = dbCategories.find((c: any) => c.name.toLowerCase() === 'other' || c.slug.toLowerCase() === 'other')
                categoryId = fallback ? fallback.id : dbCategories[0].id
            }
        }

        // Setup tool object
        const toolObj = {
            name: extracted.name || scraped.title || domain,
            website_url: cleanUrl,
            logo_url: logoUrl,
            short_description: extracted.short_description || scraped.metaDescription || scraped.title,
            long_description: extracted.long_description || scraped.metaDescription,
            pricing_type: extracted.pricing_type || 'Free',
            category_id: categoryId,
            has_api: extracted.has_api || false,
            has_free_trial: extracted.has_free_trial || false,
            is_open_source: extracted.is_open_source || false,
            monthly_price: extracted.monthly_price || null,
            yearly_price: extracted.yearly_price || null,
            currency: extracted.currency || "USD",
            tags: extracted.tags || [],
            features: extracted.features || []
        }

        if (!saveToDb) {
            // Just return extracted data, do not save (e.g. for User Submit Auto-Fill)
            return NextResponse.json({
                success: true,
                data: toolObj
            })
        }

        // Create Unique Slug
        const slug = await generateUniqueSlug(supabase, toolObj.name)

        // Save to Database
        const { data: newTool, error: insertErr } = await supabase
            .from('tools')
            .insert({
                ...toolObj,
                slug,
                status: autoPublish ? 'approved' : 'pending',
                is_verified: autoPublish,
                favorite_count: 0,
                rating: 0,
                review_count: 0,
                view_count: 0,
                tags: undefined, // remove from flat object insertion
                features: undefined // remove from flat object insertion
            })
            .select('id')
            .single()

        if (insertErr) throw insertErr

        // Auto-post to social media channels if autoPublish is true
        if (newTool && autoPublish) {
            socialPosterService.postNewToolAlert(newTool.id, supabase).catch(err => {
                console.error("Failed to auto-post single aggregated tool:", err)
            })
        }

        if (newTool) {
            // Link tags
            if (toolObj.tags && toolObj.tags.length > 0) {
                for (const tag of toolObj.tags) {
                    const tagSlug = tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
                    let { data: tagObj } = await supabase.from('tags').select('id').eq('slug', tagSlug).maybeSingle()
                    if (!tagObj) {
                        const { data: insertedTag } = await supabase.from('tags').insert({ name: tag, slug: tagSlug }).select('id').single()
                        tagObj = insertedTag
                    }
                    if (tagObj) {
                        await supabase.from('tool_tags').insert({ tool_id: newTool.id, tag_id: tagObj.id })
                    }
                }
            }

            // Link features
            if (toolObj.features && toolObj.features.length > 0) {
                const featuresData = toolObj.features.map((f: string, idx: number) => ({
                    tool_id: newTool.id,
                    feature: f,
                    sort_order: idx + 1
                }))
                await supabase.from('tool_features').insert(featuresData)
            }

            // Log activity
            await supabase.from('activity_logs').insert({
                action: 'auto_aggregate',
                entity_type: 'tool',
                entity_id: newTool.id,
                notes: `Successfully aggregated and enriched website: ${toolObj.name}`
            })
        }

        return NextResponse.json({
            success: true,
            message: `Successfully aggregated and saved: ${toolObj.name}`,
            slug,
            data: toolObj
        })

    } catch (error: any) {
        console.error("Aggregation endpoint error:", error)
        return NextResponse.json({ error: error.message || "Failed to process aggregate request" }, { status: 500 })
    }
}
