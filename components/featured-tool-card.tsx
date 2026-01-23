"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ToolWithRelations } from "@/lib/types"
import Link from "next/link"
import { motion } from "framer-motion"
import { ExternalLink, Star, Check, Zap, Eye, Sparkles } from "lucide-react"
import { getGradientPair } from "@/lib/colorUtils"

interface FeaturedToolCardProps {
    tool: ToolWithRelations
    index?: number
}

export function FeaturedToolCard({ tool, index = 0 }: FeaturedToolCardProps) {
    // Shared Badge Logic
    const isVerified = tool.is_verified;
    // Featured cards are by definition at least "Featured" or "Sponsor" usually,
    // but honestly we should rely on the plan data if available.
    // However, since this component is explicitly "FeaturedToolCard",
    // it's likely used in contexts where the tool IS featured.
    // But let's be safe and check the plan if possible, or default to Gold since it's in the "Featured" section?
    // Actually, looking at the code, it takes a `ToolWithRelations`.
    // Let's stick to the same strict logic as ToolCard to be safe.
    const planValue = tool.plan || 'Free';
    const planLower = planValue.toLowerCase();
    const isSponsor = planLower === 'sponsor'; // Handle case insensitivity if needed
    const isFeatured = planLower === 'featured' || isSponsor;

    // Logic:
    // Gold = Sponsor or Featured plan.
    // Blue = Verified AND NOT Gold AND NOT Free.
    const hasGoldBadge = isFeatured; // Since this IS a featured card, maybe we just assume Gold? 
    // Wait, if a Free tool somehow appearing here (e.g. "Editor's Choice" but not paid), 
    // we should probably still give it a Gold check if it's in the "Featured" section?
    // Let's stick to the PLAN based logic for consistency.
    // Use the variable hasGoldBadge derived from plan.
    const hasGoldBadgeStrict = isFeatured;
    const hasBlueBadge = isVerified && !hasGoldBadgeStrict && planLower !== 'free';

    const dynamicColor = tool.dominant_color || '#8b5cf6' // Indigo as default for featured
    const gradient = getGradientPair(dynamicColor)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="h-full"
        >
            <Card
                className="h-full bg-white dark:bg-gray-900 border-2 overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                style={{
                    borderColor: `${dynamicColor}20`,
                    boxShadow: `0 20px 25px -5px ${dynamicColor}10, 0 8px 10px -6px ${dynamicColor}10`
                }}
            >
                <div
                    className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
                />
                <div className="flex flex-col md:flex-row h-full">
                    {/* Left: Image/Logo Area */}
                    <div className="w-full md:w-2/5 bg-gray-100 dark:bg-gray-800 relative min-h-[200px] md:min-h-full flex items-center justify-center p-6 overflow-hidden">
                        {/* Background Pattern */}
                        <div
                            className="absolute inset-0 opacity-10"
                            style={{ background: `radial-gradient(circle at center, ${dynamicColor}, transparent)` }}
                        ></div>

                        {/* Logo */}
                        <div className="relative w-28 h-28 md:w-40 md:h-40 rounded-3xl overflow-hidden shadow-2xl z-10 group-hover:scale-105 transition-transform duration-500 ring-4 ring-white/20 dark:ring-black/20">
                            {tool.logo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={tool.logo_url}
                                    alt={tool.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-white dark:bg-gray-700 flex items-center justify-center">
                                    <Zap className="w-12 h-12 text-gray-400" />
                                </div>
                            )}
                        </div>

                        {/* Badges */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none shadow-lg px-3 py-1 text-sm">
                                <Star className="w-3.5 h-3.5 mr-1.5 fill-current" />
                                Editor's Choice
                            </Badge>
                            {/* Scarcity Badge - Dynamic Mockup */}
                            <Badge variant="secondary" className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800 backdrop-blur-sm shadow-sm animate-pulse">
                                <span className="mr-1">🔥</span> High Demand
                            </Badge>
                        </div>
                    </div>

                    {/* Right: Content Area */}
                    <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-2 leading-tight line-clamp-2">
                                    {tool.name}
                                </h3>
                                <div className="flex items-center gap-3 mb-4">
                                    {tool.category && (
                                        <Badge variant="outline" className="text-xs px-2.5 py-0.5 border-gray-300 dark:border-gray-700">
                                            {tool.category.name}
                                        </Badge>
                                    )}
                                    {tool.rating && tool.rating > 0 && (
                                        <div className="flex items-center text-amber-500 text-sm font-bold bg-amber-50 dark:bg-amber-900/10 px-2 py-0.5 rounded-full">
                                            <Star className="w-4 h-4 fill-current mr-1" />
                                            {tool.rating}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* GOLD BADGE: Shield with Crown for Premium/Sponsor */}
                            {hasGoldBadgeStrict && (
                                <div className="relative shrink-0" title="Premium Tool">
                                    <svg width="32" height="38" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                                        <defs>
                                            <linearGradient id="goldGradientFeatured" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#FFD700" />
                                                <stop offset="50%" stopColor="#FFA500" />
                                                <stop offset="100%" stopColor="#FF8C00" />
                                            </linearGradient>
                                            <linearGradient id="goldShimmerFeatured" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="white" stopOpacity="0" />
                                                <stop offset="50%" stopColor="white" stopOpacity="0.7" />
                                                <stop offset="100%" stopColor="white" stopOpacity="0" />
                                                <animate attributeName="x1" values="-100%; 200%" dur="2.5s" repeatCount="indefinite" />
                                                <animate attributeName="x2" values="0%; 300%" dur="2.5s" repeatCount="indefinite" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M11 1L21 5V12C21 18.5 16.5 23 11 25C5.5 23 1 18.5 1 12V5L11 1Z" fill="url(#goldGradientFeatured)" stroke="#B8860B" strokeWidth="0.5" />
                                        <path d="M11 1L21 5V12C21 18.5 16.5 23 11 25C5.5 23 1 18.5 1 12V5L11 1Z" fill="url(#goldShimmerFeatured)" style={{ mixBlendMode: 'overlay' }} />

                                        <path d="M6 15L8 10L11 13L14 10L16 15H6Z" fill="#FFF8DC" stroke="#B8860B" strokeWidth="0.3" />
                                        <circle cx="8" cy="10" r="1" fill="#FFF8DC" />
                                        <circle cx="11" cy="8" r="1.2" fill="#FFF8DC" />
                                        <circle cx="14" cy="10" r="1" fill="#FFF8DC" />
                                    </svg>
                                </div>
                            )}

                            {/* BLUE BADGE: Rounded Square with Checkmark for Verified */}
                            {hasBlueBadge && (
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shrink-0 badge-shimmer" title="Verified Tool">
                                    <Check className="w-5 h-5 stroke-[3]" />
                                </div>
                            )}
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3 leading-relaxed text-base font-medium">
                            {tool.short_description}
                        </p>


                        {/* Review Snippet (if available) */}
                        {tool.reviews && tool.reviews.length > 0 && (
                            <div
                                className="mt-auto mb-6 p-4 rounded-xl border shadow-sm backdrop-blur-sm"
                                style={{
                                    backgroundColor: `${dynamicColor}10`,
                                    borderColor: `${dynamicColor}20`
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 min-w-[20px]">
                                        <Sparkles className="w-4 h-4" style={{ color: dynamicColor }} />
                                    </div>
                                    <p className="text-sm italic font-medium" style={{ color: dynamicColor }}>
                                        "{tool.reviews[0].comment?.substring(0, 90)}..."
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="mt-auto flex flex-col gap-3">
                            <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
                                <span>Monthly Slots</span>
                                <span className="text-orange-500 font-bold">Only 2 spots left</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2 overflow-hidden">
                                <div className="bg-gradient-to-r from-orange-500 to-red-500 h-1.5 rounded-full w-[85%] animate-pulse" />
                            </div>

                            <div className="flex items-center gap-4">
                                <Link href={`/tool/${tool.slug}`} className="flex-1">
                                    <Button className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 h-12 text-base font-bold shadow-xl shadow-gray-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]">
                                        Get Started
                                        <ExternalLink className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>

                                <Link href={`/tool/${tool.slug}`}>
                                    <Button variant="outline" className="h-12 w-12 p-0 rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <Eye className="w-5 h-5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}
