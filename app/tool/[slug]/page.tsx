
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { toolsService } from "@/lib/services/toolsService"
import { createClient } from "@/lib/supabase/server"
import ToolDetailPage from "./client"

// Force dynamic rendering if we want to ensure latest data, 
// or let it cache and revalidate on demand. 
// For tools directory, caching is good.
export const revalidate = 3600 // Revalidate every hour

interface PageProps {
    params: Promise<{ slug: string }>
}

async function getTool(slug: string) {
    const supabase = await createClient()
    return toolsService.getToolBySlug(slug, supabase)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const tool = await getTool(slug)

    if (!tool) {
        return {
            title: 'Tool Not Found | AI Finder',
        }
    }

    const title = `${tool.name} - ${tool.short_description?.slice(0, 50)}... | AI Finder`
    const description = tool.short_description || `Discover ${tool.name} features, pricing, and alternatives on AI Finder.`

    return {
        title,
        description,
        keywords: [tool.name, ...(tool.tags?.map((t: any) => t.name) || []), 'AI Tools', 'AI Finder'],
        openGraph: {
            title,
            description,
            images: tool.image_url ? [{ url: tool.image_url }] : [],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: tool.image_url ? [tool.image_url] : [],
        }
    }
}

export default async function Page({ params }: PageProps) {
    const { slug } = await params
    const tool = await getTool(slug)

    if (!tool) {
        notFound()
    }

    // Fetch related tools
    // Default to empty array if category_id is missing
    let relatedTools: any[] = []

    if (tool.category_id) {
        try {
            const tagIds = tool.tags?.map((t: any) => t.id) || []
            relatedTools = await toolsService.getRelatedTools(
                tool.category_id,
                tool.id,
                tagIds,
                6
            )
        } catch (e) {
            console.error('Failed to fetch related tools:', e)
        }
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: tool.name,
        description: tool.short_description,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any',
        offers: {
            '@type': 'Offer',
            price: tool.pricing_type === 'Free' ? '0' : '0',
            priceCurrency: 'IDR',
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '120',
        },
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ToolDetailPage tool={tool} relatedTools={relatedTools} />
        </>
    )
}
