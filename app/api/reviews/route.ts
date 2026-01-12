import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from "next/server"

// Create admin client to bypass RLS (for server-side operations)
function createAdminClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return [] },
                setAll() { }
            }
        }
    )
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const toolId = searchParams.get('toolId')

    if (!toolId) {
        return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 })
    }

    try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                users!reviews_user_id_fkey (name, avatar_url)
            `)
            .eq('tool_id', toolId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching reviews:', error)
            throw error
        }
        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Error fetching reviews:', error)
        return NextResponse.json({
            error: 'Failed to fetch reviews',
            details: error?.message
        }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validate required fields
        if (!body.tool_id || !body.rating || !body.comment) {
            return NextResponse.json({
                error: 'Missing required fields',
                details: 'tool_id, rating, and comment are required'
            }, { status: 400 })
        }

        console.log('Creating review:', body)

        // Use admin client to bypass RLS
        const supabase = createAdminClient()

        // Try to get user from cookies-based client
        const cookieStore = await cookies()
        const authClient = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll() { }
                }
            }
        )
        const { data: { user } } = await authClient.auth.getUser()

        // Insert review using admin client
        const { data, error } = await supabase
            .from('reviews')
            .insert({
                tool_id: body.tool_id,
                rating: body.rating,
                comment: body.comment,
                title: body.title || null,
                guest_name: body.guest_name || null,
                guest_email: body.guest_email || null,
                user_id: user?.id || null,
                status: 'pending'
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase error creating review:', error)
            return NextResponse.json({
                error: 'Failed to submit review',
                details: error.message,
                code: error.code,
                hint: error.hint
            }, { status: 500 })
        }

        console.log('Review created:', data)
        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Error creating review:', error)
        return NextResponse.json({
            error: 'Failed to submit review',
            details: error?.message || 'Unknown error'
        }, { status: 500 })
    }
}
