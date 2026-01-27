import { newsletterService } from "@/lib/services/newsletterService"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        const supabase = await createClient()
        const result = await newsletterService.subscribe(email, supabase)
        return NextResponse.json(result)
    } catch (error: any) {
        console.error("Newsletter API Error:", error)
        return NextResponse.json({
            error: 'Failed to subscribe',
            details: error.message || 'Unknown error'
        }, { status: 500 })
    }
}
