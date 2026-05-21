import { toolsService } from "@/lib/services/toolsService"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { socialPosterService } from "@/lib/services/social"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const supabase = await createClient()
        const slug = (await params).slug
        const data = await toolsService.getToolBySlug(slug, supabase)

        if (!data) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
        }

        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch tool' }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const supabase = await createClient()
        const slug = (await params).slug
        const updates = await request.json()

        // Verify user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // First get the tool to ensure it exists and get its ID
        const tool = await toolsService.getToolBySlug(slug, supabase)

        if (!tool) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
        }

        // Verify ownership or admin role
        const isOwner = tool.owner_id === user.id || tool.submitted_by === user.id
        if (!isOwner) {
            const { data: userProfile } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single()

            if (userProfile?.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden: you do not own this tool' }, { status: 403 })
            }
        }

        // Perform update
        const updatedTool = await toolsService.updateTool(tool.id, updates, supabase)

        // Trigger social media auto-poster if transitioning to approved
        if (updates.status === 'approved' && tool.status !== 'approved') {
            socialPosterService.postNewToolAlert(tool.id, supabase).catch(err => {
                console.error("Failed to auto-post manually approved tool:", err)
            })
        }

        return NextResponse.json(updatedTool)
    } catch (error) {
        console.error('Update error:', error)
        return NextResponse.json({ error: 'Failed to update tool' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const supabase = await createClient()
        const slug = (await params).slug

        // Verify user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // First get the tool to ensure it exists and get its ID
        const tool = await toolsService.getToolBySlug(slug, supabase)

        if (!tool) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
        }

        // Verify ownership or admin role
        const isOwner = tool.owner_id === user.id || tool.submitted_by === user.id
        if (!isOwner) {
            const { data: userProfile } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single()

            if (userProfile?.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden: you do not own this tool' }, { status: 403 })
            }
        }

        // Delete the tool
        const { error } = await supabase
            .from('tools')
            .delete()
            .eq('id', tool.id)

        if (error) {
            console.error('Delete error:', error)
            return NextResponse.json({ error: 'Failed to delete tool' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Tool deleted successfully' })
    } catch (error) {
        console.error('Delete error:', error)
        return NextResponse.json({ error: 'Failed to delete tool' }, { status: 500 })
    }
}
