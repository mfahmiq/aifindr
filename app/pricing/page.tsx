"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Check,
    CalendarDays,
    Megaphone,
    LayoutGrid,
    Sidebar as SidebarIcon,
    Award,
    Sparkles,
    TrendingUp,
    Users,
    Eye,
    MousePointer,
    Star,
    Zap,
    ArrowRight
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { PaymentButton } from "@/components/payment-button"
import { PLAN_PRICING } from "@/lib/services/subscriptionService"
import { useLoginPopup } from "@/components/login-popup"

export default function PricingPage() {
    const { user, showLoginPopup, isLoading } = useLoginPopup()
    const router = useRouter()

    const handlePlanClick = (href: string, planName: string) => {
        if (!user) {
            showLoginPopup({
                message: `Login untuk submit tool dengan paket ${planName}`,
                returnUrl: href
            })
            return
        }
        router.push(href)
    }
    const stats = [
        { label: "Monthly views", value: "10k+", icon: Eye, color: "from-blue-500 to-cyan-500" },
        { label: "Newsletter subs", value: "500+", icon: Users, color: "from-purple-500 to-pink-500" },
        { label: "Listed AI tools", value: "20+", icon: LayoutGrid, color: "from-green-500 to-emerald-500" },
        { label: "Monthly clicks", value: "2k+", icon: MousePointer, color: "from-orange-500 to-red-500" },
    ]

    const placements = [
        {
            id: "free",
            name: "Free Listing",
            icon: <LayoutGrid className="w-6 h-6" />,
            iconColor: "from-green-500 to-emerald-500",
            price: "Rp 0",
            period: "/forever",
            description: "Get listed in our directory. Perfect for new tools.",
            features: [
                "Permanent Listing",
                "Standard visibility",
                "Searchable",
                "Community reviews"
            ],
            cta: "Submit Now",
            href: "/submit?plan=free",
            available: true,
            popular: false,
            amount: 0
        },
        {
            id: "pro",
            name: "Pro Plan",
            icon: <Award className="w-6 h-6" />,
            iconColor: "from-blue-500 to-cyan-500",
            price: "Rp 49rb",
            originalPrice: "Rp 150rb",
            period: "/bulan",
            description: "Entry Level (Best Value)",
            features: [
                "Everything in Free",
                "View Analytics (Stats)",
                "Verified Badge (Blue Check)",
                "Reply to Reviews",
                "Priority Support"
            ],
            cta: "Get Pro",
            href: "/submit?plan=pro",
            available: true,
            popular: true,
            amount: PLAN_PRICING.pro
        },
        {
            id: "featured",
            name: "Featured Plan",
            icon: <Star className="w-6 h-6" />,
            iconColor: "from-purple-500 to-pink-500",
            price: "Rp 149rb",
            originalPrice: "Rp 750rb",
            period: "/bulan",
            description: "Elite Quartet (Top 4) - Maximum visibility.",
            features: [
                "Everything in Pro",
                "Featured Badge",
                "Top position in Categories",
                "Homepage Placement",
                "Limited availability (4/mo)"
            ],
            cta: "Get Featured",
            href: "/submit?plan=featured",
            available: true,
            popular: false,
            amount: PLAN_PRICING.featured
        },
        {
            id: "sponsor",
            name: "Sponsor Plan",
            icon: <Megaphone className="w-6 h-6" />,
            iconColor: "from-yellow-500 to-orange-500",
            price: "Rp 299rb",
            originalPrice: "Rp 1.5jt",
            period: "/minggu",
            description: "Exclusive visibility with ad-free profile options.",
            features: [
                "Everything in Featured",
                "Exclusive Banner Ads",
                "No Competitor Ads on Profile",
                "Premium Support",
                "Social Media Mention"
            ],
            cta: "Become Sponsor",
            href: "/submit?plan=sponsor",
            available: true,
            popular: false,
            amount: PLAN_PRICING.sponsor
        }
    ]

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
                    <motion.div
                        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.3, 0.2] }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-pink-500/30 to-orange-500/30 rounded-full blur-3xl"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:32px_32px]" />
                    <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent" />
                </div>

                <div className="container mx-auto px-4 py-20 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <Badge className="mb-6 px-4 py-1.5 bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30">
                            <Sparkles className="w-3.5 h-3.5 mr-2 text-primary" />
                            <span className="text-primary">Launch Pricing - Limited Time</span>
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
                            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                Promote
                            </span>{" "}
                            Your AI Tool
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Get your brand in front of thousands of early adopters and AI enthusiasts.
                            Choose the placement that fits your goals.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
                >
                    {stats.map((stat, i) => (
                        <Card key={i} className={`bg-gradient-to-br ${stat.color.replace('from-', 'from-').replace('to-', 'to-')}/10 border-2`}>
                            <CardContent className="p-6 text-center">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                                <div className="text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                            </CardContent>
                        </Card>
                    ))}
                </motion.div>

                {/* Placements Grid */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">Available Placements</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                    {placements.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="relative"
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                    <Badge className="bg-gradient-to-r from-primary to-purple-500 text-white border-0 shadow-lg">
                                        <Star className="w-3 h-3 mr-1 fill-white" />
                                        Most Popular
                                    </Badge>
                                </div>
                            )}
                            <Card className={`h-full flex flex-col overflow-hidden transition-all ${plan.popular
                                ? 'border-2 border-primary/50 shadow-xl shadow-primary/10'
                                : 'border-2 border-muted/50 hover:border-primary/30'
                                }`}>
                                <div className={`h-1.5 bg-gradient-to-r ${plan.iconColor}`} />
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.iconColor} flex items-center justify-center text-white shadow-lg`}>
                                            {plan.icon}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                                        </div>
                                    </div>
                                    <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="flex flex-col mb-6">
                                        <div className="flex items-baseline">
                                            <span className="text-4xl font-bold">{plan.price}</span>
                                            <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                                        </div>
                                        {/* @ts-ignore */}
                                        {plan.originalPrice && (
                                            <span className="text-sm text-muted-foreground line-through decoration-red-500 mt-1">
                                                Normally {plan.originalPrice}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        {plan.name.includes("Sponsor") && (
                                            <div className="text-xs font-medium text-green-500 mb-2 flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" />
                                                {plan.name === "Top Banner" ? "5% off each extra week" : "Launch Price Offer"}
                                            </div>
                                        )}
                                        <ul className="space-y-2.5">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                        <Check className="h-3 w-3 text-green-500" />
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <Button
                                        className={`w-full ${plan.popular
                                            ? 'bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90'
                                            : plan.id === 'featured'
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                                                : plan.id === 'sponsor'
                                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                                                    : ''
                                            }`}
                                        variant={plan.name.includes("Free") ? "outline" : "default"}
                                        onClick={() => handlePlanClick(plan.href, plan.name)}
                                    >
                                        {plan.name.includes("Sponsor") ? (
                                            <span className="flex items-center gap-2">
                                                <CalendarDays className="w-4 h-4" /> Select Dates
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                {plan.cta}
                                                <ArrowRight className="w-4 h-4" />
                                            </span>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="max-w-3xl mx-auto"
                >
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold mb-2">Frequently Asked Questions</h2>
                        <p className="text-muted-foreground">Everything you need to know about our pricing</p>
                    </div>
                    <Card className="border-2">
                        <CardContent className="p-6">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1" className="border-muted/50">
                                    <AccordionTrigger className="hover:no-underline hover:text-primary">
                                        How do I provide my logo and link?
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        Fill out the submission form with your tool's details, logo, and link. Payment (if applicable) is the final step of the submission process.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2" className="border-muted/50">
                                    <AccordionTrigger className="hover:no-underline hover:text-primary">
                                        Can I update my listing later?
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        Yes, you will receive a management link via email to update your tool details, screenshots, and features at any time.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3" className="border-muted/50">
                                    <AccordionTrigger className="hover:no-underline hover:text-primary">
                                        What does "Permanent Listing" mean?
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        Your tool will remain in our directory indefinitely as long as the website exists. We do not remove free listings unless they violate our terms or become inactive/broken.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-4" className="border-muted/50 border-b-0">
                                    <AccordionTrigger className="hover:no-underline hover:text-primary">
                                        Do you offer refunds for sponsorships?
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        Yes, if you cancel before your campaign start date, we offer a full refund. Prorated refunds are available for active campaigns on a case-by-case basis.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="mt-20"
                >
                    <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 border-2 border-primary/20 overflow-hidden">
                        <CardContent className="py-12 text-center relative">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-2xl" />
                            <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
                            <h2 className="text-3xl font-bold mb-3">Ready to Get Started?</h2>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                Join hundreds of AI tools already listed on our platform.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <Button
                                    size="lg"
                                    className="bg-gradient-to-r from-primary to-purple-500"
                                    onClick={() => handlePlanClick('/submit', 'Free')}
                                >
                                    <Zap className="w-5 h-5 mr-2" />
                                    Submit Your Tool
                                </Button>
                                <Button size="lg" variant="outline" asChild>
                                    <Link href="/contact">
                                        Contact Sales
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div >
    )
}
