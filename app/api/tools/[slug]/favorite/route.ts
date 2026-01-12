import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import crypto from "crypto"

// Helper to get/create anonymous session ID
async function getOrCreateAnonymousId(): Promise<string> {
    const cookieStore = await cookies()
    let anonId = cookieStore.get('anon_id')?.value

    if (!anonId) {
        anonId = `anon_${crypto.randomUUID()}`
    }

    return anonId
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const supabase = await createClient()
        const slug = (await params).slug

        // Get tool
        const { data: tool, error: toolError } = await supabase
            .from('tools')
            .select('id, favorite_count')
            .eq('slug', slug)
            .single()

        if (toolError || !tool) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
        }

        // Check if current user/session has favorited
        const anonId = await getOrCreateAnonymousId()

        // Check for authenticated user first
        const { data: { user } } = await supabase.auth.getUser()
        const userId = user?.id

        // Check both authenticated favorites and anonymous favorites
        let isFavorited = false

        if (userId) {
            const { data: favorite } = await supabase
                .from('favorites')
                .select('user_id')
                .eq('tool_id', tool.id)
                .eq('user_id', userId)
                .single()
            isFavorited = !!favorite
        }

        // Also check anonymous favorites (stored in separate table or with anon prefix)
        if (!isFavorited) {
            const { data: anonFavorite } = await supabase
                .from('anonymous_favorites')
                .select('anon_id')
                .eq('tool_id', tool.id)
                .eq('anon_id', anonId)
                .single()
            isFavorited = !!anonFavorite
        }

        return NextResponse.json({
            isFavorited,
            favoriteCount: tool.favorite_count || 0
        })
    } catch (error) {
        console.error('Favorite check error:', error)
        return NextResponse.json({ error: 'Failed to check favorite status' }, { status: 500 })
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const supabase = await createClient()
        const slug = (await params).slug

        // Get tool
        const { data: tool, error: toolError } = await supabase
            .from('tools')
            .select('id, favorite_count')
            .eq('slug', slug)
            .single()

        if (toolError || !tool) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
        }

        // Check authenticated user first
        const { data: { user } } = await supabase.auth.getUser()
        const userId = user?.id
        const anonId = await getOrCreateAnonymousId()

        let isFavorited = false
        let favoriteCount = tool.favorite_count || 0

        if (userId) {
            // Handle authenticated user favorites
            const { data: existingFavorite } = await supabase
                .from('favorites')
                .select('user_id')
                .eq('tool_id', tool.id)
                .eq('user_id', userId)
                .single()

            if (existingFavorite) {
                // Remove favorite
                await supabase
                    .from('favorites')
                    .delete()
                    .eq('tool_id', tool.id)
                    .eq('user_id', userId)

                favoriteCount = Math.max(0, favoriteCount - 1)
                isFavorited = false
            } else {
                // Add favorite
                await supabase
                    .from('favorites')
                    .insert({
                        tool_id: tool.id,
                        user_id: userId
                    })

                favoriteCount = favoriteCount + 1
                isFavorited = true
            }
        } else {
            // Handle anonymous user favorites
            const { data: existingFavorite } = await supabase
                .from('anonymous_favorites')
                .select('anon_id')
                .eq('tool_id', tool.id)
                .eq('anon_id', anonId)
                .single()

            if (existingFavorite) {
                // Remove favorite
                await supabase
                    .from('anonymous_favorites')
                    .delete()
                    .eq('tool_id', tool.id)
                    .eq('anon_id', anonId)

                favoriteCount = Math.max(0, favoriteCount - 1)
                isFavorited = false
            } else {
                // Add favorite
                await supabase
                    .from('anonymous_favorites')
                    .insert({
                        tool_id: tool.id,
                        anon_id: anonId
                    })

                favoriteCount = favoriteCount + 1
                isFavorited = true
            }
        }

        // Update favorite count on tool
        await supabase
            .from('tools')
            .update({ favorite_count: favoriteCount })
            .eq('id', tool.id)

        const response = NextResponse.json({
            success: true,
            isFavorited,
            favoriteCount
        })

        // Set anonymous ID cookie
        response.cookies.set('anon_id', anonId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365 // 1 year
        })

        return response
    } catch (error) {
        console.error('Favorite toggle error:', error)
        return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 })
    }
}
