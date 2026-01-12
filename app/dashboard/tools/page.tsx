"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Package,
    Plus,
    Eye,
    Heart,
    Star,
    ArrowUpRight,
    ExternalLink,
    Settings,
    Loader2
} from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"

export default function DashboardToolsPage() {
    const [tools, setTools] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // In real app, fetch owned tools
        setLoading(false)
        setTools([])
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Tools</h1>
                    <p className="text-muted-foreground">Manage and monitor your AI tools</p>
                </div>
                <Link href="/submit">
                    <Button className="bg-gradient-to-r from-primary to-purple-500">
                        <Plus className="w-4 h-4 mr-2" />
                        Submit New Tool
                    </Button>
                </Link>
            </div>

            {/* Tools Grid */}
            {tools.length === 0 ? (
                <Card className="border-2">
                    <CardContent className="py-16 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
                            <Package className="w-10 h-10 text-purple-500" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No tools yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Submit your first AI tool or claim ownership of an existing tool to start managing it here.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Link href="/submit">
                                <Button size="lg">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Submit Tool
                                </Button>
                            </Link>
                            <Link href="/">
                                <Button variant="outline" size="lg">
                                    Browse & Claim
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tools.map((tool, index) => (
                        <motion.div
                            key={tool.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="border-2 hover:shadow-lg transition-all group">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                                            {tool.logo_url ? (
                                                <img src={tool.logo_url} alt={tool.name} className="w-10 h-10 rounded-lg" />
                                            ) : (
                                                <Package className="w-7 h-7 text-primary" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg truncate">{tool.name}</CardTitle>
                                            <CardDescription className="line-clamp-1">
                                                {tool.short_description}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <div className="text-center p-2 rounded-lg bg-muted/50">
                                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                                <Eye className="w-3 h-3" />
                                            </div>
                                            <div className="font-semibold">{tool.view_count || 0}</div>
                                            <div className="text-xs text-muted-foreground">Views</div>
                                        </div>
                                        <div className="text-center p-2 rounded-lg bg-muted/50">
                                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                                <Heart className="w-3 h-3" />
                                            </div>
                                            <div className="font-semibold">{tool.favorite_count || 0}</div>
                                            <div className="text-xs text-muted-foreground">Favorites</div>
                                        </div>
                                        <div className="text-center p-2 rounded-lg bg-muted/50">
                                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                                <Star className="w-3 h-3" />
                                            </div>
                                            <div className="font-semibold">{tool.rating?.toFixed(1) || '-'}</div>
                                            <div className="text-xs text-muted-foreground">Rating</div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Link href={`/tool/${tool.slug}`} className="flex-1">
                                            <Button variant="outline" size="sm" className="w-full">
                                                <ExternalLink className="w-3 h-3 mr-1" />
                                                View
                                            </Button>
                                        </Link>
                                        <Link href={`/dashboard/tools/${tool.slug}`} className="flex-1">
                                            <Button size="sm" className="w-full">
                                                <Settings className="w-3 h-3 mr-1" />
                                                Manage
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
