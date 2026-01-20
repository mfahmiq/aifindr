"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

import { PlusCircle, Edit, Trash2, FolderOpen, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { categoriesService, CategoryWithCount } from "@/lib/services/categoriesService"

export default function AdminCategoriesPage() {
    const [categoriesList, setCategoriesList] = useState<CategoryWithCount[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        icon: '',
        color: 'blue',
        description: '',
    })

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            setLoading(true)
            const data = await categoriesService.getCategoriesWithToolCount()
            setCategoriesList(data)
        } catch (error) {
            console.error('Error fetching categories:', error)
        } finally {
            setLoading(false)
        }
    }

    const openCreateDialog = () => {
        setEditingCategory(null)
        setFormData({ name: '', slug: '', icon: '', color: 'blue', description: '' })
        setIsDialogOpen(true)
    }

    const openEditDialog = (category: CategoryWithCount) => {
        setEditingCategory(category)
        setFormData({
            name: category.name,
            slug: category.slug,
            icon: category.icon || '',
            color: category.color || 'blue',
            description: category.description || '',
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name || !formData.slug) {
            alert('Name and slug are required')
            return
        }

        try {
            setSaving(true)
            if (editingCategory) {
                await categoriesService.updateCategory(editingCategory.id, {
                    name: formData.name,
                    slug: formData.slug,
                    icon: formData.icon || '📁',
                    color: formData.color,
                    description: formData.description || undefined,
                })
            } else {
                await categoriesService.createCategory({
                    name: formData.name,
                    slug: formData.slug,
                    icon: formData.icon || '📁',
                    color: formData.color,
                    description: formData.description || undefined,
                })
            }
            setIsDialogOpen(false)
            await fetchCategories()
        } catch (error: any) {
            console.error('Error saving category:', error)
            alert(error.message || 'Failed to save category')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (categoryId: string) => {
        const category = categoriesList.find(c => c.id === categoryId)
        if (category && category.tool_count > 0) {
            alert(`Cannot delete "${category.name}" - it has ${category.tool_count} tools assigned.`)
            return
        }
        if (confirm('Are you sure you want to delete this category?')) {
            try {
                await categoriesService.deleteCategory(categoryId)
                await fetchCategories()
            } catch (error: any) {
                console.error('Error deleting category:', error)
                alert(error.message || 'Failed to delete category')
            }
        }
    }

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
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
                    <h1 className="text-3xl font-bold tracking-tight">Categories Manager</h1>
                    <p className="text-muted-foreground">Organize tools into categories</p>
                </div>
                <Button onClick={openCreateDialog} className="bg-gradient-to-r from-primary to-purple-500">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Category
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20">
                    <CardContent className="p-4">
                        <FolderOpen className="w-6 h-6 text-blue-500 mb-2" />
                        <div className="text-2xl font-bold">{categoriesList.length}</div>
                        <div className="text-sm text-muted-foreground">Total Categories</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                            {categoriesList.reduce((sum, c) => sum + c.tool_count, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Tools</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/20">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-purple-600">
                            {categoriesList.filter(c => c.tool_count > 0).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Active Categories</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/20">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-orange-600">
                            {categoriesList.filter(c => c.tool_count === 0).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Empty Categories</div>
                    </CardContent>
                </Card>
            </div>

            {/* Categories Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoriesList.map(category => (
                    <Card key={category.id} className="group hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">{category.icon || '📁'}</div>
                                    <div>
                                        <h3 className="font-semibold">{category.name}</h3>
                                        <p className="text-sm text-muted-foreground">/{category.slug}</p>
                                    </div>
                                </div>
                                <Badge variant="secondary">{category.tool_count} tools</Badge>
                            </div>
                            <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="outline" onClick={() => openEditDialog(category)}>
                                    <Edit className="w-3 h-3 mr-1" />
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive"
                                    onClick={() => handleDelete(category.id)}
                                    disabled={category.tool_count > 0}
                                >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty State to Add */}
            <Card className="border-dashed cursor-pointer hover:border-primary/50 transition-colors" onClick={openCreateDialog}>
                <CardContent className="p-8 text-center">
                    <PlusCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Add a new category</p>
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
                        <DialogDescription>
                            {editingCategory ? 'Update category details' : 'Add a new category for tools'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Icon (Emoji)</Label>
                            <Input
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                placeholder="e.g. 🤖, 🎨, 💻"
                                className="text-2xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => {
                                    const name = e.target.value
                                    setFormData({
                                        ...formData,
                                        name,
                                        slug: editingCategory ? formData.slug : generateSlug(name)
                                    })
                                }}
                                placeholder="Category name"
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
                        <div className="space-y-2">
                            <Label>Description (optional)</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Short description"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingCategory ? 'Update Category' : 'Create Category'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
