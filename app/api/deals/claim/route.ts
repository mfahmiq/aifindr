import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const dealId = searchParams.get('id')

    if (!dealId) {
        return NextResponse.redirect(new URL('/deals', request.url))
    }

    const supabase = await createClient()

    try {
        // 1. Fetch deal to get redirect URL
        const { data: deal, error: fetchError } = await supabase
            .from('deals')
            .select('affiliate_url, tool_id, tools(slug)')
            .eq('id', dealId)
            .single()

        if (fetchError || !deal) {
            console.error('Error fetching deal for claim:', fetchError)
            return NextResponse.redirect(new URL('/deals', request.url))
        }

        // 2. Increment claim count asynchronously
        // We use RPC for speed and to bypass RLS if needed (it's SECURITY DEFINER)
        await supabase.rpc('increment_deal_claim_count', { deal_id: dealId })

        // 3. Redirect to affiliate URL or tool page
        const redirectUrl = deal.affiliate_url || `/tool/${(deal.tools as any)?.slug}`

        return NextResponse.redirect(new URL(redirectUrl, request.url))
    } catch (error) {
        console.error('Claim redirect error:', error)
        return NextResponse.redirect(new URL('/deals', request.url))
    }
}
