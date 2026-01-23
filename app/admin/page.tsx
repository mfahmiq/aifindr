"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Activity,
    CreditCard,
    DollarSign,
    Users,
    TrendingUp,
    Package,
    Eye,
    Heart,
    Star,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    Zap,
    Loader2
} from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { toolsService } from "@/lib/services/toolsService"
import { ToolWithRelations } from "@/lib/types"

export default function AdminDashboardPage() {
    const [tools, setTools] = useState<ToolWithRelations[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalTools: 0,
        verifiedTools: 0,
        proTools: 0,
        sponsorTools: 0,
        totalViews: 0,
        totalFavorites: 0
    })

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 1. Fetch real stats from API (sourced from toolsService.getAdminStats)
                const res = await fetch('/api/admin/stats')
                const realStats = await res.json()

                // 2. Fetch aggregate views/favorites (still need getTools for this or a new API)
                // Since getAdminStats doesn't sum views/favorites yet, we might still need a separate call or update API.
                // For now, let's keep the getTools for views/favorites sum but use realStats for counts.
                const { tools: allTools } = await toolsService.getTools({ limit: 1000 }) // Increase limit for better aggregate accuracy or move to aggregation API

                const views = allTools.reduce((acc: number, t: ToolWithRelations) => acc + (t.view_count || 0), 0)
                const favorites = allTools.reduce((acc: number, t: ToolWithRelations) => acc + (t.favorite_count || 0), 0)

                setStats({
                    totalTools: realStats.total,
                    verifiedTools: realStats.published, // 'published' key from API
                    proTools: realStats.pro,
                    sponsorTools: realStats.sponsor + realStats.featured, // Group featured + sponsor? Or just use specific keys if UI separates them
                    totalViews: views,
                    totalFavorites: favorites
                })
            } catch (error) {
                console.error('Error fetching stats:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    // Mock revenue calculation
    const proRevenue = stats.proTools * 9
    const sponsorRevenue = stats.sponsorTools * 49 * 4
    const totalRevenue = proRevenue + sponsorRevenue

    const statCards = [
        {
            title: 'Total Tools',
            value: stats.totalTools,
            change: '+20.1%',
            trend: 'up',
            icon: Package,
            gradient: 'from-blue-500 to-cyan-500',
            bgGradient: 'from-blue-500/10 to-cyan-500/10'
        },
        {
            title: 'Verified Tools',
            value: stats.verifiedTools,
            change: '+180%',
            trend: 'up',
            icon: Star,
            gradient: 'from-yellow-500 to-orange-500',
            bgGradient: 'from-yellow-500/10 to-orange-500/10'
        },
        {
            title: 'Pro Listings',
            value: stats.proTools,
            change: '+19%',
            trend: 'up',
            icon: CreditCard,
            gradient: 'from-purple-500 to-pink-500',
            bgGradient: 'from-purple-500/10 to-pink-500/10'
        },
        {
            title: 'Featured Tools',
            value: stats.sponsorTools,
            change: `$${sponsorRevenue}/mo`,
            trend: 'up',
            icon: Activity,
            gradient: 'from-green-500 to-emerald-500',
            bgGradient: 'from-green-500/10 to-emerald-500/10'
        },
    ]

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
                </div>
                <Badge className="bg-gradient-to-r from-primary to-purple-500 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Live Data
                </Badge>
            </div>

            {/* Revenue Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border-green-500/30 overflow-hidden relative">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98110_1px,transparent_1px),linear-gradient(to_bottom,#10b98110_1px,transparent_1px)] bg-[size:24px_24px]" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
                        <div>
                            <CardDescription className="text-green-600 dark:text-green-400 font-medium">
                                Total Revenue (This Month)
                            </CardDescription>
                            <div className="text-5xl font-bold text-green-700 dark:text-green-400 mt-2">
                                ${totalRevenue.toLocaleString()}
                            </div>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                            <DollarSign className="h-8 w-8 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="flex flex-wrap gap-4 mt-2 text-sm">
                            <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg px-3 py-1.5">
                                <span className="text-muted-foreground">Pro Listings:</span>
                                <span className="font-semibold ml-1">${proRevenue}</span>
                            </div>
                            <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg px-3 py-1.5">
                                <span className="text-muted-foreground">Sponsorships:</span>
                                <span className="font-semibold ml-1">${sponsorRevenue}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 text-sm text-green-600">
                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                <TrendingUp className="h-3 w-3" />
                            </div>
                            <span className="font-medium">+32% from last month</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className={`bg-gradient-to-br ${stat.bgGradient} border-2 hover:shadow-lg transition-all`}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                                    <stat.icon className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    {stat.trend === 'up' ? (
                                        <ArrowUpRight className="w-3 h-3 text-green-500" />
                                    ) : (
                                        <ArrowDownRight className="w-3 h-3 text-red-500" />
                                    )}
                                    <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                                        {stat.change}
                                    </span>
                                    <span className="text-muted-foreground ml-1">from last month</span>
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="w-5 h-5 text-blue-500" />
                                Total Views
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{stats.totalViews.toLocaleString()}</div>
                            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: '75%' }} />
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">75% of monthly goal</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-red-500" />
                                Total Favorites
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{stats.totalFavorites.toLocaleString()}</div>
                            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full" style={{ width: '60%' }} />
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">60% of monthly goal</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: 'Add Tool', href: '/admin/tools', icon: Package, color: 'from-blue-500 to-cyan-500' },
                                { label: 'New Deal', href: '/admin/deals', icon: DollarSign, color: 'from-green-500 to-emerald-500' },
                                { label: 'Write Post', href: '/admin/blog', icon: Star, color: 'from-purple-500 to-pink-500' },
                                { label: 'View Analytics', href: '/admin/analytics', icon: TrendingUp, color: 'from-orange-500 to-red-500' },
                            ].map(action => (
                                <a
                                    key={action.label}
                                    href={action.href}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                                >
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                                        <action.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-sm font-medium">{action.label}</span>
                                </a>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
