"use client"

import { useState, useEffect } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DollarSign,
    TrendingUp,
    Users,
    CreditCard,
    Loader2,
    Crown,
    Sparkles,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react"
import { motion } from "framer-motion"
import { subscriptionService, PLAN_PRICING } from "@/lib/services/subscriptionService"
import { SubscriptionWithUser } from "@/lib/types"

export default function AdminSubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<SubscriptionWithUser[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [stats, setStats] = useState({
        totalActive: 0,
        byPlan: { pro: 0, featured: 0, sponsor: 0 },
        mrr: 0,
        arr: 0
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [subsData, revenueStats] = await Promise.all([
                    subscriptionService.getAllSubscriptions({
                        status: filter !== 'all' ? filter : undefined
                    }),
                    subscriptionService.getRevenueStats()
                ])
                setSubscriptions(subsData.subscriptions)
                setStats(revenueStats)
            } catch (error) {
                console.error('Error fetching subscriptions:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [filter])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const planColors = {
        pro: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
        featured: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
        sponsor: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
    }

    const statusColors = {
        active: 'bg-green-500/10 text-green-600 border-green-500/30',
        pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
        cancelled: 'bg-red-500/10 text-red-600 border-red-500/30',
        expired: 'bg-gray-500/10 text-gray-600 border-gray-500/30'
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
                    <p className="text-muted-foreground">Manage subscriber plans and view revenue</p>
                </div>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Live Data
                </Badge>
            </div>

            {/* Revenue Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        title: 'Monthly Revenue (MRR)',
                        value: formatCurrency(stats.mrr),
                        icon: DollarSign,
                        gradient: 'from-green-500 to-emerald-500',
                        bgGradient: 'from-green-500/10 to-emerald-500/10'
                    },
                    {
                        title: 'Annual Revenue (ARR)',
                        value: formatCurrency(stats.arr),
                        icon: TrendingUp,
                        gradient: 'from-blue-500 to-cyan-500',
                        bgGradient: 'from-blue-500/10 to-cyan-500/10'
                    },
                    {
                        title: 'Active Subscribers',
                        value: stats.totalActive,
                        icon: Users,
                        gradient: 'from-purple-500 to-pink-500',
                        bgGradient: 'from-purple-500/10 to-pink-500/10'
                    },
                    {
                        title: 'Avg Revenue/User',
                        value: stats.totalActive > 0 ? formatCurrency(stats.mrr / stats.totalActive) : formatCurrency(0),
                        icon: CreditCard,
                        gradient: 'from-orange-500 to-red-500',
                        bgGradient: 'from-orange-500/10 to-red-500/10'
                    },
                ].map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className={`bg-gradient-to-br ${stat.bgGradient} border-2`}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                                    <stat.icon className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Plan Breakdown */}
            <div className="grid gap-4 md:grid-cols-3">
                {[
                    { plan: 'Pro', count: stats.byPlan.pro, price: PLAN_PRICING.pro, color: 'blue' },
                    { plan: 'Featured', count: stats.byPlan.featured, price: PLAN_PRICING.featured, color: 'purple' },
                    { plan: 'Sponsor', count: stats.byPlan.sponsor, price: PLAN_PRICING.sponsor, color: 'yellow' },
                ].map((item) => (
                    <Card key={item.plan} className="border-2">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Crown className={`w-5 h-5 text-${item.color}-500`} />
                                    <span className="font-semibold">{item.plan}</span>
                                </div>
                                <Badge variant="outline">{formatCurrency(item.price)}/mo</Badge>
                            </div>
                            <div className="text-3xl font-bold">{item.count}</div>
                            <p className="text-sm text-muted-foreground">
                                Active subscribers • {formatCurrency(item.count * item.price)}/mo
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Subscriptions Table */}
            <Card className="border-2">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>All Subscriptions</CardTitle>
                        <CardDescription>View and manage subscriber details</CardDescription>
                    </div>
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    {subscriptions.length === 0 ? (
                        <div className="text-center py-12">
                            <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="font-semibold mb-2">No subscriptions yet</h3>
                            <p className="text-sm text-muted-foreground">
                                Subscriptions will appear here once users upgrade their plans.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Started</TableHead>
                                    <TableHead>Expires</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subscriptions.map((sub) => (
                                    <TableRow key={sub.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{sub.users?.name || 'Unknown'}</p>
                                                <p className="text-sm text-muted-foreground">{sub.users?.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={planColors[sub.plan as keyof typeof planColors]}>
                                                {sub.plan}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[sub.status as keyof typeof statusColors]}>
                                                {sub.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatCurrency(sub.amount || 0)}</TableCell>
                                        <TableCell>
                                            {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString() : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString() : 'Never'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
