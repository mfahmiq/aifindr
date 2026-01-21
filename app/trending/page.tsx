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
    Loader2,
    ArrowUpRight,
    TrendingUp as RisingIcon
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { toolsService } from "@/lib/services/toolsService"
import { ToolWithRelations } from "@/lib/types"

export default function TrendingPage() {
    const [tools, setTools] = useState<ToolWithRelations[]>([])
    const [loading, setLoading] = useState(true)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const heroRef = useRef<HTMLDivElement>(null)

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

    // Mouse tracking for glow effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (heroRef.current) {
                const rect = heroRef.current.getBoundingClientRect()
                setMousePosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                })
            }
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
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

    // Calculate mock momentum (in real app, this would come from backend)
    const getMomentum = (tool: ToolWithRelations) => {
        const baseChange = Math.floor(Math.random() * 30) + 5
        return `+${baseChange}%`
    }

    const getHeatLevel = (index: number): 'fire' | 'hot' | 'warm' => {
        if (index === 0) return 'fire'
        if (index < 3) return 'hot'
        return 'warm'
    }

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

    const top3 = trendingTools.slice(0, 3)
    const restOfTrending = trendingTools.slice(3)

    return (
        <div className="min-h-screen">
            {/* Hero Section with AI Neural Background */}
            <div ref={heroRef} className="relative bg-gradient-to-br from-orange-500/10 via-red-500/10 to-pink-500/10 overflow-hidden">
                {/* AI Neural Network Background */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Animated gradient orbs */}
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15], rotate: [0, 180, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-orange-500/40 to-red-500/40 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ scale: [1.3, 1, 1.3], opacity: [0.15, 0.3, 0.15], rotate: [360, 180, 0] }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-pink-500/40 to-purple-500/40 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                        transition={{ duration: 15, repeat: Infinity }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full blur-3xl"
                    />

                    {/* Neural network grid pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />

                    {/* Floating particles */}
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-orange-400/50 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [0, -30, 0],
                                opacity: [0.2, 0.8, 0.2],
                                scale: [1, 1.5, 1]
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2
                            }}
                        />
                    ))}

                    {/* Mouse-following spotlight */}
                    <div
                        className="absolute w-96 h-96 rounded-full pointer-events-none transition-all duration-300 ease-out"
                        style={{
                            background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)',
                            left: mousePosition.x - 192,
                            top: mousePosition.y - 192,
                        }}
                    />

                    {/* Bottom fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
                </div>

                <div className="container mx-auto px-4 py-20 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Badge className="mb-6 px-5 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30 backdrop-blur-sm">
                                <Flame className="w-4 h-4 mr-2 text-orange-500 animate-pulse" />
                                <span className="text-orange-600 dark:text-orange-400 font-semibold">Updated in Real-time</span>
                            </Badge>
                        </motion.div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                            <motion.span
                                className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent inline-block"
                                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                                transition={{ duration: 5, repeat: Infinity }}
                                style={{ backgroundSize: '200% 200%' }}
                            >
                                Trending
                            </motion.span>{" "}
                            <span className="text-foreground">AI Tools</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-lg mx-auto">
                            Discover what's hot in the AI world right now based on views, ratings, and community love.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto py-16 px-4 max-w-6xl">
                {/* BENTO GRID - Top 3 Showcase */}
                {top3.length >= 3 && (
                    <div className="mb-20">
                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                                <Crown className="w-5 h-5 text-white" />
                            </div>
                            Top 3 This Week
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* #1 - Large Hero Card */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="lg:row-span-2"
                            >
                                <Link href={`/tool/${top3[0].slug}`} className="block h-full">
                                    <Card className="h-full relative overflow-hidden border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-transparent backdrop-blur-xl group hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 hover:-translate-y-1">
                                        {/* Animated background shimmer */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                                        {/* Glow effect */}
                                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/30 rounded-full blur-3xl group-hover:bg-yellow-500/50 transition-colors" />

                                        <CardContent className="p-8 h-full flex flex-col relative z-10">
                                            {/* Crown Badge */}
                                            <motion.div
                                                animate={{ y: [0, -5, 0], rotate: [-5, 5, -5] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute top-6 right-6"
                                            >
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl shadow-orange-500/40">
                                                    <Crown className="w-8 h-8 text-white" />
                                                </div>
                                            </motion.div>

                                            {/* Logo */}
                                            <div className="w-24 h-24 rounded-3xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden mb-6 ring-4 ring-yellow-500/30">
                                                {top3[0].logo_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={top3[0].logo_url} alt={top3[0].name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-yellow-500">
                                                        {top3[0].name.substring(0, 2)}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-3xl font-black">{top3[0].name}</h3>
                                                    {top3[0].is_verified && (
                                                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Verified</Badge>
                                                    )}
                                                </div>
                                                <p className="text-muted-foreground text-lg mb-6 line-clamp-2">{top3[0].short_description}</p>

                                                {/* Stats Row */}
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="flex items-center gap-2 bg-black/20 dark:bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
                                                        <Eye className="w-4 h-4 text-orange-400" />
                                                        <span className="font-bold">{(top3[0].view_count || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-green-500/20 rounded-full px-4 py-2">
                                                        <RisingIcon className="w-4 h-4 text-green-400" />
                                                        <span className="font-bold text-green-400">{getMomentum(top3[0])}</span>
                                                    </div>
                                                </div>

                                                <StarRating rating={top3[0].rating || 0} size="lg" showValue />
                                            </div>

                                            {/* Heat Badge */}
                                            <div className="mt-6 flex items-center justify-between">
                                                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-none px-4 py-1.5 text-sm font-bold animate-pulse">
                                                    <Flame className="w-4 h-4 mr-2" />
                                                    🔥 On Fire
                                                </Badge>
                                                <ArrowUpRight className="w-6 h-6 text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>

                            {/* #2 and #3 - Medium Cards */}
                            {top3.slice(1, 3).map((tool, idx) => (
                                <motion.div
                                    key={tool.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                                >
                                    <Link href={`/tool/${tool.slug}`}>
                                        <Card className={`relative overflow-hidden border-2 ${idx === 0 ? 'border-gray-400/50 bg-gradient-to-br from-gray-400/10 to-transparent' : 'border-amber-700/50 bg-gradient-to-br from-amber-700/10 to-transparent'} backdrop-blur-xl group hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                                            <CardContent className="p-6 relative z-10">
                                                <div className="flex items-start gap-4">
                                                    {/* Rank Badge */}
                                                    <motion.div
                                                        animate={{ y: [0, -3, 0] }}
                                                        transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.2 }}
                                                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black text-white shadow-lg ${idx === 0 ? 'bg-gradient-to-br from-gray-300 to-gray-400 shadow-gray-400/30' : 'bg-gradient-to-br from-amber-600 to-amber-700 shadow-amber-600/30'}`}
                                                    >
                                                        {idx + 2}
                                                    </motion.div>

                                                    {/* Logo */}
                                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden ring-2 ring-white/20">
                                                        {tool.logo_url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={tool.logo_url} alt={tool.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500">
                                                                {tool.name.substring(0, 2)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="text-xl font-bold truncate">{tool.name}</h3>
                                                            {tool.is_verified && (
                                                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs shrink-0">Verified</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground truncate mb-2">{tool.short_description}</p>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <Eye className="w-3.5 h-3.5 text-orange-400" />
                                                                <span className="font-medium">{(tool.view_count || 0).toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-sm text-green-400">
                                                                <RisingIcon className="w-3.5 h-3.5" />
                                                                <span className="font-medium">{getMomentum(tool)}</span>
                                                            </div>
                                                            <StarRating rating={tool.rating || 0} size="sm" />
                                                        </div>
                                                    </div>

                                                    <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rest of Trending List */}
                {restOfTrending.length > 0 && (
                    <div className="mb-16">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                                <Eye className="w-5 h-5 text-white" />
                            </div>
                            Rising Stars
                        </h2>
                        <div className="space-y-3">
                            {restOfTrending.map((tool, index) => (
                                <motion.div
                                    key={tool.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ x: 4 }}
                                >
                                    <Link href={`/tool/${tool.slug}`}>
                                        <Card className="hover:shadow-lg transition-all border border-muted/50 hover:border-orange-500/30 backdrop-blur-sm bg-card/80 group">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-4">
                                                    {/* Rank */}
                                                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-muted-foreground shrink-0">
                                                        {index + 4}
                                                    </div>

                                                    {/* Logo */}
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary text-sm shrink-0 overflow-hidden">
                                                        {tool.logo_url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={tool.logo_url} alt={tool.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                                        ) : (
                                                            tool.name.substring(0, 2)
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold truncate">{tool.name}</span>
                                                            {tool.is_verified && (
                                                                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30 shrink-0 text-xs">Verified</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground truncate">{tool.short_description}</p>
                                                    </div>

                                                    {/* Stats */}
                                                    <div className="hidden md:flex items-center gap-4">
                                                        <div className="text-center px-3 py-1.5 rounded-lg bg-muted/50">
                                                            <div className="font-bold text-sm">{(tool.view_count || 0).toLocaleString()}</div>
                                                            <div className="text-muted-foreground text-xs flex items-center gap-1">
                                                                <Eye className="w-3 h-3" /> views
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-green-500 text-sm font-medium">
                                                            <RisingIcon className="w-3.5 h-3.5" />
                                                            {getMomentum(tool)}
                                                        </div>
                                                        <StarRating rating={tool.rating || 0} size="sm" />
                                                    </div>

                                                    <Badge variant="outline" className="shrink-0 hidden sm:flex">{getCategoryName(tool)}</Badge>
                                                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Two Column Layout for Other Rankings */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Top Rated */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="border-2 border-yellow-500/30 overflow-hidden backdrop-blur-xl bg-card/80">
                            <div className="h-1.5 bg-gradient-to-r from-yellow-400 to-amber-500" />
                            <CardContent className="p-6">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                    Top Rated
                                </h2>
                                <div className="space-y-3">
                                    {topRatedTools.map((tool, index) => (
                                        <Link key={tool.id} href={`/tool/${tool.slug}`}>
                                            <Card className="hover:shadow-md transition-all hover:border-yellow-500/30 bg-card/50 backdrop-blur-sm">
                                                <CardContent className="p-3 flex items-center gap-3">
                                                    <motion.span
                                                        animate={index === 0 ? { scale: [1, 1.15, 1] } : {}}
                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                        className={`text-lg font-bold w-6 ${index === 0 ? 'text-yellow-500' : 'text-muted-foreground'}`}
                                                    >
                                                        {index + 1}
                                                    </motion.span>
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/10 flex items-center justify-center font-bold text-yellow-600 text-sm overflow-hidden">
                                                        {tool.logo_url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={tool.logo_url} alt={tool.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                                        ) : (
                                                            tool.name.substring(0, 2)
                                                        )}
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
                        <Card className="border-2 border-red-500/30 overflow-hidden backdrop-blur-xl bg-card/80">
                            <div className="h-1.5 bg-gradient-to-r from-red-400 to-pink-500" />
                            <CardContent className="p-6">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                                    Community Favorites
                                </h2>
                                <div className="space-y-3">
                                    {mostLovedTools.map((tool, index) => (
                                        <Link key={tool.id} href={`/tool/${tool.slug}`}>
                                            <Card className="hover:shadow-md transition-all hover:border-red-500/30 bg-card/50 backdrop-blur-sm">
                                                <CardContent className="p-3 flex items-center gap-3">
                                                    <motion.span
                                                        animate={index === 0 ? { scale: [1, 1.15, 1] } : {}}
                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                        className={`text-lg font-bold w-6 ${index === 0 ? 'text-red-500' : 'text-muted-foreground'}`}
                                                    >
                                                        {index + 1}
                                                    </motion.span>
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/10 flex items-center justify-center font-bold text-red-600 text-sm overflow-hidden">
                                                        {tool.logo_url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={tool.logo_url} alt={tool.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                                        ) : (
                                                            tool.name.substring(0, 2)
                                                        )}
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
