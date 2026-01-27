"use client"

import { useState, useEffect } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Settings,
    User,
    Bell,
    Shield,
    Loader2,
    Save,
    CreditCard
} from "lucide-react"
import { subscriptionService } from "@/lib/services/subscriptionService"
import { createBrowserClient } from "@supabase/ssr"
import { SubscriptionWithUser, SubscriptionPlan } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

export default function DashboardSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setLoading(false)
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Billing
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" placeholder="Your name" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="your@email.com" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Company / Organization</Label>
                                <Input id="company" placeholder="Company name" />
                            </div>
                            <Button disabled={saving}>
                                {saving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                Save Changes
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>Choose what notifications you receive</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[
                                { title: 'Email Notifications', description: 'Receive email updates about your tools' },
                                { title: 'New Reviews', description: 'Get notified when someone reviews your tool' },
                                { title: 'Weekly Reports', description: 'Receive weekly analytics summary' },
                                { title: 'Marketing Emails', description: 'Tips, offers, and product updates' },
                            ].map((item) => (
                                <div key={item.title} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{item.title}</p>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                    <Switch />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>Manage your account security</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current_password">Current Password</Label>
                                <Input id="current_password" type="password" />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="new_password">New Password</Label>
                                    <Input id="new_password" type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm_password">Confirm Password</Label>
                                    <Input id="confirm_password" type="password" />
                                </div>
                            </div>
                            <Button>Update Password</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Billing Tab */}
                <TabsContent value="billing">
                    <BillingTabContent />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function BillingTabContent() {
    const [loading, setLoading] = useState(true)
    const [subscription, setSubscription] = useState<SubscriptionWithUser | null>(null)
    const [plan, setPlan] = useState<SubscriptionPlan>('free')

    useEffect(() => {
        const fetchSubscription = async () => {
            try {
                const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                )
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    // Get effective plan first (this is the source of truth for status)
                    const effectivePlan = await subscriptionService.getEffectivePlan(user.id)
                    setPlan(effectivePlan)

                    // Get subscription details (for start/end dates etc)
                    const activeSub = await subscriptionService.getActiveSubscription(user.id)
                    if (activeSub) {
                        setSubscription(activeSub)
                    }
                }
            } catch (error) {
                console.error("Error fetching subscription:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchSubscription()
    }, [])


    const handleCancel = async () => {
        if (!subscription) return
        if (!confirm("Are you sure you want to cancel your subscription? You will lose access to premium features at the end of the current billing period.")) return

        try {
            setLoading(true)
            await subscriptionService.cancelSubscription(subscription.id)
            // Refresh
            window.location.reload()
        } catch (error) {
            console.error("Error cancelling subscription:", error)
            alert("Failed to cancel subscription. Please contact support.")
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Subscription & Billing</CardTitle>
                <CardDescription>Manage your subscription plan and billing details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-start justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg capitalize">{plan} Plan</h3>
                            {plan !== 'free' && (
                                <Badge variant={subscription?.status === 'active' ? "default" : "secondary"}>
                                    {subscription?.status || 'Active'}
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {plan === 'free'
                                ? "You are currently on the Free plan."
                                : `Your ${plan} plan ${subscription?.status === 'active' ? 'renews' : 'expires'} on ${new Date(subscription?.ends_at || '').toLocaleDateString()}`
                            }
                        </p>
                    </div>
                </div>

                {plan === 'free' ? (
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-3">
                        <h4 className="font-medium flex items-center gap-2 text-primary">
                            <CreditCard className="w-4 h-4" />
                            Upgrade to Pro
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            Unlock analytics, priority support, and more visibility for your tools.
                        </p>
                        <Button className="w-full sm:w-auto" asChild>
                            <a href="/pricing">View Plans</a>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 border rounded-lg">
                                <span className="text-sm text-muted-foreground block mb-1">Current Period</span>
                                <span className="font-medium">
                                    {new Date(subscription?.starts_at || '').toLocaleDateString()} - {new Date(subscription?.ends_at || '').toLocaleDateString()}
                                </span>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <span className="text-sm text-muted-foreground block mb-1">Amount</span>
                                <span className="font-medium">
                                    {(subscription?.amount || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                                    <span className="text-muted-foreground text-sm font-normal"> / month</span>
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button variant="outline" className="flex-1" asChild>
                                <a href="/pricing">Change Plan</a>
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={handleCancel}
                                disabled={subscription?.status !== 'active'}
                            >
                                {subscription?.status === 'active' ? 'Cancel Subscription' : 'Cancelled'}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
