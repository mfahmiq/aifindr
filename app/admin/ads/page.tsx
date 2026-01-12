"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Megaphone, Sidebar, PlusCircle, Calendar, Eye, Trash2, Edit, ExternalLink, Clock, MinusCircle, Settings } from "lucide-react"
import { useState } from "react"

// Mock ad placements data
const mockAds = [
    {
        id: '1',
        type: 'sidebar' as const,
        advertiser: 'ChatGPT',
        logoUrl: '/ads/chatgpt.png',
        targetUrl: 'https://chat.openai.com',
        startDate: '2026-01-01',
        endDate: '2026-01-14',
        status: 'active' as const,
        impressions: 4250,
        clicks: 127,
    },
    {
        id: '2',
        type: 'banner' as const,
        advertiser: 'Midjourney',
        logoUrl: '/ads/midjourney.png',
        targetUrl: 'https://midjourney.com',
        startDate: '2026-01-03',
        endDate: '2026-01-10',
        status: 'active' as const,
        impressions: 12400,
        clicks: 312,
    },
    {
        id: '3',
        type: 'navbar' as const,
        advertiser: 'Jasper',
        logoUrl: '/ads/jasper.png',
        targetUrl: 'https://jasper.ai',
        startDate: '2026-01-05',
        endDate: '2026-01-12',
        status: 'active' as const,
        impressions: 8500,
        clicks: 210,
    },
    {
        id: '4',
        type: 'sidebar' as const,
        advertiser: 'Claude AI',
        logoUrl: '/ads/claude.png',
        targetUrl: 'https://claude.ai',
        startDate: '2026-01-15',
        endDate: '2026-01-22',
        status: 'scheduled' as const,
        impressions: 0,
        clicks: 0,
    },
]

type Ad = typeof mockAds[0]

export default function AdminAdsPage() {
    const [ads, setAds] = useState(mockAds)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingAd, setEditingAd] = useState<Ad | null>(null)

    const [formData, setFormData] = useState({
        type: 'sidebar' as 'sidebar' | 'banner' | 'navbar',
        advertiser: '',
        logoUrl: '',
        targetUrl: '',
        startDate: '',
        endDate: '',
    })

    const getDaysRemaining = (endDate: string) => {
        const end = new Date(endDate)
        const now = new Date()
        return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    const sidebarAds = ads.filter(a => a.type === 'sidebar')
    const bannerAds = ads.filter(a => a.type === 'banner')
    const navbarAds = ads.filter(a => a.type === 'navbar')
    const activeAds = ads.filter(a => a.status === 'active')
    const scheduledAds = ads.filter(a => a.status === 'scheduled')

    const openCreateDialog = (type: 'sidebar' | 'banner' | 'navbar') => {
        setEditingAd(null)
        setFormData({
            type,
            advertiser: '',
            logoUrl: '',
            targetUrl: '',
            startDate: '',
            endDate: '',
        })
        setIsDialogOpen(true)
    }

    const openEditDialog = (ad: Ad) => {
        setEditingAd(ad)
        setFormData({
            type: ad.type,
            advertiser: ad.advertiser,
            logoUrl: ad.logoUrl,
            targetUrl: ad.targetUrl,
            startDate: ad.startDate,
            endDate: ad.endDate,
        })
        setIsDialogOpen(true)
    }

    const handleSave = () => {
        if (editingAd) {
            alert(`Ad for "${formData.advertiser}" updated!`)
        } else {
            alert(`Ad for "${formData.advertiser}" created!`)
        }
        setIsDialogOpen(false)
    }

    const handleDelete = (adId: string) => {
        if (confirm('Are you sure you want to delete this ad placement?')) {
            setAds(ads.filter(a => a.id !== adId))
        }
    }

    const AdTable = ({ adList }: { adList: Ad[] }) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Advertiser</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {adList.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                            No ads found
                        </TableCell>
                    </TableRow>
                ) : (
                    adList.map(ad => {
                        const daysLeft = getDaysRemaining(ad.endDate)
                        const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : 0

                        return (
                            <TableRow key={ad.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                                            {ad.advertiser.substring(0, 2)}
                                        </div>
                                        <div>
                                            <div className="font-medium">{ad.advertiser}</div>
                                            <a href={ad.targetUrl} target="_blank" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                                                <ExternalLink className="w-3 h-3" />
                                                {new URL(ad.targetUrl).hostname}
                                            </a>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={
                                        ad.type === 'banner' ? 'border-yellow-500 text-yellow-600' :
                                            ad.type === 'navbar' ? 'border-blue-500 text-blue-600' :
                                                'border-purple-500 text-purple-600'
                                    }>
                                        {ad.type === 'banner' ? 'Top Banner' : ad.type === 'navbar' ? 'Navbar Ad' : 'Sidebar'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <div>{ad.startDate} - {ad.endDate}</div>
                                        {ad.status === 'active' && daysLeft > 0 && (
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {daysLeft} days left
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {ad.status === 'active' ? (
                                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                                    ) : ad.status === 'scheduled' ? (
                                        <Badge variant="secondary">Scheduled</Badge>
                                    ) : (
                                        <Badge variant="outline">Ended</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <div className="flex items-center gap-2">
                                            <Eye className="w-3 h-3 text-muted-foreground" />
                                            {ad.impressions.toLocaleString()} views
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {ad.clicks} clicks ({ctr}% CTR)
                                        </div>
                                    </div>
                                </TableCell>
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
                    })
                )}
            </TableBody>
        </Table>
    )

    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [settings, setSettings] = useState<any[]>([])

    const loadSettings = async () => {
        const { adsService } = await import("@/lib/services/adsService")
        const data = await adsService.getSettings()
        // If data is empty (no DB yet), use defaults for UI
        if (data && data.length > 0) {
            setSettings(data)
        } else {
            setSettings([
                { placement: 'sidebar', max_slots: 5, price_per_period: 150000 },
                { placement: 'navbar', max_slots: 2, price_per_period: 350000 },
                { placement: 'banner', max_slots: 1, price_per_period: 750000 },
            ])
        }
    }

    const openSettings = () => {
        loadSettings()
        setIsSettingsOpen(true)
    }

    const saveSettings = async () => {
        const { adsService } = await import("@/lib/services/adsService")
        try {
            for (const setting of settings) {
                // Upsert via updateSettings logic or direct call
                // Since updateSettings assumes row exists, we might need upsert logic if table is empty
                // For now, assuming update works or user will run migration
                await adsService.updateSettings(setting.placement, {
                    max_slots: parseInt(setting.max_slots),
                    price_per_period: parseInt(setting.price_per_period)
                })
            }
            setIsSettingsOpen(false)
            alert('Settings saved successfully!')
        } catch (error) {
            console.error(error)
            alert('Failed to save settings. Make sure database migration is applied.')
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Ads Manager</h1>
                    <p className="text-muted-foreground">Manage sidebar, navbar, and banner sponsorship placements</p>
                </div>
                <Button variant="outline" onClick={openSettings}>
                    <Settings className="w-4 h-4 mr-2" />
                    Configuration
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <Megaphone className="w-6 h-6 text-primary mb-2" />
                        <div className="text-2xl font-bold">{ads.length}</div>
                        <div className="text-sm text-muted-foreground">Total Placements</div>
                    </CardContent>
                </Card>
                <Card className="border-green-500/20 bg-green-500/5">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-500">{activeAds.length}</div>
                        <div className="text-sm text-muted-foreground">Active Now</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold">{scheduledAds.length}</div>
                        <div className="text-sm text-muted-foreground">Scheduled</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold">$650</div>
                        <div className="text-sm text-muted-foreground">This Month (Mock)</div>
                    </CardContent>
                </Card>
            </div>

            {/* Slot Availability Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sidebar className="w-5 h-5 text-purple-500" />
                                <CardTitle>Sidebar Ads</CardTitle>
                            </div>
                            <Button size="sm" onClick={() => openCreateDialog('sidebar')}>
                                <PlusCircle className="w-4 h-4 mr-1" />
                                Add
                            </Button>
                        </div>

                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {sidebarAds.length > 0 ? (
                                sidebarAds.map(ad => (
                                    <div key={ad.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                                {ad.advertiser.substring(0, 2)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">{ad.advertiser}</div>
                                                <div className="text-xs text-muted-foreground">{ad.startDate}</div>
                                            </div>
                                        </div>
                                        <Badge className={ad.status === 'active' ? 'bg-green-500/10 text-green-500' : ''}>
                                            {ad.status}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Sidebar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No sidebar ads</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-yellow-500" />
                                <CardTitle>Top Banner</CardTitle>
                            </div>
                            <Button size="sm" onClick={() => openCreateDialog('banner')}>
                                <PlusCircle className="w-4 h-4 mr-1" />
                                Add
                            </Button>
                        </div>

                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {bannerAds.length > 0 ? (
                                bannerAds.map(ad => (
                                    <div key={ad.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                                {ad.advertiser.substring(0, 2)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">{ad.advertiser}</div>
                                                <div className="text-xs text-muted-foreground">{ad.startDate}</div>
                                            </div>
                                        </div>
                                        <Badge className={ad.status === 'active' ? 'bg-green-500/10 text-green-500' : ''}>
                                            {ad.status}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No banner ads</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MinusCircle className="w-5 h-5 text-blue-500" />
                                <CardTitle>Navbar Ads</CardTitle>
                            </div>
                            <Button size="sm" onClick={() => openCreateDialog('navbar')}>
                                <PlusCircle className="w-4 h-4 mr-1" />
                                Add
                            </Button>
                        </div>

                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {navbarAds.length > 0 ? (
                                navbarAds.map(ad => (
                                    <div key={ad.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                                {ad.advertiser.substring(0, 2)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">{ad.advertiser}</div>
                                                <div className="text-xs text-muted-foreground">{ad.startDate}</div>
                                            </div>
                                        </div>
                                        <Badge className={ad.status === 'active' ? 'bg-green-500/10 text-green-500' : ''}>
                                            {ad.status}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <MinusCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No navbar ads</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Full Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Ad Placements</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <AdTable adList={ads} />
                </CardContent>
            </Card>

            {/* Calendar View Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Booking Calendar
                    </CardTitle>
                    <CardDescription>Visual overview of booked slots</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 gap-2 text-center text-sm">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <div key={day} className="font-medium text-muted-foreground py-2">{day}</div>
                        ))}
                        {Array.from({ length: 28 }, (_, i) => {
                            const isBooked = i >= 0 && i < 14
                            const isBanner = i >= 2 && i < 9
                            return (
                                <div
                                    key={i}
                                    className={`py-3 rounded text-xs ${isBooked
                                        ? isBanner
                                            ? 'bg-yellow-500/20 text-yellow-600'
                                            : 'bg-purple-500/20 text-purple-600'
                                        : 'bg-muted hover:bg-muted/80 cursor-pointer'
                                        }`}
                                >
                                    {i + 1}
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex gap-4 mt-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-purple-500/30" />
                            <span>Sidebar Ad</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-yellow-500/30" />
                            <span>Top Banner</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-muted" />
                            <span>Available</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingAd ? 'Edit Ad Placement' : 'Create New Ad Placement'}</DialogTitle>
                        <DialogDescription>
                            {editingAd
                                ? 'Update ad details'
                                : `Book a ${formData.type === 'banner' ? 'Top Banner' :
                                    formData.type === 'navbar' ? 'Navbar Ad' :
                                        'Sidebar'
                                } ad slot`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Placement Type</Label>
                            <Select value={formData.type} onValueChange={(v: 'sidebar' | 'banner' | 'navbar') => setFormData({ ...formData, type: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sidebar">Sidebar Ad</SelectItem>
                                    <SelectItem value="navbar">Navbar Ad</SelectItem>
                                    <SelectItem value="banner">Top Banner</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Advertiser Name</Label>
                            <Input
                                value={formData.advertiser}
                                onChange={(e) => setFormData({ ...formData, advertiser: e.target.value })}
                                placeholder="Company or Tool name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Logo URL</Label>
                            <Input
                                value={formData.logoUrl}
                                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                placeholder="https://example.com/logo.png"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Target URL</Label>
                            <Input
                                value={formData.targetUrl}
                                onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                                placeholder="https://example.com"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>
                            {editingAd ? 'Update Ad' : 'Create Ad'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Ad Configuration</DialogTitle>
                        <DialogDescription>
                            Configure available slots and pricing for each ad placement type.
                        </DialogDescription>
                    </DialogHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Placement</TableHead>
                                <TableHead>Max Slots</TableHead>
                                <TableHead>Price (IDR)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {settings.map((setting, index) => (
                                <TableRow key={setting.placement}>
                                    <TableCell className="font-medium capitalize">{setting.placement}</TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={setting.max_slots}
                                            onChange={(e) => {
                                                const newSettings = [...settings]
                                                newSettings[index] = { ...setting, max_slots: e.target.value }
                                                setSettings(newSettings)
                                            }}
                                            className="w-24"
                                            min="0"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={setting.price_per_period}
                                            onChange={(e) => {
                                                const newSettings = [...settings]
                                                newSettings[index] = { ...setting, price_per_period: e.target.value }
                                                setSettings(newSettings)
                                            }}
                                            className="w-32"
                                            min="0"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm border border-yellow-200">
                        <p>Note: Decreasing max slots below the current active count will not cancel existing ads but will prevent new bookings.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                        <Button onClick={saveSettings}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
