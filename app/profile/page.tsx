"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StarRating } from "@/components/star-rating"
import { ToolCard } from "@/components/tool-card"
import {
    User,
    Heart,
    MessageSquare,
    Settings,
    Calendar,
    Star,
    ExternalLink,
    Edit,
    Loader2,
    LogIn
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export default function ProfilePage() {
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [favorites, setFavorites] = useState<any[]>([])
    const [reviews, setReviews] = useState<any[]>([])

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const supabase = createClient()

                // Get current user
                const { data: { user: authUser } } = await supabase.auth.getUser()

                if (!authUser) {
                    setLoading(false)
                    return
                }

                // Get user profile
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single()

                setUser(profile || {
                    name: authUser.email?.split('@')[0] || 'User',
                    email: authUser.email,
                    created_at: authUser.created_at,
                })

                // Get user's favorites
                const { data: favs } = await supabase
                    .from('favorites')
                    .select(`
                        *,
                        tools (*)
                    `)
                    .eq('user_id', authUser.id)

                if (favs) {
                    setFavorites(favs.map(f => f.tools).filter(Boolean))
                }

                // Get user's reviews
                const { data: userReviews } = await supabase
                    .from('reviews')
                    .select(`
                        *,
                        tools (name, slug)
                    `)
                    .eq('user_id', authUser.id)
                    .order('created_at', { ascending: false })

                if (userReviews) {
                    setReviews(userReviews)
                }

            } catch (error) {
                console.error('Error fetching user data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchUserData()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="container mx-auto py-24 px-4 text-center">
                <div className="max-w-md mx-auto">
                    <User className="w-20 h-20 mx-auto text-muted-foreground mb-6" />
                    <h1 className="text-3xl font-bold mb-4">Sign In Required</h1>
                    <p className="text-muted-foreground mb-8">
                        Please sign in to view your profile, favorites, and reviews.
                    </p>
                    <Button size="lg" asChild>
                        <Link href="/login">
                            <LogIn className="w-5 h-5 mr-2" />
                            Sign In
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    const joinedDate = user.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        : 'Recently'

    return (
        <div className="container mx-auto py-12 px-4 max-w-5xl">
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row items-start gap-6 mb-8"
            >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-4xl font-bold text-primary">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl font-bold">{user.name || user.email?.split('@')[0]}</h1>
                        {user.role === 'admin' && <Badge>Admin</Badge>}
                    </div>
                    <p className="text-muted-foreground mt-2">{user.bio || 'No bio yet'}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Joined {joinedDate}
                        </span>
                        <span className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            {reviews.length} reviews
                        </span>
                    </div>
                </div>
                <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                </Button>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardContent className="p-4 text-center">
                        <Heart className="w-6 h-6 mx-auto text-red-500 mb-2" />
                        <div className="text-2xl font-bold">{favorites.length}</div>
                        <div className="text-sm text-muted-foreground">Favorites</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <MessageSquare className="w-6 h-6 mx-auto text-blue-500 mb-2" />
                        <div className="text-2xl font-bold">{reviews.length}</div>
                        <div className="text-sm text-muted-foreground">Reviews</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <ExternalLink className="w-6 h-6 mx-auto text-green-500 mb-2" />
                        <div className="text-2xl font-bold">0</div>
                        <div className="text-sm text-muted-foreground">Submitted</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <Star className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
                        <div className="text-2xl font-bold">
                            {reviews.length > 0
                                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                                : '-'
                            }
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Rating</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs Content */}
            <Tabs defaultValue="favorites" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="favorites" className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Favorites
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        My Reviews
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="favorites">
                    {favorites.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {favorites.map((tool, index) => (
                                <ToolCard key={tool.id} tool={tool} index={index} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No favorites yet. Start exploring and save tools you love!</p>
                            <Button className="mt-4" asChild>
                                <Link href="/">Browse Tools</Link>
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="reviews">
                    {reviews.length > 0 ? (
                        <div className="space-y-4">
                            {reviews.map(review => (
                                <Card key={review.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                {review.tools?.name?.substring(0, 2) || '??'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <Link href={`/tool/${review.tools?.slug || ''}`} className="font-semibold hover:text-primary">
                                                        {review.tools?.name || 'Unknown Tool'}
                                                    </Link>
                                                    <span className="text-sm text-muted-foreground">
                                                        {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                                                    </span>
                                                </div>
                                                <StarRating rating={review.rating} size="sm" />
                                                <p className="text-muted-foreground mt-2">{review.comment}</p>
                                                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                                    <span>{review.helpful_count || 0} people found this helpful</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No reviews yet. Share your thoughts on AI tools!</p>
                            <Button className="mt-4" asChild>
                                <Link href="/">Find Tools to Review</Link>
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Display Name</label>
                                <input
                                    type="text"
                                    defaultValue={user.name || ''}
                                    className="w-full p-2 border rounded-md bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <input
                                    type="email"
                                    defaultValue={user.email || ''}
                                    className="w-full p-2 border rounded-md bg-background"
                                    disabled
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bio</label>
                                <textarea
                                    defaultValue={user.bio || ''}
                                    className="w-full p-2 border rounded-md bg-background resize-none"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-4">
                                <Button>Save Changes</Button>
                                <Button variant="outline">Cancel</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Once you delete your account, there is no going back. Please be certain.
                            </p>
                            <Button variant="destructive">Delete Account</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
