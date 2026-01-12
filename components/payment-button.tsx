"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

declare global {
    interface Window {
        snap: any
    }
}

interface PaymentButtonProps {
    plan: 'pro' | 'featured' | 'sponsor'
    amount: number
    children?: React.ReactNode
    className?: string
    variant?: 'default' | 'outline' | 'ghost'
    size?: 'default' | 'sm' | 'lg'
    disabled?: boolean
}

export function PaymentButton({
    plan,
    amount,
    children,
    className,
    variant = 'default',
    size = 'default',
    disabled = false
}: PaymentButtonProps) {
    const [loading, setLoading] = useState(false)
    const [snapLoaded, setSnapLoaded] = useState(false)

    // Load Midtrans Snap script
    useEffect(() => {
        if (typeof window !== 'undefined' && !window.snap) {
            const script = document.createElement('script')
            script.src = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
                ? 'https://app.midtrans.com/snap/snap.js'
                : 'https://app.sandbox.midtrans.com/snap/snap.js'
            script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '')
            script.onload = () => setSnapLoaded(true)
            document.body.appendChild(script)
        } else if (window.snap) {
            setSnapLoaded(true)
        }
    }, [])

    const handlePayment = async () => {
        if (!snapLoaded) {
            alert('Payment system is loading. Please try again.')
            return
        }

        setLoading(true)

        try {
            // Get current user
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                alert('Please login to subscribe to a plan.')
                window.location.href = '/login?redirect=/pricing'
                return
            }

            // Get user profile for name
            const { data: profile } = await supabase
                .from('users')
                .select('name, email')
                .eq('id', user.id)
                .single()

            // Create payment
            const response = await fetch('/api/payment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    plan,
                    email: user.email || profile?.email,
                    name: profile?.name || user.email?.split('@')[0]
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create payment')
            }

            const { token } = await response.json()

            // Open Snap popup
            window.snap.pay(token, {
                onSuccess: function (result: any) {
                    console.log('Payment success:', result)
                    alert('Payment Successful! Your subscription has been activated.')
                    window.location.href = '/dashboard?payment=success'
                },
                onPending: function (result: any) {
                    console.log('Payment pending:', result)
                    alert('Payment is pending. Please complete your payment.')
                    window.location.href = '/dashboard?payment=pending'
                },
                onError: function (result: any) {
                    console.log('Payment error:', result)
                    alert('Payment failed. Please try again.')
                },
                onClose: function () {
                    console.log('Payment popup closed')
                    setLoading(false)
                }
            })
        } catch (error: any) {
            console.error('Payment error:', error)
            alert(error.message || 'Failed to initiate payment')
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handlePayment}
            disabled={disabled || loading}
            className={className}
            variant={variant}
            size={size}
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                </>
            ) : (
                children || (
                    <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Subscribe
                    </>
                )
            )}
        </Button>
    )
}
