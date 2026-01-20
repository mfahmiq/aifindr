"use client"

import { useEffect, useState } from "react"
import { toolClaimsService } from "@/lib/services/toolClaimsService"
import { ToolClaimWithRelations } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Check, X, ExternalLink, Mail, ShieldAlert, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@supabase/ssr"
import { formatDistanceToNow } from "date-fns"

export default function AdminClaimsPage() {
    const [claims, setClaims] = useState<ToolClaimWithRelations[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const fetchClaims = async () => {
        setLoading(true)
        try {
            const data = await toolClaimsService.getPendingClaims()
            setClaims(data)
        } catch (e) {
            console.error("Error fetching claims:", e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchClaims()
    }, [])

    const handleApprove = async (claim: ToolClaimWithRelations) => {
        if (!confirm(`Are you sure you want to approve ownership of "${claim.tools?.name}" to ${claim.users?.email}?`)) return

        setActionLoading(claim.id)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            await toolClaimsService.approveClaim(claim.id, user.id)
            // Remove from list or refresh
            setClaims(prev => prev.filter(c => c.id !== claim.id))
        } catch (e: any) {
            alert(`Error approving: ${e.message}`)
        } finally {
            setActionLoading(null)
        }
    }

    const handleReject = async (claim: ToolClaimWithRelations) => {
        const reason = prompt("Enter rejection reason:")
        if (reason === null) return // Cancelled

        setActionLoading(claim.id)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            await toolClaimsService.rejectClaim(claim.id, user.id, reason || "Does not meet criteria")
            setClaims(prev => prev.filter(c => c.id !== claim.id))
        } catch (e: any) {
            alert(`Error rejecting: ${e.message}`)
        } finally {
            setActionLoading(null)
        }
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tool Ownership Claims</h1>
                    <p className="text-muted-foreground mt-2">
                        Review and approve requests from users claiming tool ownership.
                    </p>
                </div>
                <Button variant="outline" onClick={fetchClaims} disabled={loading}>
                    Refresh
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <p>Loading claims...</p>
                </div>
            ) : claims.length === 0 ? (
                <Card className="bg-muted/50 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <ShieldCheck className="w-12 h-12 mb-4 opacity-20" />
                        <h3 className="text-lg font-medium">No Pending Claims</h3>
                        <p>All caught up! There are no tool claims waiting for review.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {claims.map((claim) => (
                        <Card key={claim.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            Claim for: <Link href={`/tool/${claim.tools?.slug}`} className="text-primary hover:underline">{claim.tools?.name}</Link>
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2">
                                            Submitted {formatDistanceToNow(new Date(claim.created_at || Date.now()), { addSuffix: true })}
                                            <span className="text-muted-foreground">•</span>
                                            Method: <Badge variant="outline" className="uppercase text-[10px]">{claim.verification_method}</Badge>
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleReject(claim)}
                                            disabled={!!actionLoading}
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            Reject
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => handleApprove(claim)}
                                            disabled={!!actionLoading}
                                        >
                                            <Check className="w-4 h-4 mr-1" />
                                            Approve Ownership
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Claimant</h4>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                            {(claim.users?.name || claim.users?.email || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium">{claim.users?.name || 'No Name'}</div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {claim.users?.email}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Verification Data</h4>
                                    <div className="bg-muted p-4 rounded-md text-sm space-y-2">
                                        <div className="grid grid-cols-[100px_1fr] gap-2">
                                            <span className="text-muted-foreground">Email:</span>
                                            <span className="font-medium">{(claim.verification_data as any).email || 'N/A'}</span>
                                        </div>
                                        {(claim.verification_data as any).additional_info && (
                                            <div className="grid grid-cols-[100px_1fr] gap-2">
                                                <span className="text-muted-foreground">Details:</span>
                                                <span>{(claim.verification_data as any).additional_info}</span>
                                            </div>
                                        )}
                                        {claim.tools?.website_url && (
                                            <div className="pt-2 mt-2 border-t border-muted-foreground/10">
                                                <a
                                                    href={claim.tools.website_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center text-blue-500 hover:underline"
                                                >
                                                    Check Official Website <ExternalLink className="w-3 h-3 ml-1" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
