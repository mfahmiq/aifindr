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
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { mockBlogPosts, BlogPost } from "@/lib/mock-data"
import { PlusCircle, Edit, Trash2, Eye, Calendar, Clock } from "lucide-react"
import { useState } from "react"

export default function AdminBlogPage() {
    const [posts, setPosts] = useState(mockBlogPosts)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null)

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: 'Tutorials',
        readTime: 5,
    })

    const openCreateDialog = () => {
        setEditingPost(null)
        setFormData({
            title: '',
            slug: '',
            excerpt: '',
            content: '',
            category: 'Tutorials',
            readTime: 5,
        })
        setIsDialogOpen(true)
    }

    const openEditDialog = (post: BlogPost) => {
        setEditingPost(post)
        setFormData({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content || '',
            category: post.category,
            readTime: post.readTime,
        })
        setIsDialogOpen(true)
    }

    const handleSave = () => {
        if (editingPost) {
            // Update existing
            alert(`Post "${formData.title}" updated!`)
        } else {
            // Create new
            alert(`Post "${formData.title}" created!`)
        }
        setIsDialogOpen(false)
    }

    const handleDelete = (postId: string) => {
        if (confirm('Are you sure you want to delete this post?')) {
            setPosts(posts.filter(p => p.id !== postId))
        }
    }

    const categories = ['Tutorials', 'Comparisons', 'Listicles', 'News', 'Guides']

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Blog Manager</h1>
                    <p className="text-muted-foreground">Create and manage blog posts</p>
                </div>
                <Button onClick={openCreateDialog} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Post
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/20">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold">{posts.length}</div>
                        <div className="text-sm text-muted-foreground">Total Posts</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">{posts.filter(p => p.category === 'Tutorials').length}</div>
                        <div className="text-sm text-muted-foreground">Tutorials</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/20">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-purple-600">{posts.filter(p => p.category === 'Comparisons').length}</div>
                        <div className="text-sm text-muted-foreground">Comparisons</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-2 border-orange-500/20">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-orange-600">{posts.filter(p => p.category === 'Listicles').length}</div>
                        <div className="text-sm text-muted-foreground">Listicles</div>
                    </CardContent>
                </Card>
            </div>

            {/* Posts Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Posts</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Published</TableHead>
                                <TableHead>Read Time</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {posts.map(post => (
                                <TableRow key={post.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{post.title}</div>
                                            <div className="text-xs text-muted-foreground">/blog/{post.slug}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{post.category}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            {post.publishedAt}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {post.readTime} min
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="ghost" asChild>
                                                <a href={`/blog/${post.slug}`} target="_blank">
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                            </Button>
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
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</DialogTitle>
                        <DialogDescription>
                            {editingPost ? 'Update your blog post' : 'Write a new blog post'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Read Time (minutes)</Label>
                                <Input
                                    type="number"
                                    value={formData.readTime}
                                    onChange={(e) => setFormData({ ...formData, readTime: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Excerpt</Label>
                            <Textarea
                                value={formData.excerpt}
                                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                placeholder="Brief description for listing..."
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Content</Label>
                            <Textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Full article content (supports markdown)..."
                                rows={8}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>
                            {editingPost ? 'Update Post' : 'Publish Post'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
