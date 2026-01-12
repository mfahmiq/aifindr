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
    Gift
} from "lucide-react"
import { motion } from "framer-motion"
import { toolsService } from "@/lib/services/toolsService"
import { ToolWithRelations } from "@/lib/types"

export default function ToolManagePage() {
    const params = useParams()
    const slug = params.slug as string

    const [tool, setTool] = useState<ToolWithRelations | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        short_description: '',
        long_description: '',
        website_url: '',
        video_url: ''
    })

    useEffect(() => {
        const fetchTool = async () => {
            try {
                const data = await toolsService.getToolBySlug(slug)
                if (data) {
                    setTool(data)
                    setFormData({
                        short_description: data.short_description || '',
                        long_description: data.long_description || '',
                        website_url: data.website_url || '',
                        video_url: data.video_url || ''
                    })
                }
            } catch (error) {
                console.error('Error fetching tool:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchTool()
    }, [slug])

    const handleSave = async () => {
        if (!tool) return
        setSaving(true)
        try {
            await toolsService.updateTool(tool.id, formData)
            // Show success message
        } catch (error) {
            console.error('Error saving:', error)
        } finally {
            setSaving(false)
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
                                <img src={tool.logo_url} alt={tool.name} className="w-10 h-10 rounded-lg" />
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
                <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
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
                </TabsList>

                {/* Edit Tab */}
                <TabsContent value="edit">
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Tool Information</CardTitle>
                            <CardDescription>Update your tool's details and description</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
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
                                    <h3 className="font-semibold mb-2">Analytics Coming Soon</h3>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        Detailed analytics with charts and insights will be available here.
                                        Upgrade to Pro to access this feature.
                                    </p>
                                    <Link href="/pricing">
                                        <Button className="mt-4" variant="outline">
                                            Upgrade to Pro
                                        </Button>
                                    </Link>
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
                            <div className="flex items-center justify-center py-16 text-center">
                                <div>
                                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="font-semibold mb-2">No Reviews Yet</h3>
                                    <p className="text-sm text-muted-foreground">
                                        When users leave reviews, they will appear here.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Deals Tab */}
                <TabsContent value="deals">
                    <Card>
                        <CardHeader>
                            <CardTitle>Deals & Promotions</CardTitle>
                            <CardDescription>Create special offers for your tool</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center py-16 text-center">
                                <div>
                                    <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="font-semibold mb-2">Create a Deal</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Offer discounts and promotions to attract more users.
                                    </p>
                                    <Button>Create Deal</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
