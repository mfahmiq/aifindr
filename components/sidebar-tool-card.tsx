"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ToolWithRelations } from "@/lib/types"
import Link from "next/link"
import { motion } from "framer-motion"
import { Star, ArrowUp, ExternalLink, ShieldCheck, Crown } from "lucide-react"

interface SidebarToolCardProps {
    tool: ToolWithRelations
    index?: number
    isFeatured?: boolean
}

export function SidebarToolCard({ tool, index = 0, isFeatured = false }: SidebarToolCardProps) {
    const isSponsor = tool.plan === 'Sponsor' || isFeatured

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="w-full"
        >
            <Card className={`
                flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                hover:shadow-md border
                ${isSponsor
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800/50'
                    : 'bg-card border-border hover:border-primary/30'
                }
            `}>
                {/* Logo */}
                <div className="shrink-0 relative">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border bg-white flex items-center justify-center">
                        {tool.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={tool.logo_url}
                                alt={tool.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-xs font-bold text-muted-foreground">
                                {tool.name.slice(0, 2)}
                            </div>
                        )}
                    </div>
                    {isSponsor && (
                        <div className="absolute -top-2 -right-2 text-amber-500 bg-white dark:bg-gray-800 rounded-full p-0.5 shadow-sm border border-amber-100 dark:border-amber-900">
                            <Crown className="w-3 h-3 fill-current" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5 gap-2">
                        <Link href={`/tool/${tool.slug}`} className="hover:underline decoration-primary/50 min-w-0 block">
                            <h4 className="font-semibold text-sm truncate">{tool.name}</h4>
                        </Link>
                        {/* Rating or Verified */}
                        {tool.rating ? (
                            <div className="flex items-center text-[10px] font-medium text-amber-500 shrink-0">
                                <Star className="w-3 h-3 fill-current mr-0.5" />
                                {tool.rating.toFixed(1)}
                            </div>
                        ) : tool.is_verified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">
                        {tool.short_description}
                    </p>

                    <div className="flex items-center justify-between">
                        {/* Pricing Badge (Mobile Traffic Light System) */}
                        <Badge variant="secondary" className={`
                            text-[10px] px-1.5 py-0 h-5 font-medium border-0
                            ${tool.pricing_type === 'Free' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                tool.pricing_type === 'Freemium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                                    tool.pricing_type === 'Paid' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
                                        'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'}
                        `}>
                            {tool.pricing_type || 'Unknown'}
                        </Badge>

                        {/* Visit Button Icon */}
                        <Link href={`/tool/${tool.slug}`} className="text-xs text-primary font-medium hover:text-primary/80 flex items-center">
                            View <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}
