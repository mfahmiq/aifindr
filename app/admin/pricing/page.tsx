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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Save, Loader2, Check } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { PLAN_PRICING, PLAN_FEATURES } from "@/lib/services/subscriptionService"

// Feature name mapping for display
const featureNames: Record<string, string> = {
    basicListing: "Basic Listing",
    viewStats: "View Analytics",
    replyReviews: "Reply to Reviews",
    priorityListing: "Priority Listing",
    featuredBadge: "Featured Badge",
    homepagePlacement: "Homepage Placement",
    noCompetitorAds: "No Competitor Ads",
    bannerAds: "Banner Ads"
}

// Plan descriptions
const planDescriptions: Record<string, string> = {
    free: "Get listed in our directory. Perfect for new tools.",
    pro: "Stand out with analytics and priority ranking.",
    featured: "Higher visibility with featured badge and homepage placement.",
    sponsor: "Maximum visibility with exclusive ad-free profile."
}

// Build placements from constants
const buildPlacements = () => {
    return (Object.keys(PLAN_PRICING) as Array<keyof typeof PLAN_PRICING>).map(plan => {
        const features = Object.entries(PLAN_FEATURES[plan])
            .filter(([_, enabled]) => enabled)
            .map(([key]) => featureNames[key] || key)

        return {
            id: plan,
            name: plan === 'free' ? 'Free Listing' : `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
            price: PLAN_PRICING[plan].toString(),
            period: plan === 'free' ? '/forever' : '/month',
            description: planDescriptions[plan] || '',
            features,
            slotsTotal: -1,
            slotsBooked: 0,
            isActive: true
        }
    })
}

export default function AdminPricingPage() {
    const [placements, setPlacements] = useState(buildPlacements())
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const handleUpdate = (index: number, field: string, value: any) => {
        const newPlacements = [...placements]
        newPlacements[index] = { ...newPlacements[index], [field]: value }
        setPlacements(newPlacements)
    }

    const handleFeatureUpdate = (planIndex: number, featureIndex: number, value: string) => {
        const newPlacements = [...placements]
        const newFeatures = [...newPlacements[planIndex].features]
        newFeatures[featureIndex] = value
        newPlacements[planIndex].features = newFeatures
        setPlacements(newPlacements)
    }

    const addFeature = (planIndex: number) => {
        const newPlacements = [...placements]
        newPlacements[planIndex].features.push("New Feature")
        setPlacements(newPlacements)
    }

    const removeFeature = (planIndex: number, featureIndex: number) => {
        const newPlacements = [...placements]
        newPlacements[planIndex].features.splice(featureIndex, 1)
        setPlacements(newPlacements)
    }

    const handleSave = async () => {
        setSaving(true)
        setSaved(false)
        // TODO: Implement actual save to database when subscription_plans table is created
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pricing & Availability</h1>
                    <p className="text-muted-foreground">Manage your subscription plans and benefits. Data is synced from subscriptionService.</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : saved ? (
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save All Changes'}
                </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {placements.map((plan, i) => (
                    <Card key={plan.id} className="relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1 h-full ${plan.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <CardHeader className="pl-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1 w-full mr-4">
                                    <Label className="text-xs text-muted-foreground uppercase">Plan Name</Label>
                                    <Input
                                        value={plan.name}
                                        onChange={(e) => handleUpdate(i, 'name', e.target.value)}
                                        className="font-bold text-xl h-auto py-1 px-2 -ml-2 border-transparent hover:border-input focus:border-input transition-colors"
                                    />
                                </div>
                                <Badge variant={plan.slotsTotal === -1 || plan.slotsBooked < plan.slotsTotal ? "outline" : "destructive"}>
                                    {plan.slotsTotal === -1
                                        ? "Unlimited Slots"
                                        : `${plan.slotsTotal - plan.slotsBooked} Slots Left`
                                    }
                                </Badge>
                            </div>
                            <div className="mt-2">
                                <Label className="text-xs text-muted-foreground uppercase">Description</Label>
                                <Textarea
                                    value={plan.description}
                                    onChange={(e) => handleUpdate(i, 'description', e.target.value)}
                                    className="resize-none h-16 mt-1"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="pl-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Price ($)</Label>
                                    <div className="flex items-center mt-1.5">
                                        <span className="text-muted-foreground mr-2 font-bold">$</span>
                                        <Input
                                            type="number"
                                            value={plan.price}
                                            onChange={(e) => handleUpdate(i, 'price', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Billing Period</Label>
                                    <Input
                                        value={plan.period}
                                        onChange={(e) => handleUpdate(i, 'period', e.target.value)}
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>

                            {plan.slotsTotal !== -1 && (
                                <div className="p-4 bg-muted/50 rounded-lg border">
                                    <Label className="mb-2 block font-semibold">Inventory Management</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs">Total Slots</Label>
                                            <Input
                                                type="number"
                                                value={plan.slotsTotal}
                                                onChange={(e) => handleUpdate(i, 'slotsTotal', parseInt(e.target.value))}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Booked Slots</Label>
                                            <Input
                                                type="number"
                                                value={plan.slotsBooked}
                                                onChange={(e) => handleUpdate(i, 'slotsBooked', parseInt(e.target.value))}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        Adjusting "Booked" will immediately affect availability shown to users.
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <Label>Features & Benefits</Label>
                                    <Button size="sm" variant="ghost" onClick={() => addFeature(i)} className="h-6">
                                        <Plus className="w-3 h-3 mr-1" /> Add
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {plan.features.map((feature, fIndex) => (
                                        <div key={fIndex} className="flex gap-2">
                                            <Input
                                                value={feature}
                                                onChange={(e) => handleFeatureUpdate(i, fIndex, e.target.value)}
                                            />
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="shrink-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => removeFeature(i, fIndex)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pl-6 bg-muted/20 border-t py-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground w-full">
                                <span className="flex h-2 w-2 rounded-full bg-green-500" />
                                Active on public page
                                <Button variant="link" size="sm" className="ml-auto text-destructive h-auto p-0 hover:no-underline">
                                    Deactivate Plan
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
