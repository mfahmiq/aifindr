import { newsletterService } from "@/lib/services/newsletterService"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        const result = await newsletterService.subscribe(email)
        return NextResponse.json(result)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
    }
}
