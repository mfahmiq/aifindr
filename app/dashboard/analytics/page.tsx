"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Package,
    Plus,
    Eye,
    ArrowUpRight,
    Settings,
    Loader2,
    BarChart3,
    TrendingUp,
    MousePointer,
    Sparkles
} from "lucide-react"
import { motion } from "framer-motion"

import { createClient } from "@/lib/supabase/client"
// Dynamically import subscriptionService or just import types if possible, but here we need logic.
// Accessing subscriptionService directly.
import { subscriptionService } from "@/lib/services/subscriptionService"

import { analyticsService } from "@/lib/services/analyticsService"

export default function DashboardAnalyticsPage() {
    const [loading, setLoading] = useState(true)
    const [plan, setPlan] = useState('free')
    const [stats, setStats] = useState<any>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const effectivePlan = await subscriptionService.getEffectivePlan(user.id)
                    setPlan(effectivePlan)

                    const analyticsData = await analyticsService.getUserStats()
                    if (analyticsData) {
                        setStats(analyticsData.stats)
                    }
                }
            } catch (e) {
                console.error("Error fetching analytics", e)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    const isPremium = ['pro', 'featured', 'sponsor'].includes(plan.toLowerCase())

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground">View detailed statistics for all your tools</p>
            </div>

            {/* Analytics Coming Soon */}
            <Card className="border-2">
                <CardContent className="py-20 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6">
                        <BarChart3 className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                        {isPremium ? 'Analytics Dashboard (Coming Soon)' : 'Analytics Dashboard'}
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Detailed analytics with views, clicks, referrers, and conversion tracking will be available here.
                    </p>

                    {/* Real Stats Preview */}
                    <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto mb-6">
                        {[
                            { title: 'Total Views', value: stats?.totalViews || '0', icon: Eye, trend: '+0%' },
                            { title: 'Total Favorites', value: stats?.totalFavorites || '0', icon: MousePointer, trend: '+0%' },
                            { title: 'Listed Tools', value: stats?.totalTools || '0', icon: Sparkles, trend: '+0%' },
                        ].map((stat) => (
                            <div key={stat.title} className="p-4 rounded-xl bg-muted/50">
                                <stat.icon className="w-5 h-5 text-muted-foreground mb-2" />
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <div className="text-sm text-muted-foreground">{stat.title}</div>
                            </div>
                        ))}
                    </div>

                    {!isPremium && (
                        <>
                            <p className="text-sm text-muted-foreground mb-4">
                                Upgrade to Pro to unlock detailed analytics
                            </p>
                            <Link href="/pricing">
                                <Button>
                                    Upgrade to Pro
                                    <ArrowUpRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </>
                    )}
                    {isPremium && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium">
                            <Sparkles className="w-4 h-4" />
                            <span>Included in your plan</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
