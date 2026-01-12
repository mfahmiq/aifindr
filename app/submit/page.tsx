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
    Loader2
} from "lucide-react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

interface Category {
    id: string
    name: string
    slug: string
}

import { Suspense } from 'react'

const SubmitToolContent = () => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const initialPlan = searchParams.get('plan') || 'free'

    const [submitted, setSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState(initialPlan)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
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
                const [slots, settings] = await Promise.all([
                    adsService.getRemainingSlots(),
                    adsService.getSettings()
                ])

                setRemainingSlots(prev => ({ ...prev, ...slots } as any))
                const prices: Record<string, number> = {}
                if (settings) {
                    settings.forEach((s: any) => {
                        prices[s.placement] = s.price_per_period * 1000
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
            reader.onloadend = () => {
                setLogoPreview(reader.result as string)
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
            const { error } = await supabase
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
                    video_url: videoUrl,
                    submitted_by: userId,
                    owner_id: userId,
                    submitted_email: userEmail,
                    status: 'pending',
                    is_verified: false,
                    is_priority: false,
                    has_backlink: false,
                    created_at: new Date().toISOString()
                })

            if (error) throw error

            setSubmitted(true)
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
            price: "Rp 150rb",
            period: "/month",
            description: "Stand out",
            features: ["Everything in Free", "Video upload", "Verified badge", "Priority ranking"],
            color: "from-blue-500 to-cyan-500",
            popular: true
        },
        {
            id: "featured",
            name: "Featured",
            price: "Rp 450rb",
            period: "/month",
            description: "Maximum visibility",
            features: ["Everything in Pro", "Featured badge", "Top of category", "Newsletter mention"],
            color: "from-purple-500 to-pink-500"
        },
        {
            id: "sponsor",
            name: "Sponsor",
            price: "Rp 750rb",
            period: "/month",
            description: "Exclusive promotion",
            features: ["Everything in Featured", "Banner ads", "No competitor ads", "Premium support"],
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

        let total = 750000
        if (date?.from && date?.to && adPlacement && adPrices[adPlacement]) {
            const days = Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24))
            const extraDays = Math.max(0, days - 30)
            const extraWeeks = Math.ceil(extraDays / 7)
            if (extraWeeks > 0) total += extraWeeks * adPrices[adPlacement]
        }
        return total
    }

    const totalPrice = calculateTotal()
    const isPaidPlan = selectedPlan !== 'free'
    const canUploadVideo = ['pro', 'featured', 'sponsor'].includes(selectedPlan)

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
                            {plans.map((plan) => (
                                <Card
                                    key={plan.id}
                                    className={`cursor-pointer transition-all ${selectedPlan === plan.id
                                        ? 'border-2 border-primary shadow-lg shadow-primary/10'
                                        : 'border-2 border-muted hover:border-primary/30'
                                        }`}
                                    onClick={() => setSelectedPlan(plan.id)}
                                >
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
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">{plan.description}</div>
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === plan.id ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                                                }`}>
                                                {selectedPlan === plan.id && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-1 mb-3">
                                            <span className="text-xl font-bold">{plan.price}</span>
                                            <span className="text-sm text-muted-foreground">{plan.period}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
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
                                            <Input name="name" id="name" placeholder="e.g. Magic Writer AI" required className="h-12" />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="url">Website URL <span className="text-red-500">*</span></Label>
                                            <Input name="url" id="url" type="url" placeholder="https://your-tool.com" required className="h-12" />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="description">Short Description <span className="text-red-500">*</span></Label>
                                            <Textarea name="description" id="description" placeholder="Briefly describe what your tool does (Max 200 chars)" maxLength={200} required className="min-h-[100px]" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                                            <Select name="category" required>
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
                                            <Select name="pricing_type" required>
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
