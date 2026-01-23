"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { motion } from "framer-motion"
import {
    Bot,
    Image,
    Video,
    Code,
    Music,
    FileText,
    Mic,
    MessageSquare,
    Sparkles,
    ArrowRight,
    TrendingUp,
    Zap,
    Loader2
} from "lucide-react"
import { useState, useEffect } from "react"
import { categoriesService } from "@/lib/services/categoriesService"
import { Category } from "@/lib/types"

// Category configuration with icons, colors, and descriptions
const categoryConfig: Record<string, {
    icon: React.ElementType;
    gradient: string;
    bgGlow: string;
    description: string;
}> = {
    // Chat & Assistants
    'Chat': { icon: MessageSquare, gradient: 'from-blue-500 to-cyan-500', bgGlow: 'group-hover:shadow-blue-500/25', description: 'AI assistants & chatbots' },
    '#AI Chat & Assistant': { icon: MessageSquare, gradient: 'from-blue-500 to-cyan-500', bgGlow: 'group-hover:shadow-blue-500/25', description: 'AI assistants & chatbots' },
    '#ChatBots': { icon: Bot, gradient: 'from-indigo-500 to-blue-500', bgGlow: 'group-hover:shadow-indigo-500/25', description: 'Automated chat solutions' },
    '#Customer Support': { icon: MessageSquare, gradient: 'from-teal-500 to-cyan-500', bgGlow: 'group-hover:shadow-teal-500/25', description: 'AI-powered support tools' },

    // Image
    'Image': { icon: Image, gradient: 'from-purple-500 to-pink-500', bgGlow: 'group-hover:shadow-purple-500/25', description: 'AI image tools' },
    '#Image Generators': { icon: Image, gradient: 'from-purple-500 to-pink-500', bgGlow: 'group-hover:shadow-purple-500/25', description: 'Generate images with AI' },
    '#Image editing': { icon: Image, gradient: 'from-fuchsia-500 to-purple-500', bgGlow: 'group-hover:shadow-fuchsia-500/25', description: 'AI photo & image editing' },
    '#Art': { icon: Sparkles, gradient: 'from-pink-500 to-rose-500', bgGlow: 'group-hover:shadow-pink-500/25', description: 'AI art generation' },
    '#3D model': { icon: Image, gradient: 'from-violet-500 to-purple-500', bgGlow: 'group-hover:shadow-violet-500/25', description: '3D modeling with AI' },

    // Video
    'Video': { icon: Video, gradient: 'from-red-500 to-pink-500', bgGlow: 'group-hover:shadow-red-500/25', description: 'AI video creation' },
    '#Video Generators': { icon: Video, gradient: 'from-red-500 to-pink-500', bgGlow: 'group-hover:shadow-red-500/25', description: 'Generate videos with AI' },
    '#Text-to-video': { icon: Video, gradient: 'from-rose-500 to-red-500', bgGlow: 'group-hover:shadow-rose-500/25', description: 'Convert text to video' },
    '#Face Swap & DeepFake': { icon: Video, gradient: 'from-orange-500 to-red-500', bgGlow: 'group-hover:shadow-orange-500/25', description: 'Face swap & deepfake tools' },

    // Audio & Voice
    'Audio': { icon: Music, gradient: 'from-orange-500 to-amber-500', bgGlow: 'group-hover:shadow-orange-500/25', description: 'AI audio tools' },
    '#Music': { icon: Music, gradient: 'from-orange-500 to-amber-500', bgGlow: 'group-hover:shadow-orange-500/25', description: 'AI music generation' },
    '#Audio Editing': { icon: Music, gradient: 'from-yellow-500 to-orange-500', bgGlow: 'group-hover:shadow-yellow-500/25', description: 'AI audio editing' },
    '#Text To Speech': { icon: Mic, gradient: 'from-green-500 to-emerald-500', bgGlow: 'group-hover:shadow-green-500/25', description: 'Text to speech conversion' },
    '#Voice Cloning': { icon: Mic, gradient: 'from-teal-500 to-green-500', bgGlow: 'group-hover:shadow-teal-500/25', description: 'Clone voices with AI' },

    // Coding & Development
    'Coding': { icon: Code, gradient: 'from-green-500 to-emerald-500', bgGlow: 'group-hover:shadow-green-500/25', description: 'AI coding tools' },
    '#Developer Tools': { icon: Code, gradient: 'from-green-500 to-emerald-500', bgGlow: 'group-hover:shadow-green-500/25', description: 'Tools for developers' },
    '#Assistant Code': { icon: Code, gradient: 'from-lime-500 to-green-500', bgGlow: 'group-hover:shadow-lime-500/25', description: 'AI coding assistants' },
    '#Github Projects': { icon: Code, gradient: 'from-gray-600 to-gray-800', bgGlow: 'group-hover:shadow-gray-500/25', description: 'Open source AI projects' },
    '#LLM models': { icon: Bot, gradient: 'from-slate-500 to-gray-600', bgGlow: 'group-hover:shadow-slate-500/25', description: 'Large Language Models' },

    // Writing
    'Writing': { icon: FileText, gradient: 'from-cyan-500 to-teal-500', bgGlow: 'group-hover:shadow-cyan-500/25', description: 'AI writing tools' },
    '#E-mail': { icon: FileText, gradient: 'from-blue-400 to-cyan-500', bgGlow: 'group-hover:shadow-blue-400/25', description: 'AI email writing' },
    '#Summarizer': { icon: FileText, gradient: 'from-sky-500 to-blue-500', bgGlow: 'group-hover:shadow-sky-500/25', description: 'AI text summarization' },

    // Productivity
    'Productivity': { icon: Zap, gradient: 'from-yellow-500 to-orange-500', bgGlow: 'group-hover:shadow-yellow-500/25', description: 'Boost productivity with AI' },
    '#Automation': { icon: Zap, gradient: 'from-amber-500 to-yellow-500', bgGlow: 'group-hover:shadow-amber-500/25', description: 'AI automation tools' },
    '#Files & Spreadsheets': { icon: FileText, gradient: 'from-emerald-500 to-teal-500', bgGlow: 'group-hover:shadow-emerald-500/25', description: 'AI for files & data' },

    // Business
    '#Business': { icon: TrendingUp, gradient: 'from-blue-600 to-indigo-600', bgGlow: 'group-hover:shadow-blue-600/25', description: 'AI for business' },
    '#Marketing': { icon: TrendingUp, gradient: 'from-pink-500 to-rose-500', bgGlow: 'group-hover:shadow-pink-500/25', description: 'AI marketing tools' },
    '#E-commerce': { icon: Zap, gradient: 'from-green-500 to-teal-500', bgGlow: 'group-hover:shadow-green-500/25', description: 'AI for e-commerce' },
    '#Finance': { icon: TrendingUp, gradient: 'from-emerald-600 to-green-600', bgGlow: 'group-hover:shadow-emerald-600/25', description: 'AI finance tools' },
    '#Human Resources': { icon: Bot, gradient: 'from-violet-500 to-indigo-500', bgGlow: 'group-hover:shadow-violet-500/25', description: 'AI for HR' },

    // Data & Analytics
    '#Data & Analytics': { icon: TrendingUp, gradient: 'from-cyan-600 to-blue-600', bgGlow: 'group-hover:shadow-cyan-600/25', description: 'AI data analysis' },
    '#AI detection': { icon: Sparkles, gradient: 'from-red-500 to-orange-500', bgGlow: 'group-hover:shadow-red-500/25', description: 'Detect AI-generated content' },

    // Social & Entertainment
    '#AI Characters': { icon: Bot, gradient: 'from-purple-500 to-violet-500', bgGlow: 'group-hover:shadow-purple-500/25', description: 'AI character creation' },
    '#AI Girlfriend': { icon: MessageSquare, gradient: 'from-pink-400 to-rose-400', bgGlow: 'group-hover:shadow-pink-400/25', description: 'AI companion chat' },
    '#Dating & Relationships': { icon: MessageSquare, gradient: 'from-red-400 to-pink-400', bgGlow: 'group-hover:shadow-red-400/25', description: 'AI for dating' },
    '#Avatars': { icon: Bot, gradient: 'from-indigo-400 to-purple-400', bgGlow: 'group-hover:shadow-indigo-400/25', description: 'AI avatar generation' },
    '#Games': { icon: Zap, gradient: 'from-violet-500 to-purple-500', bgGlow: 'group-hover:shadow-violet-500/25', description: 'AI gaming tools' },
    '#AI Simulation': { icon: Bot, gradient: 'from-cyan-500 to-blue-500', bgGlow: 'group-hover:shadow-cyan-500/25', description: 'AI simulations' },

    // Education & Research
    '#Education / Studies': { icon: FileText, gradient: 'from-blue-500 to-indigo-500', bgGlow: 'group-hover:shadow-blue-500/25', description: 'AI for education' },
    '#Healthcare': { icon: Sparkles, gradient: 'from-red-500 to-rose-500', bgGlow: 'group-hover:shadow-red-500/25', description: 'AI healthcare tools' },
    '#Assistive technology (AT)': { icon: Bot, gradient: 'from-teal-500 to-cyan-500', bgGlow: 'group-hover:shadow-teal-500/25', description: 'Assistive AI technology' },

    // AI Agents & Tools
    '#AI Agents': { icon: Bot, gradient: 'from-violet-600 to-purple-600', bgGlow: 'group-hover:shadow-violet-600/25', description: 'Autonomous AI agents' },
    '#AI Useful': { icon: Zap, gradient: 'from-amber-500 to-orange-500', bgGlow: 'group-hover:shadow-amber-500/25', description: 'Useful AI utilities' },
    '#Extensions ChatGPT': { icon: Bot, gradient: 'from-green-600 to-emerald-600', bgGlow: 'group-hover:shadow-green-600/25', description: 'ChatGPT extensions' },
    '#Robots and Devices': { icon: Bot, gradient: 'from-slate-600 to-gray-600', bgGlow: 'group-hover:shadow-slate-600/25', description: 'AI robots & devices' },

    // Special Collections
    '#Latest AI': { icon: Sparkles, gradient: 'from-blue-500 to-purple-500', bgGlow: 'group-hover:shadow-blue-500/25', description: 'Latest AI tools' },
    '#Future Tools': { icon: Sparkles, gradient: 'from-violet-500 to-fuchsia-500', bgGlow: 'group-hover:shadow-violet-500/25', description: 'Cutting-edge AI tools' },
    '#Amazing': { icon: Sparkles, gradient: 'from-yellow-400 to-orange-400', bgGlow: 'group-hover:shadow-yellow-400/25', description: 'Amazing AI discoveries' },
    '#AIxploria Selection': { icon: Sparkles, gradient: 'from-amber-500 to-yellow-500', bgGlow: 'group-hover:shadow-amber-500/25', description: 'Curated AI selection' },

    // Fashion
    '#Fashion': { icon: Sparkles, gradient: 'from-pink-400 to-fuchsia-400', bgGlow: 'group-hover:shadow-pink-400/25', description: 'AI for fashion' },

    // Default fallback
    'default': { icon: Bot, gradient: 'from-primary to-purple-500', bgGlow: 'group-hover:shadow-primary/25', description: 'AI tools & utilities' },
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [totalTools, setTotalTools] = useState(0)

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoriesService.getCategoriesWithToolCount()
                setCategories(data)
                // Count total tools
                const total = data.reduce((sum, cat) => sum + (cat.tool_count || 0), 0)
                setTotalTools(total)
            } catch (error) {
                console.error('Error fetching categories:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchCategories()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 180, 360]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{
                            scale: [1.2, 1, 1.2],
                            rotate: [360, 180, 0]
                        }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-pink-500/10 to-orange-500/10 rounded-full blur-3xl"
                    />
                    {/* Grid pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:32px_32px]" />
                    {/* Bottom fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
                </div>

                <div className="container mx-auto px-4 py-16 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <Badge className="mb-4 px-4 py-1.5 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
                            <Sparkles className="w-3.5 h-3.5 mr-2 text-yellow-500" />
                            {categories.length} Categories • {totalTools}+ Tools
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                            Explore by{" "}
                            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                Category
                            </span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Find the perfect AI tool for your needs. Browse our curated collection
                            organized by category.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {/* Categories Grid */}
                {categories.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-bold mb-2">No Categories Found</h2>
                        <p className="text-muted-foreground">Categories will appear here once tools are added.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {categories.map((category, index) => {
                            const config = categoryConfig[category.name] || categoryConfig['default']
                            const IconComponent = config.icon

                            return (
                                <motion.div
                                    key={category.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.08 }}
                                    whileHover={{ y: -5 }}
                                >
                                    <Link href={`/?category=${encodeURIComponent(category.slug)}`}>
                                        <Card className={`group h-full overflow-hidden cursor-pointer border-2 border-muted/50 hover:border-primary/30 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-2xl ${config.bgGlow} transition-all duration-300`}>
                                            {/* Gradient top bar */}
                                            <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />

                                            <CardContent className="p-6">
                                                {/* Icon */}
                                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                                    <IconComponent className="w-8 h-8 text-white" />
                                                </div>

                                                {/* Title & Count */}
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                                                        {category.name}
                                                    </h3>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {category.tool_count || 0} tools
                                                    </Badge>
                                                </div>

                                                {/* Description */}
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    {category.description || config.description}
                                                </p>

                                                {/* CTA */}
                                                <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                                                    <span>Explore</span>
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </div>
                )}

                {/* Stats Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-16"
                >
                    <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 border-primary/20">
                        <CardContent className="py-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                                <div>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Sparkles className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="text-3xl font-bold">{totalTools}+</div>
                                    <div className="text-sm text-muted-foreground">Total Tools</div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Bot className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div className="text-3xl font-bold">{categories.length}</div>
                                    <div className="text-sm text-muted-foreground">Categories</div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div className="text-3xl font-bold">Daily</div>
                                    <div className="text-sm text-muted-foreground">Updates</div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Zap className="w-5 h-5 text-yellow-500" />
                                    </div>
                                    <div className="text-3xl font-bold">Free</div>
                                    <div className="text-sm text-muted-foreground">To Browse</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
