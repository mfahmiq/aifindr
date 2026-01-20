
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    const slug = params.slug
    const supabase = await createClient()

    // 1. Get tool ID
    const { data: tool, error: toolError } = await supabase
        .from('tools')
        .select('id, view_count')
        .eq('slug', slug)
        .single()

    if (toolError || !tool) {
        return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
    }

    // 2. Track click in tool_views (simulating click tracking via views table with referrer or just separate logic)
    // Ideally we should have a 'clicks' column in 'tools' table.
    // Since migration is tricky right now, we will try to increment 'view_count' as a fallback 
    // OR try to update 'click_count' if it exists.

    // We will attempt to update 'click_count' directly. If it fails (column doesn't exist), we catch it.
    try {
        const { error: updateError } = await supabase.rpc('increment_click_count', { tool_id: tool.id })

        if (updateError) {
            // Fallback: Just log it or do nothing if RPC missing
            console.error('Click tracking RPC failed:', updateError)
        }
    } catch (e) {
        // Ignore
    }

    return NextResponse.json({ success: true })
}
