"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { AdBannerUpload } from "@/components/ad-banner-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Eye,
    Heart,
    MousePointer,
    Star,
    TrendingUp,
    ArrowLeft,
    ExternalLink,
    Save,
    Loader2,
    BarChart3,
    MessageSquare,
    Settings,
    Gift,
    Image as ImageIcon,
    Trash2,
    X,
    Sparkles,
    Video,
    Plus
} from "lucide-react"
import { motion } from "framer-motion"
import { toolsService } from "@/lib/services/toolsService"
import { subscriptionService } from "@/lib/services/subscriptionService"
import { adsService, ActiveAd } from "@/lib/services/adsService"
import { ToolWithRelations, ReviewWithUser, Deal } from "@/lib/types"
import { createBrowserClient } from "@supabase/ssr" // Needed for auth check
import { reviewsService } from "@/lib/services/reviewsService"
import { dealsService } from "@/lib/services/dealsService"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"

export default function ToolManagePage() {
    const params = useParams()
    const slug = params.slug as string

    const [tool, setTool] = useState<ToolWithRelations | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [isSponsor, setIsSponsor] = useState(false)
    const [isPremium, setIsPremium] = useState(false)
    const [ads, setAds] = useState<ActiveAd[]>([])
    const [reviews, setReviews] = useState<ReviewWithUser[]>([])
    const [deals, setDeals] = useState<Deal[]>([])
    const [isDealModalOpen, setIsDealModalOpen] = useState(false)
    const [newDeal, setNewDeal] = useState({
        discount: '',
        code: '',
        description: '',
        expires_at: ''
    })

    // File Upload State
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
    const [videoFile, setVideoFile] = useState<File | null>(null)

    // Previews
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        short_description: '',
        long_description: '',
        website_url: '',
        video_url: '',
        logo_url: '',
        image_url: '' // For screenshot
    })

    useEffect(() => {
        const fetchToolAndAccess = async () => {
            try {
                // 1. Fetch Tool
                const data = await toolsService.getToolBySlug(slug)
                if (data) {
                    setTool(data)
                    setFormData({
                        short_description: data.short_description || '',
                        long_description: data.long_description || '',
                        website_url: data.website_url || '',
                        video_url: data.video_url || '',
                        logo_url: data.logo_url || '',
                        image_url: data.image_url || ''
                    })
                    // Initialize previews
                    setLogoPreview(data.logo_url || null)
                    setScreenshotPreview(data.image_url || null)
                }

                // 2. Check Subscription & Ads (Sponsor only)
                const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                )
                const { data: { user } } = await supabase.auth.getUser()

                if (user && data) {
                    const effectivePlan = await subscriptionService.getEffectivePlan(user.id)
                    const isSponsorPlan = effectivePlan === 'sponsor'
                    setIsSponsor(isSponsorPlan)
                    setIsPremium(['pro', 'featured', 'sponsor'].includes(effectivePlan))

                    if (isSponsorPlan) {
                        try {
                            // Since getActiveAdsByTool doesn't exist, we fetch active ads
                            // and filter those that might be relevant (sharing same link_url style or just all of them for now)
                            const activeAds = await adsService.getActiveAds()
                            // Filtering ads that link to this specific tool
                            const toolAds = activeAds.filter(ad => ad.link_url.includes(slug))
                            setAds(toolAds)
                        } catch (e) {
                            console.error("Error fetching ads:", e)
                        }
                    }

                    // Fetch Reviews and Deals
                    try {
                        const [reviewsData, dealsData] = await Promise.all([
                            reviewsService.getOwnerReviewsByToolId(data.id),
                            dealsService.getDealsByToolId(data.id)
                        ])
                        setReviews(reviewsData)
                        setDeals(dealsData)
                    } catch (e) {
                        console.error("Error fetching reviews/deals:", e)
                    }
                }

            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchToolAndAccess()
    }, [slug])

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("Logo must be less than 2MB")
                return
            }
            setLogoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setLogoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("Screenshot must be less than 2MB")
                return
            }
            setScreenshotFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setScreenshotPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 50 * 1024 * 1024) {
                alert("Video must be less than 50MB")
                return
            }
            setVideoFile(file)
        }
    }

    const deleteFileFromStorage = async (url: string) => {
        if (!url) return
        try {
            // Extract path from URL
            // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
            const urlObj = new URL(url)
            const pathParts = urlObj.pathname.split('/public/')
            if (pathParts.length < 2) return

            const fullPath = pathParts[1] // images/tools/user/file.jpg
            const bucket = fullPath.split('/')[0] // 'images'
            const filePath = fullPath.substring(bucket.length + 1) // tools/user/file.jpg

            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            const { error } = await supabase.storage
                .from(bucket)
                .remove([filePath])

            if (error) {
                console.error("Error deleting file:", error)
            } else {
                console.log("Deleted old file:", filePath)
            }
        } catch (e) {
            console.error("Failed to parse URL for deletion", e)
        }
    }

    const uploadFile = async (file: File, bucket: string, path: string) => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, { upsert: true })

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path)

        return publicUrl
    }

    const handleSave = async () => {
        if (!tool) return
        setSaving(true)
        try {
            const updatedData = { ...formData }
            const userId = (tool as any).owner_id || (tool as any).submitted_by

            // 1. Handle Logo Upload
            if (logoFile && userId) {
                if (tool.logo_url) {
                    await deleteFileFromStorage(tool.logo_url)
                }
                const logoPath = `tools/${userId}/${Date.now()}_${logoFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
                updatedData.logo_url = await uploadFile(logoFile, 'images', logoPath)
            }

            // 2. Handle Screenshot Upload
            if (screenshotFile && userId) {
                if (tool.image_url) { // image_url is screenshot
                    await deleteFileFromStorage(tool.image_url)
                }
                const screenshotPath = `tool-images/${userId}/${Date.now()}_scr_${screenshotFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
                updatedData.image_url = await uploadFile(screenshotFile, 'images', screenshotPath)
            }

            // 3. Handle Video Upload
            if (videoFile && userId) {
                if (tool.video_url && tool.video_url.includes('supabase.co')) {
                    await deleteFileFromStorage(tool.video_url)
                }
                const videoPath = `tools/${userId}/${Date.now()}_${videoFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
                updatedData.video_url = await uploadFile(videoFile, 'videos', videoPath)
            }

            await toolsService.updateTool(tool.id, updatedData)

            // Refresh tool data to update state completely
            const refreshedTool = await toolsService.getToolBySlug(slug)
            if (refreshedTool) {
                setTool(refreshedTool)
                // No need to reset files/previews manually as they should match now, 
                // but let's clear file inputs
                setLogoFile(null)
                setScreenshotFile(null)
                setVideoFile(null)
            }
            alert("Tool updated successfully!")
        } catch (error) {
            console.error('Error saving:', error)
            alert("Failed to save changes.")
        } finally {
            setSaving(false)
        }
    }

    const handleCreateDeal = async () => {
        if (!tool) return
        try {
            await dealsService.createDeal({
                tool_id: tool.id,
                discount: newDeal.discount,
                code: newDeal.code,
                description: newDeal.description,
                expires_at: newDeal.expires_at || undefined,
            })
            const dealsData = await dealsService.getDealsByToolId(tool.id)
            setDeals(dealsData)
            setIsDealModalOpen(false)
            setNewDeal({ discount: '', code: '', description: '', expires_at: '' })
            alert('Deal created successfully!')
        } catch (error) {
            console.error('Error creating deal:', error)
            alert('Failed to create deal')
        }
    }

    const handleDeleteDeal = async (id: string) => {
        if (!confirm('Are you sure you want to delete this deal?')) return
        try {
            await dealsService.deleteDeal(id)
            setDeals(deals.filter(d => d.id !== id))
        } catch (error) {
            console.error('Error deleting deal:', error)
            alert('Failed to delete deal')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!tool) {
        return (
            <div className="text-center py-16">
                <h2 className="text-2xl font-bold mb-2">Tool not found</h2>
                <p className="text-muted-foreground mb-4">The tool you're looking for doesn't exist.</p>
                <Link href="/dashboard/tools">
                    <Button>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Tools
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/tools">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                            {tool.logo_url ? (
                                <img src={tool.logo_url} alt={tool.name} referrerPolicy="no-referrer" className="w-10 h-10 rounded-lg" />
                            ) : (
                                <span className="text-2xl font-bold text-primary">{tool.name[0]}</span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{tool.name}</h1>
                            <p className="text-muted-foreground">{tool.category?.name || 'Uncategorized'}</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href={`/tool/${tool.slug}`}>
                        <Button variant="outline">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Public Page
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                {[
                    { title: 'Views', value: tool.view_count || 0, icon: Eye, color: 'text-blue-500' },
                    { title: 'Favorites', value: tool.favorite_count || 0, icon: Heart, color: 'text-red-500' },
                    { title: 'Clicks', value: (tool as any).click_count || 0, icon: MousePointer, color: 'text-green-500' },
                    { title: 'Rating', value: tool.rating?.toFixed(1) || '-', icon: Star, color: 'text-yellow-500' },
                ].map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                                        <p className="text-2xl font-bold">{stat.value}</p>
                                    </div>
                                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="edit" className="space-y-4">
                <TabsList className={`grid w-full ${isSponsor ? 'lg:grid-cols-5 lg:w-[500px]' : 'lg:grid-cols-4 lg:w-[400px]'}`}>
                    <TabsTrigger value="edit" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Edit
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Reviews
                    </TabsTrigger>
                    <TabsTrigger value="deals" className="flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        Deals
                    </TabsTrigger>
                    {isSponsor && (
                        <TabsTrigger value="ads" className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                            Ads
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* Edit Tab */}
                <TabsContent value="edit">
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Tool Information</CardTitle>
                            <CardDescription>Update your tool's details and description</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Logo Upload */}
                                <div className="space-y-4">
                                    <Label>Tool Logo</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-24 h-24 rounded-xl border overflow-hidden bg-muted flex items-center justify-center group">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-4xl font-bold text-muted-foreground">
                                                    {tool.name[0]}
                                                </span>
                                            )}
                                            <div
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                onClick={() => document.getElementById('logo-upload')?.click()}
                                            >
                                                <Settings className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Button variant="outline" size="sm" onClick={() => document.getElementById('logo-upload')?.click()}>
                                                Change Logo
                                            </Button>
                                            <p className="text-xs text-muted-foreground">
                                                Recommended: 512x512px (Max 2MB)
                                            </p>
                                            <input
                                                id="logo-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleLogoChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Screenshot Upload */}
                                <div className="space-y-4">
                                    <Label>Tool Screenshot</Label>
                                    <div
                                        className="relative aspect-video rounded-xl border-2 border-dashed overflow-hidden bg-muted/30 flex items-center justify-center group cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => document.getElementById('screenshot-upload')?.click()}
                                    >
                                        {screenshotPreview ? (
                                            <>
                                                <img src={screenshotPreview} alt="Screenshot preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-white font-medium">Click to change</p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                                <p className="text-sm font-medium text-muted-foreground">Upload Screenshot</p>
                                            </div>
                                        )}
                                        <input
                                            id="screenshot-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleScreenshotChange}
                                        />
                                    </div>
                                </div>

                                {/* Video Upload & URL */}
                                <div className="space-y-4 md:col-span-2">
                                    <Label>Demo Video</Label>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Video URL (YouTube/Vimeo)</Label>
                                            <Input
                                                placeholder="https://youtube.com/watch?v=..."
                                                value={formData.video_url}
                                                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Or Upload Video File</Label>
                                            <div
                                                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => document.getElementById('video-upload')?.click()}
                                            >
                                                {videoFile ? (
                                                    <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                                                        <Video className="w-4 h-4" />
                                                        {videoFile.name}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                                        <Video className="w-4 h-4" />
                                                        <span>Upload Video (Max 50MB)</span>
                                                    </div>
                                                )}
                                                <input
                                                    id="video-upload"
                                                    type="file"
                                                    className="hidden"
                                                    accept="video/*"
                                                    onChange={handleVideoChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="short_description">Short Description</Label>
                                <Textarea
                                    id="short_description"
                                    placeholder="Brief description of your tool..."
                                    value={formData.short_description}
                                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="long_description">Full Description</Label>
                                <Textarea
                                    id="long_description"
                                    placeholder="Detailed description of your tool and its features..."
                                    value={formData.long_description}
                                    onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                                    rows={6}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="website_url">Website URL</Label>
                                    <Input
                                        id="website_url"
                                        type="url"
                                        value={formData.website_url}
                                        onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="video_url">Video URL (optional)</Label>
                                    <Input
                                        id="video_url"
                                        type="url"
                                        placeholder="YouTube or Vimeo link"
                                        value={formData.video_url}
                                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                    />
                                </div>
                            </div>

                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                Save Changes
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics">
                    <Card>
                        <CardHeader>
                            <CardTitle>Analytics</CardTitle>
                            <CardDescription>View detailed statistics for your tool</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center py-16 text-center">
                                <div>
                                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="font-semibold mb-2">
                                        {isPremium ? 'Analytics Coming Soon' : 'Analytics'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                                        Detailed analytics with views, clicks, and conversion tracking will be available here.
                                    </p>

                                    {!isPremium && (
                                        <>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Upgrade to Pro to access this feature.
                                            </p>
                                            <Link href="/pricing">
                                                <Button variant="outline">
                                                    Upgrade to Pro
                                                </Button>
                                            </Link>
                                        </>
                                    )}

                                    {isPremium && (
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium">
                                            <Sparkles className="w-4 h-4" />
                                            <span>Included in your plan</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Reviews Tab */}
                <TabsContent value="reviews">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reviews</CardTitle>
                            <CardDescription>Manage and respond to user reviews</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {reviews.length === 0 ? (
                                <div className="flex items-center justify-center py-16 text-center">
                                    <div>
                                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                        <h3 className="font-semibold mb-2">No Reviews Yet</h3>
                                        <p className="text-sm text-muted-foreground">
                                            When users leave reviews, they will appear here.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="p-4 border rounded-lg space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                                                        {review.users?.avatar_url ? (
                                                            <img src={review.users.avatar_url} alt={review.users.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground">
                                                                {(review.users?.name || review.guest_name || 'U')[0]}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold flex items-center gap-2">
                                                            {review.users?.name || review.guest_name || 'Anonymous User'}
                                                            <Badge variant={review.status === 'approved' ? 'secondary' : 'outline'} className="text-[10px] h-4">
                                                                {review.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {format(new Date(review.created_at!), 'MMM d, yyyy')}
                                                </div>
                                            </div>
                                            <p className="text-sm">{review.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Deals Tab */}
                <TabsContent value="deals">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Deals & Promotions</CardTitle>
                                <CardDescription>Create special offers for your tool</CardDescription>
                            </div>
                            <Dialog open={isDealModalOpen} onOpenChange={setIsDealModalOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Deal
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Create New Deal</DialogTitle>
                                        <DialogDescription>
                                            Add a discount or promo code for your users.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="discount">Discount Amount (e.g. 20% OFF)</Label>
                                            <Input
                                                id="discount"
                                                placeholder="e.g. 20% OFF"
                                                value={newDeal.discount}
                                                onChange={(e) => setNewDeal({ ...newDeal, discount: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="code">Promo Code (Optional)</Label>
                                            <Input
                                                id="code"
                                                placeholder="e.g. WELCOME20"
                                                value={newDeal.code}
                                                onChange={(e) => setNewDeal({ ...newDeal, code: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="desc">Description</Label>
                                            <Textarea
                                                id="desc"
                                                placeholder="Describe the deal..."
                                                value={newDeal.description}
                                                onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="expiry">Expiry Date (Optional)</Label>
                                            <Input
                                                id="expiry"
                                                type="date"
                                                value={newDeal.expires_at}
                                                onChange={(e) => setNewDeal({ ...newDeal, expires_at: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsDealModalOpen(false)}>Cancel</Button>
                                        <Button onClick={handleCreateDeal}>Create Deal</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {deals.length === 0 ? (
                                <div className="flex items-center justify-center py-16 text-center">
                                    <div>
                                        <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                        <h3 className="font-semibold mb-2">No Deals Yet</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Offer discounts and promotions to attract more users.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {deals.map((deal) => (
                                        <div key={deal.id} className="p-4 border rounded-lg bg-card relative group">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge className="bg-primary text-primary-foreground font-bold">
                                                    {deal.discount}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleDeleteDeal(deal.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <h4 className="font-semibold mb-1">{deal.code || 'No code required'}</h4>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                                {deal.description}
                                            </p>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                                                <span>Claims: {deal.claim_count || 0}</span>
                                                {deal.expires_at && (
                                                    <span>Expires: {format(new Date(deal.expires_at), 'MMM d, yyyy')}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Ads Tab (Sponsor Only) */}
                {isSponsor && (
                    <TabsContent value="ads">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-yellow-500" />
                                    Ad Management
                                </CardTitle>
                                <CardDescription>Manage your sponsored ads placements</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {ads.length === 0 ? (
                                    <div className="flex items-center justify-center py-16 text-center">
                                        <div>
                                            <Sparkles className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                                            <h3 className="font-semibold mb-2">Create Ad Campaign</h3>
                                            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                                                As a Sponsor, you can create and manage ad banners to be displayed across the platform.
                                            </p>
                                            <AdBannerUpload
                                                fixedPlacement={tool?.ad_placement || undefined}
                                                onSuccess={() => window.location.reload()}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-end">
                                            <AdBannerUpload
                                                fixedPlacement={tool?.ad_placement || undefined}
                                                onSuccess={() => window.location.reload()}
                                            />
                                        </div>

                                        <div className="grid gap-4">
                                            {ads.map((ad) => (
                                                <div key={ad.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-16 h-12 bg-muted rounded overflow-hidden">
                                                            {ad.image_url && <img src={ad.image_url} alt={ad.name} className="w-full h-full object-cover" />}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold">{ad.name}</h4>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <Badge variant="outline" className="capitalize">{ad.placement}</Badge>
                                                                <span>•</span>
                                                                <span className={ad.is_active ? "text-green-500" : "text-muted-foreground"}>
                                                                    {ad.is_active ? "Active" : "Inactive"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-center">
                                                            <p className="text-xs text-muted-foreground">Impressions</p>
                                                            <p className="font-semibold">{ad.impressions?.toLocaleString() || 0}</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-muted-foreground">Clicks</p>
                                                            <p className="font-semibold">{ad.clicks?.toLocaleString() || 0}</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-muted-foreground">CTR</p>
                                                            <p className="font-semibold">
                                                                {((ad.clicks || 0) / (ad.impressions || 1) * 100).toFixed(1)}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div >
    )
}
