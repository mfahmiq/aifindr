"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { analyticsService, DashboardStats } from "@/lib/services/analyticsService"
import { TrendingUp, Eye, Heart, Package, Gift, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts"

const COLORS = ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#6366f1']

export default function AdminAnalyticsPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            setLoading(true)
            const data = await analyticsService.getDashboardStats()
            setStats(data)
        } catch (error) {
            console.error('Error fetching analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Failed to load analytics data</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                    <p className="text-muted-foreground">Platform performance and insights</p>
                </div>
                <Badge variant="outline" className="w-fit">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Live Data
                </Badge>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/20">
                    <CardContent className="p-4">
                        <Eye className="w-6 h-6 text-purple-500 mb-2" />
                        <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Total Views</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-2 border-red-500/20">
                    <CardContent className="p-4">
                        <Heart className="w-6 h-6 text-red-500 mb-2" />
                        <div className="text-2xl font-bold">{stats.totalFavorites.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Total Favorites</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20">
                    <CardContent className="p-4">
                        <Package className="w-6 h-6 text-blue-500 mb-2" />
                        <div className="text-2xl font-bold">{stats.totalTools}</div>
                        <div className="text-sm text-muted-foreground">Approved Tools</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20">
                    <CardContent className="p-4">
                        <Gift className="w-6 h-6 text-green-500 mb-2" />
                        <div className="text-2xl font-bold">{stats.activeDeals}</div>
                        <div className="text-sm text-muted-foreground">Active Deals</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Weekly Views Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Weekly Traffic</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.recentViews}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="date" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="views"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        dot={{ fill: '#8b5cf6' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Category Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.categoryDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="name"
                                        label={({ name, percent }: { name?: string, percent?: number }) => `${name ?? 'Unknown'} ${((percent || 0) * 100).toFixed(0)}%`}
                                    >
                                        {stats.categoryDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Tools */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Performing Tools</CardTitle>
                </CardHeader>
                <CardContent>
                    {stats.topTools.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No tools data available yet</p>
                    ) : (
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.topTools} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis type="number" className="text-xs" />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={150}
                                        className="text-xs"
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                        formatter={(value) => [`${value} views`, 'Views']}
                                    />
                                    <Bar
                                        dataKey="views"
                                        fill="#8b5cf6"
                                        radius={[0, 4, 4, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Category Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats.categoryDistribution.map((cat, index) => (
                            <div key={cat.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="font-medium">{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant="secondary">{cat.count} tools</Badge>
                                    <span className="text-muted-foreground text-sm">
                                        {stats.totalTools > 0
                                            ? ((cat.count / stats.totalTools) * 100).toFixed(1)
                                            : 0}%
                                    </span>
                                </div>
                            </div>
                        ))}
                        {stats.categoryDistribution.length === 0 && (
                            <p className="text-center text-muted-foreground py-4">No category data available</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
