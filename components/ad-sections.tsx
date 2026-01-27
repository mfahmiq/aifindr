"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Sparkles, Zap, ArrowRight, Crown, Star } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { adsService, Ad } from "@/lib/services/adsService"
import Link from "next/link"
import { ToolWithRelations } from "@/lib/types"

// Sponsor Tool Banner - Displays tools with Sponsor plan as promotional banners
export function SponsorToolBanner({ excludeToolId }: { excludeToolId?: string }) {
    const [tools, setTools] = useState<ToolWithRelations[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        const fetchSponsorTools = async () => {
            try {
                // Fetch tools with Sponsor plan
                const res = await fetch('/api/tools?plan=Sponsor&limit=5')
                if (res.ok) {
                    const data = await res.json()
                    // Filter out the current tool if provided
                    const filteredTools = excludeToolId
                        ? data.tools.filter((t: ToolWithRelations) => t.id !== excludeToolId)
                        : data.tools
                    setTools(filteredTools)
                }
            } catch (error) {
                console.error('Error fetching sponsor tools:', error)
            }
        }
        fetchSponsorTools()
    }, [excludeToolId])

    // Rotate through sponsor tools every 5 seconds
    useEffect(() => {
        if (tools.length <= 1) return
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % tools.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [tools.length])

    if (tools.length === 0) return null

    const tool = tools[currentIndex]

    return (
        <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
        >
            <Link href={`/tool/${tool.slug}`} className="block group">
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white py-3 px-4 relative overflow-hidden">
                    {/* Animated background effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                    <div className="container mx-auto flex items-center justify-center gap-4 text-sm relative">
                        <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px] shrink-0 flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Sponsor
                        </Badge>
                        <div className="flex items-center gap-3">
                            {tool.logo_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={tool.logo_url} alt={tool.name} className="w-8 h-8 rounded-lg object-cover" />
                            )}
                            <span className="font-bold text-base">
                                {tool.name}
                            </span>
                            <span className="opacity-90 hidden sm:inline">
                                — {tool.short_description}
                            </span>
                        </div>
                        <Button
                            size="sm"
                            variant="secondary"
                            className="bg-white text-orange-600 hover:bg-white/90 font-semibold shrink-0 group-hover:scale-105 transition-transform"
                        >
                            View Tool
                            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>

                    {/* Tool count indicator */}
                    {tools.length > 1 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                            {tools.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentIndex ? 'bg-white' : 'bg-white/40'
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </Link>
        </motion.div>
    )
}

// Sponsor Sidebar Card - For tool detail pages
export function SponsorSidebarCard({ excludeToolId }: { excludeToolId?: string }) {
    const [tools, setTools] = useState<ToolWithRelations[]>([])

    useEffect(() => {
        const fetchSponsorTools = async () => {
            try {
                const res = await fetch('/api/tools?plan=Sponsor&limit=3')
                if (res.ok) {
                    const data = await res.json()
                    const filteredTools = excludeToolId
                        ? data.tools.filter((t: ToolWithRelations) => t.id !== excludeToolId)
                        : data.tools
                    setTools(filteredTools.slice(0, 2))
                }
            } catch (error) {
                console.error('Error fetching sponsor tools:', error)
            }
        }
        fetchSponsorTools()
    }, [excludeToolId])

    if (tools.length === 0) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
        >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="w-3 h-3 text-amber-500" />
                <span>Sponsored Tools</span>
            </div>
            {tools.map((tool) => (
                <Link key={tool.id} href={`/tool/${tool.slug}`} className="block group">
                    <Card className="border-2 border-amber-500/20 hover:border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-transparent transition-all duration-300">
                        <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                                    {tool.logo_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={tool.logo_url} alt={tool.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Zap className="w-5 h-5 text-amber-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm group-hover:text-amber-600 transition-colors truncate">
                                        {tool.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {tool.short_description}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </motion.div>
    )
}

// Premium Top Banner - Highest visibility, appears below navbar on all pages
export function TopBannerAd() {
    const [ad, setAd] = useState<Ad | null>(null)

    useEffect(() => {
        const fetchAd = async () => {
            try {
                const data = await adsService.getActiveAdByPlacement('banner')
                setAd(data)
            } catch (error) {
                console.error('Error fetching banner ad:', error)
            }
        }
        fetchAd()
    }, [])

    if (!ad) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
        >
            <a
                href={ad.link_url || '#'}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="block group"
                onClick={() => adsService.trackClick(ad.id)}
            >
                <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white py-3 px-4 relative overflow-hidden">
                    {/* Animated background effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                    <div className="container mx-auto flex items-center justify-center gap-4 text-sm relative">
                        <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px] shrink-0">
                            ✨ Sponsored
                        </Badge>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-base">
                                {ad.title}
                            </span>
                            <span className="opacity-90 hidden sm:inline">
                                — {ad.description}
                            </span>
                        </div>
                        <Button
                            size="sm"
                            variant="secondary"
                            className="bg-white text-purple-600 hover:bg-white/90 font-semibold shrink-0 group-hover:scale-105 transition-transform"
                        >
                            {ad.cta_text || 'Learn More'}
                            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            </a>
        </motion.div>
    )
}

// Sidebar Ad - High engagement, sticky position
export function SidebarAd() {
    const [ads, setAds] = useState<Ad[]>([])

    useEffect(() => {
        const fetchAds = async () => {
            try {
                // Fetch up to max slots
                const data = await adsService.getAdsForDisplay('sidebar')
                setAds(data)
            } catch (error) {
                console.error('Error fetching sidebar ads:', error)
            }
        }
        fetchAds()
    }, [])

    if (ads.length === 0) return null

    return (
        <div className="space-y-6">
            {ads.map((ad, index) => (
                <motion.div
                    key={ad.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + (index * 0.1) }}
                >
                    <Card className="overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-background shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                <Badge variant="outline" className="text-[10px] text-primary border-primary/30 bg-primary/5">
                                    Featured Sponsor
                                </Badge>
                            </div>
                            <a
                                href={ad.link_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                className="block"
                                onClick={() => adsService.trackClick(ad.id)}
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/40 to-primary/20 flex items-center justify-center font-bold text-primary text-xl shadow-md group-hover:scale-110 transition-transform overflow-hidden">
                                        {ad.image_url ? (
                                            <img src={ad.image_url} alt={ad.title || ''} className="w-full h-full object-cover" />
                                        ) : (
                                            ad.title?.substring(0, 2) || 'AD'
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg group-hover:text-primary transition-colors">
                                            {ad.title}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {ad.description?.substring(0, 40)}...
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {ad.description}
                                </p>
                                <Button className="w-full group-hover:bg-primary/90" size="lg">
                                    <Zap className="w-4 h-4 mr-2" />
                                    {ad.cta_text || 'Try Now'}
                                    <ExternalLink className="w-3 h-3 ml-2" />
                                </Button>
                            </a>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    )
}

// Compact Sidebar Ad for Tool Detail pages
export function CompactSidebarAd() {
    const [ad, setAd] = useState<Ad | null>(null)

    useEffect(() => {
        const fetchAd = async () => {
            try {
                const data = await adsService.getActiveAdByPlacement('sidebar')
                setAd(data)
            } catch (error) {
                console.error('Error fetching sidebar ad:', error)
            }
        }
        fetchAd()
    }, [])

    if (!ad) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
        >
            <a
                href={ad.link_url || '#'}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="block group"
                onClick={() => adsService.trackClick(ad.id)}
            >
                <Card className="border-2 border-dashed border-primary/20 hover:border-primary/50 bg-gradient-to-br from-primary/5 to-transparent transition-all duration-300">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sponsored</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-bold text-primary group-hover:scale-110 transition-transform overflow-hidden">
                                {ad.image_url ? (
                                    <img src={ad.image_url} alt={ad.title || ''} className="w-full h-full object-cover" />
                                ) : (
                                    ad.title?.substring(0, 2) || 'AD'
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold group-hover:text-primary transition-colors">
                                    {ad.title}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                    {ad.description?.substring(0, 30)}...
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {ad.cta_text || 'Learn More'}
                            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardContent>
                </Card>
            </a>
        </motion.div>
    )
}

// Inline Ad - Appears between tool cards (maximum exposure)
export function InlineToolAd({ adData }: { adData?: Ad }) {
    const [ad, setAd] = useState<Ad | null>(adData || null)

    useEffect(() => {
        if (adData) {
            setAd(adData)
            return
        }

        const fetchAd = async () => {
            try {
                const data = await adsService.getActiveAdByPlacement('inline')
                setAd(data)
            } catch (error) {
                console.error('Error fetching inline ad:', error)
            }
        }
        fetchAd()
    }, [adData])

    if (!ad) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-1 h-full"
        >
            <a
                href={ad.link_url || '#'}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="block h-full"
                onClick={() => adsService.trackClick(ad.id)}
            >
                <Card className="h-full border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background hover:shadow-lg transition-all group overflow-hidden relative">
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                    <CardContent className="p-4 h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[10px]">
                                ⭐ Promoted
                            </Badge>
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-bold text-primary text-lg group-hover:scale-110 transition-transform overflow-hidden">
                                {ad.image_url ? (
                                    <img src={ad.image_url} alt={ad.title || ''} className="w-full h-full object-cover" />
                                ) : (
                                    ad.title?.substring(0, 2) || 'AD'
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold group-hover:text-primary transition-colors">
                                    {ad.title}
                                </h3>
                                <Badge variant="outline" className="text-[10px]">AI Tool</Badge>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground flex-1 line-clamp-2 mb-3">
                            {ad.description}
                        </p>

                        <Button className="w-full" size="sm">
                            <Zap className="w-3 h-3 mr-1" />
                            {ad.cta_text || 'Try Now'}
                        </Button>
                    </CardContent>
                </Card>
            </a>
        </motion.div>
    )
}

// Footer CTA Ad - Last chance to convert
export function FooterCtaAd() {
    const [ad, setAd] = useState<Ad | null>(null)

    useEffect(() => {
        const fetchAd = async () => {
            try {
                const data = await adsService.getActiveAdByPlacement('footer')
                setAd(data)
            } catch (error) {
                console.error('Error fetching footer ad:', error)
            }
        }
        fetchAd()
    }, [])

    if (!ad) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="my-12"
        >
            <a
                href={ad.link_url || '#'}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="block group"
                onClick={() => adsService.trackClick(ad.id)}
            >
                <Card className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white border-0 overflow-hidden relative">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    <CardContent className="p-8 text-center relative">
                        <Badge className="bg-white/20 text-white border-0 mb-4">Sponsored</Badge>
                        <h3 className="text-2xl font-bold mb-2">{ad.title}</h3>
                        <p className="text-white/90 mb-6 max-w-lg mx-auto">{ad.description}</p>
                        <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-white/90 font-bold group-hover:scale-105 transition-transform">
                            {ad.cta_text || 'Get Started'}
                            <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </a>
        </motion.div>
    )
}
