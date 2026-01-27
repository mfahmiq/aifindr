import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createTransaction, generateOrderId } from '@/lib/midtrans'
import { PLAN_PRICING } from '@/lib/services/subscriptionService'

// Use service role client since this is a server-side API
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, plan, email, name, toolId } = body

        // Validate plan
        if (!plan || !['pro', 'featured', 'sponsor'].includes(plan)) {
            return NextResponse.json(
                { error: 'Invalid plan selected' },
                { status: 400 }
            )
        }

        // Validate user
        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
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

        // Generate unique order ID
        const orderId = generateOrderId(userId, plan)

        // Create Midtrans transaction
        const transaction = await createTransaction({
            orderId,
            amount,
            customerName: name || 'Customer',
            customerEmail: email || '',
            plan,
            itemName: `AIFindr ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - 1 Month`
        })

        // Create pending payment record
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
