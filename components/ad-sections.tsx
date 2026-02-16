"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Sparkles, Zap, ArrowRight, ChevronRight, LayoutGrid, Globe, Shield, Star, Crown } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { adsService } from "@/lib/services/adsService"
import Link from "next/link"
import { Ad, AdWithLogo, ToolWithRelations } from "@/lib/types"

// Sponsor Tool Banner - Displays tools with Sponsor plan as promotional banners
import Image from "next/image"

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
                                <div className="relative w-8 h-8 shrink-0">
                                    <Image
                                        src={tool.logo_url}
                                        alt={tool.name}
                                        fill
                                        sizes="32px"
                                        className="rounded-lg object-cover"
                                        unoptimized={tool.logo_url.endsWith('.gif')} // Handle GIFs if needed, otherwise optional
                                    />
                                </div>
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
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform relative">
                                    {tool.logo_url ? (
                                        <Image
                                            src={tool.logo_url}
                                            alt={tool.name}
                                            fill
                                            sizes="40px"
                                            className="object-cover"
                                        />
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
            className="w-full relative z-50 mt-1"
        >
            <a
                href={ad.link_url || '#'}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="block group"
                onClick={() => adsService.trackClick(ad.id)}
            >
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white py-3.5 px-4 relative overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.4)] ring-1 ring-white/20">
                    {/* Pulsing light effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:animate-shimmer" />

                    <div className="container mx-auto flex items-center justify-center gap-6 text-sm relative">
                        <Badge variant="secondary" className="bg-white/30 text-white border-0 text-[10px] shrink-0 font-black tracking-widest uppercase px-2 py-0.5 animate-pulse shadow-sm">
                            ⚡ PROMOTED
                        </Badge>
                        <div className="flex items-center gap-4">
                            <h3 className="font-black text-lg tracking-tight group-hover:scale-105 transition-transform drop-shadow-md">
                                {ad.title}
                            </h3>
                            <div className="w-1.5 h-1.5 rounded-full bg-white/40 hidden sm:block" />
                            <span className="opacity-95 font-bold hidden sm:inline truncate max-w-sm tracking-tight">
                                {ad.description}
                            </span>
                        </div>
                        <Button
                            size="sm"
                            variant="secondary"
                            className="bg-white text-purple-700 hover:bg-white/90 font-black shrink-0 px-8 h-10 rounded-full shadow-2xl group-hover:shadow-purple-400/50 transition-all border-0 uppercase text-xs ring-2 ring-purple-100/50"
                        >
                            {ad.cta_text || 'TRY FREE'}
                            <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
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
            {(ads as AdWithLogo[]).map((ad, index) => (
                <motion.div
                    key={ad.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + (index * 0.1) }}
                    className="h-full"
                >
                    <Card className={`
                        relative h-full flex flex-col items-center p-5
                        rounded-3xl
                        transition-all duration-300 ease-out
                        group overflow-hidden
                        rgb-border bg-transparent border-0 shadow-lg
                    `}>
                        {/* Static decorative glow */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-colors" />

                        <CardContent className="p-0 flex flex-col items-center text-center z-10 w-full relative">
                            <div className="w-full flex justify-between mb-4">
                                <Badge variant="outline" className="text-[10px] text-primary border-primary/30 bg-primary/5 font-black uppercase tracking-widest px-2 py-0.5">
                                    SPONSORED
                                </Badge>
                                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                            </div>

                            <a
                                href={ad.link_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                className="block w-full flex flex-col items-center"
                                onClick={() => adsService.trackClick(ad.id)}
                            >
                                <div className="w-16 h-16 mb-4 rounded-full overflow-hidden shadow-md bg-white border border-gray-100 dark:border-gray-800 relative group-hover:scale-110 transition-transform duration-500">
                                    {ad.tool_logo_url || ad.image_url ? (
                                        <Image
                                            src={ad.tool_logo_url || ad.image_url || ''}
                                            alt={ad.title || ''}
                                            fill
                                            sizes="64px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center font-black text-primary text-xl">
                                            {ad.title?.substring(0, 2) || 'AD'}
                                        </div>
                                    )}
                                </div>

                                <h3 className="font-black text-lg text-gray-900 dark:text-white group-hover:text-primary transition-colors text-center line-clamp-2 mb-2">
                                    {ad.title}
                                </h3>

                                <div className="text-xs text-primary/80 font-black mt-1 uppercase tracking-tighter flex items-center gap-1.5 mb-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    EDITOR'S PICK
                                </div>

                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed line-clamp-3 font-medium px-2">
                                    &laquo; {ad.description} &raquo;
                                </p>

                                <Button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-primary hover:text-white dark:hover:bg-gray-200 dark:hover:text-slate-900 border-0 rounded-xl py-6 font-black tracking-wide transition-all shadow-none hover:shadow-lg hover:scale-[1.02] mt-auto">
                                    <Zap className="w-3.5 h-3.5 mr-2" />
                                    {ad.cta_text || 'ACCESS NOW'}
                                    <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
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
                <Card className="rounded-3xl border-2 border-dashed border-primary/20 hover:border-primary/50 bg-gradient-to-br from-primary/5 to-transparent transition-all duration-300">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">SPONSORED</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-white shadow-md border border-primary/10 flex items-center justify-center font-bold text-primary group-hover:scale-110 transition-transform overflow-hidden relative">
                                {ad.image_url ? (
                                    <Image
                                        src={ad.image_url}
                                        alt={ad.title || ''}
                                        fill
                                        sizes="48px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                        {ad.title?.substring(0, 2) || 'AD'}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold group-hover:text-primary transition-colors truncate">
                                    {ad.title}
                                </div>
                                <div className="text-xs text-muted-foreground truncate opacity-80">
                                    {ad.description?.substring(0, 30)}...
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-3 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 font-bold border-primary/20">
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
// Redesigned to EXACTLY match standard ToolCard layout for grid consistency
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

    // Use Tool data if available (Authoritative source), otherwise fallback to Ad manual data
    const displayAd = {
        ...ad,
        title: (ad as any).tool_name || ad.title,
        description: (ad as any).tool_description || ad.description,
        logo: (ad as any).tool_logo_url || (ad as any).image_url || ad.image_url,
        color: (ad as any).tool_dominant_color || '#8b5cf6'
    }

    const dynamicColor = displayAd.color || '#f59e0b'

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full"
        >
            <a
                href={ad.link_url || '#'}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="block h-full"
                onClick={() => adsService.trackClick(ad.id)}
            >
                <Card className={`
                    relative h-full flex flex-col items-center p-5
                    rounded-3xl
                    transition-all duration-300 ease-out
                    group overflow-hidden
                    bg-white dark:bg-gray-900/50 border border-amber-200 dark:border-amber-900/30 shadow-sm hover:shadow-xl hover:-translate-y-1
                `}>
                    {/* Glow Effect Background */}
                    <div
                        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                            backgroundImage: `linear-gradient(to top, #f59e0b15, transparent)`
                        }}
                    />

                    {/* Top Row: Header Info using Grid for true centering matching ToolCard */}
                    <div className="w-full grid grid-cols-3 items-start mb-4 z-10 relative">
                        {/* Left: Promoted Indicator (matches Vote area) */}
                        <div className="flex flex-col gap-1 justify-self-start">
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 font-bold text-xs uppercase tracking-wider">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Ad</span>
                            </div>
                        </div>

                        {/* Center Group: Badge (matches Premium Badge area) */}
                        <div className="flex flex-col items-center justify-start gap-1 justify-self-center pt-0.5 w-full">
                            <div className="flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-current animate-pulse" />
                                <span className="font-bold text-sm uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 whitespace-nowrap">
                                    Promoted
                                </span>
                            </div>
                        </div>

                        {/* Right: Badge (matches Pricing area) */}
                        <div className="justify-self-end flex flex-col items-end gap-1">
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 text-center min-w-[60px]">
                                Sponsor
                            </Badge>
                        </div>
                    </div>

                    {/* Main Content: Logo, Name, Description */}
                    <div className="flex-1 flex flex-col items-center text-center z-10 w-full px-2 mt-2">
                        {/* Logo */}
                        <div className="w-16 h-16 mb-4 rounded-full overflow-hidden shadow-md bg-white border border-gray-100 dark:border-gray-800 relative group-hover:scale-105 transition-transform duration-500">
                            {(ad as AdWithLogo).tool_logo_url || (ad as Ad).image_url ? (
                                <Image
                                    src={(ad as AdWithLogo).tool_logo_url || (ad as Ad).image_url || ''}
                                    alt={(ad as Ad).title || ''}
                                    fill
                                    sizes="64px"
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-amber-500/10 to-amber-500/5 flex items-center justify-center font-black text-amber-500 text-xl">
                                    {ad.title?.substring(0, 2) || 'AD'}
                                </div>
                            )}
                        </div>

                        {/* Name + Badges */}
                        <div className="flex flex-col items-center gap-2 mb-3">
                            <div className="flex items-center justify-center gap-2">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors text-center line-clamp-2">
                                    {ad.title}
                                </h3>
                                {/* Gold Shield for Sponsor Ad */}
                                <div className="relative shrink-0" title="Promoted Tool">
                                    <svg width="22" height="26" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                                        <path d="M11 1L21 5V12C21 18.5 16.5 23 11 25C5.5 23 1 18.5 1 12V5L11 1Z" fill="url(#goldGradient)" stroke="#B8860B" strokeWidth="0.5" />
                                        <path d="M11 1L21 5V12C21 18.5 16.5 23 11 25C5.5 23 1 18.5 1 12V5L11 1Z" fill="url(#goldShimmer)" style={{ mixBlendMode: 'overlay' }} />
                                        <path d="M6 15L8 10L11 13L14 10L16 15H6Z" fill="#FFF8DC" stroke="#B8860B" strokeWidth="0.3" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 leading-relaxed px-2">
                            &laquo; {displayAd.description} &raquo;
                        </p>
                    </div>

                    {/* Footer: Visit Button */}
                    <div className="w-full z-10 mt-auto pt-4 flex gap-2">
                        <Button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-400 dark:hover:text-slate-900 border-0 rounded-xl py-6 font-semibold tracking-wide transition-all shadow-none hover:shadow-lg hover:scale-[1.02]">
                            <ExternalLink className="w-3.5 h-3.5 mr-2" />
                            {ad.cta_text || 'Visit'}
                        </Button>
                        <Button variant="outline" className="h-full aspect-square rounded-xl px-3 hover:bg-gray-100 dark:hover:bg-gray-800 border-amber-200 dark:border-amber-900/30 text-amber-600" title="Promoted">
                            <Sparkles className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* SVG Defs for Shield (Required if not already in global scope) */}
                    {/* Since this is a separate component, we should include the defs locally or rely on them being in DOM. 
                        Safest to include locally with unique ID to avoid conflicts. */}
                    <svg width="0" height="0" className="absolute">
                        <defs>
                            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FFD700" />
                                <stop offset="50%" stopColor="#FFA500" />
                                <stop offset="100%" stopColor="#FF8C00" />
                            </linearGradient>
                            <linearGradient id="goldShimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="white" stopOpacity="0" />
                                <stop offset="50%" stopColor="white" stopOpacity="0.7" />
                                <stop offset="100%" stopColor="white" stopOpacity="0" />
                                <animate attributeName="x1" values="-100%; 200%" dur="2.5s" repeatCount="indefinite" />
                                <animate attributeName="x2" values="0%; 300%" dur="2.5s" repeatCount="indefinite" />
                            </linearGradient>
                        </defs>
                    </svg>
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
                <Card className="rounded-3xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white border-0 overflow-hidden relative shadow-2xl">
                    <div className="absolute inset-x-0 bottom-0 h-full bg-black/10 group-hover:bg-black/0 transition-colors" />
                    <CardContent className="p-10 text-center relative z-10">
                        <Badge className="bg-white/20 text-white border-0 mb-6 font-bold tracking-widest px-3 py-1">SPONSORED</Badge>
                        <h3 className="text-3xl font-black mb-3 tracking-tight">{ad.title}</h3>
                        <p className="text-white/95 mb-8 max-w-lg mx-auto font-medium leading-relaxed italic">&laquo; {ad.description} &raquo;</p>
                        <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-white/90 font-black px-10 h-14 rounded-2xl group-hover:scale-105 transition-transform shadow-xl">
                            {ad.cta_text || 'Get Started'}
                            <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </a>
        </motion.div>
    )
}
