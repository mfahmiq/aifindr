"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format, addDays } from "date-fns"
import { DateRange } from "react-day-picker"
import {
    ArrowLeft,
    CheckCircle2,
    Upload,
    Image as ImageIcon,
    Video,
    Sparkles,
    Award,
    Check,
    Star,
    Shield,
    Zap,
    ArrowRight,
    Megaphone,
    Calendar as CalendarIcon,
    Loader2,
    Eye,
    LayoutGrid,
    Sidebar as SidebarIcon,
    Monitor
} from "lucide-react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

import { ToolCard } from "@/components/tool-card"
import { FeaturedToolCard } from "@/components/featured-tool-card"
import { TopBannerAd, SidebarAd, InlineToolAd, SponsorToolBanner } from "@/components/ad-sections"
import { ToolWithRelations } from "@/lib/types"
import { Ad } from "@/lib/services/adsService"


interface Category {
    id: string
    name: string
    slug: string
}

import { Suspense } from 'react'
import { extractDominantColor } from "@/lib/colorUtils"
import Script from 'next/script'

declare global {
    interface Window {
        snap: any;
    }
}

const SubmitToolContent = () => {
    const searchParams = useSearchParams()

    // Midtrans Configuration
    const snapUrl = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js'
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''

    const router = useRouter()
    const initialPlan = searchParams.get('plan') || 'free'

    const [submitted, setSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState(initialPlan)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [dominantColor, setDominantColor] = useState<string | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [adPlacement, setAdPlacement] = useState("sidebar")
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 30),
    })

    const [userId, setUserId] = useState<string | null>(null)
    const [userEmail, setUserEmail] = useState<string | null>(null)

    // Form refs
    const formRef = useRef<HTMLFormElement>(null)
    const logoInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)

    // Ad slots state
    const [remainingSlots, setRemainingSlots] = useState({
        sidebar: 3,
        navbar: 1,
        banner: 0,
        inline: 3
    })
    const [featuredSlots, setFeaturedSlots] = useState({ total: 10, used: 0, remaining: 10 })
    const [adPrices, setAdPrices] = useState<Record<string, number>>({})

    // Initialize Supabase client
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const init = async () => {
            // Check auth
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
                setUserEmail(user.email || null)
            }

            // Fetch categories
            const { data: cats } = await supabase
                .from('categories')
                .select('id, name, slug')
                .order('name')

            if (cats) setCategories(cats)

            // Fetch ad settings (mock/real combo)
            const { adsService } = await import("@/lib/services/adsService")
            try {
                const [slots, settings, featStatus] = await Promise.all([
                    adsService.getRemainingSlots(),
                    adsService.getSettings(),
                    adsService.getFeaturedSlotsStatus()
                ])
                setFeaturedSlots(featStatus)

                setRemainingSlots(prev => ({ ...prev, ...slots } as any))
                const prices: Record<string, number> = {}
                if (settings) {
                    settings.forEach((s: any) => {
                        prices[s.placement] = s.price_per_period
                    })
                }
                setAdPrices(prices)
            } catch (error) {
                console.error("Failed to fetch ad data", error)
            }
        }
        init()
    }, [])

    // Update selected plan if search param changes
    useEffect(() => {
        const planParam = searchParams.get('plan')
        if (planParam) {
            setSelectedPlan(planParam)
        }
    }, [searchParams])

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("Logo must be less than 2MB")
                return
            }
            setLogoFile(file)
            const reader = new FileReader()
            reader.onloadend = async () => {
                const result = reader.result as string
                setLogoPreview(result)
                try {
                    const color = await extractDominantColor(result)
                    setDominantColor(color)
                } catch (e) {
                    console.error("Failed to extract color", e)
                }
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

    const uploadFile = async (file: File, bucket: string, path: string) => {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, { upsert: true })

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path)

        return publicUrl
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userId) {
            alert("Please login to submit a tool")
            router.push('/login?redirect=/submit')
            return
        }

        if (!logoFile) {
            alert("Please upload a logo")
            return
        }

        setIsSubmitting(true)

        try {
            const formData = new FormData(e.target as HTMLFormElement)
            const name = formData.get('name') as string
            const url = formData.get('url') as string
            const description = formData.get('description') as string // Maps to short_description
            const categoryId = formData.get('category') as string
            const pricingModel = formData.get('pricing_type') as string

            // Generate slug from name
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 6)

            // Upload Logo
            const logoPath = `tools/${userId}/${Date.now()}_${logoFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
            const logoUrl = await uploadFile(logoFile, 'images', logoPath)

            // Upload Video if exists
            let videoUrl = null
            if (videoFile) {
                const videoPath = `tools/${userId}/${Date.now()}_${videoFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
                videoUrl = await uploadFile(videoFile, 'videos', videoPath)
            }

            // Insert into DB
            const isPaidPlan = selectedPlan !== 'free'
            const initialStatus = isPaidPlan ? 'pending_payment' : 'pending'

            const { data: toolData, error } = await supabase
                .from('tools')
                .insert({
                    name,
                    slug,
                    website_url: url,
                    short_description: description,
                    long_description: description, // Default long description to short one for now
                    category_id: categoryId,
                    pricing_type: pricingModel,
                    plan: selectedPlan === 'free' ? null : selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1),
                    logo_url: logoUrl,
                    dominant_color: dominantColor, // Save extracted color
                    video_url: videoUrl,
                    submitted_by: userId,
                    owner_id: userId,
                    submitted_email: userEmail,
                    status: initialStatus,
                    is_verified: false,
                    is_priority: false,
                    has_backlink: false,
                    created_at: new Date().toISOString()
                })
                .select('id')
                .single()

            if (error) throw error

            if (isPaidPlan && toolData) {
                // Call Payment API
                const response = await fetch('/api/payment/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        toolId: toolData.id,
                        plan: selectedPlan,
                        name,
                        email: userEmail
                    })
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.error);

                // Trigger Snap
                if (window.snap) {
                    window.snap.pay(result.token, {
                        onSuccess: (result: any) => {
                            setSubmitted(true);
                        },
                        onPending: (result: any) => {
                            setSubmitted(true);
                        },
                        onError: (result: any) => {
                            console.error("Payment Error", result);
                            alert("Payment failed! Please try again.");
                        },
                        onClose: () => {
                            console.log("Payment popup closed");
                        }
                    })
                } else {
                    alert("Payment gateway not loaded. Please refresh.");
                }
            } else {
                setSubmitted(true)
            }
        } catch (error: any) {
            console.error("Submission error:", error)
            alert(error.message || "Failed to submit tool")
        } finally {
            setIsSubmitting(false)
        }
    }

    const plans = [
        {
            id: "free",
            name: "Free",
            price: "Rp 0",
            period: "/forever",
            description: "Basic listing",
            features: ["Permanent listing", "Logo upload", "Searchable"],
            color: "from-green-500 to-emerald-500"
        },
        {
            id: "pro",
            name: "Pro",
            price: "Rp 49rb",
            originalPrice: "Rp 150rb",
            period: "/month",
            description: "Entry Level (Best Value)",
            features: ["Everything in Free", "Video upload", "Verified badge", "Priority ranking"],
            color: "from-blue-500 to-cyan-500",
            popular: true
        },
        {
            id: "featured",
            name: "Featured",
            price: "Rp 149rb",
            originalPrice: "Rp 750rb",
            period: "/month",
            description: "Elite Quartet (Top 4)",
            features: ["Everything in Pro", "Featured badge", "Top of category", "Limited availability (4/mo)"],
            color: "from-purple-500 to-pink-500"
        },
        {
            id: "sponsor",
            name: "Sponsor",
            price: "Rp 299rb",
            period: "/week",
            description: "Exclusive promotion",
            features: ["Everything in Featured", "Banner ads", "No competitor ads", "Dedicated support"],
            color: "from-yellow-500 to-orange-500"
        }
    ]

    // Helper to calculate total price
    const calculateTotal = () => {
        if (selectedPlan !== 'sponsor') {
            const priceStr = plans.find(p => p.id === selectedPlan)?.price || "0"
            if (priceStr === "Rp 0") return 0
            if (priceStr.includes('rb')) {
                return parseInt(priceStr.replace(/[^0-9]/g, '')) * 1000
            }
            return 0
        }



        let total = 0
        if (date?.from && date?.to && adPlacement && adPrices[adPlacement]) {
            const days = Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24))
            const extraDays = Math.max(0, days - 30)
            const extraWeeks = Math.ceil(extraDays / 7)
            // Base price for 30 days is roughly 4 weeks
            const weeklyPrice = adPrices[adPlacement]
            total = weeklyPrice * 4

            if (extraWeeks > 0) total += extraWeeks * weeklyPrice
        }
        return total
    }

    const totalPrice = calculateTotal()
    const isPaidPlan = selectedPlan !== 'free'
    const canUploadVideo = ['pro', 'featured', 'sponsor'].includes(selectedPlan)

    // Construct mock tool for preview
    const mockTool: ToolWithRelations = {
        id: 'preview',
        name: (formRef.current?.elements.namedItem('name') as HTMLInputElement)?.value || "Your Tool Name",
        slug: 'preview-tool',
        short_description: (formRef.current?.elements.namedItem('description') as HTMLTextAreaElement)?.value || "Your tool's short description will appear here. Capture the essence of your tool in a few sentences.",
        long_description: null,
        website_url: (formRef.current?.elements.namedItem('url') as HTMLInputElement)?.value || "https://example.com",
        logo_url: logoPreview,
        video_url: null,
        dominant_color: dominantColor,
        pricing_type: (formRef.current?.elements.namedItem('pricing_type') as HTMLSelectElement)?.value || "Freemium",
        plan: selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'pending',
        is_verified: selectedPlan !== 'free',
        is_priority: ['pro', 'featured', 'sponsor'].includes(selectedPlan),
        has_backlink: false,
        category_id: (formRef.current?.elements.namedItem('category') as HTMLSelectElement)?.value || null,
        submitted_by: userId,
        owner_id: userId,
        submitted_email: userEmail,
        view_count: 1250,
        favorite_count: 42,
        rating: 4.9,
        review_count: 12,
        has_api: false,
        has_premium_support: false,
        has_free_trial: false,
        is_open_source: false,
        image_url: null,
        rejection_reason: null,
        subscription_ends_at: null,
        subscription_starts_at: null,
        category: categories.find(c => c.id === ((formRef.current?.elements.namedItem('category') as HTMLSelectElement)?.value)) as any || { name: "Category" },
        reviews: [
            {
                id: 'mock-review',
                tool_id: 'preview',
                user_id: 'mock-user',
                rating: 5,
                comment: "This is a preview of how a review might look.",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                status: 'approved',
                title: 'Great tool!',
                guest_name: 'John Doe',
                guest_email: null,
                helpful_count: 5
            }
        ]
    }

    // Force update when form values change (handled by native onChange in form inputs but we need React state for these to trigger re-renders if we want real-time preview)
    // Actually, for the preview to be "live", we need state for name, description, url, pricing_type.
    // Currently, they are unregulated inputs. I should create state for them.

    // NOTE: To avoid refactoring the entire form to controlled components right now (which is safer but bigger change),
    // I will add state variables just for capturing the input for preview purposes, or switch the inputs to be controlled.
    // Switching to controlled inputs is cleaner.

    const [previewName, setPreviewName] = useState("Your Tool Name")
    const [previewDesc, setPreviewDesc] = useState("Your tool's short description will appear here.")
    const [previewPricing, setPreviewPricing] = useState("Freemium")
    const [previewCategory, setPreviewCategory] = useState<string>("")
    const [previewPlacement, setPreviewPlacement] = useState<string>("sidebar")

    // Update mockTool with state values
    mockTool.name = previewName || "Your Tool Name"
    mockTool.short_description = previewDesc || "Your tool's short description will appear here."
    mockTool.pricing_type = previewPricing
    const selectedCategoryObj = categories.find(c => c.id === previewCategory)
    // @ts-ignore
    mockTool.category = selectedCategoryObj ? { name: selectedCategoryObj.name } : { name: "Category" }

    // Mock Ad for Preview
    const mockAd: Ad = {
        id: 'preview-ad',
        name: mockTool.name,
        title: mockTool.name,
        description: mockTool.short_description || "Ad Description",
        link_url: mockTool.website_url,
        cta_text: "View Tool",
        image_url: mockTool.logo_url,
        placement: previewPlacement as any,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        starts_at: new Date().toISOString(),
        ends_at: new Date().toISOString(),
        impressions: 0,
        clicks: 0,
        advertiser_name: 'Preview User',
        advertiser_email: 'preview@example.com'
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md text-center"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Submission Received!</h1>
                    <p className="text-muted-foreground text-lg mb-8">
                        Thank you for submitting your tool. Our team will review it shortly.
                        You can track the status in your dashboard.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="bg-gradient-to-r from-primary to-purple-500" asChild>
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                        <Button size="lg" variant="outline" onClick={() => setSubmitted(false)}>
                            Submit Another
                        </Button>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <Script
                src={snapUrl}
                data-client-key={clientKey}
                strategy="lazyOnload"
            />

            {/* Live Preview Mobile (Floating or Bottom?) - Optional, for now just hiding on mobile or showing at bottom. 
                The sidebar is hidden on small screens in grid layout? No, it's just stacked.
            */}

            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 overflow-hidden">
                <div className="absolute inset-0">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
                        transition={{ duration: 8, repeat: Infinity }}
                        className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-full blur-3xl"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:32px_32px]" />
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
                </div>

                <div className="container mx-auto px-4 py-16 relative">
                    <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Directory
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <Badge className="mb-4 px-4 py-1.5 bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30">
                            <Sparkles className="w-3.5 h-3.5 mr-2 text-primary" />
                            <span className="text-primary">Get Listed in Minutes</span>
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                            Submit Your{" "}
                            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                AI Tool
                            </span>
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            Join our growing directory and reach thousands of AI enthusiasts.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="container max-w-5xl mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Plan Selection Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-1"
                    >
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary" />
                            Choose Your Plan
                        </h2>
                        <div className="space-y-4">
                            {plans.map((plan) => {
                                // Sold out logic
                                let isSoldOut = false
                                if (plan.id === 'featured' && featuredSlots.remaining <= 0) isSoldOut = true
                                // For sponsor, check if ALL main slots are out? Or just one? 
                                // Let's simplify: if Banner AND Sidebar are out, it's effectively limited.
                                // But Sponsor grants choice. So if ANY is available, it's open.
                                // Logic: If ALL are 0, then sold out.
                                if (plan.id === 'sponsor') {
                                    // Check if sidebar, navbar, banner, inline are all 0
                                    if (remainingSlots.sidebar <= 0 && remainingSlots.navbar <= 0 && remainingSlots.banner <= 0 && remainingSlots.inline <= 0) {
                                        isSoldOut = true
                                    }
                                }

                                return (
                                    <Card
                                        key={plan.id}
                                        className={`relative transition-all ${isSoldOut ? 'opacity-60 grayscale cursor-not-allowed border-muted' :
                                            selectedPlan === plan.id
                                                ? 'border-2 border-primary shadow-lg shadow-primary/10 cursor-pointer'
                                                : 'border-2 border-muted hover:border-primary/30 cursor-pointer'
                                            }`}
                                        onClick={() => !isSoldOut && setSelectedPlan(plan.id)}
                                    >
                                        {isSoldOut && (
                                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-xl">
                                                <Badge variant="destructive" className="text-lg px-4 py-1 rotate-[-12deg] shadow-lg border-2 border-white">
                                                    SOLD OUT
                                                </Badge>
                                            </div>
                                        )}
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white shadow-lg`}>
                                                        {plan.id === "free" ? <CheckCircle2 className="w-5 h-5" /> :
                                                            plan.id === "pro" ? <Award className="w-5 h-5" /> :
                                                                plan.id === "featured" ? <Star className="w-5 h-5" /> :
                                                                    <Megaphone className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold flex items-center gap-2">
                                                            {plan.name}
                                                            {plan.popular && (
                                                                <Badge variant="secondary" className="text-xs">Popular</Badge>
                                                            )}
                                                            {plan.id === 'featured' && !isSoldOut && featuredSlots.remaining < 3 && (
                                                                <Badge variant="destructive" className="text-[10px] h-5 px-1.5 animate-pulse">
                                                                    Only {featuredSlots.remaining} left
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">{plan.description}</div>
                                                    </div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === plan.id ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                                                    }`}>
                                                    {selectedPlan === plan.id && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>
                                            <div className="flex flex-col mb-3">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-bold">{plan.price}</span>
                                                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                                                </div>
                                                {/* @ts-ignore */}
                                                {plan.originalPrice && (
                                                    <span className="text-xs text-muted-foreground line-through decoration-red-500">
                                                        Normally {plan.originalPrice}
                                                    </span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>

                        {/* Live Preview Section */}
                        <div className="mt-8 sticky top-4">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-primary" />
                                Live Preview
                            </h2>
                            <div className="transform origin-top-left transition-all duration-300">
                                {selectedPlan === 'sponsor' ? (
                                    <div className="bg-muted/30 p-4 rounded-xl border border-dashed border-primary/20">
                                        <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">
                                            {previewPlacement === 'sidebar' && "Sidebar Banner Preview"}
                                            {previewPlacement === 'navbar' && "Navbar Premium Preview"}
                                            {previewPlacement === 'hero' && "Hero Banner Preview"}
                                            {previewPlacement === 'inline' && "Inline Feed Preview"}
                                        </p>

                                        {/* Context Wrappers */}
                                        {previewPlacement === 'sidebar' && (
                                            <div className="flex gap-4">
                                                <div className="hidden sm:block flex-1 bg-muted/20 rounded h-64 animate-pulse opacity-20" />
                                                <div className="w-64 shrink-0">
                                                    <SidebarAd adData={mockAd} />
                                                </div>
                                            </div>
                                        )}

                                        {previewPlacement === 'navbar' && (
                                            <div className="w-full space-y-2">
                                                <div className="w-full h-12 bg-muted/20 rounded-t-lg opacity-20" />
                                                <TopBannerAd adData={mockAd} />
                                                <div className="w-full h-32 bg-muted/20 rounded-b-lg opacity-20" />
                                            </div>
                                        )}

                                        {previewPlacement === 'hero' && (
                                            <div className="w-full">
                                                <div className="w-full h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg mb-2 opacity-20" />
                                                <SponsorToolBanner tool={mockTool} />
                                                <div className="w-full h-24 bg-muted/20 rounded-b-lg mt-2 opacity-20" />
                                            </div>
                                        )}

                                        {previewPlacement === 'inline' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="h-64 bg-muted/20 rounded-xl animate-pulse opacity-20" />
                                                <InlineToolAd adData={mockAd} />
                                                <div className="h-64 bg-muted/20 rounded-xl animate-pulse opacity-20" />
                                            </div>
                                        )}
                                    </div>
                                ) : (selectedPlan === 'featured') ? (
                                    <div className="w-full">
                                        <FeaturedToolCard
                                            tool={mockTool}
                                            remainingSlots={featuredSlots.remaining}
                                            totalSlots={featuredSlots.total}
                                            forceVertical={true}
                                        />
                                        <p className="text-xs text-muted-foreground mt-2 text-center">
                                            * Featured layout may vary based on screen size
                                        </p>
                                    </div>
                                ) : (
                                    <ToolCard tool={mockTool} />
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-2"
                    >
                        <Card className="border-2">
                            <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    Tool Details
                                </CardTitle>
                                <CardDescription>
                                    Please provide accurate information to help users find your tool.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Tool Name <span className="text-red-500">*</span></Label>
                                            <Input
                                                name="name"
                                                id="name"
                                                placeholder="e.g. Magic Writer AI"
                                                required
                                                className="h-12"
                                                onChange={(e) => setPreviewName(e.target.value)}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="url">Website URL <span className="text-red-500">*</span></Label>
                                            <Input name="url" id="url" type="url" placeholder="https://your-tool.com" required className="h-12" />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="description">Short Description <span className="text-red-500">*</span></Label>
                                            <Textarea
                                                name="description"
                                                id="description"
                                                placeholder="Briefly describe what your tool does (Max 200 chars)"
                                                maxLength={200}
                                                required
                                                className="min-h-[100px]"
                                                onChange={(e) => setPreviewDesc(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                                            <Select name="category" required onValueChange={setPreviewCategory}>
                                                <SelectTrigger className="h-12">
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Pricing Model <span className="text-red-500">*</span></Label>
                                            <Select name="pricing_type" required onValueChange={setPreviewPricing}>
                                                <SelectTrigger className="h-12">
                                                    <SelectValue placeholder="Select Pricing" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Free">Free</SelectItem>
                                                    <SelectItem value="Freemium">Freemium</SelectItem>
                                                    <SelectItem value="Paid">Paid</SelectItem>
                                                    <SelectItem value="Free Trial">Free Trial</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Sponsor Options */}
                                    {selectedPlan === 'sponsor' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-4 pt-4 border-t border-border"
                                        >
                                            <Label className="text-amber-500 font-bold flex items-center gap-2">
                                                <Megaphone className="w-4 h-4" />
                                                Sponsor Options <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 text-[10px] border-amber-500/20">Exclusive</Badge>
                                            </Label>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Sidebar Banner */}
                                                <div
                                                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-amber-500/50 ${previewPlacement === 'sidebar' ? 'border-amber-500 bg-amber-500/5' : 'border-border bg-card'}`}
                                                    onClick={() => setPreviewPlacement('sidebar')}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="font-semibold flex items-center gap-2">
                                                            <SidebarIcon className="w-4 h-4 text-muted-foreground" />
                                                            Sidebar Banner
                                                        </div>
                                                        <Badge variant="outline" className="bg-background">5 slots left</Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mb-3">Appears on tool detail pages</p>
                                                    <div className="text-right">
                                                        <div className="text-xs line-through text-muted-foreground">Rp 150,000</div>
                                                        <div className="text-sm font-bold text-amber-500">Rp 49,000<span className="text-xs font-normal text-muted-foreground">/week</span></div>
                                                    </div>
                                                    {previewPlacement === 'sidebar' && (
                                                        <div className="absolute inset-0 border-2 border-amber-500 rounded-xl pointer-events-none" />
                                                    )}
                                                </div>

                                                {/* Navbar Premium */}
                                                <div
                                                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-amber-500/50 ${previewPlacement === 'navbar' ? 'border-amber-500 bg-amber-500/5' : 'border-border bg-card'}`}
                                                    onClick={() => setPreviewPlacement('navbar')}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="font-semibold flex items-center gap-2">
                                                            <Monitor className="w-4 h-4 text-muted-foreground" />
                                                            Navbar Premium
                                                        </div>
                                                        <Badge variant="outline" className="bg-background">2 slots left</Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mb-3">Top of homepage navigation</p>
                                                    <div className="text-right">
                                                        <div className="text-xs line-through text-muted-foreground">Rp 250,000</div>
                                                        <div className="text-sm font-bold text-amber-500">Rp 99,000<span className="text-xs font-normal text-muted-foreground">/week</span></div>
                                                    </div>
                                                    {previewPlacement === 'navbar' && (
                                                        <div className="absolute inset-0 border-2 border-amber-500 rounded-xl pointer-events-none" />
                                                    )}
                                                </div>

                                                {/* Hero Banner */}
                                                <div
                                                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-amber-500/50 ${previewPlacement === 'hero' ? 'border-amber-500 bg-amber-500/5' : 'border-border bg-card'}`}
                                                    onClick={() => setPreviewPlacement('hero')}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="font-semibold flex items-center gap-2">
                                                            <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                                                            Hero Banner
                                                        </div>
                                                        <Badge variant="outline" className="bg-background">1 slot left</Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mb-3">Large banner on homepage</p>
                                                    <div className="text-right">
                                                        <div className="text-xs line-through text-muted-foreground">Rp 1,000,000</div>
                                                        <div className="text-sm font-bold text-amber-500">Rp 299,000<span className="text-xs font-normal text-muted-foreground">/week</span></div>
                                                    </div>
                                                    {previewPlacement === 'hero' && (
                                                        <div className="absolute inset-0 border-2 border-amber-500 rounded-xl pointer-events-none" />
                                                    )}
                                                </div>

                                                {/* Inline Feed */}
                                                <div
                                                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-amber-500/50 ${previewPlacement === 'inline' ? 'border-amber-500 bg-amber-500/5' : 'border-border bg-card'}`}
                                                    onClick={() => setPreviewPlacement('inline')}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="font-semibold flex items-center gap-2">
                                                            <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                                                            Inline Feed
                                                        </div>
                                                        <Badge variant="outline" className="bg-background">3 slots left</Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mb-3">Within tools listing grid</p>
                                                    <div className="text-right">
                                                        <div className="text-xs line-through text-muted-foreground">Rp 75,000</div>
                                                        <div className="text-sm font-bold text-amber-500">Rp 29,000<span className="text-xs font-normal text-muted-foreground">/week</span></div>
                                                    </div>
                                                    {previewPlacement === 'inline' && (
                                                        <div className="absolute inset-0 border-2 border-amber-500 rounded-xl pointer-events-none" />
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Logo Upload - Available for all */}
                                    <div className="grid gap-2">
                                        <Label className="flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4 text-green-500" />
                                            Logo Upload
                                            <Badge variant="secondary" className="text-xs">All Plans</Badge>
                                        </Label>
                                        <div
                                            className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                                            onClick={() => logoInputRef.current?.click()}
                                        >
                                            <input
                                                type="file"
                                                ref={logoInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleLogoChange}
                                            />
                                            {logoPreview ? (
                                                <div className="flex items-center justify-center gap-4">
                                                    <img src={logoPreview} alt="Logo preview" className="w-16 h-16 rounded-xl object-cover" />
                                                    <div className="text-left">
                                                        <p className="font-medium">{logoFile?.name}</p>
                                                        <p className="text-sm text-muted-foreground">Click to change</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                        <Upload className="w-6 h-6 text-green-500" />
                                                    </div>
                                                    <p className="font-medium">Upload your logo</p>
                                                    <p className="text-sm text-muted-foreground">PNG, JPG up to 2MB</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Video Upload - Paid Plans only */}
                                    <div className="grid gap-2">
                                        <Label className="flex items-center gap-2">
                                            <Video className="w-4 h-4 text-blue-500" />
                                            Demo Video
                                            <Badge className={`text-xs border-0 ${canUploadVideo ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                                {canUploadVideo ? 'Included' : 'Pro+ Only'}
                                            </Badge>
                                        </Label>
                                        <div
                                            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${canUploadVideo
                                                ? 'cursor-pointer hover:border-primary/50 hover:bg-primary/5 group'
                                                : 'opacity-50 cursor-not-allowed bg-muted/30'
                                                }`}
                                            onClick={() => canUploadVideo && videoInputRef.current?.click()}
                                        >
                                            <input
                                                type="file"
                                                ref={videoInputRef}
                                                className="hidden"
                                                accept="video/*"
                                                onChange={handleVideoChange}
                                                disabled={!canUploadVideo}
                                            />
                                            {videoFile ? (
                                                <div className="flex items-center justify-center gap-4">
                                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                                        <Video className="w-8 h-8 text-white" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-medium">{videoFile.name}</p>
                                                        <p className="text-sm text-muted-foreground">Click to change</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3 ${canUploadVideo
                                                        ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:scale-110 transition-transform'
                                                        : 'bg-muted'
                                                        }`}>
                                                        <Video className={`w-6 h-6 ${canUploadVideo ? 'text-blue-500' : 'text-muted-foreground'}`} />
                                                    </div>
                                                    <p className="font-medium">
                                                        {canUploadVideo ? "Upload demo video" : "Upgrade to upload video"}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {canUploadVideo ? "MP4, WebM up to 50MB" : "Showcase your tool with a demo video"}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Sponsor Plan Options */}
                                    {selectedPlan === 'sponsor' && (
                                        <div className="space-y-6 p-6 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-xl border-2 border-yellow-500/20">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Megaphone className="w-5 h-5 text-yellow-500" />
                                                <h3 className="font-semibold text-lg">Sponsor Options</h3>
                                                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">Exclusive</Badge>
                                            </div>

                                            {/* Ad Placement Selection */}
                                            <div className="space-y-3">
                                                <Label className="flex items-center gap-2">
                                                    Ad Placement Location <span className="text-red-500">*</span>
                                                </Label>
                                                <RadioGroup value={adPlacement} onValueChange={setAdPlacement} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <Label
                                                        htmlFor="sidebar"
                                                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${adPlacement === 'sidebar'
                                                            ? 'border-yellow-500 bg-yellow-500/10'
                                                            : 'border-muted hover:border-yellow-500/50'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <RadioGroupItem value="sidebar" id="sidebar" />
                                                            <div>
                                                                <p className="font-medium">Sidebar Banner</p>
                                                                <p className="text-xs text-muted-foreground">Appears on tool detail pages</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-xs text-muted-foreground line-through">Rp 150,000</span>
                                                                <p className="font-semibold text-yellow-600">Rp {(adPrices['sidebar'] || 49000).toLocaleString()}</p>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">/week</p>
                                                            <Badge variant={remainingSlots.sidebar > 0 ? "outline" : "destructive"} className="text-xs mt-1">
                                                                {remainingSlots.sidebar} slots left
                                                            </Badge>
                                                        </div>
                                                    </Label>

                                                    <Label
                                                        htmlFor="navbar"
                                                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${adPlacement === 'navbar'
                                                            ? 'border-yellow-500 bg-yellow-500/10'
                                                            : 'border-muted hover:border-yellow-500/50'} ${remainingSlots.navbar === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <RadioGroupItem value="navbar" id="navbar" disabled={remainingSlots.navbar === 0} />
                                                            <div>
                                                                <p className="font-medium">Navbar Premium</p>
                                                                <p className="text-xs text-muted-foreground">Top of homepage navigation</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-xs text-muted-foreground line-through">Rp 250,000</span>
                                                                <p className="font-semibold text-yellow-600">Rp {(adPrices['navbar'] || 99000).toLocaleString()}</p>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">/week</p>
                                                            <Badge variant={remainingSlots.navbar > 0 ? "outline" : "destructive"} className="text-xs mt-1">
                                                                {remainingSlots.navbar > 0 ? `${remainingSlots.navbar} slots left` : 'Sold out'}
                                                            </Badge>
                                                        </div>
                                                    </Label>

                                                    <Label
                                                        htmlFor="banner"
                                                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${adPlacement === 'banner'
                                                            ? 'border-yellow-500 bg-yellow-500/10'
                                                            : 'border-muted hover:border-yellow-500/50'} ${remainingSlots.banner === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <RadioGroupItem value="banner" id="banner" disabled={remainingSlots.banner === 0} />
                                                            <div>
                                                                <p className="font-medium">Hero Banner</p>
                                                                <p className="text-xs text-muted-foreground">Large banner on homepage</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-xs text-muted-foreground line-through">Rp 1,000,000</span>
                                                                <p className="font-semibold text-yellow-600">Rp {(adPrices['banner'] || 299000).toLocaleString()}</p>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">/week</p>
                                                            <Badge variant={remainingSlots.banner > 0 ? "outline" : "destructive"} className="text-xs mt-1">
                                                                {remainingSlots.banner > 0 ? `${remainingSlots.banner} slots left` : 'Sold out'}
                                                            </Badge>
                                                        </div>
                                                    </Label>

                                                    <Label
                                                        htmlFor="inline"
                                                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${adPlacement === 'inline'
                                                            ? 'border-yellow-500 bg-yellow-500/10'
                                                            : 'border-muted hover:border-yellow-500/50'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <RadioGroupItem value="inline" id="inline" />
                                                            <div>
                                                                <p className="font-medium">Inline Feed</p>
                                                                <p className="text-xs text-muted-foreground">Within tools listing grid</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-xs text-muted-foreground line-through">Rp 75,000</span>
                                                                <p className="font-semibold text-yellow-600">Rp {(adPrices['inline'] || 29000).toLocaleString()}</p>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">/week</p>
                                                            <Badge variant={remainingSlots.inline > 0 ? "outline" : "destructive"} className="text-xs mt-1">
                                                                {remainingSlots.inline} slots left
                                                            </Badge>
                                                        </div>
                                                    </Label>
                                                </RadioGroup>
                                            </div>

                                            {/* Ad Duration Selection */}
                                            <div className="space-y-3">
                                                <Label className="flex items-center gap-2">
                                                    <CalendarIcon className="w-4 h-4 text-yellow-500" />
                                                    Ad Duration
                                                    <span className="text-sm text-muted-foreground">(Base: 30 days included)</span>
                                                </Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal h-12",
                                                                !date && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {date?.from ? (
                                                                date.to ? (
                                                                    <>
                                                                        {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                                                                        <span className="ml-auto text-muted-foreground">
                                                                            ({Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24))} days)
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    format(date.from, "LLL dd, y")
                                                                )
                                                            ) : (
                                                                <span>Pick a date range</span>
                                                            )}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            initialFocus
                                                            mode="range"
                                                            defaultMonth={date?.from}
                                                            selected={date}
                                                            onSelect={setDate}
                                                            numberOfMonths={2}
                                                            disabled={(date) => date < new Date()}
                                                        />
                                                    </PopoverContent>
                                                </Popover>

                                                {/* Duration Quick Select */}
                                                <div className="flex gap-2 flex-wrap">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setDate({ from: new Date(), to: addDays(new Date(), 30) })}
                                                        className={date?.to && Math.ceil((date.to.getTime() - (date.from?.getTime() || 0)) / (1000 * 60 * 60 * 24)) === 30 ? 'border-yellow-500 bg-yellow-500/10' : ''}
                                                    >
                                                        30 Days (Included)
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setDate({ from: new Date(), to: addDays(new Date(), 60) })}
                                                        className={date?.to && Math.ceil((date.to.getTime() - (date.from?.getTime() || 0)) / (1000 * 60 * 60 * 24)) === 60 ? 'border-yellow-500 bg-yellow-500/10' : ''}
                                                    >
                                                        60 Days (+4 weeks)
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setDate({ from: new Date(), to: addDays(new Date(), 90) })}
                                                        className={date?.to && Math.ceil((date.to.getTime() - (date.from?.getTime() || 0)) / (1000 * 60 * 60 * 24)) === 90 ? 'border-yellow-500 bg-yellow-500/10' : ''}
                                                    >
                                                        90 Days (+8 weeks)
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Price Breakdown */}
                                            <div className="bg-background/80 rounded-xl p-4 space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Ad Placement ({adPlacement})</span>
                                                    <span>Rp {(adPrices[adPlacement] || 0).toLocaleString()} x 4 weeks</span>
                                                </div>
                                                <div className="flex justify-between font-bold pt-2 border-t">
                                                    <span>Total (30 Days)</span>
                                                    <span>Rp {calculateTotal().toLocaleString()}</span>
                                                </div>
                                                {date?.from && date?.to && (() => {
                                                    const days = Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24))
                                                    const extraDays = Math.max(0, days - 30)
                                                    const extraWeeks = Math.ceil(extraDays / 7)
                                                    const weeklyRate = adPrices[adPlacement] || 100000
                                                    const extraCost = extraWeeks * weeklyRate

                                                    if (extraWeeks > 0) {
                                                        return (
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">
                                                                    Extra Duration (+{extraWeeks} weeks)
                                                                </span>
                                                                <span className="text-yellow-600">
                                                                    +Rp {extraCost.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                })()}
                                                <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                                                    <span>Total</span>
                                                    <span className="text-xl bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                                                        Rp {totalPrice.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={isSubmitting}
                                        className="w-full h-14 text-lg bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : isPaidPlan ? (
                                            <>
                                                Submit & Pay Rp {totalPrice.toLocaleString()}
                                                <ArrowRight className="w-5 h-5 ml-2" />
                                            </>
                                        ) : (
                                            <>
                                                Submit Tool
                                                <ArrowRight className="w-5 h-5 ml-2" />
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-xs text-center text-muted-foreground">
                                        By submitting, you agree to our Terms of Service and Privacy Policy
                                    </p>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default function SubmitToolPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <SubmitToolContent />
        </Suspense>
    )
}
