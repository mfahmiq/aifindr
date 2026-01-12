import { toolsService } from "@/lib/services/toolsService"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

        // First get the tool to ensure it exists and get its ID
        const tool = await toolsService.getToolBySlug(slug, supabase)

        if (!tool) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
        }

        // Perform update
        const updatedTool = await toolsService.updateTool(tool.id, updates, supabase)

        return NextResponse.json(updatedTool)
    } catch (error) {
        console.error('Update error:', error)
        return NextResponse.json({ error: 'Failed to update tool' }, { status: 500 })
    }
}
