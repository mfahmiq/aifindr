"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ToolWithRelations } from "@/lib/types"
import Link from "next/link"
import { motion } from "framer-motion"
import {
    ExternalLink,
    Star,
    Check,
    ArrowUp,
    Zap,
    Eye,
    Sparkles
} from "lucide-react"
import { PLAN_NAMES } from "@/lib/constants"

interface ToolCardProps {
    tool: ToolWithRelations
    index?: number
}

export function ToolCard({ tool, index = 0 }: ToolCardProps) {
    const planValue = tool.plan || PLAN_NAMES.FREE
    const isSponsor = planValue === PLAN_NAMES.SPONSOR
    const isFeatured = planValue === PLAN_NAMES.FEATURED || isSponsor // Sponsor is also featured
    const isVerified = tool.is_verified
    const isPro = planValue === PLAN_NAMES.PRO

    // Premium badge configurations
    const getPremiumBadge = () => {
        if (isSponsor) return { label: 'Featured', gradient: 'text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500', iconColor: 'text-rose-500' }
        if (isFeatured) return { label: 'Featured', gradient: 'text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500', iconColor: 'text-purple-500' }
        if (isPro) return { label: 'Pro', gradient: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500', iconColor: 'text-blue-500' }
        return null
    }

    const premiumBadge = getPremiumBadge()

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -6 }}
            className="h-full"
        >
            <Card className={`
                relative h-full flex flex-col items-center p-5
                rounded-2xl
                transition-all duration-300
                group overflow-hidden
                ${isSponsor
                    ? 'rgb-border bg-transparent border-0 hover:shadow-lg'
                    : isFeatured
                        ? 'bg-white dark:bg-gray-900 border border-rose-100 dark:border-rose-900/30 shadow-[0_4px_20px_-2px_rgba(255,100,200,0.15)] hover:shadow-[0_8px_30px_-5px_rgba(255,100,200,0.25)]'
                        : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-md hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.3)]'
                }
            `}
            >
                {/* Glow Effect Background (Only if not sponsor, as sponsor has its own effect) */}
                {!isSponsor && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                )}

                {/* TOP Ribbon - Only for SPONSOR plan tools */}
                {/* This badge indicates premium Sponsor tier placement - highest visibility tier */}
                {/* TOP Ribbon - Only for SPONSOR plan tools */}
                {/* This badge indicates premium Sponsor tier placement - highest visibility tier */}
                {isSponsor && (
                    <div className="absolute top-0 right-0 z-50 pointer-events-none overflow-hidden w-20 h-20 rounded-tr-2xl">
                        <div className="absolute top-0 right-0 bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[10px] font-bold py-1 w-32 text-center transform translate-x-[30%] translate-y-[40%] rotate-45 shadow-sm uppercase tracking-widest animate-shine">
                            TOP
                        </div>
                    </div>
                )}


                {/* Top Row: Upvotes (Views can be tooltip or combined) & Featured Badge CENTERED */}
                <div className="w-full grid grid-cols-3 items-start mb-4 z-10 relative">
                    {/* Left: Stats */}
                    <div className="flex flex-col gap-1 justify-self-start">
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-bold text-sm">
                            <ArrowUp className="w-4 h-4 text-gray-400" />
                            <span>{tool.favorite_count || 0}</span>
                        </div>
                        {/* Views */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Eye className="w-3 h-3" />
                            <span>{tool.view_count || 0}</span>
                        </div>
                    </div>

                    {/* Center: Featured Badge (Gradient Text) */}
                    <div className="justify-self-center pt-0.5">
                        {premiumBadge && (
                            <div className="flex items-center gap-1.5 pointer-events-none">
                                <Star className={`w-4 h-4 ${premiumBadge.iconColor} fill-current`} />
                                <span className={`font-bold text-sm uppercase tracking-wide ${premiumBadge.gradient} whitespace-nowrap`}>
                                    {premiumBadge.label}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right: Pricing Type */}
                    {/* Added mr-12 when isSponsor to prevent overlap with TOP ribbon */}
                    <div className={`flex flex-col items-end gap-1 ${isSponsor ? 'mr-12' : ''}`}>
                        {tool.pricing_type && (
                            <Badge variant="secondary" className={`
                                text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 h-auto text-center min-w-[60px]
                                ${tool.pricing_type === 'Free' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50' :
                                    tool.pricing_type === 'Freemium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200/50' :
                                        tool.pricing_type === 'Paid' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200/50' :
                                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200/50'}
                            `}>
                                {tool.pricing_type}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Main Content: Logo, Name, Description */}
                <div className="flex-1 flex flex-col items-center text-center z-10 w-full px-2 mt-2">
                    {/* Logo */}
                    <div className="w-16 h-16 mb-4 rounded-full overflow-hidden shadow-md bg-white border border-gray-100 dark:border-gray-800">
                        {tool.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={tool.logo_url}
                                alt={tool.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement?.classList.add('fallback-icon');
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                                <Zap className="w-8 h-8" />
                            </div>
                        )}
                    </div>


                    {/* Name + Badges */}
                    <div className="flex flex-col items-center gap-2 mb-3">
                        <div className="flex items-center justify-center gap-2">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                {tool.name}
                            </h3>
                            {isVerified && (
                                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white shadow-sm shrink-0" title="Verified Tool">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                            )}
                        </div>

                        {/* Recommended Badge for High Rated Tools */}
                        {tool.rating && tool.rating > 4.8 && (
                            <div className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-orange-200 dark:border-orange-500/20 animate-shine">
                                <Sparkles className="w-3 h-3 fill-orange-500" />
                                <span>RECOMMENDED</span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 leading-relaxed px-2">
                        &laquo; {tool.short_description} &raquo;
                    </p>

                    {/* Social Proof: Best Review Snippet */}
                    {tool.reviews && tool.reviews.length > 0 && (
                        <div className="w-full px-2 mb-4">
                            {(() => {
                                // Find best review (5 stars, longest comment?) or just first 5 star
                                const bestReview = tool.reviews.filter(r => r.rating === 5 && r.comment && r.comment.length > 10).sort((a, b) => b.comment.length - a.comment.length)[0] || tool.reviews[0];

                                if (bestReview && bestReview.comment) {
                                    return (
                                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-lg p-2.5 relative">
                                            <div className="absolute -top-2 left-4 text-blue-300 dark:text-blue-800">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 16.6569 20.6739 18 19.017 18H16.017C15.4647 18 15.017 18.4477 15.017 19V21L14.017 21ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 16.6569 11.6735 18 10.0166 18H7.0166C6.46432 18 6.0166 18.4477 6.0166 19V21L5.0166 21Z" />
                                                </svg>
                                            </div>
                                            <p className="text-xs text-blue-800 dark:text-blue-300 italic line-clamp-2 leading-tight pt-1">
                                                "{bestReview.comment}"
                                            </p>
                                        </div>
                                    )
                                }
                                return null;
                            })()}
                        </div>
                    )}

                </div>
                {/* Footer: Visit Button */}
                <div className="w-full z-10 mt-auto">
                    <Link href={`/tool/${tool.slug}`} className="w-full block">
                        <Button className="w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold tracking-wide shadow-md shadow-blue-500/20 rounded-xl py-5 uppercase text-xs transition-transform active:scale-[0.98]">
                            <ExternalLink className="w-3.5 h-3.5 mr-2" />
                            Visit
                        </Button>
                    </Link>
                </div>
            </Card>
        </motion.div>
    )
}
