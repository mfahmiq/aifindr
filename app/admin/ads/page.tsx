"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { adsService, Ad } from "@/lib/services/adsService"
import { PlusCircle, Edit, Trash2, Megaphone, Eye, MousePointer, Loader2, Settings } from "lucide-react"
import { useState, useEffect } from "react"

const PLACEMENTS = [
    { value: 'navbar', label: 'Navbar' },
    { value: 'sidebar', label: 'Sidebar' },
    { value: 'banner', label: 'Banner' },
    { value: 'top_banner', label: 'Top Banner' },
    { value: 'inline', label: 'Inline' },
    { value: 'footer_cta', label: 'Footer CTA' },
]

export default function AdminAdsPage() {
    const [ads, setAds] = useState<Ad[]>([])
    const [stats, setStats] = useState({ total: 0, active: 0, scheduled: 0, totalImpressions: 0, totalClicks: 0 })
    const [settings, setSettings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [editingAd, setEditingAd] = useState<Ad | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        placement: 'sidebar',
        link_url: '',
        title: '',
        description: '',
        advertiser_name: '',
        starts_at: '',
        ends_at: '',
        is_active: true,
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [adsData, statsData, settingsData] = await Promise.all([
                adsService.getAllAds(),
                adsService.getAdsStats(),
                adsService.getSettings()
            ])
            setAds(adsData)
            setStats(statsData)
            setSettings(settingsData.length > 0 ? settingsData : [
                { placement: 'sidebar', max_slots: 5, price_per_period: 150000 },
                { placement: 'navbar', max_slots: 2, price_per_period: 250000 },
                { placement: 'banner', max_slots: 1, price_per_period: 500000 },
            ])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const openCreateDialog = () => {
        setEditingAd(null)
        setFormData({
            name: '',
            placement: 'sidebar',
            link_url: '',
            title: '',
            description: '',
            advertiser_name: '',
            starts_at: new Date().toISOString().split('T')[0],
            ends_at: '',
            is_active: true,
        })
        setIsDialogOpen(true)
    }

    const openEditDialog = (ad: Ad) => {
        setEditingAd(ad)
        setFormData({
            name: ad.name,
            placement: ad.placement,
            link_url: ad.link_url,
            title: ad.title || '',
            description: ad.description || '',
            advertiser_name: ad.advertiser_name || '',
            starts_at: ad.starts_at ? ad.starts_at.split('T')[0] : '',
            ends_at: ad.ends_at ? ad.ends_at.split('T')[0] : '',
            is_active: ad.is_active !== false,
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name || !formData.placement || !formData.link_url) {
            alert('Please fill in all required fields')
            return
        }

        try {
            setSaving(true)
            if (editingAd) {
                await adsService.updateAd(editingAd.id, {
                    name: formData.name,
                    placement: formData.placement,
                    link_url: formData.link_url,
                    title: formData.title || undefined,
                    description: formData.description || undefined,
                    advertiser_name: formData.advertiser_name || undefined,
                    starts_at: formData.starts_at || undefined,
                    ends_at: formData.ends_at || undefined,
                    is_active: formData.is_active,
                })
            } else {
                await adsService.createAd({
                    name: formData.name,
                    placement: formData.placement,
                    link_url: formData.link_url,
                    title: formData.title || undefined,
                    description: formData.description || undefined,
                    advertiser_name: formData.advertiser_name || undefined,
                    starts_at: formData.starts_at || undefined,
                    ends_at: formData.ends_at || undefined,
                    is_active: formData.is_active,
                })
            }
            setIsDialogOpen(false)
            await fetchData()
        } catch (error: any) {
            console.error('Error saving ad:', error)
            alert(error.message || 'Failed to save ad')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (adId: string) => {
        if (confirm('Are you sure you want to delete this ad?')) {
            try {
                await adsService.deleteAd(adId)
                await fetchData()
            } catch (error: any) {
                console.error('Error deleting ad:', error)
                alert(error.message || 'Failed to delete ad')
            }
        }
    }

    const handleToggleActive = async (ad: Ad) => {
        try {
            await adsService.updateAd(ad.id, { is_active: !ad.is_active })
            await fetchData()
        } catch (error: any) {
            console.error('Error toggling ad:', error)
        }
    }

    const getCTR = (impressions: number, clicks: number) => {
        if (!impressions) return '0%'
        return ((clicks / impressions) * 100).toFixed(2) + '%'
    }

    const getAdStatus = (ad: Ad) => {
        const now = new Date()
        const startsAt = ad.starts_at ? new Date(ad.starts_at) : new Date(0)
        const endsAt = ad.ends_at ? new Date(ad.ends_at) : new Date('2099-12-31')

        if (!ad.is_active) return { label: 'Inactive', color: 'secondary' }
        if (now < startsAt) return { label: 'Scheduled', color: 'outline' }
        if (now > endsAt) return { label: 'Expired', color: 'destructive' }
        return { label: 'Active', color: 'default' }
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
                    <h1 className="text-3xl font-bold tracking-tight">Ads Manager</h1>
                    <p className="text-muted-foreground">Manage ad placements and campaigns</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Button>
                    <Button onClick={openCreateDialog} className="bg-gradient-to-r from-yellow-500 to-orange-500">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Ad
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/20">
                    <CardContent className="p-4">
                        <Megaphone className="w-6 h-6 text-yellow-500 mb-2" />
                        <div className="text-2xl font-bold">{stats.active}</div>
                        <div className="text-sm text-muted-foreground">Active Ads</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
                        <div className="text-sm text-muted-foreground">Scheduled</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/20">
                    <CardContent className="p-4">
                        <Eye className="w-6 h-6 text-purple-500 mb-2" />
                        <div className="text-2xl font-bold text-purple-600">{stats.totalImpressions.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Impressions</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20">
                    <CardContent className="p-4">
                        <MousePointer className="w-6 h-6 text-green-500 mb-2" />
                        <div className="text-2xl font-bold text-green-600">{stats.totalClicks.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Clicks</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-2 border-red-500/20">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-red-600">{getCTR(stats.totalImpressions, stats.totalClicks)}</div>
                        <div className="text-sm text-muted-foreground">Avg CTR</div>
                    </CardContent>
                </Card>
            </div>

            {/* Ads Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Ads ({ads.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {ads.length === 0 ? (
                        <div className="text-center py-12">
                            <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No ads yet</h3>
                            <p className="text-muted-foreground mb-4">Create your first ad placement.</p>
                            <Button onClick={openCreateDialog}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create First Ad
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Placement</TableHead>
                                    <TableHead>Advertiser</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Impressions</TableHead>
                                    <TableHead>Clicks</TableHead>
                                    <TableHead>CTR</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ads.map(ad => {
                                    const status = getAdStatus(ad)
                                    return (
                                        <TableRow key={ad.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{ad.name}</span>
                                                    {ad.title && <span className="text-xs text-muted-foreground">{ad.title}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{ad.placement}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {ad.advertiser_name || <span className="text-muted-foreground">-</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.color as any}>{status.label}</Badge>
                                            </TableCell>
                                            <TableCell>{(ad.impressions || 0).toLocaleString()}</TableCell>
                                            <TableCell>{(ad.clicks || 0).toLocaleString()}</TableCell>
                                            <TableCell>{getCTR(ad.impressions || 0, ad.clicks || 0)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => openEditDialog(ad)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(ad.id)}>
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
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingAd ? 'Edit Ad' : 'Create New Ad'}</DialogTitle>
                        <DialogDescription>
                            {editingAd ? 'Update ad details' : 'Create a new ad placement'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ad name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Placement *</Label>
                                <Select value={formData.placement} onValueChange={(v) => setFormData({ ...formData, placement: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PLACEMENTS.map(p => (
                                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Link URL *</Label>
                            <Input
                                value={formData.link_url}
                                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Title (optional)</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ad title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description (optional)</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Ad description..."
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Advertiser Name</Label>
                            <Input
                                value={formData.advertiser_name}
                                onChange={(e) => setFormData({ ...formData, advertiser_name: e.target.value })}
                                placeholder="Company name"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Starts At</Label>
                                <Input
                                    type="date"
                                    value={formData.starts_at}
                                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Ends At</Label>
                                <Input
                                    type="date"
                                    value={formData.ends_at}
                                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingAd ? 'Update Ad' : 'Create Ad'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ad Settings</DialogTitle>
                        <DialogDescription>Configure ad placement limits and pricing</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {settings.map((setting, index) => (
                            <div key={setting.placement} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div>
                                    <span className="font-medium capitalize">{setting.placement}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Max slots:</span> {setting.max_slots}
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Price:</span> Rp {(setting.price_per_period || 0).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsSettingsOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
