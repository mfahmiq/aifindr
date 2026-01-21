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
            <Card className="h-full bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-gray-800/50 border-2 border-purple-100 dark:border-purple-900/30 overflow-hidden group hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
                <div className="flex flex-col md:flex-row h-full">
                    {/* Left: Image/Logo Area */}
                    <div className="w-full md:w-2/5 bg-gray-100 dark:bg-gray-800 relative min-h-[200px] md:min-h-full flex items-center justify-center p-6 overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600 via-gray-900 to-gray-900"></div>

                        {/* Logo */}
                        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden shadow-2xl z-10 group-hover:scale-105 transition-transform duration-500">
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
                        <div className="absolute top-4 left-4 flex gap-2">
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none shadow-lg">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                Editor's Choice
                            </Badge>
                        </div>
                    </div>

                    {/* Right: Content Area */}
                    <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-2">
                                    {tool.name}
                                </h3>
                                <div className="flex items-center gap-2 mb-4">
                                    {tool.category && (
                                        <Badge variant="outline" className="text-xs">
                                            {tool.category.name}
                                        </Badge>
                                    )}
                                    {tool.rating && tool.rating > 0 && (
                                        <div className="flex items-center text-amber-500 text-sm font-bold">
                                            <Star className="w-4 h-4 fill-current mr-1" />
                                            {tool.rating}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {tool.is_verified && (
                                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-full" title="Verified">
                                    <Check className="w-5 h-5 stroke-[3]" />
                                </div>
                            )}
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3 leading-relaxed">
                            {tool.short_description}
                        </p>


                        {/* Review Snippet (if available) */}
                        {tool.reviews && tool.reviews.length > 0 && (
                            <div className="mt-auto mb-6 bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/20">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 min-w-[20px]">
                                        <Sparkles className="w-4 h-4 text-purple-500" />
                                    </div>
                                    <p className="text-sm text-purple-800 dark:text-purple-300 italic">
                                        "{tool.reviews[0].comment?.substring(0, 80)}..."
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="mt-auto flex items-center gap-4">
                            <Link href={`/tool/${tool.slug}`} className="flex-1">
                                <Button className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 h-12 text-base font-semibold shadow-xl shadow-gray-200 dark:shadow-none transition-all hover:translate-y-[-2px]">
                                    Visit Website
                                    <ExternalLink className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>

                            <Link href={`/tool/${tool.slug}`}>
                                <Button variant="outline" className="h-12 w-12 p-0 rounded-xl border-2">
                                    <Eye className="w-5 h-5" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}
