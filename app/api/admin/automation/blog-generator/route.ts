import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Helper to call Gemini 1.5 Flash to generate a blog post
async function generateBlogPostWithGemini(
    apiKey: string,
    format: 'listicle' | 'review' | 'comparison',
    toolsData: any[],
    targetCategory: string
): Promise<any> {
    if (!toolsData || toolsData.length === 0) {
        throw new Error("No approved tools available to generate a blog post.")
    }

    let systemInstruction = `You are a professional Indonesian SEO copywriter, tech blogger, and AI expert.
Your job is to write a highly engaging, professional, and SEO-optimized blog post in BAHASA INDONESIA about the provided AI tools.
The article must be formatted as semantic HTML (using <h2>, <h3>, <p>, <ul>, <li>, <strong>, and <table> if appropriate). Do NOT include <html>, <head>, or <body> tags. Keep the styling clean and premium.
Add outbound URLs to the tools using the provided website_url, adding the following UTM tag: ?utm_source=aifindr&utm_medium=blog&utm_campaign=ai_blog_generator.
Always link the tool names with their website_url inside the content.

You MUST return a valid JSON object matching the following structure EXACTLY:
{
  "title": "A catchy, click-worthy, SEO-optimized title in Bahasa Indonesia (max 80 chars)",
  "slug": "unique-url-friendly-slug-in-english-or-indonesian",
  "excerpt": "A compelling 1-2 sentence meta description/excerpt in Bahasa Indonesia (max 150 chars)",
  "content": "The full blog post content in HTML (Bahasa Indonesia). Minimum 600 words, rich, deep, and beautifully structured with subheadings.",
  "category": "${targetCategory}",
  "read_time": 5
}`

    let prompt = ""

    if (format === 'listicle') {
        const toolsList = toolsData.map((t, idx) => `
Tool #${idx + 1}:
- Name: ${t.name}
- Website URL: ${t.website_url}
- Pricing: ${t.pricing_type}
- Short Description: ${t.short_description}
- Description: ${t.long_description || ''}
- Category: ${t.categories?.name || 'AI Tools'}
`).join("\n")

        prompt = `
Format: Listicles / Daily Roundup (Kumpulan Tool Terbaik)
Topic: Write a curated roundup article listing the top AI tools for productivity, coding, design, or creators based on these tools.
Language: Bahasa Indonesia

Tools to write about:
${toolsList}

Instructions:
1. Write a compelling introduction explaining the AI trends of today.
2. Review each tool in detail: discuss its main features, target audience, pricing, and how it stands out.
3. Link the tool name to its website URL (with the UTM parameters).
4. Add a comparison table summarizing their pricing types and key features.
5. Conclude with actionable advice on how to choose the right tool.
`
    } else if (format === 'review') {
        const t = toolsData[0] // Focus on the first tool
        prompt = `
Format: Deep-Dive Review (Ulasan Mendalam)
Topic: Write a comprehensive, deep-dive product review about the AI tool "${t.name}".
Language: Bahasa Indonesia

Tool Details:
- Name: ${t.name}
- Website URL: ${t.website_url}
- Pricing: ${t.pricing_type}
- Short Description: ${t.short_description}
- Description: ${t.long_description || ''}
- Category: ${t.categories?.name || 'AI Tools'}

Instructions:
1. Write an engaging intro introducing "${t.name}" and the specific problem it solves.
2. Outline its key features in detail with bullet points.
3. Provide a step-by-step guide on how to get started or use the tool.
4. Analyze its pricing model (pricing type: ${t.pricing_type}).
5. Give an honest list of Pros & Cons (Kelebihan & Kekurangan) using a table or clean bullet points.
6. Provide a final verdict (Kesimpulan) and a rating out of 10.
`
    } else {
        // Comparison
        const t1 = toolsData[0]
        const t2 = toolsData[1] || toolsData[0] // fallback if only one tool
        prompt = `
Format: Alternatives & Comparisons (Perbandingan)
Topic: Compare "${t1.name}" with "${t2.name}" (or focus on "${t1.name}" as an alternative to popular tools like ChatGPT/Midjourney if they are similar).
Language: Bahasa Indonesia

Tool 1 Details:
- Name: ${t1.name}
- Website URL: ${t1.website_url}
- Pricing: ${t1.pricing_type}
- Short Description: ${t1.short_description}
- Description: ${t1.long_description || ''}

Tool 2/Alternative Details:
- Name: ${t2.name}
- Website URL: ${t2.website_url}
- Pricing: ${t2.pricing_type}
- Short Description: ${t2.short_description}
- Description: ${t2.long_description || ''}

Instructions:
1. Write a captivating introduction about why finding alternatives or comparing tools in this domain is essential.
2. Directly compare both tools. Outline their similarities and differences.
3. Create a detailed HTML comparison table comparing their pricing, features, and ease of use.
4. Discuss the strengths and weaknesses of each tool.
5. Conclude with a clear recommendation on when to choose Tool 1 vs Tool 2.
`
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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

    try {
        return JSON.parse(textContent)
    } catch (err) {
        console.error("Gemini output was not valid JSON:", textContent)
        throw new Error("Gemini did not return a valid JSON object.")
    }
}

// GET/POST Handler
export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // 1. Authorize user (Admin or CRON)
        let isAuthorized = false
        const authHeader = request.headers.get("Authorization")

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7)
            if (token === process.env.CRON_SECRET) {
                isAuthorized = true
            }
        }

        if (!isAuthorized) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
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

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 })
        }

        // 2. Read Request Parameters / Body
        let body: any = {}
        try {
            body = await request.json()
        } catch (e) {}

        const adminClient = createAdminClient()

        // Fetch settings from database to get defaults
        const { data: settingsData } = await adminClient
            .from("site_settings")
            .select("feature_flags")
            .eq("id", "main")
            .single()

        const dbConfig = (settingsData?.feature_flags as any)?.blog_generator_settings || {}
        
        // Merge body params with DB config fallbacks
        const format = body.format || dbConfig.format || 'listicle'
        const status = body.status || dbConfig.status || 'draft'
        const category = body.category || dbConfig.category || 'Listicles'

        // 3. Resolve Gemini API Key
        const dbCreds = (settingsData?.feature_flags as any)?.automation_credentials || {}
        const apiKey = process.env.GEMINI_API_KEY || dbCreds.gemini?.GEMINI_API_KEY

        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API Key is not configured. Please add it to your environment or Automation dashboard." }, { status: 400 })
        }

        // 4. Fetch Approved Tools
        // Get the latest approved tools
        const { data: approvedTools, error: toolsError } = await adminClient
            .from('tools')
            .select('*, categories(name, slug)')
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(10)

        if (toolsError) {
            throw toolsError
        }

        if (!approvedTools || approvedTools.length === 0) {
            return NextResponse.json({ error: "No approved tools found in the database. Please approve some tools first." }, { status: 400 })
        }

        // Filter tools to write about
        // For listicles, we take up to 5 tools
        // For reviews, we take the latest 1
        // For comparisons, we take the latest 2
        let toolsToUse: any[] = []
        if (format === 'listicle') {
            toolsToUse = approvedTools.slice(0, 5)
        } else if (format === 'review') {
            toolsToUse = approvedTools.slice(0, 1)
        } else {
            toolsToUse = approvedTools.slice(0, 2)
        }

        // 5. Generate Article Content using Gemini
        console.log(`Generating daily blog post in format: ${format}...`)
        const generated = await generateBlogPostWithGemini(apiKey, format, toolsToUse, category)

        // 6. Set Cover Image
        // Fallback to the first tool's logo URL
        const coverImage = toolsToUse[0]?.logo_url || null

        // 7. Create Blog Post
        const finalSlug = `${generated.slug}-${Date.now().toString().slice(-4)}` // guarantee uniqueness
        
        const { data: createdPost, error: insertError } = await adminClient
            .from('blog_posts')
            .insert({
                title: generated.title,
                slug: finalSlug,
                excerpt: generated.excerpt,
                content: generated.content,
                category: generated.category || category,
                status: status, // 'draft' or 'published'
                cover_image: coverImage,
                read_time: generated.read_time || 5,
                author_name: 'AIFindr AI Agent',
                published_at: status === 'published' ? new Date().toISOString() : null,
                view_count: 0
            })
            .select()
            .single()

        if (insertError) {
            throw insertError
        }

        // 8. Log the activity in database
        await adminClient.from('activity_logs').insert({
            action: 'auto_blog_generate',
            entity_type: 'blog_post',
            entity_id: createdPost.id,
            notes: `Successfully generated blog post titled: "${createdPost.title}" in format: "${format}" (${status})`
        })

        return NextResponse.json({
            success: true,
            message: `Successfully generated blog post!`,
            post: {
                id: createdPost.id,
                title: createdPost.title,
                slug: createdPost.slug,
                status: createdPost.status,
                cover_image: createdPost.cover_image
            }
        })

    } catch (error: any) {
        console.error("Daily Blog Generator error:", error)
        return NextResponse.json({ error: error.message || "Failed to generate blog post" }, { status: 500 })
    }
}

// Support GET for direct testing or cron jobs
export async function GET(request: Request) {
    // Forward to POST handler
    return POST(request)
}
