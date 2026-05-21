import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { socialPosterService } from "@/lib/services/social"

export async function POST(req: Request) {
    try {
        const supabase = await createClient()

        // 1. Verify user is admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: userProfile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
        }

        // 2. Parse request payload
        const { toolId } = await req.json()
        if (!toolId) {
            return NextResponse.json({ error: 'Missing toolId' }, { status: 400 })
        }

        // 3. Trigger orchestrator using admin supabase client inside the service
        const results = await socialPosterService.postNewToolAlert(toolId, supabase)

        return NextResponse.json({
            success: true,
            results
        })

    } catch (error: any) {
        console.error('Admin manual broadcast error:', error)
        return NextResponse.json({ error: error.message || 'Failed to trigger broadcast' }, { status: 500 })
    }
}
