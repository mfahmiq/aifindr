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
import { mockDeals, mockTools, Deal } from "@/lib/mock-data"
import { PlusCircle, Edit, Trash2, Gift, Clock, Copy } from "lucide-react"
import { useState } from "react"

export default function AdminDealsPage() {
    const [deals, setDeals] = useState(mockDeals)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingDeal, setEditingDeal] = useState<Deal | null>(null)

    const [formData, setFormData] = useState({
        toolId: '',
        toolName: '',
        discount: '',
        code: '',
        description: '',
        expiresAt: '',
    })

    const getDaysUntil = (date?: string | null) => {
        if (!date) return null
        const diff = new Date(date).getTime() - new Date().getTime()
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    const openCreateDialog = () => {
        setEditingDeal(null)
        setFormData({
            toolId: '',
            toolName: '',
            discount: '',
            code: '',
            description: '',
            expiresAt: '',
        })
        setIsDialogOpen(true)
    }

    const openEditDialog = (deal: Deal) => {
        setEditingDeal(deal)
        setFormData({
            toolId: deal.toolId,
            toolName: deal.toolName,
            discount: deal.discount,
            code: deal.code || '',
            description: deal.description,
            expiresAt: deal.expiresAt || '',
        })
        setIsDialogOpen(true)
    }

    const handleSave = () => {
        if (editingDeal) {
            alert(`Deal for "${formData.toolName}" updated!`)
        } else {
            alert(`Deal for "${formData.toolName}" created!`)
        }
        setIsDialogOpen(false)
    }

    const handleDelete = (dealId: string) => {
        if (confirm('Are you sure you want to delete this deal?')) {
            setDeals(deals.filter(d => d.id !== dealId))
        }
    }

    const handleToolChange = (toolId: string) => {
        const tool = mockTools.find(t => t.id === toolId)
        if (tool) {
            setFormData({ ...formData, toolId, toolName: tool.name })
        }
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
                        <div className="text-2xl font-bold">{deals.length}</div>
                        <div className="text-sm text-muted-foreground">Active Deals</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/20">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-purple-600">{deals.filter(d => d.code).length}</div>
                        <div className="text-sm text-muted-foreground">With Coupon Codes</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-2 border-orange-500/20">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-orange-600">
                            {deals.filter(d => getDaysUntil(d.expiresAt) && getDaysUntil(d.expiresAt)! <= 7).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Expiring Soon</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">245</div>
                        <div className="text-sm text-muted-foreground">Total Claims (Mock)</div>
                    </CardContent>
                </Card>
            </div>

            {/* Deals Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Deals</CardTitle>
                </CardHeader>
                <CardContent>
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
                                const daysLeft = getDaysUntil(deal.expiresAt)
                                return (
                                    <TableRow key={deal.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                                    {deal.toolName.substring(0, 2)}
                                                </div>
                                                <span className="font-medium">{deal.toolName}</span>
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
                                            {deal.expiresAt ? (
                                                <span className="flex items-center gap-1 text-sm">
                                                    <Clock className="w-3 h-3" />
                                                    {deal.expiresAt}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">No expiry</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {daysLeft && daysLeft <= 0 ? (
                                                <Badge variant="destructive">Expired</Badge>
                                            ) : daysLeft && daysLeft <= 7 ? (
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
                            <Label>Select Tool</Label>
                            <Select value={formData.toolId} onValueChange={handleToolChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a tool" />
                                </SelectTrigger>
                                <SelectContent>
                                    {mockTools.map(tool => (
                                        <SelectItem key={tool.id} value={tool.id}>{tool.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Discount Text</Label>
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
                            <Label>Description</Label>
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
                                value={formData.expiresAt}
                                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>
                            {editingDeal ? 'Update Deal' : 'Create Deal'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
