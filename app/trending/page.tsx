"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/star-rating"
import {
    TrendingUp,
    Eye,
    Heart,
    Crown,
    Sparkles,
    ArrowRight,
    Flame,
    Star,
    Zap,
    Loader2
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { toolsService } from "@/lib/services/toolsService"
import { ToolWithRelations } from "@/lib/types"

export default function TrendingPage() {
    const [tools, setTools] = useState<ToolWithRelations[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTools = async () => {
            try {
                const { tools } = await toolsService.getTools({ sortBy: 'trending', limit: 20 })
                setTools(tools)
            } catch (error) {
                console.error('Error fetching tools:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchTools()
    }, [])

    // Sort by views for trending
    const trendingTools = [...tools]
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 10)

    // Sort by rating for top rated
    const topRatedTools = [...tools]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5)

    // Sort by favorites
    const mostLovedTools = [...tools]
        .sort((a, b) => (b.favorite_count || 0) - (a.favorite_count || 0))
        .slice(0, 5)

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    const getCategoryName = (tool: ToolWithRelations) => {
        if (tool.category && typeof tool.category === 'object') return tool.category.name
        return 'AI Tool'
    }

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-orange-500/10 via-red-500/10 to-pink-500/10 overflow-hidden">
                <div className="absolute inset-0">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
                        transition={{ duration: 8, repeat: Infinity }}
                        className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-br from-orange-500/30 to-red-500/30 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.3, 0.2] }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full blur-3xl"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:32px_32px]" />
                    {/* Bottom fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
                </div>

                <div className="container mx-auto px-4 py-16 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <Badge className="mb-4 px-4 py-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
                            <Flame className="w-3.5 h-3.5 mr-2 text-orange-500" />
                            <span className="text-orange-600 dark:text-orange-400">Updated in Real-time</span>
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                            <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
                                Trending
                            </span>{" "}
                            AI Tools
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Discover what's hot in the AI world right now based on views, ratings, and community love.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto py-12 px-4 max-w-6xl">
                {/* Main Trending List */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white" />
                        </div>
                        Most Viewed This Week
                    </h2>
                    {trendingTools.length === 0 ? (
                        <Card className="p-8 text-center text-muted-foreground">
                            No trending tools found. Check back later!
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {trendingTools.map((tool, index) => (
                                <motion.div
                                    key={tool.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ x: 4 }}
                                >
                                    <Link href={`/tool/${tool.slug}`}>
                                        <Card className={`hover:shadow-lg transition-all border-2 ${index < 3 ? 'border-orange-500/30 bg-gradient-to-r from-orange-500/5 to-transparent' : 'border-muted/50'
                                            }`}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-4">
                                                    {/* Rank */}
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${index === 0
                                                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/30'
                                                        : index === 1
                                                            ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white'
                                                            : index === 2
                                                                ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                                                                : 'bg-muted text-muted-foreground'
                                                        }`}>
                                                        {index === 0 && <Crown className="w-6 h-6" />}
                                                        {index > 0 && (index + 1)}
                                                    </div>

                                                    {/* Logo */}
                                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary text-lg shrink-0">
                                                        {tool.name.substring(0, 2)}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-lg truncate">{tool.name}</span>
                                                            {tool.is_verified && (
                                                                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30 shrink-0">Verified</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground truncate">{tool.short_description}</p>
                                                    </div>

                                                    {/* Stats */}
                                                    <div className="hidden md:flex items-center gap-6">
                                                        <div className="text-center px-4 py-2 rounded-lg bg-muted/50">
                                                            <div className="font-bold text-lg">{(tool.view_count || 0).toLocaleString()}</div>
                                                            <div className="text-muted-foreground text-xs flex items-center gap-1">
                                                                <Eye className="w-3 h-3" /> views
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <StarRating rating={tool.rating || 0} size="sm" />
                                                            <div className="text-muted-foreground text-xs">{tool.review_count || 0} reviews</div>
                                                        </div>
                                                    </div>

                                                    <Badge variant="outline" className="shrink-0">{getCategoryName(tool)}</Badge>
                                                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Two Column Layout for Other Rankings */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Top Rated */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="border-2 border-yellow-500/30 overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-yellow-400 to-amber-500" />
                            <CardContent className="p-6">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                    Top Rated
                                </h2>
                                <div className="space-y-3">
                                    {topRatedTools.map((tool, index) => (
                                        <Link key={tool.id} href={`/tool/${tool.slug}`}>
                                            <Card className="hover:shadow-md transition-all hover:border-yellow-500/30">
                                                <CardContent className="p-3 flex items-center gap-3">
                                                    <span className={`text-lg font-bold w-6 ${index === 0 ? 'text-yellow-500' : 'text-muted-foreground'
                                                        }`}>{index + 1}</span>
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/10 flex items-center justify-center font-bold text-yellow-600 text-sm">
                                                        {tool.name.substring(0, 2)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate">{tool.name}</div>
                                                        <StarRating rating={tool.rating || 0} size="sm" showValue />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Most Loved */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="border-2 border-red-500/30 overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-red-400 to-pink-500" />
                            <CardContent className="p-6">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                                    Community Favorites
                                </h2>
                                <div className="space-y-3">
                                    {mostLovedTools.map((tool, index) => (
                                        <Link key={tool.id} href={`/tool/${tool.slug}`}>
                                            <Card className="hover:shadow-md transition-all hover:border-red-500/30">
                                                <CardContent className="p-3 flex items-center gap-3">
                                                    <span className={`text-lg font-bold w-6 ${index === 0 ? 'text-red-500' : 'text-muted-foreground'
                                                        }`}>{index + 1}</span>
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/10 flex items-center justify-center font-bold text-red-600 text-sm">
                                                        {tool.name.substring(0, 2)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate">{tool.name}</div>
                                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                                                            {(tool.favorite_count || 0).toLocaleString()} favorites
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
