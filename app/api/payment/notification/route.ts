import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifySignature, getTransactionStatus } from '@/lib/midtrans'
import { subscriptionService } from '@/lib/services/subscriptionService'

export async function POST(request: NextRequest) {
    const supabase = createAdminClient()
    try {
        const body = await request.json()

        const {
            order_id,
            transaction_status,
            fraud_status,
            status_code,
            gross_amount,
            signature_key,
            payment_type,
            transaction_id
        } = body

        console.log('Midtrans webhook received:', { order_id, transaction_status, fraud_status })

        // Verify signature (optional but recommended for production)
        if (process.env.MIDTRANS_IS_PRODUCTION === 'true') {
            const isValid = verifySignature(order_id, status_code, gross_amount, signature_key)
            if (!isValid) {
                console.error('Invalid signature for order:', order_id)
                return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
            }
        }

        // Determine payment status
        let paymentStatus: 'pending' | 'success' | 'failed' | 'expired' | 'cancelled' = 'pending'

        if (transaction_status === 'capture') {
            paymentStatus = fraud_status === 'accept' ? 'success' : 'pending'
        } else if (transaction_status === 'settlement') {
            paymentStatus = 'success'
        } else if (['cancel', 'deny'].includes(transaction_status)) {
            paymentStatus = 'cancelled'
        } else if (transaction_status === 'expire') {
            paymentStatus = 'expired'
        } else if (transaction_status === 'failure') {
            paymentStatus = 'failed'
        }

        // Update payment record
        const { data: payment, error: updateError } = await supabase
            .from('payments')
            .update({
                status: paymentStatus,
                payment_type,
                midtrans_transaction_id: transaction_id,
                midtrans_response: body,
                updated_at: new Date().toISOString()
            })
            .eq('order_id', order_id)
            .select('user_id, plan, tool_id')
            .single()

        if (updateError) {
            console.error('Error updating payment:', updateError)
        }

        // If payment successful, activate subscription
        if (paymentStatus === 'success' && payment) {
            const startsAt = new Date()
            const endsAt = new Date()

            // Adjust duration based on plan
            if (payment.plan === 'sponsor') {
                endsAt.setDate(endsAt.getDate() + 7) // 1 week
            } else {
                endsAt.setMonth(endsAt.getMonth() + 1) // 1 month
            }

            // Update Tool status if tool_id exists
            if (payment.tool_id) {
                await supabase
                    .from('tools')
                    .update({
                        plan: payment.plan.charAt(0).toUpperCase() + payment.plan.slice(1), // Capitalize
                        subscription_starts_at: startsAt.toISOString(),
                        subscription_ends_at: endsAt.toISOString(),
                        status: 'pending', // Keep pending for review, or 'published' if trusted
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', payment.tool_id)
            }

            // Check for existing active subscription
            const { data: existingSub } = await supabase
                .from('subscriptions')
                .select('id')
                .eq('user_id', payment.user_id)
                // If we want per-tool subscriptions, we should also check tool_id
                .eq('tool_id', payment.tool_id || null)
                .eq('status', 'active')
                .single()

            if (existingSub) {
                // Update existing subscription
                await supabase
                    .from('subscriptions')
                    .update({
                        plan: payment.plan,
                        amount: parseFloat(gross_amount),
                        status: 'active',
                        starts_at: startsAt.toISOString(),
                        ends_at: endsAt.toISOString(),
                        payment_id: order_id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingSub.id)
            } else {
                // Create new subscription
                await supabase
                    .from('subscriptions')
                    .insert({
                        user_id: payment.user_id,
                        tool_id: payment.tool_id || null,
                        plan: payment.plan,
                        amount: parseFloat(gross_amount),
                        currency: 'IDR',
                        status: 'active',
                        starts_at: startsAt.toISOString(),
                        ends_at: endsAt.toISOString(),
                        payment_id: order_id,
                        auto_renew: false
                    })
            }

            console.log(`Subscription activated for user ${payment.user_id}, plan: ${payment.plan}`)

            // Notify admin if new Sponsor (for manual benefits like Social Media mention)
            if (payment.plan === 'sponsor') {
                await subscriptionService.sendAdminNotification('new_sponsor', {
                    userId: payment.user_id,
                    plan: payment.plan,
                    amount: gross_amount,
                    timestamp: new Date().toISOString()
                })
            }
        }

        return NextResponse.json({ status: 'ok' })
    } catch (error: any) {
        console.error('Webhook processing error:', error)
        return NextResponse.json(
            { error: error.message || 'Webhook processing failed' },
            { status: 500 }
        )
    }
}

// Allow GET for webhook verification
export async function GET() {
    return NextResponse.json({ status: 'ok', message: 'Midtrans webhook endpoint' })
}
