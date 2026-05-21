import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createTransaction, generateOrderId } from '@/lib/midtrans'
import { PLAN_PRICING } from '@/lib/services/subscriptionService'

export async function POST(request: NextRequest) {
    try {
        // Authenticate user via session
        const authSupabase = await createClient()
        const { data: { user }, error: authError } = await authSupabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { plan, toolId } = body

        // Validate plan
        if (!plan || !['pro', 'featured', 'sponsor'].includes(plan)) {
            return NextResponse.json(
                { error: 'Invalid plan selected' },
                { status: 400 }
            )
        }

        // Get plan price
        const amount = PLAN_PRICING[plan as keyof typeof PLAN_PRICING]
        if (!amount) {
            return NextResponse.json(
                { error: 'Invalid plan pricing' },
                { status: 400 }
            )
        }

        // Use authenticated user's ID — not from request body
        const userId = user.id
        const email = user.email || ''
        const name = user.user_metadata?.full_name || user.user_metadata?.name || 'Customer'

        // Generate unique order ID
        const orderId = generateOrderId(userId, plan)

        // Create Midtrans transaction
        const transaction = await createTransaction({
            orderId,
            amount,
            customerName: name,
            customerEmail: email,
            plan,
            itemName: `AIFindr ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - 1 Month`
        })

        // Create pending payment record using admin client (bypasses RLS)
        const supabase = createAdminClient()
        const { error: paymentError } = await supabase
            .from('payments')
            .insert({
                user_id: userId,
                tool_id: toolId || null,
                order_id: orderId,
                amount,
                currency: 'IDR',
                status: 'pending',
                plan,
                midtrans_response: { token: transaction.token }
            })

        if (paymentError) {
            console.error('Error creating payment record:', paymentError)
            // Continue anyway - webhook will handle payment record
        }

        return NextResponse.json({
            token: transaction.token,
            redirectUrl: transaction.redirectUrl,
            orderId
        })
    } catch (error: any) {
        console.error('Payment creation error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create payment' },
            { status: 500 }
        )
    }
}
