"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
    Gift,
    Clock,
    Copy,
    ExternalLink,
    Sparkles,
    Zap,
    Tag,
    CheckCircle,
    Flame,
    ArrowRight,
    Percent,
    Loader2
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useState, useEffect } from "react"
import { dealsService, DealWithTool } from "@/lib/services/dealsService"

export default function DealsPage() {
    const [deals, setDeals] = useState<DealWithTool[]>([])
    const [loading, setLoading] = useState(true)
    const [copiedCode, setCopiedCode] = useState<string | null>(null)

    useEffect(() => {
        const fetchDeals = async () => {
            try {
                const data = await dealsService.getActiveDeals()
                setDeals(data)
            } catch (error) {
                console.error('Error fetching deals:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchDeals()
    }, [])

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code)
        setCopiedCode(code)
        setTimeout(() => setCopiedCode(null), 2000)
    }

    // Calculate days until expiry
    const getDaysUntil = (date?: string | null) => {
        if (!date) return null
        const diff = new Date(date).getTime() - new Date().getTime()
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

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
            <div className="relative bg-gradient-to-br from-red-500/10 via-orange-500/10 to-yellow-500/10 overflow-hidden">
                <div className="absolute inset-0">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 6, repeat: Infinity }}
                        className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-br from-red-500/40 to-orange-500/40 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 8, repeat: Infinity }}
                        className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-yellow-500/40 to-orange-500/40 rounded-full blur-3xl"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:32px_32px]" />
                    {/* Bottom fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
                </div>

                <div className="container mx-auto px-4 py-16 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="inline-block mb-4"
                        >
                            <Badge className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 text-sm">
                                <Flame className="w-4 h-4 mr-2" />
                                Hot Deals Inside!
                            </Badge>
                        </motion.div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                            <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                                Exclusive Deals
                            </span>
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Save money with exclusive discounts and special offers on premium AI tools.
                        </p>
                        <div className="flex items-center justify-center gap-4 mt-6">
                            <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                                <Tag className="w-4 h-4 text-red-500" />
                                <span className="font-semibold">{deals.length} Active Deals</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                                <Percent className="w-4 h-4 text-green-500" />
                                <span className="font-semibold">Up to 50% Off</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto py-12 px-4 max-w-6xl">
                {deals.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="p-12 text-center bg-gradient-to-br from-red-50/50 via-orange-50/30 to-yellow-50/50 dark:from-red-900/10 dark:via-orange-900/10 dark:to-yellow-900/10 border-2 border-dashed border-orange-200 dark:border-orange-800">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <Gift className="w-20 h-20 mx-auto text-orange-400 mb-6" />
                            </motion.div>
                            <h2 className="text-2xl font-bold mb-3">No Deals Available Yet</h2>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                We're working on bringing you exclusive discounts and special offers on top AI tools. Check back soon!
                            </p>
                            <Button variant="outline" className="border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20" asChild>
                                <Link href="/">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Browse AI Tools
                                </Link>
                            </Button>
                        </Card>
                    </motion.div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {deals.map((deal, index) => {
                            const tool = deal.tools
                            const daysLeft = getDaysUntil(deal.expires_at)

                            return (
                                <motion.div
                                    key={deal.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group"
                                >
                                    <Card className="h-full flex flex-col overflow-hidden border-0 bg-card shadow-lg hover:shadow-2xl transition-all duration-300 relative">
                                        {/* Discount Header Banner */}
                                        <div className="bg-gradient-to-r from-[#ff4d4d] via-[#f97316] to-[#fbbf24] text-white px-4 py-3 text-center relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                            <div className="font-bold text-lg relative flex items-center justify-center gap-2 drop-shadow-sm">
                                                <motion.div
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                >
                                                    <Zap className="w-5 h-5 fill-current" />
                                                </motion.div>
                                                {deal.discount || 'Special Offer'}
                                            </div>
                                        </div>

                                        <CardHeader className="pb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] flex items-center justify-center shadow-inner overflow-hidden border border-white/5 group-hover:border-white/10 transition-colors">
                                                    {tool?.logo_url ? (
                                                        <img
                                                            src={tool.logo_url}
                                                            alt={tool.name}
                                                            className="w-full h-full object-contain p-2"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className={`w-full h-full flex items-center justify-center font-bold text-xl text-white/90 bg-gradient-to-br from-gray-700 to-gray-900 ${tool?.logo_url ? 'hidden' : ''}`}>
                                                        {tool?.name?.substring(0, 2).toUpperCase() || '??'}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                                                        {tool?.name || 'AI Tool'}
                                                    </CardTitle>
                                                    <Badge variant="secondary" className="mt-1 bg-white/5 hover:bg-white/10 border-white/10 text-[10px] uppercase tracking-wider">
                                                        Deal
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="flex-1 space-y-4">
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] block">
                                                    Discount
                                                </span>
                                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                                    {deal.description}
                                                </p>
                                            </div>

                                            {deal.code && (
                                                <div className="relative mt-4 p-4 rounded-xl bg-black/40 border border-dashed border-white/10 group-hover:border-primary/30 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] font-bold text-[#f97316] uppercase tracking-widest block">
                                                                Promo Code
                                                            </span>
                                                            <code className="font-mono font-black text-xl text-white tracking-widest">{deal.code}</code>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                copyCode(deal.code!);
                                                            }}
                                                            className={cn(
                                                                "h-9 px-4 bg-white/5 hover:bg-white/10 transition-all",
                                                                copiedCode === deal.code && "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                                            )}
                                                        >
                                                            {copiedCode === deal.code ? (
                                                                <>
                                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                                    Copied
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="w-4 h-4 mr-2" />
                                                                    Copy
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>

                                        <CardFooter className="flex-col gap-4 pt-2">
                                            {daysLeft && daysLeft > 0 && (
                                                <div className={cn(
                                                    "flex items-center gap-2 text-xs w-full px-4 py-2.5 rounded-full font-medium transition-colors",
                                                    daysLeft <= 3
                                                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                                        : "bg-white/5 text-muted-foreground border border-white/5"
                                                )}>
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>
                                                        {daysLeft <= 3 ? 'ENDING SOON: ' : ''}
                                                        Expires in {daysLeft} days
                                                    </span>
                                                </div>
                                            )}
                                            <Button
                                                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#ff4d4d] to-[#f97316] hover:opacity-90 transition-all text-white font-bold group/btn shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] border-0"
                                                asChild
                                            >
                                                <Link href={deal.affiliate_url || (tool?.slug ? `/tool/${tool.slug}` : '#')} target="_blank">
                                                    <ExternalLink className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                                                    Claim Deal
                                                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                                </Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </div>
                )}

                {/* CTA for more deals */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-16"
                >
                    <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 border-2 border-primary/20 overflow-hidden">
                        <CardContent className="py-12 text-center relative">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-2xl" />
                            <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
                            <h2 className="text-3xl font-bold mb-3">Want More Deals?</h2>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                Subscribe to our newsletter and get exclusive deals delivered to your inbox.
                            </p>
                            <Button size="lg" className="bg-gradient-to-r from-primary to-purple-500">
                                <Gift className="w-5 h-5 mr-2" />
                                Subscribe for Deals
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
