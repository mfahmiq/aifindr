import { submissionsService } from "@/lib/services/analyticsService"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const result = await submissionsService.submitTool(body)
        return NextResponse.json(result)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to submit tool' }, { status: 500 })
    }
}
