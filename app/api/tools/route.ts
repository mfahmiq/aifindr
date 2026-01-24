import { toolsService } from "@/lib/services/toolsService"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)

    const filters = {
        search: searchParams.get('search') || undefined,
        category: searchParams.get('category') || undefined,
        pricing: searchParams.getAll('pricing'),
        tags: searchParams.getAll('tags'),
        features: {
            hasFreeTrial: searchParams.get('hasFreeTrial') === 'true',
            hasAPI: searchParams.get('hasAPI') === 'true',
            isOpenSource: searchParams.get('isOpenSource') === 'true',
            isVerified: searchParams.get('isVerified') === 'true',
        },
        status: searchParams.get('status') || undefined,
        plan: searchParams.get('plan') || undefined, // Filter by subscription plan
        highlight: searchParams.get('highlight') === 'true', // Filter for featured tools
        picks: searchParams.get('picks') === 'true', // Filter for "AI Select Picks"
        sortBy: searchParams.get('sortBy') as any || 'popular',
        limit: parseInt(searchParams.get('limit') || '12'),
        page: parseInt(searchParams.get('page') || '1')
    }

    try {
        const supabase = await createClient()
        const data = await toolsService.getTools(filters, supabase)
        return NextResponse.json(data)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 })
    }
}
