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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Eye,
    Heart,
    MousePointer,
    Star,
    TrendingUp,
    Package,
    Crown,
    Sparkles,
    ArrowUpRight,
    Plus,
    Loader2,
    ExternalLink,
    BarChart3,
    MessageSquare,
    Shield,
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    AlertCircle,
    CheckCircle,
    XOctagon,
    Hourglass
} from "lucide-react"
import { motion } from "framer-motion"
import { toolClaimsService } from "@/lib/services/toolClaimsService"
import { subscriptionService, PLAN_PRICING, PLAN_FEATURES } from "@/lib/services/subscriptionService"
import { ToolWithRelations, Subscription, SubscriptionPlan } from "@/lib/types"
import { createBrowserClient } from "@supabase/ssr"
import { User } from "@supabase/supabase-js"

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null)
    const [tools, setTools] = useState<ToolWithRelations[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalTools: 0,
        totalViews: 0,
        totalFavorites: 0,
        totalClicks: 0,
        avgRating: 0
    })
    const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>('free')
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [features, setFeatures] = useState<typeof PLAN_FEATURES[SubscriptionPlan]>(PLAN_FEATURES.free)
    const [submissions, setSubmissions] = useState<any[]>([])

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                window.location.href = '/login'
                return
            }

            setUser(user)

            try {
                // Get user's active subscription
                const activeSub = await subscriptionService.getActiveSubscription(user.id)
                setSubscription(activeSub)

                const plan = activeSub?.plan || 'free'
                setCurrentPlan(plan)
                setFeatures(PLAN_FEATURES[plan])

                // Get owned tools
                const ownedTools = await toolClaimsService.getOwnedTools(user.id)
                setTools(ownedTools || [])

                // Get submitted tools (tools this user has submitted)
                const { data: submittedTools } = await supabase
                    .from('tools')
                    .select('id, name, slug, logo_url, status, plan, rejection_reason, created_at, updated_at')
                    .eq('submitted_by', user.id)
                    .order('created_at', { ascending: false })

                setSubmissions(submittedTools || [])

                // Calculate real stats from tools
                const totalViews = ownedTools?.reduce((sum, tool) => sum + (tool.view_count || 0), 0) || 0
                const totalFavorites = ownedTools?.reduce((sum, tool) => sum + (tool.favorite_count || 0), 0) || 0
                const totalClicks = ownedTools?.reduce((sum, tool) => sum + ((tool as any).click_count || 0), 0) || 0
                const avgRating = ownedTools?.length
                    ? ownedTools.reduce((sum, tool) => sum + (tool.rating || 0), 0) / ownedTools.length
                    : 0

                setStats({
                    totalTools: ownedTools?.length || 0,
                    totalViews,
                    totalFavorites,
                    totalClicks,
                    avgRating: Math.round(avgRating * 10) / 10
                })
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const planColors = {
        free: 'from-gray-500 to-gray-600',
        pro: 'from-blue-500 to-cyan-500',
        featured: 'from-purple-500 to-pink-500',
        sponsor: 'from-yellow-500 to-orange-500'
    }

    const planLabels = {
        free: 'Free',
        pro: 'Pro',
        featured: 'Featured',
        sponsor: 'Sponsor'
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never'
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const daysUntilExpiry = () => {
        if (!subscription?.ends_at) return null
        const end = new Date(subscription.ends_at)
        const now = new Date()
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return diff > 0 ? diff : 0
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
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, {user?.user_metadata?.name || user?.email?.split('@')[0]}!</p>
                </div>
                <Badge className={`bg-gradient-to-r ${planColors[currentPlan]} text-white border-0 px-4 py-1.5`}>
                    <Crown className="w-3 h-3 mr-1" />
                    {planLabels[currentPlan]} Plan
                </Badge>
            </div>

            {/* Subscription Card for Paid Users */}
            {currentPlan !== 'free' && subscription && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className={`bg-gradient-to-r ${planColors[currentPlan]}/10 border-2`}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${planColors[currentPlan]} flex items-center justify-center`}>
                                        <Crown className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">{planLabels[currentPlan]} Subscription</h3>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                Since {formatDate(subscription.starts_at)}
                                            </span>
                                            {subscription.ends_at && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    Expires in {daysUntilExpiry()} days
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={subscription.auto_renew ? "default" : "secondary"}>
                                        {subscription.auto_renew ? "Auto-renew ON" : "Auto-renew OFF"}
                                    </Badge>
                                    <Link href="/pricing">
                                        <Button variant="outline" size="sm">
                                            Manage
                                            <ArrowUpRight className="w-3 h-3 ml-1" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {[
                    { title: 'Total Tools', value: stats.totalTools, icon: Package, gradient: 'from-blue-500 to-cyan-500' },
                    { title: 'Total Views', value: stats.totalViews, icon: Eye, gradient: 'from-green-500 to-emerald-500', locked: !features.viewStats },
                    { title: 'Total Favorites', value: stats.totalFavorites, icon: Heart, gradient: 'from-red-500 to-pink-500', locked: !features.viewStats },
                    { title: 'Total Clicks', value: stats.totalClicks, icon: MousePointer, gradient: 'from-purple-500 to-violet-500', locked: !features.viewStats },
                    { title: 'Avg Rating', value: stats.avgRating, icon: Star, gradient: 'from-yellow-500 to-orange-500', suffix: '/5' },
                ].map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="border-2 hover:shadow-lg transition-all relative">
                            {stat.locked && (
                                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                                    <div className="text-center">
                                        <Shield className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                                        <span className="text-xs text-muted-foreground">Pro+</span>
                                    </div>
                                </div>
                            )}
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                                    <stat.icon className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {stat.value.toLocaleString()}{stat.suffix || ''}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Plan Features Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Your Plan Features
                        </CardTitle>
                        <CardDescription>
                            Features available with your {planLabels[currentPlan]} plan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { name: 'Basic Listing', key: 'basicListing', icon: Package },
                                { name: 'View Stats', key: 'viewStats', icon: BarChart3 },
                                { name: 'Reply Reviews', key: 'replyReviews', icon: MessageSquare },
                                { name: 'Priority Listing', key: 'priorityListing', icon: TrendingUp },
                                { name: 'Featured Badge', key: 'featuredBadge', icon: Star },
                                { name: 'Homepage Placement', key: 'homepagePlacement', icon: Crown },
                                { name: 'No Competitor Ads', key: 'noCompetitorAds', icon: Shield },
                                { name: 'Banner Ads', key: 'bannerAds', icon: Sparkles },
                            ].map((feature) => {
                                const hasFeature = features[feature.key as keyof typeof features]
                                return (
                                    <div
                                        key={feature.key}
                                        className={`flex items-center gap-2 p-3 rounded-lg ${hasFeature
                                            ? 'bg-green-50 dark:bg-green-950/30 text-green-600'
                                            : 'bg-muted/50 text-muted-foreground'
                                            }`}
                                    >
                                        {hasFeature ? (
                                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="w-4 h-4 flex-shrink-0" />
                                        )}
                                        <span className="text-sm font-medium">{feature.name}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* My Tools Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="border-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                My Tools
                            </CardTitle>
                            <CardDescription>Tools you own or have claimed</CardDescription>
                        </div>
                        <Link href="/submit">
                            <Button className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90">
                                <Plus className="w-4 h-4 mr-2" />
                                Submit New Tool
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {tools.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                                    <Package className="w-8 h-8 text-purple-500" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">No tools yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Submit your AI tool to get started or claim an existing tool.
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <Link href="/submit">
                                        <Button>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Submit Tool
                                        </Button>
                                    </Link>
                                    <Link href="/">
                                        <Button variant="outline">
                                            Browse Tools
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {tools.map(tool => (
                                    <div
                                        key={tool.id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                                                {tool.logo_url ? (
                                                    <img src={tool.logo_url} alt={tool.name} referrerPolicy="no-referrer" className="w-8 h-8 rounded" />
                                                ) : (
                                                    <Package className="w-6 h-6 text-primary" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold">{tool.name}</h4>
                                                    {currentPlan !== 'free' && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            <Shield className="w-3 h-3 mr-1" />
                                                            Verified Owner
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {features.viewStats ? (
                                                        <>{tool.view_count || 0} views • {tool.favorite_count || 0} favorites</>
                                                    ) : (
                                                        <span className="flex items-center gap-1">
                                                            <Shield className="w-3 h-3" />
                                                            Upgrade to Pro to see stats
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Link href={`/tool/${tool.slug}`}>
                                                <Button variant="ghost" size="sm">
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/dashboard/tools/${tool.slug}`}>
                                                <Button variant="outline" size="sm">
                                                    Manage
                                                    <ArrowUpRight className="w-3 h-3 ml-1" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* My Submissions Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
            >
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            My Submissions
                        </CardTitle>
                        <CardDescription>Tools you have submitted for review</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {submissions.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                                    <FileText className="w-7 h-7 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-semibold mb-1">No submissions yet</h3>
                                <p className="text-muted-foreground text-sm mb-4">
                                    Submit your AI tool to get listed in our directory.
                                </p>
                                <Link href="/submit">
                                    <Button size="sm">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Submit Tool
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {submissions.map(submission => {
                                    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
                                        pending: { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: Hourglass, label: 'Pending Review' },
                                        approved: { color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle, label: 'Approved' },
                                        rejected: { color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: XOctagon, label: 'Rejected' },
                                        published: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: CheckCircle2, label: 'Published' },
                                    }
                                    const status = statusConfig[submission.status] || statusConfig.pending
                                    const StatusIcon = status.icon

                                    return (
                                        <div
                                            key={submission.id}
                                            className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                                                    {submission.logo_url ? (
                                                        <img src={submission.logo_url} alt={submission.name} referrerPolicy="no-referrer" className="w-6 h-6 rounded" />
                                                    ) : (
                                                        <Package className="w-5 h-5 text-blue-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold">{submission.name}</h4>
                                                        {submission.plan && submission.plan !== 'free' && (
                                                            <Badge variant="outline" className="text-xs capitalize">
                                                                {submission.plan}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge className={`text-xs border ${status.color}`}>
                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                            {status.label}
                                                        </Badge>
                                                        {submission.rejection_reason && (
                                                            <span className="text-xs text-red-500 flex items-center gap-1">
                                                                <AlertCircle className="w-3 h-3" />
                                                                {submission.rejection_reason}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(submission.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                {submission.status === 'approved' || submission.status === 'published' ? (
                                                    <Link href={`/tool/${submission.slug}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                ) : null}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Upgrade CTA for Free Users */}
            {currentPlan === 'free' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border-purple-500/30">
                        <CardContent className="flex items-center justify-between py-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Upgrade to Pro</h3>
                                    <p className="text-muted-foreground">
                                        Get detailed analytics, reply to reviews, and priority listing.
                                    </p>
                                </div>
                            </div>
                            <Link href="/pricing">
                                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                                    View Plans
                                    <ArrowUpRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Upgrade CTA for Pro Users (to Featured) */}
            {currentPlan === 'pro' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border-purple-500/30">
                        <CardContent className="flex items-center justify-between py-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                    <Crown className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Upgrade to Featured</h3>
                                    <p className="text-muted-foreground">
                                        Get homepage placement and a featured badge for maximum visibility.
                                    </p>
                                </div>
                            </div>
                            <Link href="/pricing">
                                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                                    See Featured Benefits
                                    <ArrowUpRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    )
}
