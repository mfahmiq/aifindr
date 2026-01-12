"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ToolWithRelations } from "@/lib/types"
import Link from "next/link"
import { motion } from "framer-motion"
import {
    Heart,
    Eye,
    CheckCircle,
    ArrowUpRight,
    Sparkles,
    Bot,
    Image,
    Video,
    Code,
    Music,
    FileText,
    Mic,
    MessageSquare,
    Star,
    ExternalLink,
    Zap
} from "lucide-react"
import { PLAN_NAMES } from "@/lib/constants"

interface ToolCardProps {
    tool: ToolWithRelations
    index?: number
}

// Modern category styling with vibrant gradients
const categoryConfig: Record<string, { icon: React.ElementType; gradient: string; textColor: string; bgColor: string }> = {
    'Chat': { icon: MessageSquare, gradient: 'from-blue-500 to-cyan-500', textColor: 'text-blue-600', bgColor: 'bg-blue-500/10' },
    'Image': { icon: Image, gradient: 'from-violet-500 to-purple-500', textColor: 'text-violet-600', bgColor: 'bg-violet-500/10' },
    'Video': { icon: Video, gradient: 'from-rose-500 to-pink-500', textColor: 'text-rose-600', bgColor: 'bg-rose-500/10' },
    'Coding': { icon: Code, gradient: 'from-emerald-500 to-teal-500', textColor: 'text-emerald-600', bgColor: 'bg-emerald-500/10' },
    'Audio': { icon: Music, gradient: 'from-amber-500 to-orange-500', textColor: 'text-amber-600', bgColor: 'bg-amber-500/10' },
    'Writing': { icon: FileText, gradient: 'from-cyan-500 to-blue-500', textColor: 'text-cyan-600', bgColor: 'bg-cyan-500/10' },
    'Voice': { icon: Mic, gradient: 'from-red-500 to-rose-500', textColor: 'text-red-600', bgColor: 'bg-red-500/10' },
    'Productivity': { icon: Zap, gradient: 'from-indigo-500 to-purple-500', textColor: 'text-indigo-600', bgColor: 'bg-indigo-500/10' },
    'default': { icon: Bot, gradient: 'from-slate-500 to-gray-500', textColor: 'text-slate-600', bgColor: 'bg-slate-500/10' },
}

export function ToolCard({ tool, index = 0 }: ToolCardProps) {
    const categoryName = tool.category && typeof tool.category === 'object'
        ? tool.category.name
        : (tool.category as unknown as string) || 'default'

    const config = categoryConfig[categoryName] || categoryConfig['default']
    const IconComponent = config.icon

    const planValue = tool.plan || PLAN_NAMES.FREE
    const isSponsor = planValue === PLAN_NAMES.SPONSOR
    const isFeatured = planValue === PLAN_NAMES.FEATURED
    const isPro = planValue === PLAN_NAMES.PRO
    const isPremium = isSponsor || isFeatured || isPro

    // Premium badge configurations
    const getPremiumBadge = () => {
        if (isSponsor) return { label: 'Sponsor', gradient: 'from-amber-500 to-orange-500', icon: Sparkles }
        if (isFeatured) return { label: 'Featured', gradient: 'from-violet-500 to-purple-500', icon: Star }
        if (isPro) return { label: 'Pro', gradient: 'from-blue-500 to-cyan-500', icon: Zap }
        return null
    }

    const premiumBadge = getPremiumBadge()

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="h-full"
        >
            <Link href={`/tool/${tool.slug}`} className="block h-full group">
                <Card className={`
                    relative h-full overflow-hidden
                    bg-white dark:bg-gray-900
                    border border-gray-200/80 dark:border-gray-700/80
                    hover:border-transparent
                    rounded-2xl
                    transition-all duration-500 ease-out
                    hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)]
                    dark:hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]
                    ${isPremium ? 'ring-1 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''}
                    ${isSponsor ? 'ring-amber-400/50' : isFeatured ? 'ring-violet-400/50' : isPro ? 'ring-blue-400/50' : ''}
                `}>
                    {/* Gradient accent bar at top */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                    {/* Premium badge */}
                    {premiumBadge && (
                        <div className="absolute top-3 right-3 z-10">
                            <Badge className={`bg-gradient-to-r ${premiumBadge.gradient} text-white border-0 shadow-lg px-2.5 py-1 text-xs font-medium`}>
                                <premiumBadge.icon className="w-3 h-3 mr-1" />
                                {premiumBadge.label}
                            </Badge>
                        </div>
                    )}

                    <div className="p-5">
                        {/* Header with Logo and Info */}
                        <div className="flex items-start gap-4">
                            {/* Logo with gradient background */}
                            <div className={`
                                relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0
                                bg-gradient-to-br ${config.gradient}
                                shadow-lg
                                group-hover:scale-110 group-hover:shadow-xl
                                transition-all duration-300
                            `}>
                                {tool.logo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={tool.logo_url}
                                        alt={tool.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <IconComponent className="w-7 h-7 text-white" />
                                    </div>
                                )}
                                {/* Shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </div>

                            <div className="flex-1 min-w-0 pt-0.5">
                                {/* Name with verified */}
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-bold text-gray-900 dark:text-white truncate text-base group-hover:text-primary transition-colors">
                                        {tool.name}
                                    </h3>
                                    {tool.is_verified && (
                                        <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" fill="currentColor" />
                                    )}
                                </div>

                                {/* Category & Pricing Badges */}
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="secondary" className={`${config.bgColor} ${config.textColor} border-0 text-xs font-medium px-2.5 py-0.5`}>
                                        <IconComponent className="w-3 h-3 mr-1" />
                                        {categoryName}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs px-2 py-0.5 border-gray-300 dark:border-gray-600">
                                        {tool.pricing_type}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {tool.short_description}
                        </p>

                        {/* Tags */}
                        {tool.tags && tool.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {tool.tags.slice(0, 3).map(tag => (
                                    <span
                                        key={tag.id}
                                        className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        #{tag.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Footer with Stats */}
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            {/* Rating or New */}
                            <div className="flex items-center gap-2">
                                {tool.rating ? (
                                    <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg">
                                        <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                            {tool.rating.toFixed(1)}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            ({tool.review_count || 0})
                                        </span>
                                    </div>
                                ) : (
                                    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        New
                                    </Badge>
                                )}
                            </div>

                            {/* Stats & Arrow */}
                            <div className="flex items-center gap-3">
                                {(tool.view_count ?? 0) > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <Eye className="w-3.5 h-3.5" />
                                        {(tool.view_count ?? 0) >= 1000
                                            ? `${((tool.view_count ?? 0) / 1000).toFixed(1)}k`
                                            : tool.view_count}
                                    </span>
                                )}
                                {(tool.favorite_count ?? 0) > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <Heart className="w-3.5 h-3.5" />
                                        {tool.favorite_count}
                                    </span>
                                )}

                                {/* Animated arrow */}
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </Link>
        </motion.div>
    )
}
