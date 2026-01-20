import { toolsService } from "@/lib/services/toolsService"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
    try {
        const supabase = await createClient()

        // Check if user is admin (you might want to add more robust auth here)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const stats = await toolsService.getAdminStats(supabase)
        return NextResponse.json(stats)
    } catch (error) {
        console.error('Admin stats fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 })
    }
}
