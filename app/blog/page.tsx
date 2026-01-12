"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Newspaper,
    Search,
    Calendar,
    Clock,
    User,
    ArrowRight,
    Sparkles,
    BookOpen,
    Loader2
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { blogService } from "@/lib/services/blogService"
import { BlogPost } from "@/lib/types"

const categoryColors: Record<string, string> = {
    'News': 'from-blue-500 to-cyan-500',
    'Tutorials': 'from-green-500 to-emerald-500',
    'Reviews': 'from-purple-500 to-pink-500',
    'Tips': 'from-orange-500 to-amber-500',
    'default': 'from-primary to-purple-500'
}

export default function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const data = await blogService.getPosts()
                setPosts(data)
            } catch (error) {
                console.error('Error fetching blog posts:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchPosts()
    }, [])

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const formatDate = (dateString: string | null) => {
        if (!dateString) return ''
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 overflow-hidden">
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
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <Badge className="mb-4 px-4 py-1.5 bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30">
                            <BookOpen className="w-3.5 h-3.5 mr-2 text-primary" />
                            <span className="text-emerald-600 dark:text-emerald-400">{posts.length} Articles</span>
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                AI Blog
                            </span>
                        </h1>
                        <p className="text-lg text-muted-foreground mb-6">
                            Stay updated with the latest AI trends, tutorials, and industry insights.
                        </p>

                        {/* Search */}
                        <div className="relative max-w-md mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                                placeholder="Search articles..."
                                className="pl-12 h-12 text-lg rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto py-12 px-4 max-w-6xl">
                {filteredPosts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="p-12 text-center bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border-2 border-dashed border-primary/20">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Newspaper className="w-20 h-20 mx-auto text-primary/40 mb-6" />
                            </motion.div>
                            <h2 className="text-2xl font-bold mb-3">No Articles Found</h2>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                {searchQuery ? `No articles match "${searchQuery}". Try a different search term.` : 'Our writers are crafting new content. Check back soon for the latest AI insights!'}
                            </p>
                            {searchQuery && (
                                <Button variant="outline" onClick={() => setSearchQuery('')}>
                                    Clear Search
                                </Button>
                            )}
                        </Card>
                    </motion.div>
                ) : (
                    <>
                        {/* Featured Post */}
                        {filteredPosts[0] && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-12"
                            >
                                <Link href={`/blog/${filteredPosts[0].slug}`}>
                                    <Card className="overflow-hidden hover:shadow-xl transition-all border-2 hover:border-primary/30">
                                        <div className="md:flex">
                                            <div className={`aspect-video md:aspect-auto md:w-1/2 bg-gradient-to-br ${categoryColors[filteredPosts[0].category || ''] || categoryColors['default']} flex items-center justify-center relative overflow-hidden p-8`}>
                                                <Sparkles className="w-24 h-24 text-white/30" />
                                            </div>
                                            <CardContent className="p-8 md:w-1/2">
                                                <Badge className="mb-3">{filteredPosts[0].category}</Badge>
                                                <h2 className="text-2xl md:text-3xl font-bold mb-3 line-clamp-2">
                                                    {filteredPosts[0].title}
                                                </h2>
                                                <p className="text-muted-foreground mb-6 line-clamp-3">{filteredPosts[0].excerpt}</p>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4" />
                                                        {filteredPosts[0].author_name || 'Admin'}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatDate(filteredPosts[0].published_at)}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        {filteredPosts[0].read_time || 5} min read
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </div>
                                    </Card>
                                </Link>
                            </motion.div>
                        )}

                        {/* Other Posts Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPosts.slice(1).map((post, index) => {
                                const gradientClass = categoryColors[post.category || ''] || categoryColors['default']

                                return (
                                    <motion.div
                                        key={post.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ y: -5 }}
                                    >
                                        <Link href={`/blog/${post.slug}`}>
                                            <Card className="h-full overflow-hidden hover:shadow-lg transition-all border-2 hover:border-primary/30">
                                                <div className={`aspect-video bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
                                                    <Newspaper className="w-12 h-12 text-white/30" />
                                                </div>
                                                <CardContent className="p-5">
                                                    <Badge variant="outline" className="mb-2">{post.category}</Badge>
                                                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{post.title}</h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span>{formatDate(post.published_at)}</span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {post.read_time || 5} min
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
