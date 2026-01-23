"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Search, Sparkles, Zap, Star, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function HeroSection() {

    const [searchQuery, setSearchQuery] = useState("")
    const router = useRouter()

    const handleSearch = () => {
        if (searchQuery.trim()) {
            // Check if we are already on homepage to simple update params or push
            const params = new URLSearchParams(window.location.search)
            params.set('search', searchQuery)
            params.delete('page') // Reset page on new search
            router.push(`/?${params.toString()}`)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    return (
        <div className="relative isolate overflow-hidden">
            {/* ... existing background code ... */}
            {/* Animated gradient background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30" />

                {/* Animated orbs */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-3xl opacity-30"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-br from-pink-400 to-orange-500 rounded-full blur-3xl opacity-30"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.3, 0.2],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-violet-400 to-indigo-500 rounded-full blur-3xl opacity-20"
                />

                {/* Grid pattern overlay with noise */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

                {/* Bottom fade gradient for smooth transition */}
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent" />
            </div>

            <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32 lg:py-40 text-center relative">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-primary/20 hover:bg-primary/10">
                        <Sparkles className="w-3.5 h-3.5 mr-2 text-yellow-500" />
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            🚀 20+ AI Tools & Growing
                        </span>
                    </Badge>
                </motion.div>

                {/* Main heading */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight">
                        <span className="text-foreground">Discover the</span>
                        <br />
                        <span className="relative">
                            <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                                Best AI Tools Directory
                            </span>
                            {/* Underline decoration */}
                            <motion.svg
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="absolute -bottom-2 left-0 w-full h-3"
                                viewBox="0 0 200 12"
                                fill="none"
                            >
                                <motion.path
                                    d="M2 8C50 4 150 4 198 8"
                                    stroke="url(#gradient)"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1, delay: 0.7 }}
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0" y1="0" x2="200" y2="0">
                                        <stop stopColor="#3B82F6" />
                                        <stop offset="0.5" stopColor="#8B5CF6" />
                                        <stop offset="1" stopColor="#EC4899" />
                                    </linearGradient>
                                </defs>
                            </motion.svg>
                        </span>
                    </h1>
                </motion.div>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                >
                    Curated directory of the most powerful AI tools to{" "}
                    <span className="font-semibold text-foreground">supercharge your workflow</span>.
                    Updated daily for creators, developers, and innovators.
                </motion.p>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-8 flex items-center justify-center gap-6 sm:gap-10 text-sm"
                >
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-background flex items-center justify-center text-white text-xs font-bold">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <span className="text-muted-foreground">10K+ Users</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-muted-foreground ml-1">4.9/5</span>
                    </div>
                </motion.div>

                {/* Search bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xl mx-auto"
                >
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search 20+ AI tools..."
                            className="pl-12 h-14 rounded-full border-2 border-primary/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary shadow-lg text-base"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <Button
                        size="lg"
                        className="w-full sm:w-auto rounded-full h-14 px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white border-0 shadow-xl shadow-purple-500/25 text-base font-semibold group"
                        onClick={handleSearch}
                    >
                        <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                        Explore
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </motion.div>

                {/* Popular tags */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm"
                >
                    <span className="text-muted-foreground">Popular:</span>
                    {['ChatGPT', 'Midjourney', 'Claude', 'Copilot', 'Runway'].map((tag, i) => (
                        <motion.button
                            key={tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.7 + i * 0.1 }}
                            className="px-3 py-1 rounded-full bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                        >
                            {tag}
                        </motion.button>
                    ))}
                </motion.div>
            </div>
        </div>
    )
}
