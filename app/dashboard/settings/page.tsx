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

import { userService } from "@/lib/services/userService"
import { toast } from "sonner"

export default function DashboardSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState<any>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await userService.getCurrentProfile()
                setProfile(data)
            } catch (error) {
                console.error("Error fetching profile:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

    const handleSaveProfile = async () => {
        if (!profile) return
        setSaving(true)
        try {
            await userService.updateProfile({
                name: profile.name,
                company: profile.company,
                bio: profile.bio
            })
            toast.success("Profile updated successfully")
        } catch (error) {
            console.error("Error saving profile:", error)
            toast.error("Failed to save profile")
        } finally {
            setSaving(false)
        }
    }

    const handleNotificationChange = async (key: string, value: boolean) => {
        if (!profile) return
        const newPrefs = {
            ...(profile.notification_preferences || { email: true, reviews: true, reports: true, marketing: false }),
            [key]: value
        }

        try {
            const updated = await userService.updateProfile({
                notification_preferences: newPrefs
            })
            setProfile(updated)
            toast.success("Notification preferences updated")
        } catch (error) {
            console.error("Error updating notifications:", error)
            toast.error("Failed to update preferences")
        }
    }

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
                                    <Input
                                        id="name"
                                        placeholder="Your name"
                                        value={profile?.name || ''}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={profile?.email || ''} disabled />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Company / Organization</Label>
                                <Input
                                    id="company"
                                    placeholder="Company name"
                                    value={profile?.company || ''}
                                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Input
                                    id="bio"
                                    placeholder="Brief description about you"
                                    value={profile?.bio || ''}
                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                />
                            </div>
                            <Button onClick={handleSaveProfile} disabled={saving}>
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
                                { id: 'email', title: 'Email Notifications', description: 'Receive email updates about your tools' },
                                { id: 'reviews', title: 'New Reviews', description: 'Get notified when someone reviews your tool' },
                                { id: 'reports', title: 'Weekly Reports', description: 'Receive weekly analytics summary' },
                                { id: 'marketing', title: 'Marketing Emails', description: 'Tips, offers, and product updates' },
                            ].map((item) => (
                                <div key={item.id} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{item.title}</p>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                    <Switch
                                        checked={profile?.notification_preferences?.[item.id] ?? (item.id === 'marketing' ? false : true)}
                                        onCheckedChange={(checked) => handleNotificationChange(item.id, checked)}
                                    />
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
                    // Get effective plan
                    const effectivePlan = await subscriptionService.getEffectivePlan(user.id)
                    setPlan(effectivePlan)

                    // Get latest subscription details (active, cancelled, or expired)
                    const latestSub = await subscriptionService.getLatestSubscription(user.id)
                    setSubscription(latestSub)
                }
            } catch (error) {
                console.error("Error fetching subscription:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchSubscription()
    }, [])

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return "N/A"
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

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

    // A subscription is considered "really active" if status is active and date is valid
    const isTrulyActive = subscription?.status === 'active' &&
        (!subscription.ends_at || new Date(subscription.ends_at) > new Date())

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
                                <Badge variant={isTrulyActive ? "default" : "secondary"}>
                                    {isTrulyActive ? 'Active' : (subscription?.status || 'Inactive')}
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {plan === 'free'
                                ? "You are currently on the Free plan."
                                : isTrulyActive
                                    ? `Your ${plan} plan renews on ${formatDate(subscription?.ends_at)}`
                                    : subscription?.status === 'cancelled'
                                        ? `Your ${plan} plan has been cancelled and expires on ${formatDate(subscription?.ends_at)}`
                                        : `Your ${plan} plan has expired.`
                            }
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Always show plan details if there was a subscription */}
                    {subscription && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 border rounded-lg">
                                <span className="text-sm text-muted-foreground block mb-1">Last Period</span>
                                <span className="font-medium">
                                    {formatDate(subscription.starts_at)} - {formatDate(subscription.ends_at)}
                                </span>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <span className="text-sm text-muted-foreground block mb-1">Amount</span>
                                <span className="font-medium">
                                    {(subscription.amount || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                                    <span className="text-muted-foreground text-sm font-normal"> / month</span>
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button variant="outline" className="flex-1" asChild>
                            <a href="/pricing">Change Plan</a>
                        </Button>
                        {isTrulyActive && (
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={handleCancel}
                            >
                                Cancel Subscription
                            </Button>
                        )}
                        {subscription?.status === 'cancelled' && !isTrulyActive && (
                            <Button variant="secondary" className="flex-1" disabled>
                                Cancelled
                            </Button>
                        )}
                    </div>
                </div>

                {plan === 'free' && !subscription && (
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
                )}
            </CardContent>
        </Card>
    )
}
