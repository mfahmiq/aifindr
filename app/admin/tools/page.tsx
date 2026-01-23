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
    Zap,
    Check,
    Filter
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
    const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set())
    const [batchLoading, setBatchLoading] = useState(false)

    // Pagination state
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(50)
    const [totalCount, setTotalCount] = useState(0)
    const [stats, setStats] = useState({ total: 0, published: 0, pending: 0, rejected: 0, premium: 0 })

    // Column Filter state
    const [filterName, setFilterName] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [filterPlan, setFilterPlan] = useState('all')
    const [filterHealth, setFilterHealth] = useState('all')

    // Helper: Get verification badge (Gold/Blue/None) based on plan
    const getVerificationBadge = (tool: ToolWithRelations) => {
        const planLower = (tool.plan || 'free').toLowerCase()
        const isSponsor = planLower === 'sponsor'
        const isFeatured = planLower === 'featured' || isSponsor
        const hasGoldBadge = isSponsor || isFeatured
        const hasBlueBadge = tool.is_verified && !hasGoldBadge && planLower !== 'free'

        if (hasGoldBadge) {
            return (
                <div className="relative shrink-0" title="Premium Tool">
                    <svg width="16" height="19" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
                        <defs>
                            <linearGradient id="goldGradientAdmin" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FFD700" />
                                <stop offset="50%" stopColor="#FFA500" />
                                <stop offset="100%" stopColor="#FF8C00" />
                            </linearGradient>
                            <linearGradient id="goldShimmerAdmin" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="white" stopOpacity="0" />
                                <stop offset="50%" stopColor="white" stopOpacity="0.7" />
                                <stop offset="100%" stopColor="white" stopOpacity="0" />
                                <animate attributeName="x1" values="-100%; 200%" dur="2.5s" repeatCount="indefinite" />
                                <animate attributeName="x2" values="0%; 300%" dur="2.5s" repeatCount="indefinite" />
                            </linearGradient>
                        </defs>
                        <path d="M11 1L21 5V12C21 18.5 16.5 23 11 25C5.5 23 1 18.5 1 12V5L11 1Z" fill="url(#goldGradientAdmin)" stroke="#B8860B" strokeWidth="0.5" />
                        <path d="M11 1L21 5V12C21 18.5 16.5 23 11 25C5.5 23 1 18.5 1 12V5L11 1Z" fill="url(#goldShimmerAdmin)" style={{ mixBlendMode: 'overlay' }} />

                        <path d="M6 15L8 10L11 13L14 10L16 15H6Z" fill="#FFF8DC" stroke="#B8860B" strokeWidth="0.3" />
                        <circle cx="8" cy="10" r="1" fill="#FFF8DC" />
                        <circle cx="11" cy="8" r="1.2" fill="#FFF8DC" />
                        <circle cx="14" cy="10" r="1" fill="#FFF8DC" />
                    </svg>
                </div>
            )
        }
        if (hasBlueBadge) {
            return (
                <div className="flex items-center justify-center w-4 h-4 rounded bg-gradient-to-br from-blue-400 to-blue-600 text-white shrink-0 badge-shimmer" title="Verified Tool">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
            )
        }
        return null
    }

    // Fetch stats
    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats')
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Stats fetch error:', error)
        }
    }

    // Fetch tools with pagination and status
    const fetchTools = async (currentPage = 1, currentTab = activeTab) => {
        setLoading(true)
        try {
            // Map tab to status filter
            let status = 'all'
            if (currentTab === 'published') status = 'approved'
            if (currentTab === 'pending') status = 'pending'
            if (currentTab === 'rejected') status = 'rejected'

            const params = new URLSearchParams({
                status,
                limit: pageSize.toString(),
                page: currentPage.toString(),
                sortBy: 'newest' // Admin usually wants newest first or by plan
            })

            const res = await fetch(`/api/tools?${params.toString()}`)
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setTools(data.tools)
            setTotalCount(data.count || 0)
        } catch (error) {
            console.error('Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTools(page, activeTab)
        fetchStats()

        // Fetch categories once
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error('Failed to fetch categories', err))
    }, [page, activeTab, pageSize])

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
        video_url: '',
        pricing_type: '',
        category_id: '',
        subscription_ends_at: '',
        short_description: '',
        long_description: ''
    })

    // Client-side filtering
    const filteredTools = tools.filter(tool => {
        const nameMatch = filterName === '' || tool.name.toLowerCase().includes(filterName.toLowerCase())
        const categoryMatch = filterCategory === '' || (tool.category?.name || '').toLowerCase().includes(filterCategory.toLowerCase())
        const planMatch = filterPlan === 'all' || (tool.plan || 'Free') === filterPlan
        // @ts-ignore
        const healthMatch = filterHealth === 'all' || (filterHealth === 'active' ? tool.is_active !== false : tool.is_active === false)
        return nameMatch && categoryMatch && planMatch && healthMatch
    })

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
            if (success) {
                alert("Tool approved successfully! ✅")
                fetchStats()
            }
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
            fetchStats()
        }
    }

    // Batch Actions
    const handleSelectTool = (toolId: string, checked: boolean) => {
        const newSelected = new Set(selectedToolIds)
        if (checked) {
            newSelected.add(toolId)
        } else {
            newSelected.delete(toolId)
        }
        setSelectedToolIds(newSelected)
    }

    const handleSelectAll = (tools: ToolWithRelations[], checked: boolean) => {
        if (checked) {
            const allIds = new Set(tools.map(t => t.id))
            setSelectedToolIds(allIds)
        } else {
            setSelectedToolIds(new Set())
        }
    }

    const handleBatchApprove = async () => {
        if (selectedToolIds.size === 0) return
        if (!confirm(`Approve ${selectedToolIds.size} tools?`)) return

        setBatchLoading(true)
        const selectedTools = tools.filter(t => selectedToolIds.has(t.id))
        let successCount = 0

        for (const tool of selectedTools) {
            const success = await handleUpdateTool(tool.slug, {
                is_verified: true,
                status: 'approved'
            })
            if (success) successCount++
        }

        setBatchLoading(false)
        setSelectedToolIds(new Set())
        fetchTools(page, activeTab)
        fetchStats()
        alert(`Successfully approved ${successCount} of ${selectedTools.length} tools! ✅`)
    }

    const handleBatchReject = async () => {
        if (selectedToolIds.size === 0) return
        const reason = prompt(`Enter rejection reason for ${selectedToolIds.size} tools:`)
        if (!reason) return

        setBatchLoading(true)
        const selectedTools = tools.filter(t => selectedToolIds.has(t.id))
        let successCount = 0

        for (const tool of selectedTools) {
            const success = await handleUpdateTool(tool.slug, {
                status: 'rejected',
                rejection_reason: reason
            })
            if (success) successCount++
        }

        setBatchLoading(false)
        setSelectedToolIds(new Set())
        fetchTools(page, activeTab)
        fetchStats()
        alert(`Rejected ${successCount} of ${selectedTools.length} tools. ❌`)
    }

    const handleBatchDelete = async () => {
        if (selectedToolIds.size === 0) return
        if (!confirm(`Are you sure you want to DELETE ${selectedToolIds.size} tools? This cannot be undone!`)) return

        setBatchLoading(true)
        const selectedTools = tools.filter(t => selectedToolIds.has(t.id))
        let successCount = 0

        for (const tool of selectedTools) {
            try {
                const res = await fetch(`/api/tools/${tool.slug}`, { method: 'DELETE' })
                if (res.ok) successCount++
            } catch (e) {
                console.error('Delete error:', e)
            }
        }

        setBatchLoading(false)
        setSelectedToolIds(new Set())
        fetchTools(page, activeTab)
        fetchStats()
        alert(`Deleted ${successCount} of ${selectedTools.length} tools. 🗑️`)
    }

    const handleDeleteTool = async (tool: ToolWithRelations) => {
        if (!confirm(`Are you sure you want to delete "${tool.name}"? This cannot be undone!`)) return

        try {
            const res = await fetch(`/api/tools/${tool.slug}`, { method: 'DELETE' })
            if (res.ok) {
                alert('Tool deleted successfully! 🗑️')
                fetchTools(page, activeTab)
                fetchStats()
            } else {
                const data = await res.json()
                alert(`Failed to delete tool: ${data.error || 'Unknown error'}`)
            }
        } catch (e) {
            console.error('Delete error:', e)
            alert('Failed to delete tool. Please try again.')
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
            fetchStats()
        }
    }

    const openToolDetailsDialog = (tool: ToolWithRelations) => {
        setSelectedTool(tool)
        setToolDetails({
            name: tool.name,
            slug: tool.slug,
            logo_url: tool.logo_url || '',
            website_url: tool.website_url || '',
            video_url: tool.video_url || '',
            pricing_type: tool.pricing_type || 'Free',
            category_id: tool.category_id || '',
            subscription_ends_at: tool.subscription_ends_at || '',
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

    const handleRunHealthCheck = async (toolIds?: string[]) => {
        const isBatch = toolIds && toolIds.length > 0
        const message = isBatch
            ? `Run health check on ${toolIds.length} selected tools?`
            : "Run health check on 20 outdated/unchecked tools?"

        if (!confirm(message)) return

        setBatchLoading(true)
        try {
            const res = await fetch('/api/admin/check-health', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toolIds, limit: 20 })
            })

            if (res.ok) {
                const data = await res.json()
                alert(`Health Check Complete!\nSelect 'Active' or 'Dead' filter to see results.\nProcessed: ${data.processed}\nDead Links: ${data.dead}`)
                fetchTools(page, activeTab)
            } else {
                throw new Error('Health check failed')
            }
        } catch (error) {
            console.error('Health check error:', error)
            alert("Failed to run health check.")
        } finally {
            setBatchLoading(false)
            if (isBatch) setSelectedToolIds(new Set())
        }
    }

    const ToolsTable = ({ tools, isReviewMode = false }: { tools: ToolWithRelations[], isReviewMode?: boolean }) => {
        const allSelected = tools.length > 0 && tools.every(t => selectedToolIds.has(t.id))
        const someSelected = selectedToolIds.size > 0

        return (
            <div className="space-y-3">
                {/* Batch Action Bar */}
                {someSelected && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl border border-primary/20">
                        <span className="text-sm font-medium">
                            {selectedToolIds.size} tools selected
                        </span>
                        <div className="flex gap-2 ml-auto">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleBatchApprove}
                                disabled={batchLoading}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                                {batchLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                                Approve All
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleBatchReject}
                                disabled={batchLoading}
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject All
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleBatchDelete}
                                disabled={batchLoading}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                Delete All
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRunHealthCheck(Array.from(selectedToolIds))}
                                disabled={batchLoading}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                                <Zap className="w-4 h-4 mr-1" />
                                Check Health
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedToolIds(new Set())}
                            >
                                Clear
                            </Button>
                        </div>
                    </div>
                )}

                <div className="rounded-xl border-2 bg-card overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30 hover:bg-muted/50">
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={(checked) => handleSelectAll(tools, !!checked)}
                                    />
                                </TableHead>
                                <TableHead className="w-[60px] font-semibold">Logo</TableHead>
                                <TableHead className="font-semibold">Name</TableHead>
                                <TableHead className="hidden md:table-cell font-semibold">Category</TableHead>
                                <TableHead className="font-semibold text-right">Views</TableHead>
                                <TableHead className="font-semibold">Plan</TableHead>
                                <TableHead className="hidden lg:table-cell font-semibold">Subscription</TableHead>
                                <TableHead className="font-semibold">Link Health</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                            {/* Filter Row */}
                            <TableRow className="bg-muted/20">
                                <TableHead></TableHead>
                                <TableHead></TableHead>
                                <TableHead>
                                    <Input
                                        placeholder="Filter name..."
                                        value={filterName}
                                        onChange={(e) => setFilterName(e.target.value)}
                                        className="h-7 text-xs"
                                    />
                                </TableHead>
                                <TableHead className="hidden md:table-cell">
                                    <Input
                                        placeholder="Filter category..."
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="h-7 text-xs"
                                    />
                                </TableHead>
                                <TableHead></TableHead>
                                <TableHead>
                                    <Select value={filterPlan} onValueChange={setFilterPlan}>
                                        <SelectTrigger className="h-7 text-xs">
                                            <SelectValue placeholder="All Plans" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Plans</SelectItem>
                                            <SelectItem value="Free">Free</SelectItem>
                                            <SelectItem value="Pro">Pro</SelectItem>
                                            <SelectItem value="Featured">Featured</SelectItem>
                                            <SelectItem value="Sponsor">Sponsor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableHead>
                                <TableHead className="hidden lg:table-cell"></TableHead>
                                <TableHead>
                                    <Select value={filterHealth} onValueChange={setFilterHealth}>
                                        <SelectTrigger className="h-7 text-xs">
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Health</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="dead">Dead / Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableHead>
                                <TableHead></TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                                        <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin w-4 h-4" /> Loading tools...</span>
                                    </TableCell>
                                </TableRow>
                            ) : filteredTools.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                                        No tools found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTools.map((tool) => (
                                    <TableRow key={tool.id} className={`hover:bg-muted/30 transition-colors ${selectedToolIds.has(tool.id) ? 'bg-primary/5' : ''}`}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedToolIds.has(tool.id)}
                                                onCheckedChange={(checked) => handleSelectTool(tool.id, !!checked)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary text-sm shadow-sm overflow-hidden">
                                                {tool.logo_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={tool.logo_url} alt={tool.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                                ) : (
                                                    tool.name.substring(0, 2)
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-1.5">
                                                    {tool.name}
                                                    {getVerificationBadge(tool)}
                                                </span>
                                                <span className="text-xs text-muted-foreground md:hidden">
                                                    {tool.category?.name || 'Uncategorized'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {tool.category?.name || 'Uncategorized'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {tool.view_count?.toLocaleString() || '0'}
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
                                            {/* @ts-ignore */}
                                            {tool.is_active === false ? (
                                                <Badge variant="destructive" className="gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                    Dead
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-50" />
                                                    Active
                                                </Badge>
                                            )}
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
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTool(tool)}>Delete Tool</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t bg-muted/5 mt-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                        <span>Showing {tools.length} of {totalCount} tools</span>
                        <div className="flex items-center gap-2">
                            <span>Show:</span>
                            <Select
                                value={pageSize.toString()}
                                onValueChange={(val) => {
                                    setPageSize(parseInt(val))
                                    setPage(1)
                                }}
                            >
                                <SelectTrigger className="w-[80px] h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[20, 50, 100, 200, 500].map(size => (
                                        <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                            disabled={page === 1 || loading}
                            className="bg-background shadow-sm"
                        >
                            Previous
                        </Button>
                        <div className="flex items-center gap-1.5 mx-2 text-sm font-semibold">
                            <span className="text-primary">{page}</span>
                            <span className="text-muted-foreground">/</span>
                            <span>{Math.ceil(totalCount / pageSize)}</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(prev => prev + 1)}
                            disabled={page >= Math.ceil(totalCount / pageSize) || loading}
                            className="bg-background shadow-sm"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Tools</h1>
                    <p className="text-muted-foreground">Add, edit, and review AI tools in your directory.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleRunHealthCheck()}
                        disabled={batchLoading}
                    >
                        {batchLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                        Check Links
                    </Button>
                    <Button className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Tool
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20 rounded-xl p-4">
                    <div className="text-sm text-muted-foreground">Total Tools</div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20 rounded-xl p-4">
                    <div className="text-sm text-muted-foreground">Published</div>
                    <div className="text-2xl font-bold text-green-600">{stats.published}</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/20 rounded-xl p-4">
                    <div className="text-sm text-muted-foreground">Pending Review</div>
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                </div>
                <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-2 border-red-500/20 rounded-xl p-4">
                    <div className="text-sm text-muted-foreground">Rejected</div>
                    <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg" onClick={() => setPage(1)}>
                        All Tools ({stats.total})
                    </TabsTrigger>
                    <TabsTrigger value="published" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg" onClick={() => setPage(1)}>
                        Published ({stats.published})
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="relative data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg" onClick={() => setPage(1)}>
                        Pending Review
                        {stats.pending > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-medium">
                                {stats.pending}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg" onClick={() => setPage(1)}>
                        Rejected ({stats.rejected})
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                    <div className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                        <Award className="w-3 h-3" />
                        Sorted by Newest
                    </div>
                    <ToolsTable tools={tools} />
                </TabsContent>
                <TabsContent value="published" className="mt-4">
                    <ToolsTable tools={tools} />
                </TabsContent>
                <TabsContent value="pending" className="mt-4">
                    <div className="mb-4 text-sm text-muted-foreground">
                        Review submissions from users. Approve to publish or Reject with a note.
                    </div>
                    <ToolsTable tools={tools} isReviewMode={true} />
                </TabsContent>
                <TabsContent value="rejected" className="mt-4">
                    <div className="mb-4 text-sm text-muted-foreground">
                        Tools that have been rejected. You can edit them and approve later if the issues are resolved.
                    </div>
                    <ToolsTable tools={tools} />
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
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={toolDetails.category_id}
                                onValueChange={(val) => setToolDetails({ ...toolDetails, category_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pricing_type">Pricing Model</Label>
                                <Select
                                    value={toolDetails.pricing_type}
                                    onValueChange={(val) => setToolDetails({ ...toolDetails, pricing_type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Free">Free</SelectItem>
                                        <SelectItem value="Freemium">Freemium</SelectItem>
                                        <SelectItem value="Paid">Paid</SelectItem>
                                        <SelectItem value="Free Trial">Free Trial</SelectItem>
                                        <SelectItem value="Contact for Pricing">Contact for Pricing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="video">Video URL</Label>
                                <Input
                                    id="video"
                                    value={toolDetails.video_url}
                                    onChange={(e) => setToolDetails({ ...toolDetails, video_url: e.target.value })}
                                    placeholder="https://youtube.com/..."
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ends_at">Subscription Ends</Label>
                            <Input
                                id="ends_at"
                                type="date"
                                value={toolDetails.subscription_ends_at ? new Date(toolDetails.subscription_ends_at).toISOString().split('T')[0] : ''}
                                onChange={(e) => setToolDetails({ ...toolDetails, subscription_ends_at: e.target.value ? new Date(e.target.value).toISOString() : '' })}
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
        </div >
    )
}
