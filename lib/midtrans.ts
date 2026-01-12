import midtransClient from 'midtrans-client'

// Midtrans Snap client for creating transactions
const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY!,
    clientKey: process.env.MIDTRANS_CLIENT_KEY!
})

// Midtrans Core API client for checking transaction status
const coreApi = new midtransClient.CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY!,
    clientKey: process.env.MIDTRANS_CLIENT_KEY!
})

export interface CreateTransactionParams {
    orderId: string
    amount: number
    customerName: string
    customerEmail: string
    plan: string
    itemName: string
}

/**
 * Create a Midtrans Snap transaction
 */
export async function createTransaction(params: CreateTransactionParams) {
    const { orderId, amount, customerName, customerEmail, plan, itemName } = params

    const parameter = {
        transaction_details: {
            order_id: orderId,
            gross_amount: amount
        },
        item_details: [{
            id: plan,
            price: amount,
            quantity: 1,
            name: itemName
        }],
        customer_details: {
            first_name: customerName,
            email: customerEmail
        },
        callbacks: {
            finish: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=success`,
            error: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?payment=error`,
            pending: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=pending`
        }
    }

    const transaction = await snap.createTransaction(parameter)
    return {
        token: transaction.token,
        redirectUrl: transaction.redirect_url
    }
}

/**
 * Get transaction status from Midtrans
 */
export async function getTransactionStatus(orderId: string) {
    return await coreApi.transaction.status(orderId)
}

/**
 * Verify webhook notification signature
 */
export function verifySignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    signatureKey: string
): boolean {
    const crypto = require('crypto')
    const serverKey = process.env.MIDTRANS_SERVER_KEY!

    const hash = crypto
        .createHash('sha512')
        .update(orderId + statusCode + grossAmount + serverKey)
        .digest('hex')

    return hash === signatureKey
}

/**
 * Generate unique order ID
 */
export function generateOrderId(userId: string, plan: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `SUB-${plan.toUpperCase()}-${timestamp}-${random}`
}

export { snap, coreApi }
