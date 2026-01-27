import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = createAdminClient()

        // Fetch latest users who have an avatar_url
        const { data: users, error } = await supabase
            .from('users')
            .select('name, avatar_url')
            .not('avatar_url', 'is', null) // Only users with avatars
            .order('created_at', { ascending: false })
            .limit(5)

        if (error) {
            console.error('Error fetching public avatars:', error)
            return NextResponse.json({ users: [] })
        }

        // Return sanitized data
        const sanitizedUsers = users?.map(u => ({
            name: u.name,
            avatar_url: u.avatar_url
        })) || []

        return NextResponse.json({ users: sanitizedUsers })
    } catch (error) {
        console.error('Internal error fetching avatars:', error)
        return NextResponse.json({ users: [] })
    }
}
