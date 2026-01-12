"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Calendar,
    Clock,
    User,
    ArrowLeft,
    Share2,
    Bookmark,
    Loader2,
    ArrowRight
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { blogService } from "@/lib/services/blogService"
import { BlogPost } from "@/lib/types"

export default function BlogPostPage() {
    const params = useParams()
    const slug = params?.slug as string
    const [post, setPost] = useState<BlogPost | null>(null)
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPost = async () => {
            if (!slug) return

            try {
                const data = await blogService.getPostBySlug(slug)
                setPost(data)

                // Fetch related posts
                const allPosts = await blogService.getPosts()
                const related = allPosts
                    .filter(p => p.id !== data?.id && p.category === data?.category)
                    .slice(0, 3)
                setRelatedPosts(related)
            } catch (error) {
                console.error('Error fetching blog post:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchPost()
    }, [slug])

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

    if (!post) {
        return (
            <div className="container mx-auto py-24 px-4 text-center">
                <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
                <p className="text-muted-foreground mb-8">
                    The blog post you're looking for doesn't exist or has been removed.
                </p>
                <Button asChild>
                    <Link href="/blog">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Blog
                    </Link>
                </Button>
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

                <div className="container mx-auto px-4 py-12 relative">
                    <Link href="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Blog
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl"
                    >
                        <Badge className="mb-4">{post.category}</Badge>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                            {post.title}
                        </h1>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {post.author_name || 'Admin'}
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {formatDate(post.published_at)}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {post.read_time || 5} min read
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto py-12 px-4">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Main Content */}
                    <article className="lg:col-span-3">
                        <Card className="border-2">
                            <CardContent className="p-8 prose prose-lg dark:prose-invert max-w-none">
                                {post.excerpt && (
                                    <p className="text-xl text-muted-foreground leading-relaxed mb-8 font-medium">
                                        {post.excerpt}
                                    </p>
                                )}
                                <div
                                    className="blog-content"
                                    dangerouslySetInnerHTML={{ __html: post.content || '' }}
                                />
                            </CardContent>
                        </Card>

                        {/* Share & Save */}
                        <div className="flex items-center justify-between mt-6 p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm">
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Bookmark className="w-4 h-4 mr-2" />
                                    Save
                                </Button>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {post.view_count || 0} views
                            </div>
                        </div>
                    </article>

                    {/* Sidebar */}
                    <aside className="space-y-6">
                        {/* Author Card */}
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-semibold mb-4">About the Author</h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-bold text-primary">
                                        {(post.author_name || 'A').charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-medium">{post.author_name || 'Admin'}</div>
                                        <div className="text-sm text-muted-foreground">Content Writer</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Related Posts */}
                        {relatedPosts.length > 0 && (
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="font-semibold mb-4">Related Posts</h3>
                                    <div className="space-y-4">
                                        {relatedPosts.map(related => (
                                            <Link
                                                key={related.id}
                                                href={`/blog/${related.slug}`}
                                                className="block group"
                                            >
                                                <div className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                                                    {related.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {formatDate(related.published_at)}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* CTA */}
                        <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
                            <CardContent className="p-6 text-center">
                                <h3 className="font-bold mb-2">Subscribe to Newsletter</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Get the latest AI news delivered to your inbox.
                                </p>
                                <Button className="w-full">
                                    Subscribe
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </div>
    )
}
