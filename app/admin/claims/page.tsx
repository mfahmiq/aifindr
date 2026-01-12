"use client"

import { useState, useEffect } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Check,
    X,
    Loader2,
    ExternalLink,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from "lucide-react"
import { motion } from "framer-motion"
import { toolClaimsService } from "@/lib/services/toolClaimsService"
import { ToolClaimWithRelations } from "@/lib/types"

export default function AdminClaimsPage() {
    const [claims, setClaims] = useState<ToolClaimWithRelations[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('pending')
    const [rejectionReason, setRejectionReason] = useState('')
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        fetchClaims()
    }, [filter])

    const fetchClaims = async () => {
        try {
            setLoading(true)
            const { claims: data } = await toolClaimsService.getAllClaims({
                status: filter !== 'all' ? filter as any : undefined
            })
            setClaims(data)
        } catch (error) {
            console.error('Error fetching claims:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (claimId: string) => {
        setProcessingId(claimId)
        try {
            // In real app, get admin user ID from auth context
            await toolClaimsService.approveClaim(claimId, 'admin-user-id')
            fetchClaims()
        } catch (error) {
            console.error('Error approving claim:', error)
        } finally {
            setProcessingId(null)
        }
    }

    const handleReject = async (claimId: string) => {
        if (!rejectionReason.trim()) return
        setProcessingId(claimId)
        try {
            await toolClaimsService.rejectClaim(claimId, 'admin-user-id', rejectionReason)
            setRejectionReason('')
            fetchClaims()
        } catch (error) {
            console.error('Error rejecting claim:', error)
        } finally {
            setProcessingId(null)
        }
    }

    const statusColors = {
        pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
        approved: 'bg-green-500/10 text-green-600 border-green-500/30',
        rejected: 'bg-red-500/10 text-red-600 border-red-500/30'
    }

    const statusIcons = {
        pending: Clock,
        approved: CheckCircle,
        rejected: XCircle
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tool Claims</h1>
                    <p className="text-muted-foreground">Review and verify tool ownership claims</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                {[
                    { status: 'pending', label: 'Pending', icon: Clock, color: 'yellow' },
                    { status: 'approved', label: 'Approved', icon: CheckCircle, color: 'green' },
                    { status: 'rejected', label: 'Rejected', icon: XCircle, color: 'red' },
                ].map((item) => {
                    const count = claims.filter(c => c.status === item.status).length
                    return (
                        <Card key={item.status} className="border-2">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{item.label}</p>
                                        <p className="text-3xl font-bold">{count}</p>
                                    </div>
                                    <item.icon className={`w-8 h-8 text-${item.color}-500`} />
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Claims Table */}
            <Card className="border-2">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>All Claims</CardTitle>
                        <CardDescription>Review and manage tool ownership claims</CardDescription>
                    </div>
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    {claims.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="font-semibold mb-2">No claims found</h3>
                            <p className="text-sm text-muted-foreground">
                                {filter === 'pending'
                                    ? 'No pending claims to review.'
                                    : 'No claims match the selected filter.'}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Tool</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {claims.map((claim) => {
                                    const StatusIcon = statusIcons[claim.status as keyof typeof statusIcons]
                                    return (
                                        <TableRow key={claim.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{claim.users?.name || 'Unknown'}</p>
                                                    <p className="text-sm text-muted-foreground">{claim.users?.email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{claim.tools?.name}</span>
                                                    <a
                                                        href={claim.tools?.website_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-muted-foreground hover:text-primary"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {claim.verification_method || 'Manual'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[claim.status as keyof typeof statusColors]}>
                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                    {claim.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {claim.created_at
                                                    ? new Date(claim.created_at).toLocaleDateString()
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {claim.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-green-600 hover:text-green-700"
                                                            onClick={() => handleApprove(claim.id)}
                                                            disabled={processingId === claim.id}
                                                        >
                                                            {processingId === claim.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Check className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-red-600 hover:text-red-700"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Reject Claim</DialogTitle>
                                                                    <DialogDescription>
                                                                        Provide a reason for rejecting this claim.
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <div className="space-y-4 py-4">
                                                                    <div className="space-y-2">
                                                                        <Label>Rejection Reason</Label>
                                                                        <Textarea
                                                                            placeholder="Enter reason for rejection..."
                                                                            value={rejectionReason}
                                                                            onChange={(e) => setRejectionReason(e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <DialogFooter>
                                                                    <Button
                                                                        variant="destructive"
                                                                        onClick={() => handleReject(claim.id)}
                                                                        disabled={!rejectionReason.trim() || processingId === claim.id}
                                                                    >
                                                                        {processingId === claim.id ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                                        ) : null}
                                                                        Reject Claim
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                )}
                                                {claim.status !== 'pending' && (
                                                    <span className="text-sm text-muted-foreground">
                                                        {claim.reviewed_at
                                                            ? `Reviewed ${new Date(claim.reviewed_at).toLocaleDateString()}`
                                                            : '-'}
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
