"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
    Loader2,
    Mail
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useState, useEffect } from "react"
import { dealsService, DealWithTool } from "@/lib/services/dealsService"

export default function DealsPage() {
    const [deals, setDeals] = useState<DealWithTool[]>([])
    const [loading, setLoading] = useState(true)
    const [copiedCode, setCopiedCode] = useState<string | null>(null)
    const [email, setEmail] = useState("")
    const [subscribing, setSubscribing] = useState(false)
    const [subscribedSuccess, setSubscribedSuccess] = useState(false)

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

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setSubscribing(true)
        try {
            const res = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })

            if (res.ok) {
                setSubscribedSuccess(true)
                setEmail("")
            } else {
                const data = await res.json()
                alert(data.error || "Failed to subscribe")
            }
        } catch (error) {
            console.error("Newsletter error:", error)
            alert("Something went wrong. Please try again.")
        } finally {
            setSubscribing(false)
        }
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
                                                <div className="w-16 h-16 rounded-2xl bg-muted/60 dark:bg-zinc-900 flex items-center justify-center shadow-inner overflow-hidden border border-border dark:border-white/5 group-hover:border-primary/20 transition-colors">
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
                                                    <div className={`w-full h-full flex items-center justify-center font-bold text-xl text-primary/60 dark:text-white/90 bg-gradient-to-br from-muted to-muted/80 dark:from-gray-700 dark:to-gray-900 ${tool?.logo_url ? 'hidden' : ''}`}>
                                                        {tool?.name?.substring(0, 2).toUpperCase() || '??'}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors text-foreground">
                                                        {tool?.name || 'AI Tool'}
                                                    </CardTitle>
                                                    <Badge variant="secondary" className="mt-1 bg-primary/10 hover:bg-primary/20 border-primary/10 text-primary text-[10px] uppercase tracking-wider font-bold">
                                                        Deal
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="flex-1 space-y-4">
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] block">
                                                    Discount Detail
                                                </span>
                                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                                    {deal.description}
                                                </p>
                                            </div>

                                            {deal.code && (
                                                <div className="relative mt-4 p-4 rounded-xl bg-muted/50 dark:bg-black/40 border border-dashed border-border dark:border-white/20 group-hover:border-primary/40 transition-colors shadow-inner">
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest block">
                                                                Promo Code
                                                            </span>
                                                            <code className="font-mono font-black text-xl text-foreground dark:text-white tracking-widest">{deal.code}</code>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                copyCode(deal.code!);
                                                            }}
                                                            className={cn(
                                                                "h-9 px-4 bg-background dark:bg-white/10 hover:bg-muted dark:hover:bg-white/20 transition-all text-foreground dark:text-white border border-border dark:border-white/10",
                                                                copiedCode === deal.code && "bg-green-600 text-white hover:bg-green-700 border-0"
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
                                                        ? "bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20"
                                                        : "bg-muted/50 text-muted-foreground border border-border dark:border-white/5"
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
                    <Card className="bg-white dark:bg-zinc-900 text-foreground dark:text-white border border-border dark:border-0 overflow-hidden relative shadow-xl dark:shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 dark:bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32 opacity-50 dark:opacity-100" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[100px] -ml-32 -mb-32 opacity-50 dark:opacity-100" />

                        <CardContent className="py-16 text-center relative z-10">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            >
                                <Sparkles className="w-16 h-16 mx-auto mb-6 text-primary" />
                            </motion.div>
                            <h2 className="text-4xl font-black mb-4 tracking-tight">Want More Deals?</h2>
                            <p className="text-muted-foreground dark:text-gray-400 mb-10 max-w-lg mx-auto text-lg">
                                Subscribe to our newsletter and get exclusive, limited-time deals delivered straight to your inbox.
                            </p>

                            {subscribedSuccess ? (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 rounded-2xl p-6 max-w-md mx-auto"
                                >
                                    <div className="flex items-center justify-center gap-3 text-primary font-bold text-xl mb-2">
                                        <CheckCircle className="w-6 h-6" />
                                        Success!
                                    </div>
                                    <p className="text-muted-foreground dark:text-gray-300">You're now on the list. Keep an eye on your inbox!</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto px-4 md:px-0">
                                    <div className="flex-1 relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            type="email"
                                            placeholder="Enter your email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="h-14 pl-12 bg-muted/50 dark:bg-white/5 border-border dark:border-white/10 focus:border-primary/50 text-foreground dark:text-white rounded-2xl text-lg transition-all"
                                            required
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={subscribing}
                                        className="h-14 px-10 bg-primary hover:bg-primary/90 text-white dark:text-white rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(hsl(var(--primary)),0.2)] hover:shadow-[0_0_30px_rgba(hsl(var(--primary)),0.4)] transition-all shrink-0"
                                    >
                                        {subscribing ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                Subscribe Now
                                                <ArrowRight className="w-5 h-5 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            )}
                            <p className="text-xs text-muted-foreground/60 dark:text-gray-500 mt-6">
                                Join 1,000+ AI enthusiasts. No spam, ever. Unsubscribe at any time.
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
