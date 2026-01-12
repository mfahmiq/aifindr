"use client"

import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/components/star-rating"
import { CompactSidebarAd } from "@/components/ad-sections"
import { ToolWithRelations, ReviewWithUser } from "@/lib/types" // Updated imports
import {
    ArrowLeft,
    ExternalLink,
    Heart,
    Share2,
    Check,
    Eye,
    MessageSquare,
    ThumbsUp,
    ShieldCheck,
    BarChart3,
    Sparkles,
    Zap,
    Crown,
    Globe,
    Calendar,
    TrendingUp,
    Users,
    Star,
    Bot,
    Image,
    Video,
    Code,
    Music,
    FileText,
    Mic,
    Copy,
    CheckCircle,
    Loader2
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useState, useEffect, use } from "react"
import { appendUTMParams, getUTMConfig, UTMConfig } from "@/lib/utm"
import { getGradientPair, hexToRgb, extractDominantColor } from "@/lib/colorUtils"

interface PageProps {
    params: Promise<{ slug: string }>
}

// Category to icon/color mapping
const categoryConfig: Record<string, { icon: React.ElementType; color: string; bgGradient: string }> = {
    'Chat': { icon: MessageSquare, color: 'text-blue-500', bgGradient: 'from-blue-500 to-cyan-500' },
    'Image': { icon: Image, color: 'text-purple-500', bgGradient: 'from-purple-500 to-pink-500' },
    'Video': { icon: Video, color: 'text-pink-500', bgGradient: 'from-pink-500 to-rose-500' },
    'Coding': { icon: Code, color: 'text-green-500', bgGradient: 'from-green-500 to-emerald-500' },
    'Audio': { icon: Music, color: 'text-orange-500', bgGradient: 'from-orange-500 to-amber-500' },
    'Writing': { icon: FileText, color: 'text-cyan-500', bgGradient: 'from-cyan-500 to-teal-500' },
    'Voice': { icon: Mic, color: 'text-red-500', bgGradient: 'from-red-500 to-pink-500' },
    'default': { icon: Bot, color: 'text-primary', bgGradient: 'from-primary to-purple-500' },
}

export default function ToolDetailPage({ params }: PageProps) {
    const { slug } = use(params)
    const [tool, setTool] = useState<ToolWithRelations | null>(null)
    const [reviews, setReviews] = useState<ReviewWithUser[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const [isFavorited, setIsFavorited] = useState(false)
    const [favoriteLoading, setFavoriteLoading] = useState(false)
    const [favoriteCount, setFavoriteCount] = useState(0)
    const [viewCount, setViewCount] = useState(0)
    const [userRating, setUserRating] = useState(0)
    const [reviewText, setReviewText] = useState("")
    const [copied, setCopied] = useState(false)
    const [utmConfig, setUtmConfig] = useState<UTMConfig | null>(null)
    const [dynamicGradient, setDynamicGradient] = useState<{ from: string; to: string } | null>(null)

    // Load UTM config
    useEffect(() => {
        setUtmConfig(getUTMConfig())
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch tool details
                const toolRes = await fetch(`/api/tools/${slug}`)
                if (!toolRes.ok) throw new Error('Tool not found')
                const toolData = await toolRes.json()
                setTool(toolData)

                // Fetch reviews
                const reviewsRes = await fetch(`/api/reviews?toolId=${toolData.id}`)
                if (reviewsRes.ok) {
                    const reviewsData = await reviewsRes.json()
                    setReviews(reviewsData)
                }

                // Set initial counts
                setViewCount(toolData.view_count || 0)
                setFavoriteCount(toolData.favorite_count || 0)

                // Check favorite status
                try {
                    const favRes = await fetch(`/api/tools/${slug}/favorite`)
                    if (favRes.ok) {
                        const favData = await favRes.json()
                        setIsFavorited(favData.isFavorited)
                    }
                } catch (e) {
                    // Ignore favorite check errors
                }

                // Record view
                try {
                    const viewRes = await fetch(`/api/tools/${slug}/view`, { method: 'POST' })
                    if (viewRes.ok) {
                        const viewData = await viewRes.json()
                        if (viewData.viewRecorded) {
                            setViewCount(viewData.viewCount)
                        }
                    }
                } catch (e) {
                    // Ignore view errors
                }

                // Set dynamic gradient based on dominant_color or extract from logo
                if (toolData.dominant_color) {
                    setDynamicGradient(getGradientPair(toolData.dominant_color))
                } else if (toolData.logo_url) {
                    // Extract color from logo in background
                    extractDominantColor(toolData.logo_url).then(color => {
                        setDynamicGradient(getGradientPair(color))
                    })
                }
            } catch (err) {
                console.error(err)
                setError(true)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [slug])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !tool) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold mb-4">Tool not found</h2>
                <Button asChild>
                    <Link href="/">Back to Home</Link>
                </Button>
            </div>
        )
    }

    const categoryName = tool.category && typeof tool.category === 'object'
        ? tool.category.name
        : (tool.category as unknown as string) || 'default'

    const config = categoryConfig[categoryName] || categoryConfig['default']
    const IconComponent = config.icon
    const isFeatured = tool.plan === 'Featured'

    const handleSubmitReview = async () => {
        if (userRating > 0 && reviewText.trim()) {
            // Validate tool.id exists
            if (!tool.id) {
                console.error('Tool ID is missing:', tool)
                alert('Error: Tool data is not loaded properly. Please refresh the page.')
                return
            }

            console.log('Submitting review for tool:', { id: tool.id, name: tool.name })

            try {
                const res = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tool_id: tool.id,
                        rating: userRating,
                        comment: reviewText,
                    })
                })

                const data = await res.json()

                if (res.ok) {
                    alert(`Review submitted! It will appear after moderation.`)
                    setReviewText("")
                    setUserRating(0)
                } else {
                    console.error('Review submission failed:', data)
                    alert(`Failed to submit review: ${data.details || data.error || 'Unknown error'}`)
                }
            } catch (e) {
                console.error('Review submission error:', e)
                alert('Error submitting review. Please try again.')
            }
        } else {
            alert('Please provide a rating and review text.')
        }
    }

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleToggleFavorite = async () => {
        if (favoriteLoading) return
        setFavoriteLoading(true)
        try {
            const res = await fetch(`/api/tools/${slug}/favorite`, { method: 'POST' })
            if (res.ok) {
                const data = await res.json()
                setIsFavorited(data.isFavorited)
                setFavoriteCount(data.favoriteCount)
            }
        } catch (e) {
            console.error('Favorite toggle error:', e)
        } finally {
            setFavoriteLoading(false)
        }
    }

    // Compute gradient style for hero
    const heroGradientStyle = dynamicGradient
        ? { background: `linear-gradient(to right, ${dynamicGradient.from}, ${dynamicGradient.to})` }
        : undefined

    return (
        <div className="min-h-screen">
            {/* Hero Banner */}
            <div
                className={`relative ${!dynamicGradient ? `bg-gradient-to-r ${config.bgGradient}` : ''} overflow-hidden`}
                style={heroGradientStyle}
            >
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:40px_40px]" />
                </div>
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/20 blur-3xl"
                />

                <div className="container mx-auto px-4 py-12 relative">
                    {/* Back Button */}
                    <Link href="/" className="inline-flex items-center text-sm text-white/80 hover:text-white mb-8 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Directory
                    </Link>

                    <div className="flex flex-col md:flex-row items-start gap-6">
                        {/* Large Icon/Logo */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/30 overflow-hidden"
                        >
                            {tool.logo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={tool.logo_url}
                                    alt={tool.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <IconComponent className="w-12 h-12 md:w-16 md:h-16 text-white" />
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex-1 text-white"
                        >
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                                {isFeatured && (
                                    <Badge className="bg-yellow-400 text-yellow-900 border-0 shadow-lg">
                                        <Crown className="w-3 h-3 mr-1" />
                                        Featured
                                    </Badge>
                                )}
                                {tool.is_verified && (
                                    <Badge className="bg-white/20 text-white border-white/30">
                                        <ShieldCheck className="w-3 h-3 mr-1" />
                                        Verified
                                    </Badge>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">{tool.name}</h1>
                            <p className="text-lg text-white/90 mb-4 max-w-2xl">{tool.short_description}</p>

                            {/* Rating & Stats */}
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                    <Sparkles className="w-4 h-4 text-yellow-300" />
                                    <span className="font-bold">{tool.rating?.toFixed(1) || '0.0'}</span>
                                    <span className="text-white/70">({tool.review_count || 0} reviews)</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                    <Eye className="w-4 h-4" />
                                    <span>{(tool.view_count || 0).toLocaleString()} views</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                    <Heart className="w-4 h-4" />
                                    <span>{(tool.favorite_count || 0).toLocaleString()} favorites</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="grid lg:grid-cols-3 gap-8 -mt-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tags */}
                        {tool.tags && tool.tags.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex flex-wrap gap-2"
                            >
                                {tool.tags.map(tag => (
                                    <Badge key={tag.id} variant="secondary" className="px-3 py-1 text-sm">
                                        #{tag.name}
                                    </Badge>
                                ))}
                            </motion.div>
                        )}

                        {/* About Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="overflow-hidden border-2 border-muted/50 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="w-5 h-5 text-primary" />
                                        About {tool.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <p className="text-muted-foreground leading-relaxed text-lg">
                                        {tool.long_description || tool.short_description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Features Card */}
                        {tool.features && tool.features.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Card className="overflow-hidden border-2 border-muted/50 shadow-lg">
                                    <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                                        <CardTitle className="flex items-center gap-2">
                                            <Zap className="w-5 h-5 text-green-500" />
                                            Key Features
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {tool.features.map((feature, i) => (
                                                <motion.div
                                                    key={feature.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.4 + i * 0.1 }}
                                                    className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                                                        <Check className="w-4 h-4 text-white" />
                                                    </div>
                                                    <span className="font-medium">{feature.feature}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Reviews Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Card className="overflow-hidden border-2 border-muted/50 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-purple-500" />
                                        Reviews ({reviews.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    {/* Write Review Box */}
                                    <div className="p-5 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl space-y-4 border border-muted">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <Star className="w-4 h-4 text-yellow-500" />
                                            Write a Review
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-muted-foreground">Your rating:</span>
                                            <StarRating
                                                rating={userRating}
                                                interactive
                                                size="lg"
                                                onRatingChange={setUserRating}
                                            />
                                        </div>
                                        <Textarea
                                            placeholder="Share your experience with this tool..."
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            className="min-h-[100px]"
                                        />
                                        <Button
                                            onClick={handleSubmitReview}
                                            disabled={userRating === 0}
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                        >
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Submit Review
                                        </Button>
                                    </div>

                                    {/* Existing Reviews */}
                                    <div className="space-y-4">
                                        {reviews.map((review, i) => (
                                            <motion.div
                                                key={review.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.5 + i * 0.1 }}
                                                className="p-4 rounded-xl bg-card border hover:border-primary/30 transition-colors"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center font-bold text-white text-lg shadow-lg">
                                                        {(review.guest_name || review.users?.name || '?').charAt(0)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold">{review.guest_name || review.users?.name || 'Anonymous'}</span>
                                                                <StarRating rating={review.rating} size="sm" />
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(review.created_at || '').toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-muted-foreground">{review.comment}</p>
                                                        {/* Helpful count - needs implementing in backend/API to be useful, just UI for now */}
                                                        <button className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-primary transition-colors">
                                                            <ThumbsUp className="w-3.5 h-3.5" />
                                                            Helpful ({review.helpful_count || 0})
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Action Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="sticky top-20 overflow-hidden border-2 shadow-xl">
                                <div className={`h-2 bg-gradient-to-r ${config.bgGradient}`} />
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Badge className={`${config.color} bg-transparent border`}>
                                            <IconComponent className="w-3 h-3 mr-1" />
                                            {categoryName}
                                        </Badge>
                                        <Badge variant="secondary">{tool.pricing_type}</Badge>
                                    </div>

                                    <Button
                                        className={`w-full bg-gradient-to-r ${config.bgGradient} hover:opacity-90 shadow-lg`}
                                        size="lg"
                                        asChild
                                    >
                                        <a href={utmConfig ? appendUTMParams(tool.website_url, utmConfig) : tool.website_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Visit Website
                                            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                                        </a>
                                    </Button>

                                    <div className="flex gap-2">
                                        <Button
                                            variant={isFavorited ? "default" : "outline"}
                                            className={`flex-1 ${isFavorited ? 'bg-red-500 hover:bg-red-600' : ''}`}
                                            onClick={handleToggleFavorite}
                                            disabled={favoriteLoading}
                                        >
                                            {favoriteLoading ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Heart className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                                            )}
                                            {isFavorited ? 'Saved!' : 'Save'}
                                        </Button>
                                        <Button variant="outline" className="flex-1" onClick={handleShare}>
                                            {copied ? (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4 mr-2" />
                                                    Share
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href="/compare">
                                            <BarChart3 className="w-4 h-4 mr-2" />
                                            Add to Compare
                                        </Link>
                                    </Button>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                                        <div className="text-center p-3 rounded-lg bg-muted/50">
                                            <Eye className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                                            <div className="text-xl font-bold">{viewCount.toLocaleString()}</div>
                                            <div className="text-xs text-muted-foreground">Views</div>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-muted/50">
                                            <Heart className="w-5 h-5 mx-auto mb-1 text-red-400" />
                                            <div className="text-xl font-bold">{favoriteCount.toLocaleString()}</div>
                                            <div className="text-xs text-muted-foreground">Favorites</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Quick Info Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="border-2">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-yellow-500" />
                                        Quick Info
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {tool.has_free_trial && (
                                        <div className="flex items-center gap-3 p-2 rounded-lg bg-green-500/10">
                                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                            <span className="text-sm font-medium">Free Trial Available</span>
                                        </div>
                                    )}
                                    {tool.has_api && (
                                        <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-500/10">
                                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                <Code className="w-3 h-3 text-white" />
                                            </div>
                                            <span className="text-sm font-medium">API Available</span>
                                        </div>
                                    )}
                                    {tool.is_open_source && (
                                        <div className="flex items-center gap-3 p-2 rounded-lg bg-purple-500/10">
                                            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                                                <Globe className="w-3 h-3 text-white" />
                                            </div>
                                            <span className="text-sm font-medium">Open Source</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Sponsored Ad */}
                        <CompactSidebarAd />
                    </div>
                </div>
            </div>
        </div>
    )
}
