import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import crypto from "crypto"

// Helper to get/create session ID for anonymous users
async function getSessionId(): Promise<string> {
    const cookieStore = await cookies()
    let sessionId = cookieStore.get('view_session_id')?.value

    if (!sessionId) {
        sessionId = crypto.randomUUID()
        // Note: Setting cookie in API routes requires response headers
    }

    return sessionId
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const supabase = await createClient()
        const slug = (await params).slug

        // Get tool by slug
        const { data: tool, error: toolError } = await supabase
            .from('tools')
            .select('id, view_count')
            .eq('slug', slug)
            .single()

        if (toolError || !tool) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
        }

        // Get session ID for duplicate prevention
        const sessionId = await getSessionId()

        // Get client IP hash for additional duplicate prevention
        const forwarded = request.headers.get('x-forwarded-for')
        const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16)

        // Check for recent view from same session/IP (within last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
        const { data: existingView } = await supabase
            .from('tool_views')
            .select('id')
            .eq('tool_id', tool.id)
            .eq('ip_hash', ipHash)
            .gte('created_at', oneHourAgo)
            .limit(1)
            .single()

        // Only record view if no recent duplicate
        if (!existingView) {
            // Record the view
            const { error: insertError } = await supabase
                .from('tool_views')
                .insert({
                    tool_id: tool.id,
                    ip_hash: ipHash,
                    user_agent: request.headers.get('user-agent') || null,
                    referrer: request.headers.get('referer') || null
                })

            if (insertError) {
                console.error('Error inserting view:', insertError)
                return NextResponse.json({ error: 'Failed to record view' }, { status: 500 })
            }
        }

        // Fetch latest count (it might have been updated by trigger)
        const { data: updatedTool } = await supabase
            .from('tools')
            .select('view_count')
            .eq('id', tool.id)
            .single()

        const response = NextResponse.json({
            success: true,
            viewRecorded: !existingView,
            viewCount: updatedTool?.view_count || tool.view_count
        })

        // Set session cookie for future requests
        response.cookies.set('view_session_id', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        })

        return response
    } catch (error) {
        console.error('View tracking error:', error)
        return NextResponse.json({ error: 'Failed to record view' }, { status: 500 })
    }
}
