"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    MoreHorizontal,
    PlusCircle,
    CheckCircle,
    XCircle,
    Award,
    Star,
    Link2,
    ArrowUp,
    ShieldCheck,
    Loader2,
    Pencil,
    Crown,
    Zap
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tool, ToolWithRelations } from "@/lib/types"
import Link from "next/link"
import { useState, useEffect } from "react"
import {
    PLAN_NAMES,
    TOOL_STATUS,
    FEATURE_LABELS,
    getPlanFeatures,
    hasFeature,
    isPremiumPlan,
    getPlanPriority
} from "@/lib/constants"

// Helper to get plan badge variant using constants
const getPlanBadge = (plan?: string | null) => {
    switch (plan) {
        case PLAN_NAMES.FEATURED:
            return <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 hover:bg-purple-500/30"><Crown className="w-3 h-3 mr-1" />Featured</Badge>
        case PLAN_NAMES.PRO:
            return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 hover:bg-blue-500/30"><ShieldCheck className="w-3 h-3 mr-1" />Pro</Badge>
        case PLAN_NAMES.SPONSOR:
            return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 hover:bg-amber-500/30"><Zap className="w-3 h-3 mr-1" />Sponsor</Badge>
        default:
            return <Badge variant="secondary">Free</Badge>
    }
}

// Helper to calculate days remaining
const getDaysRemaining = (endDate?: string | null) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
}

export default function AdminToolsPage() {
    const [activeTab, setActiveTab] = useState("all")
    const [rejectReason, setRejectReason] = useState("")
    const [selectedTool, setSelectedTool] = useState<ToolWithRelations | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [tools, setTools] = useState<ToolWithRelations[]>([])

    // Fetch tools on mount
    const fetchTools = async () => {
        setLoading(true)
        try {
            // Fetch ALL tools (status=all)
            const res = await fetch('/api/tools?status=all&limit=100')
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setTools(data.tools)
        } catch (error) {
            console.error('Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTools()
    }, [])

    // Editable tool state for benefits
    const [editingTool, setEditingTool] = useState<{
        plan: string;
        is_verified: boolean;
        is_priority: boolean;
        has_backlink: boolean;
        has_premium_support: boolean;
    }>({
        plan: 'Free',
        is_verified: false,
        is_priority: false,
        has_backlink: false,
        has_premium_support: false,
    })

    const [toolDetailsDialogOpen, setToolDetailsDialogOpen] = useState(false)
    const [toolDetails, setToolDetails] = useState({
        name: '',
        slug: '',
        logo_url: '',
        website_url: '',
        short_description: '',
        long_description: ''
    })

    const pendingTools = tools.filter(t => !t.is_verified)
    const publishedTools = tools.filter(t => t.is_verified)

    // Sort by plan priority: Featured > Sponsor > Pro > Free
    const planPriority = { 'Featured': 0, 'Sponsor': 1, 'Pro': 2, 'Free': 3, 'null': 4 }
    const sortedTools = [...tools].sort((a, b) =>
        // @ts-ignore
        (planPriority[a.plan || 'null'] ?? 4) - (planPriority[b.plan || 'null'] ?? 4)
    )

    const openEditDialog = (tool: ToolWithRelations) => {
        setSelectedTool(tool)
        setEditingTool({
            plan: tool.plan || 'Free',
            is_verified: tool.is_verified || false,
            is_priority: tool.is_priority || false,
            has_backlink: tool.has_backlink || false,
            has_premium_support: tool.has_premium_support || false,
        })
        setEditDialogOpen(true)
    }

    const handleUpdateTool = async (slug: string, updates: any) => {
        try {
            const res = await fetch(`/api/tools/${slug}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })

            if (res.ok) {
                // Refresh local state or re-fetch
                fetchTools()
                return true
            }
        } catch (error) {
            console.error('Update error:', error)
        }
        return false
    }

    // Actions
    const handleApprove = async (tool: ToolWithRelations) => {
        if (confirm(`Approve "${tool.name}"?`)) {
            const success = await handleUpdateTool(tool.slug, {
                is_verified: true,
                status: 'approved'
            })
            if (success) alert("Tool approved successfully! ✅")
        }
    }

    const handleReject = async (tool: ToolWithRelations) => {
        const success = await handleUpdateTool(tool.slug, {
            status: 'rejected',
            rejection_reason: rejectReason
        })
        if (success) {
            alert("Tool rejected. ❌")
            setRejectReason("")
        }
    }

    const handleSaveBenefits = async () => {
        if (!selectedTool) return

        // Auto-set verified/priority based on plan
        const isPremiumPlan = ['Pro', 'Featured', 'Sponsor'].includes(editingTool.plan)

        const updates = {
            plan: editingTool.plan,
            is_verified: isPremiumPlan || editingTool.is_verified,
            is_priority: isPremiumPlan || editingTool.is_priority,
            has_backlink: editingTool.has_backlink,
            has_premium_support: editingTool.has_premium_support,
            status: isPremiumPlan || editingTool.is_verified ? 'approved' : selectedTool.status
        }

        const success = await handleUpdateTool(selectedTool.slug, updates)
        if (success) {
            alert("Benefits updated! ✨")
            setEditDialogOpen(false)
        }
    }

    const openToolDetailsDialog = (tool: ToolWithRelations) => {
        setSelectedTool(tool)
        setToolDetails({
            name: tool.name,
            slug: tool.slug,
            logo_url: tool.logo_url || '',
            website_url: tool.website_url || '',
            short_description: tool.short_description || '',
            long_description: tool.long_description || ''
        })
        setToolDetailsDialogOpen(true)
    }

    const handleSaveToolDetails = async () => {
        if (!selectedTool) return
        const success = await handleUpdateTool(selectedTool.slug, toolDetails)
        if (success) {
            alert("Tool details updated! 📝")
            setToolDetailsDialogOpen(false)
            fetchTools()
        }
    }

    const ToolsTable = ({ tools, isReviewMode = false }: { tools: ToolWithRelations[], isReviewMode?: boolean }) => (
        <div className="rounded-xl border-2 bg-card overflow-hidden shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30 hover:bg-muted/50">
                        <TableHead className="w-[60px] font-semibold">Logo</TableHead>
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="hidden md:table-cell font-semibold">Category</TableHead>
                        <TableHead className="font-semibold">Plan</TableHead>
                        <TableHead className="hidden lg:table-cell font-semibold">Subscription</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin w-4 h-4" /> Loading tools...</span>
                            </TableCell>
                        </TableRow>
                    ) : tools.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                No tools found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        tools.map((tool) => (
                            <TableRow key={tool.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell className="font-medium">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary text-sm shadow-sm overflow-hidden">
                                        {tool.logo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={tool.logo_url} alt={tool.name} className="w-full h-full object-cover" />
                                        ) : (
                                            tool.name.substring(0, 2)
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span className="flex items-center gap-1.5">
                                            {tool.name}
                                            {tool.is_verified && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                                        </span>
                                        <span className="text-xs text-muted-foreground md:hidden">
                                            {tool.category?.name || 'Uncategorized'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {tool.category?.name || 'Uncategorized'}
                                </TableCell>
                                <TableCell>
                                    {getPlanBadge(tool.plan)}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                    {(() => {
                                        const days = getDaysRemaining(tool.subscription_ends_at)
                                        if (days === null) return <span className="text-muted-foreground text-xs">-</span>
                                        if (days <= 0) return <Badge variant="destructive">Expired</Badge>
                                        if (days <= 7) return <Badge variant="outline" className="text-orange-500 border-orange-500">{days}d left</Badge>
                                        return <Badge variant="outline" className="text-green-500 border-green-500">{days}d left</Badge>
                                    })()}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={tool.is_verified ? "default" : "secondary"}>
                                        {tool.is_verified ? "Published" : "Pending"}
                                    </Badge>
                                    {tool.status === 'rejected' && <Badge variant="destructive" className="ml-1">Rejected</Badge>}
                                </TableCell>
                                <TableCell className="text-right">
                                    {isReviewMode ? (
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleApprove(tool)} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => openToolDetailsDialog(tool)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                        <XCircle className="w-4 h-4 mr-1" /> Reject
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Reject "{tool.name}"</DialogTitle>
                                                        <DialogDescription>
                                                            Please provide a reason for rejection. This will be sent to the submitter.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="py-4">
                                                        <Label htmlFor="reject-reason">Rejection Note</Label>
                                                        <Textarea
                                                            id="reject-reason"
                                                            placeholder="e.g. The tool seems to be a duplicate of..."
                                                            value={rejectReason}
                                                            onChange={(e) => setRejectReason(e.target.value)}
                                                            className="mt-2"
                                                        />
                                                    </div>
                                                    <DialogFooter>
                                                        <DialogClose asChild>
                                                            <Button variant="outline">Cancel</Button>
                                                        </DialogClose>
                                                        <Button variant="destructive" onClick={() => handleReject(tool)}>
                                                            Confirm Rejection
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    ) : (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/tool/${tool.slug}`} target="_blank">View Live</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openToolDetailsDialog(tool)}>
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Edit Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openEditDialog(tool)}>
                                                    Manage Benefits
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive">Delete Tool</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            </TableRow>
                        )))}
                </TableBody>
            </Table>
        </div>
    )

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Tools</h1>
                    <p className="text-muted-foreground">Add, edit, and review AI tools in your directory.</p>
                </div>
                <Button className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Tool
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20 rounded-xl p-4">
                    <div className="text-sm text-muted-foreground">Total Tools</div>
                    <div className="text-2xl font-bold">{sortedTools.length}</div>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20 rounded-xl p-4">
                    <div className="text-sm text-muted-foreground">Published</div>
                    <div className="text-2xl font-bold text-green-600">{publishedTools.length}</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/20 rounded-xl p-4">
                    <div className="text-sm text-muted-foreground">Pending</div>
                    <div className="text-2xl font-bold text-yellow-600">{pendingTools.length}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/20 rounded-xl p-4">
                    <div className="text-sm text-muted-foreground">Premium</div>
                    <div className="text-2xl font-bold text-purple-600">{sortedTools.filter(t => t.plan && t.plan !== 'Free').length}</div>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                        All Tools ({sortedTools.length})
                    </TabsTrigger>
                    <TabsTrigger value="published" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                        Published ({publishedTools.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="relative data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg">
                        Pending Review
                        {pendingTools.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-medium">
                                {pendingTools.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                    <div className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                        <Award className="w-3 h-3" />
                        Sorted by Plan Priority: Featured → Sponsor → Pro → Free
                    </div>
                    <ToolsTable tools={sortedTools} />
                </TabsContent>
                <TabsContent value="published" className="mt-4">
                    <ToolsTable tools={publishedTools} />
                </TabsContent>
                <TabsContent value="pending" className="mt-4">
                    <div className="mb-4 text-sm text-muted-foreground">
                        Review submissions from users. Approve to publish or Reject with a note.
                    </div>
                    <ToolsTable tools={pendingTools} isReviewMode={true} />
                </TabsContent>
            </Tabs>

            {/* Manage Benefits Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Manage Benefits for "{selectedTool?.name}"</DialogTitle>
                        <DialogDescription>
                            Configure the tool's subscription plan and benefits.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {/* Plan Selector */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Subscription Plan</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {(['Free', 'Pro', 'Featured', 'Sponsor'] as const).map(plan => (
                                    <button
                                        key={plan}
                                        onClick={() => setEditingTool({ ...editingTool, plan })}
                                        className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${editingTool.plan === plan
                                            ? plan === 'Sponsor' ? 'border-amber-500 bg-amber-500/10 text-amber-600'
                                                : plan === 'Featured' ? 'border-purple-500 bg-purple-500/10 text-purple-600'
                                                    : plan === 'Pro' ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                                                        : 'border-gray-500 bg-gray-500/10 text-gray-600'
                                            : 'border-muted hover:border-muted-foreground/50'
                                            }`}
                                    >
                                        {plan}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Plan Benefits Display */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Plan Benefits</Label>
                            <div className="grid gap-1.5 text-sm max-h-[300px] overflow-y-auto">
                                {Object.entries(FEATURE_LABELS).map(([featureKey, label]) => {
                                    const isIncluded = hasFeature(editingTool.plan || 'Free', featureKey)
                                    return (
                                        <div
                                            key={featureKey}
                                            className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isIncluded
                                                    ? 'bg-green-500/10 text-green-700'
                                                    : 'bg-muted/50 text-muted-foreground line-through'
                                                }`}
                                        >
                                            {isIncluded ? (
                                                <CheckCircle className="w-4 h-4 shrink-0" />
                                            ) : (
                                                <XCircle className="w-4 h-4 shrink-0 opacity-50" />
                                            )}
                                            <span>{label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Manual Override Options */}
                        <div className="space-y-2 pt-2 border-t">
                            <Label className="text-xs text-muted-foreground">Manual Overrides</Label>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Link2 className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm">Do-follow Backlink</span>
                                </div>
                                <Checkbox
                                    checked={editingTool.has_backlink}
                                    onCheckedChange={(checked) => setEditingTool({ ...editingTool, has_backlink: !!checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    <span className="text-sm">Premium Support</span>
                                </div>
                                <Checkbox
                                    checked={editingTool.has_premium_support}
                                    onCheckedChange={(checked) => setEditingTool({ ...editingTool, has_premium_support: !!checked })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveBenefits}>Save Benefits</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Tool Details Dialog */}
            <Dialog open={toolDetailsDialogOpen} onOpenChange={setToolDetailsDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Tool Details</DialogTitle>
                        <DialogDescription>
                            Update the core information for "{selectedTool?.name}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={toolDetails.name}
                                    onChange={(e) => setToolDetails({ ...toolDetails, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    value={toolDetails.slug}
                                    onChange={(e) => setToolDetails({ ...toolDetails, slug: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Website URL</Label>
                            <Input
                                id="website"
                                value={toolDetails.website_url}
                                onChange={(e) => setToolDetails({ ...toolDetails, website_url: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logo">Logo URL</Label>
                            <Input
                                id="logo"
                                value={toolDetails.logo_url}
                                onChange={(e) => setToolDetails({ ...toolDetails, logo_url: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="short_desc">Short Description</Label>
                            <Input
                                id="short_desc"
                                value={toolDetails.short_description}
                                onChange={(e) => setToolDetails({ ...toolDetails, short_description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="long_desc">Long Description</Label>
                            <Textarea
                                id="long_desc"
                                value={toolDetails.long_description}
                                onChange={(e) => setToolDetails({ ...toolDetails, long_description: e.target.value })}
                                className="h-32"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setToolDetailsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveToolDetails}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
