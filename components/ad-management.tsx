"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Sparkles,
    Megaphone,
    Calendar,
    Check,
    AlertCircle,
    Loader2,
    Plus,
    Layout,
    PanelLeft,
    Monitor,
    List,
    MousePointer,
    Eye,
    Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { adsService, ActiveAd } from "@/lib/services/adsService"
import { ToolWithRelations } from "@/lib/types"
import { cn } from "@/lib/utils"
import { format, addDays } from "date-fns"

interface AdManagementProps {
    tool: ToolWithRelations
}

// Pricing Configuration (Mocked based on screenshot)
const PLACEMENTS = [
    {
        id: 'sidebar',
        title: 'Sidebar Banner',
        description: 'Appears on tool detail pages',
        price: 150000,
        extensionPrice: 49000,
        icon: PanelLeft,
        baseIncluded: true,
        maxSlots: 5
    },
    {
        id: 'navbar',
        title: 'Navbar Premium',
        description: 'Top of homepage navigation',
        price: 250000,
        extensionPrice: 99000,
        icon: Layout,
        baseIncluded: true,
        maxSlots: 2
    },
    {
        id: 'top_banner', // 'Hero Banner' in screenshot
        title: 'Hero Banner',
        description: 'Large banner on homepage',
        price: 1000000,
        extensionPrice: 299000,
        icon: Monitor,
        baseIncluded: true,
        maxSlots: 1
    },
    {
        id: 'inline',
        title: 'Inline Feed',
        description: 'Within tools listing grid',
        price: 75000,
        extensionPrice: 29000,
        icon: List,
        baseIncluded: true,
        maxSlots: 3
    }
]

export function AdManagement({ tool }: AdManagementProps) {
    const [view, setView] = useState<'list' | 'create'>('list')
    const [ads, setAds] = useState<ActiveAd[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)

    // List only valid placements to prevent errors if invalid string is in DB
    const VALID_PLACEMENTS = ['sidebar', 'navbar', 'top_banner', 'inline']

    // Form State
    const [selectedPlacement, setSelectedPlacement] = useState<string>(() => {
        if (tool.ad_placement && VALID_PLACEMENTS.includes(tool.ad_placement)) {
            return tool.ad_placement
        }
        return 'sidebar'
    })

    const [duration, setDuration] = useState<number>(30)
    const [creating, setCreating] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        ctaText: 'Learn More',
        imageFile: null as File | null,
        imageUrl: '' // Only if they want to use existing or external URL
    })

    useEffect(() => {
        fetchAds()
        // If tool.ad_placement updates, sync it
        if (tool.ad_placement && VALID_PLACEMENTS.includes(tool.ad_placement)) {
            setSelectedPlacement(tool.ad_placement)
        }
    }, [tool.id, tool.ad_placement])

    const fetchAds = async () => {
        try {
            setLoading(true)
            // Ideally we fetch ads for THIS tool (by filtering link_url or having a tool_id column in ads)
            // Since schema doesn't seem to link ads to tool_id directly, we filter by name or link
            const allAds = await adsService.getActiveAds()
            const myAds = allAds.filter(ad => ad.link_url.includes(tool.slug) || ad.name.includes(tool.name))
            setAds(myAds)

            // Fetch slots stats
            const slotStats = await adsService.getRemainingSlots()
            setStats(slotStats)
        } catch (error) {
            console.error("Error fetching ads:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateAd = async () => {
        setCreating(true)
        try {
            const placementConfig = PLACEMENTS.find(p => p.id === selectedPlacement)
            if (!placementConfig) return

            // Logic to calculate end date
            const startDate = new Date()
            const endDate = addDays(startDate, duration)

            // Create Ad
            await adsService.createAd({
                name: `${tool.name} - ${placementConfig.title}`,
                placement: selectedPlacement,
                link_url: `/tool/${tool.slug}`, // Default to tool page
                title: formData.title || tool.name,
                description: formData.description || tool.short_description,
                image_url: tool.image_url || tool.logo_url || '', // Default to tool image if not uploaded (upload logic omitted for brevity, can add later)
                advertiser_name: tool.name,
                starts_at: startDate.toISOString(),
                ends_at: endDate.toISOString(),
                is_active: true // Auto-approve for demo/MVP
            })

            alert("Ad Campaign Created Successfully!")
            setView('list')
            fetchAds()

        } catch (error) {
            console.error("Error creating ad:", error)
            alert("Failed to create ad campaign")
        } finally {
            setCreating(false)
        }
    }

    const calculateTotal = () => {
        const placement = PLACEMENTS.find(p => p.id === selectedPlacement)
        if (!placement) return 0

        // Base pricing logic:
        // If duration is 30, it's included (0 cost for upgrade? Or base price?)
        // The screenshot implies "Included" means included in the Sponsor Plan.
        // Extensions cost extra.

        let total = 0
        if (duration > 30) {
            const extraWeeks = Math.ceil((duration - 30) / 7)
            total += extraWeeks * placement.extensionPrice
        }

        // Add base price if not "included" (assuming it is included for this user)
        // For now, let's assume the "Base Price" shown is what they paid for the plan, so 0 extra for base.

        return total
    }

    const totalPrice = calculateTotal()

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (view === 'list') {
        if (ads.length === 0) {
            return (
                <Card className="bg-black/20 border-border/50">
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-yellow-500" />
                            <CardTitle className="text-lg">Ad Management</CardTitle>
                        </div>
                        <CardDescription>Manage your sponsored ads placements</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-6">
                            <Sparkles className="w-8 h-8 text-yellow-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Create Ad Campaign</h3>
                        <p className="text-muted-foreground max-w-md mb-8">
                            As a Sponsor, you can create and manage ad banners to be displayed across the platform.
                        </p>
                        <Button
                            onClick={() => setView('create')}
                            className="bg-white text-black hover:bg-gray-200 font-bold px-8"
                        >
                            Create Ad
                        </Button>
                    </CardContent>
                </Card>
            )
        }

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Your Campaigns</h2>
                        <p className="text-muted-foreground">Manage active ad placements</p>
                    </div>
                    <Button onClick={() => setView('create')}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Campaign
                    </Button>
                </div>

                <div className="grid gap-4">
                    {ads.map(ad => (
                        <Card key={ad.id} className="overflow-hidden">
                            <div className="flex items-center p-4 gap-4">
                                <div className="w-24 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                    {ad.image_url ? (
                                        <img src={ad.image_url} alt={ad.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-accent">
                                            <Monitor className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold truncate">{ad.name}</h4>
                                        <Badge variant={ad.is_active ? 'default' : 'secondary'} className="text-[10px]">
                                            {ad.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] uppercase">
                                            {ad.placement.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(ad.starts_at || new Date()), 'MMM d')} - {format(new Date(ad.ends_at || new Date()), 'MMM d, yyyy')}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MousePointer className="w-3 h-3" />
                                            {ad.clicks || 0} Clicks
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            {ad.impressions || 0} Views
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-muted-foreground">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <Card className="bg-gradient-to-br from-gray-900 to-black border-yellow-500/20 shadow-2xl overflow-hidden relative">
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none" />

            <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                    <Megaphone className="w-5 h-5 text-yellow-500" />
                    <h2 className="text-xl font-bold text-white">Sponsor Options</h2>
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold border-0 text-[10px] uppercase ml-2">
                        Exclusive
                    </Badge>
                </div>
                <CardDescription className="text-gray-400">Configure your ad placement and duration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 relative z-10">
                {/* 1. Placement Selection */}
                <div className="space-y-3">
                    <Label className="text-yellow-500 font-bold flex items-center gap-2">
                        Ad Placement Location <span className="text-red-500">*</span>
                    </Label>
                    <RadioGroup
                        value={selectedPlacement}
                        onValueChange={setSelectedPlacement}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        {PLACEMENTS.map((placement) => {
                            const remaining = stats ? (stats[placement.id] || 0) : placement.maxSlots
                            const isSelected = selectedPlacement === placement.id

                            return (
                                <Label
                                    key={placement.id}
                                    className={cn(
                                        "relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 bg-gray-900/50 hover:bg-gray-800/80",
                                        isSelected
                                            ? "border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.15)]"
                                            : "border-gray-800 hover:border-gray-700"
                                    )}
                                >
                                    <RadioGroupItem value={placement.id} className="sr-only" />
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 font-bold text-white">
                                            <placement.icon className={cn("w-4 h-4", isSelected ? "text-yellow-500" : "text-gray-400")} />
                                            {placement.title}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-400 line-through decoration-gray-600">Rp {placement.price.toLocaleString()}</div>
                                            <div className="text-xs font-bold text-green-500">Included</div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-snug mb-3 pr-8">
                                        {placement.description}
                                    </p>
                                    <div className="mt-auto flex justify-between items-end border-t border-gray-800 pt-3">
                                        <div className="flex items-center gap-1.5">
                                            <span className={cn("w-2 h-2 rounded-full", remaining > 0 ? "bg-green-500" : "bg-red-500")} />
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {remaining} slots left
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-gray-500">
                                            Ext: <span className="text-gray-300">Rp {placement.extensionPrice.toLocaleString()}/wk</span>
                                        </div>
                                    </div>

                                    {/* Selection Circle indicator */}
                                    <div className={cn(
                                        "absolute top-4 right-16 w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center transition-all",
                                        isSelected ? "border-yellow-500 bg-yellow-500" : "bg-transparent"
                                    )}>
                                        {isSelected && <Check className="w-3 h-3 text-black" />}
                                    </div>
                                </Label>
                            )
                        })}
                    </RadioGroup>
                </div>

                {/* 2. Duration Selection */}
                <div className="space-y-3">
                    <Label className="text-yellow-500 font-bold flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Ad Duration <span className="text-gray-500 font-normal text-xs ml-1">(Base: 30 days included)</span>
                    </Label>

                    <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 flex items-center gap-3 text-sm text-gray-300 mb-4">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>
                            {format(new Date(), 'MMM d, yyyy')} - {format(addDays(new Date(), duration), 'MMM d, yyyy')}
                        </span>
                        <span className="ml-auto font-mono text-yellow-500 bg-yellow-950/30 px-2 py-0.5 rounded text-xs">
                            ({duration} days)
                        </span>
                    </div>

                    <div className="flex gap-3">
                        {[30, 60, 90].map((days) => (
                            <Button
                                key={days}
                                variant="outline"
                                onClick={() => setDuration(days)}
                                className={cn(
                                    "flex-1 h-auto py-3 border-gray-800 bg-gray-900/50 hover:bg-gray-800 hover:text-white transition-all",
                                    duration === days ? "border-yellow-500 text-yellow-500 bg-yellow-950/10" : "text-gray-400"
                                )}
                            >
                                <div className="flex flex-col items-center gap-0.5">
                                    <span className="font-bold">{days} Days</span>
                                    {days === 30 ? (
                                        <span className="text-[10px] text-green-500 font-medium">(Included)</span>
                                    ) : (
                                        <span className="text-[10px] text-yellow-600">+{Math.ceil((days - 30) / 7)} weeks</span>
                                    )}
                                </div>
                            </Button>
                        ))}
                    </div>
                </div>

                {/* 3. Creative Details (Simplified) */}
                <div className="space-y-3 pt-2">
                    <Label className="text-gray-400 text-sm">Campaign Title</Label>
                    <Input
                        placeholder="e.g. Summer Promotion"
                        className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-600 focus:border-yellow-500"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

            </CardContent>

            <CardFooter className="bg-black/40 border-t border-gray-800 p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="w-full md:w-auto space-y-1">
                    <div className="text-xs text-gray-500">Sponsor Plan (Base)</div>
                    <div className="flex justify-between md:justify-start gap-8 items-baseline">
                        <div className="font-medium text-gray-400">Total ({duration} Days)</div>
                        <div className="text-2xl font-black text-white">
                            {totalPrice === 0 ? 'Included' : `Rp ${totalPrice.toLocaleString()}`}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="ghost" className="flex-1 md:flex-none" onClick={() => setView('list')}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateAd}
                        disabled={creating}
                        className="flex-1 md:flex-none bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                    >
                        {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {totalPrice === 0 ? 'Create Campaign' : 'Proceed to Payment'}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
