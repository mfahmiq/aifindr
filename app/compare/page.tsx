"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/star-rating"
import {
    Plus,
    X,
    ExternalLink,
    Check,
    Minus,
    ArrowLeft,
    BarChart3,
    Sparkles,
    Zap,
    ArrowRight,
    Loader2
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toolsService } from "@/lib/services/toolsService"
import { ToolWithRelations } from "@/lib/types"
import { appendUTMParams } from "@/lib/utm"

export default function ComparePage() {
    const [tools, setTools] = useState<ToolWithRelations[]>([])
    const [selectedTools, setSelectedTools] = useState<ToolWithRelations[]>([])
    const [showSelector, setShowSelector] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTools = async () => {
            try {
                const { tools } = await toolsService.getTools({ limit: 50 })
                setTools(tools)
            } catch (error) {
                console.error('Error fetching tools:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchTools()
    }, [])

    const addTool = (tool: ToolWithRelations) => {
        if (selectedTools.length < 3 && !selectedTools.find(t => t.id === tool.id)) {
            setSelectedTools([...selectedTools, tool])
        }
        setShowSelector(false)
    }

    const removeTool = (toolId: string) => {
        setSelectedTools(selectedTools.filter(t => t.id !== toolId))
    }

    const availableTools = tools.filter(t => !selectedTools.find(s => s.id === t.id))

    const getCategoryName = (tool: ToolWithRelations) => {
        if (tool.category && typeof tool.category === 'object') return tool.category.name
        return 'AI Tool'
    }

    const compareFields = [
        { label: 'Category', key: 'category', isCategory: true },
        { label: 'Pricing', key: 'pricing_type' },
        { label: 'Rating', key: 'rating', isRating: true },
        { label: 'Reviews', key: 'review_count' },
        { label: 'Verified', key: 'is_verified', isBoolean: true },
        { label: 'Featured', key: 'is_featured', isBoolean: true },
    ]

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
            <div className="relative bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 overflow-hidden">
                <div className="absolute inset-0">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
                        transition={{ duration: 8, repeat: Infinity }}
                        className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.3, 0.2] }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:32px_32px]" />
                    {/* Bottom fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
                </div>

                <div className="container mx-auto px-4 py-12 relative">
                    <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Directory
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <Badge className="mb-4 px-4 py-1.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-500/30">
                            <BarChart3 className="w-3.5 h-3.5 mr-2 text-blue-500" />
                            <span className="text-blue-600 dark:text-blue-400">Side-by-Side Comparison</span>
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                            <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                                Compare
                            </span>{" "}
                            AI Tools
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Select up to 3 tools to compare features, pricing, and ratings side by side.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto py-12 px-4 max-w-6xl">
                {/* Tool Selection Slots */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[0, 1, 2].map((slot) => (
                        <motion.div key={slot} layout>
                            {selectedTools[slot] ? (
                                <Card className="relative border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute right-2 top-2 h-8 w-8 hover:bg-red-500/10 hover:text-red-500"
                                        onClick={() => removeTool(selectedTools[slot].id)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                    <CardHeader className="text-center pb-2">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-bold text-primary text-2xl mx-auto mb-3 shadow-lg overflow-hidden">
                                            {selectedTools[slot].logo_url ? (
                                                <img
                                                    src={selectedTools[slot].logo_url}
                                                    alt={selectedTools[slot].name}
                                                    referrerPolicy="no-referrer"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                selectedTools[slot].name.substring(0, 2)
                                            )}
                                        </div>
                                        <CardTitle className="text-xl">{selectedTools[slot].name}</CardTitle>
                                        <Badge className="mx-auto mt-2" variant="outline">{getCategoryName(selectedTools[slot])}</Badge>
                                    </CardHeader>
                                </Card>
                            ) : (
                                <Card
                                    className="border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                                    onClick={() => setShowSelector(true)}
                                >
                                    <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                                            <Plus className="w-8 h-8 group-hover:text-primary transition-colors" />
                                        </div>
                                        <span className="font-medium group-hover:text-primary transition-colors">Add Tool</span>
                                        <span className="text-xs mt-1">Click to select</span>
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Tool Selector Modal */}
                <AnimatePresence>
                    {showSelector && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowSelector(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-card border-2 rounded-2xl shadow-2xl max-w-md w-full max-h-[60vh] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-primary" />
                                        Select a Tool
                                    </h3>
                                </div>
                                <div className="overflow-y-auto max-h-[50vh] p-4 space-y-2">
                                    {availableTools.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">No more tools available</p>
                                    ) : (
                                        availableTools.map(tool => (
                                            <div
                                                key={tool.id}
                                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 cursor-pointer transition-colors border border-transparent hover:border-primary/20"
                                                onClick={() => addTool(tool)}
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary overflow-hidden">
                                                    {tool.logo_url ? (
                                                        <img
                                                            src={tool.logo_url}
                                                            alt={tool.name}
                                                            referrerPolicy="no-referrer"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        tool.name.substring(0, 2)
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-semibold">{tool.name}</div>
                                                    <div className="text-xs text-muted-foreground">{getCategoryName(tool)}</div>
                                                </div>
                                                <Badge variant="outline">{tool.pricing_type}</Badge>
                                                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Comparison Table */}
                {selectedTools.length >= 2 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8"
                    >
                        <Card className="border-2 overflow-hidden shadow-xl">
                            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                            <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-primary" />
                                    Feature Comparison
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b bg-muted/30">
                                                <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Feature</th>
                                                {selectedTools.map(tool => (
                                                    <th key={tool.id} className="text-center py-4 px-6 font-bold text-lg">
                                                        {tool.name}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {compareFields.map((field, i) => (
                                                <tr key={field.key} className={`border-b last:border-0 ${i % 2 === 0 ? 'bg-muted/10' : ''}`}>
                                                    <td className="py-4 px-6 font-medium">{field.label}</td>
                                                    {selectedTools.map(tool => {
                                                        let value: any = tool[field.key as keyof ToolWithRelations]

                                                        // Handle category specially
                                                        if (field.isCategory) {
                                                            value = getCategoryName(tool)
                                                        }

                                                        return (
                                                            <td key={tool.id} className="text-center py-4 px-6">
                                                                {field.isRating && typeof value === 'number' ? (
                                                                    <div className="flex justify-center">
                                                                        <StarRating rating={value} size="sm" showValue />
                                                                    </div>
                                                                ) : field.isBoolean ? (
                                                                    value ? (
                                                                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                                                                            <Check className="w-5 h-5 text-green-500" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mx-auto">
                                                                            <Minus className="w-5 h-5 text-muted-foreground/30" />
                                                                        </div>
                                                                    )
                                                                ) : (
                                                                    <Badge variant="secondary">{String(value ?? '-')}</Badge>
                                                                )}
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                            <tr className="bg-gradient-to-r from-primary/5 to-primary/10">
                                                <td className="py-6 px-6 font-semibold">Visit Website</td>
                                                {selectedTools.map(tool => (
                                                    <td key={tool.id} className="text-center py-6 px-6">
                                                        <Button asChild className="bg-gradient-to-r from-primary to-purple-500">
                                                            <a href={appendUTMParams(tool.website_url || '', { enabled: true, source: 'indoai', medium: 'compare', campaign: tool.name.toLowerCase().replace(/\s+/g, '-') })} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                                Visit
                                                            </a>
                                                        </Button>
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {selectedTools.length < 2 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <p className="text-lg text-muted-foreground">Select at least 2 tools to start comparing</p>
                        <p className="text-sm text-muted-foreground mt-2">Click the "Add Tool" cards above</p>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
