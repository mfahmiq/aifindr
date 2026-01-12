import { categoriesService } from "@/lib/services/categoriesService"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const data = await categoriesService.getCategories()
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }
}
