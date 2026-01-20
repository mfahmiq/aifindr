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
import { dealsService, DealWithTool, ToolForSelect } from "@/lib/services/dealsService"
import { PlusCircle, Edit, Trash2, Gift, Clock, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

export default function AdminDealsPage() {
    const [deals, setDeals] = useState<DealWithTool[]>([])
    const [tools, setTools] = useState<ToolForSelect[]>([])
    const [stats, setStats] = useState({ total: 0, active: 0, expiringThisWeek: 0, totalClaims: 0 })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingDeal, setEditingDeal] = useState<DealWithTool | null>(null)

    const [formData, setFormData] = useState({
        tool_id: '',
        discount: '',
        code: '',
        description: '',
        expires_at: '',
        is_active: true,
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [dealsData, toolsData, statsData] = await Promise.all([
                dealsService.getAllDeals(),
                dealsService.getToolsForSelect(),
                dealsService.getDealsStats()
            ])
            setDeals(dealsData)
            setTools(toolsData)
            setStats(statsData)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const getDaysUntil = (date?: string | null) => {
        if (!date) return null
        const diff = new Date(date).getTime() - new Date().getTime()
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    const openCreateDialog = () => {
        setEditingDeal(null)
        setFormData({
            tool_id: '',
            discount: '',
            code: '',
            description: '',
            expires_at: '',
            is_active: true,
        })
        setIsDialogOpen(true)
    }

    const openEditDialog = (deal: DealWithTool) => {
        setEditingDeal(deal)
        setFormData({
            tool_id: deal.tool_id,
            discount: deal.discount,
            code: deal.code || '',
            description: deal.description,
            expires_at: deal.expires_at ? deal.expires_at.split('T')[0] : '',
            is_active: deal.is_active !== false,
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.tool_id || !formData.discount || !formData.description) {
            alert('Please fill in all required fields')
            return
        }

        try {
            setSaving(true)
            if (editingDeal) {
                await dealsService.updateDeal(editingDeal.id, {
                    tool_id: formData.tool_id,
                    discount: formData.discount,
                    code: formData.code || undefined,
                    description: formData.description,
                    expires_at: formData.expires_at || undefined,
                    is_active: formData.is_active,
                })
            } else {
                await dealsService.createDeal({
                    tool_id: formData.tool_id,
                    discount: formData.discount,
                    code: formData.code || undefined,
                    description: formData.description,
                    expires_at: formData.expires_at || undefined,
                    is_active: formData.is_active,
                })
            }
            setIsDialogOpen(false)
            await fetchData()
        } catch (error: any) {
            console.error('Error saving deal:', error)
            alert(error.message || 'Failed to save deal')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (dealId: string) => {
        if (confirm('Are you sure you want to delete this deal?')) {
            try {
                await dealsService.deleteDeal(dealId)
                await fetchData()
            } catch (error: any) {
                console.error('Error deleting deal:', error)
                alert(error.message || 'Failed to delete deal')
            }
        }
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
                    <h1 className="text-3xl font-bold tracking-tight">Deals Manager</h1>
                    <p className="text-muted-foreground">Create and manage promotional deals</p>
                </div>
                <Button onClick={openCreateDialog} className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Deal
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-2 border-red-500/20">
                    <CardContent className="p-4">
                        <Gift className="w-6 h-6 text-red-500 mb-2" />
                        <div className="text-2xl font-bold">{stats.active}</div>
                        <div className="text-sm text-muted-foreground">Active Deals</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/20">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-purple-600">
                            {deals.filter(d => d.code).length}
                        </div>
                        <div className="text-sm text-muted-foreground">With Coupon Codes</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-2 border-orange-500/20">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-orange-600">
                            {stats.expiringThisWeek}
                        </div>
                        <div className="text-sm text-muted-foreground">Expiring Soon</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">{stats.totalClaims}</div>
                        <div className="text-sm text-muted-foreground">Total Claims</div>
                    </CardContent>
                </Card>
            </div>

            {/* Deals Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Deals</CardTitle>
                </CardHeader>
                <CardContent>
                    {deals.length === 0 ? (
                        <div className="text-center py-12">
                            <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No deals yet</h3>
                            <p className="text-muted-foreground mb-4">Create your first promotional deal.</p>
                            <Button onClick={openCreateDialog}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create First Deal
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tool</TableHead>
                                    <TableHead>Discount</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deals.map(deal => {
                                    const daysLeft = getDaysUntil(deal.expires_at)
                                    return (
                                        <TableRow key={deal.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                                        {deal.tools?.name?.substring(0, 2) || 'NA'}
                                                    </div>
                                                    <span className="font-medium">{deal.tools?.name || 'Unknown Tool'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                                                    {deal.discount}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {deal.code ? (
                                                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                                        {deal.code}
                                                    </code>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {deal.expires_at ? (
                                                    <span className="flex items-center gap-1 text-sm">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(deal.expires_at).toLocaleDateString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">No expiry</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {!deal.is_active ? (
                                                    <Badge variant="secondary">Inactive</Badge>
                                                ) : daysLeft !== null && daysLeft <= 0 ? (
                                                    <Badge variant="destructive">Expired</Badge>
                                                ) : daysLeft !== null && daysLeft <= 7 ? (
                                                    <Badge variant="outline" className="text-orange-500 border-orange-500">
                                                        {daysLeft}d left
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-green-500 border-green-500">
                                                        Active
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => openEditDialog(deal)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(deal.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingDeal ? 'Edit Deal' : 'Create New Deal'}</DialogTitle>
                        <DialogDescription>
                            {editingDeal ? 'Update deal details' : 'Create a promotional deal for a tool'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Tool *</Label>
                            <Select value={formData.tool_id} onValueChange={(v) => setFormData({ ...formData, tool_id: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a tool" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tools.map(tool => (
                                        <SelectItem key={tool.id} value={tool.id}>{tool.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Discount Text *</Label>
                                <Input
                                    value={formData.discount}
                                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                    placeholder="e.g. 30% OFF, Free Trial"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Coupon Code (optional)</Label>
                                <Input
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g. INDOAI30"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description *</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe the deal..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Expires At</Label>
                            <Input
                                type="date"
                                value={formData.expires_at}
                                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingDeal ? 'Update Deal' : 'Create Deal'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
