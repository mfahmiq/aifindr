import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theaiselect.com'
    const supabase = await createClient()

    // Get all tools
    const { data: tools } = await supabase
        .from('tools')
        .select('slug, updated_at')
        .eq('status', 'published')

    const toolUrls = (tools || []).map((tool) => ({
        url: `${baseUrl}/tool/${tool.slug}`,
        lastModified: new Date(tool.updated_at || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    // Get all categories
    const { data: categories } = await supabase
        .from('categories')
        .select('slug')

    const categoryUrls = (categories || []).map((category) => ({
        url: `${baseUrl}/categories?category=${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/categories`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/trending`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/compare`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/pricing`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        ...toolUrls,
        ...categoryUrls,
    ]
}
