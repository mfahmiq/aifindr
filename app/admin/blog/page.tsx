"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PlusCircle, Edit, Trash2, Eye, Calendar, Clock, Loader2, BookOpen } from "lucide-react"
import { useState, useEffect } from "react"
import { blogService } from "@/lib/services/blogService"
import { BlogPost } from "@/lib/types"

const BLOG_CATEGORIES = ['Tutorials', 'Listicles', 'Comparisons', 'News', 'Guides', 'Reviews']

export default function AdminBlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null)

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: 'Tutorials',
        status: 'draft',
        read_time: 5,
    })

    useEffect(() => {
        fetchPosts()
    }, [])

    const fetchPosts = async () => {
        try {
            setLoading(true)
            const data = await blogService.getAllPosts()
            setPosts(data)
        } catch (error) {
            console.error('Error fetching posts:', error)
        } finally {
            setLoading(false)
        }
    }

    const generateSlug = (title: string) => {
        return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 100)
    }

    const openCreateDialog = () => {
        setEditingPost(null)
        setFormData({
            title: '',
            slug: '',
            excerpt: '',
            content: '',
            category: 'Tutorials',
            status: 'draft',
            read_time: 5,
        })
        setIsDialogOpen(true)
    }

    const openEditDialog = (post: BlogPost) => {
        setEditingPost(post)
        setFormData({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            category: post.category,
            status: post.status || 'draft',
            read_time: post.read_time || 5,
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.title || !formData.slug || !formData.excerpt || !formData.content) {
            alert('Please fill in all required fields')
            return
        }

        try {
            setSaving(true)
            if (editingPost) {
                await blogService.updatePost(editingPost.id, formData)
            } else {
                await blogService.createPost(formData)
            }
            setIsDialogOpen(false)
            await fetchPosts()
        } catch (error: any) {
            console.error('Error saving post:', error)
            alert(error.message || 'Failed to save post')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (postId: string) => {
        if (confirm('Are you sure you want to delete this post?')) {
            try {
                await blogService.deletePost(postId)
                await fetchPosts()
            } catch (error: any) {
                console.error('Error deleting post:', error)
                alert(error.message || 'Failed to delete post')
            }
        }
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Blog Manager</h1>
                    <p className="text-muted-foreground">Create and manage blog posts</p>
                </div>
                <Button onClick={openCreateDialog} className="bg-gradient-to-r from-purple-500 to-pink-500">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Post
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/20">
                    <CardContent className="p-4">
                        <BookOpen className="w-6 h-6 text-purple-500 mb-2" />
                        <div className="text-2xl font-bold">{posts.length}</div>
                        <div className="text-sm text-muted-foreground">Total Posts</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                            {posts.filter(p => p.status === 'published').length}
                        </div>
                        <div className="text-sm text-muted-foreground">Published</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/20">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-yellow-600">
                            {posts.filter(p => p.status === 'draft').length}
                        </div>
                        <div className="text-sm text-muted-foreground">Drafts</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">
                            {posts.reduce((sum, p) => sum + (p.view_count || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Views</div>
                    </CardContent>
                </Card>
            </div>

            {/* Posts Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Posts</CardTitle>
                </CardHeader>
                <CardContent>
                    {posts.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No blog posts yet</h3>
                            <p className="text-muted-foreground mb-4">Create your first blog post to get started.</p>
                            <Button onClick={openCreateDialog}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create First Post
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Views</TableHead>
                                    <TableHead>Published</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {posts.map(post => (
                                    <TableRow key={post.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{post.title}</span>
                                                <span className="text-xs text-muted-foreground">/{post.slug}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{post.category}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {post.status === 'published' ? (
                                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Published</Badge>
                                            ) : post.status === 'draft' ? (
                                                <Badge variant="secondary">Draft</Badge>
                                            ) : (
                                                <Badge variant="outline">{post.status}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="flex items-center gap-1 text-sm">
                                                <Eye className="w-3 h-3" />
                                                {(post.view_count || 0).toLocaleString()}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(post.published_at)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => openEditDialog(post)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(post.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</DialogTitle>
                        <DialogDescription>
                            {editingPost ? 'Update post details' : 'Write a new blog post'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => {
                                    const title = e.target.value
                                    setFormData({
                                        ...formData,
                                        title,
                                        slug: editingPost ? formData.slug : generateSlug(title)
                                    })
                                }}
                                placeholder="Post title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="url-friendly-slug"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BLOG_CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Read Time (min)</Label>
                                <Input
                                    type="number"
                                    value={formData.read_time}
                                    onChange={(e) => setFormData({ ...formData, read_time: parseInt(e.target.value) || 5 })}
                                    min="1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Excerpt *</Label>
                            <Textarea
                                value={formData.excerpt}
                                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                placeholder="Short summary for preview..."
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Content *</Label>
                            <Textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Full blog content (supports markdown)..."
                                rows={10}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingPost ? 'Update Post' : 'Create Post'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
