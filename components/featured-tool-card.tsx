"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ToolWithRelations } from "@/lib/types"
import Link from "next/link"
import { motion } from "framer-motion"
import { ExternalLink, Star, Check, Zap, Eye, Sparkles } from "lucide-react"

interface FeaturedToolCardProps {
    tool: ToolWithRelations
    index?: number
}

export function FeaturedToolCard({ tool, index = 0 }: FeaturedToolCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="h-full"
        >
            <Card className="h-full bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-gray-800/50 border-2 border-purple-100 dark:border-purple-900/30 overflow-hidden group hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex flex-col md:flex-row h-full">
                    {/* Left: Image/Logo Area */}
                    <div className="w-full md:w-2/5 bg-gray-100 dark:bg-gray-800 relative min-h-[200px] md:min-h-full flex items-center justify-center p-6 overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600 via-gray-900 to-gray-900"></div>

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
                                <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-2 leading-tight">
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
                            {tool.is_verified && (
                                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-full shadow-sm" title="Verified">
                                    <Check className="w-6 h-6 stroke-[3]" />
                                </div>
                            )}
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3 leading-relaxed text-base font-medium">
                            {tool.short_description}
                        </p>


                        {/* Review Snippet (if available) */}
                        {tool.reviews && tool.reviews.length > 0 && (
                            <div className="mt-auto mb-6 bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-purple-100 dark:border-purple-900/20 shadow-sm backdrop-blur-sm">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 min-w-[20px]">
                                        <Sparkles className="w-4 h-4 text-purple-500" />
                                    </div>
                                    <p className="text-sm text-purple-900 dark:text-purple-200 italic font-medium">
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
