"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    History,
    Search,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    ShieldAlert,
    Terminal,
    User,
    Globe
} from "lucide-react"
import { activityLogsService } from "@/lib/services/activityLogsService"
import { format } from "date-fns"

export default function AdminAuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [count, setCount] = useState(0)
    const [loading, setLoading] = useState(true)
    
    // Filters
    const [action, setAction] = useState<string>("all")
    const [entityType, setEntityType] = useState<string>("all")
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const limit = 20

    // Collapsed state for JSON viewers
    const [expandedRow, setExpandedRow] = useState<string | null>(null)

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const filters: any = {
                limit,
                page
            }
            if (action && action !== "all") filters.action = action
            if (entityType && entityType !== "all") filters.entityType = entityType
            
            const result = await activityLogsService.getLogs(filters)
            
            // Client-side search for user email/name or notes since Supabase joins aren't easily searchable by nested properties without RPC
            let filteredLogs = result.logs || []
            if (search.trim()) {
                const searchLower = search.toLowerCase()
                filteredLogs = filteredLogs.filter(log => {
                    const userName = log.users?.name?.toLowerCase() || ""
                    const userEmail = log.users?.email?.toLowerCase() || ""
                    const notes = log.notes?.toLowerCase() || ""
                    const actionName = log.action?.toLowerCase() || ""
                    return userName.includes(searchLower) || 
                           userEmail.includes(searchLower) || 
                           notes.includes(searchLower) ||
                           actionName.includes(searchLower)
                })
            }

            setLogs(filteredLogs)
            setCount(filteredLogs.length)
        } catch (error) {
            console.error("Failed to fetch activity logs:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [action, entityType, page])

    const getActionBadgeColor = (actionName: string) => {
        if (actionName.includes("approve")) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
        if (actionName.includes("reject")) return "bg-rose-500/10 text-rose-500 border-rose-500/20"
        if (actionName.includes("flag")) return "bg-amber-500/10 text-amber-500 border-amber-500/20"
        return "bg-zinc-500/10 text-zinc-400 border-zinc-800"
    }

    const toggleRow = (id: string) => {
        if (expandedRow === id) {
            setExpandedRow(null)
        } else {
            setExpandedRow(id)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-zinc-100">
                        <History className="w-6 h-6 text-primary" />
                        Admin Audit Logs
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Track, monitor, and audit administrative actions and automated ownership claims in real-time.
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="self-start md:self-auto border-zinc-800 hover:bg-zinc-900 text-zinc-300"
                    onClick={fetchLogs}
                    disabled={loading}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Refresh Logs
                </Button>
            </div>

            {/* Filters Bar */}
            <Card className="border-zinc-800 bg-zinc-950/60 backdrop-blur">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Search by admin email, action or notes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
                            className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus-visible:ring-primary w-full"
                        />
                    </div>
                    
                    <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
                        <div className="w-full md:w-44">
                            <Select value={action} onValueChange={setAction}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                    <SelectValue placeholder="Filter Action" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                    <SelectItem value="all">All Actions</SelectItem>
                                    <SelectItem value="claim.auto_approve">claim.auto_approve</SelectItem>
                                    <SelectItem value="claim.approve">claim.approve</SelectItem>
                                    <SelectItem value="claim.reject">claim.reject</SelectItem>
                                    <SelectItem value="review.approved">review.approved</SelectItem>
                                    <SelectItem value="review.rejected">review.rejected</SelectItem>
                                    <SelectItem value="review.flagged">review.flagged</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full md:w-40">
                            <Select value={entityType} onValueChange={setEntityType}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                    <SelectValue placeholder="Entity Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                    <SelectItem value="all">All Entities</SelectItem>
                                    <SelectItem value="claim">Claims</SelectItem>
                                    <SelectItem value="review">Reviews</SelectItem>
                                    <SelectItem value="tool">Tools</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <Button 
                            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full md:w-auto px-5"
                            onClick={fetchLogs}
                        >
                            Apply
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Audit Logs Table */}
            <Card className="border-zinc-800 bg-zinc-950/60 overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-900/50 border-zinc-800">
                            <TableRow className="hover:bg-transparent border-zinc-800">
                                <TableHead className="w-[180px] text-zinc-400 font-semibold">Timestamp</TableHead>
                                <TableHead className="w-[200px] text-zinc-400 font-semibold">Actor / Admin</TableHead>
                                <TableHead className="w-[160px] text-zinc-400 font-semibold">Action</TableHead>
                                <TableHead className="text-zinc-400 font-semibold">Activity Details</TableHead>
                                <TableHead className="w-[100px] text-zinc-400 font-semibold text-right">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-zinc-500">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-600" />
                                        Loading audit logs...
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-zinc-500">
                                        <ShieldAlert className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                                        No audit log entries found matching the criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <>
                                        <TableRow 
                                            key={log.id} 
                                            className={`border-zinc-800 hover:bg-zinc-900/30 transition-colors cursor-pointer ${expandedRow === log.id ? "bg-zinc-900/10" : ""}`}
                                            onClick={() => toggleRow(log.id)}
                                        >
                                            <TableCell className="text-zinc-400 text-xs whitespace-nowrap">
                                                {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                                                        <User className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-zinc-200 text-xs font-medium">{log.users?.name || "System Automated"}</span>
                                                        <span className="text-[10px] text-zinc-500">{log.users?.email || "system@aifindr.com"}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`text-[10px] uppercase font-bold py-0.5 px-2 border ${getActionBadgeColor(log.action)}`}>
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-zinc-300 max-w-sm truncate">
                                                {log.notes}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-zinc-100">
                                                    {expandedRow === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        
                                        {/* Collapsible Details Row */}
                                        {expandedRow === log.id && (
                                            <TableRow className="bg-zinc-900/20 border-zinc-800 hover:bg-zinc-900/20">
                                                <TableCell colSpan={5} className="p-4 border-t border-zinc-800/80">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* Metadata Card */}
                                                        <div className="space-y-2.5 bg-zinc-950 p-3 rounded-lg border border-zinc-800/60">
                                                            <h4 className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                                                                <Globe className="w-3.5 h-3.5 text-primary" />
                                                                Connection Metadata
                                                            </h4>
                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                <div>
                                                                    <span className="text-zinc-500 block">IP Address</span>
                                                                    <span className="font-mono text-zinc-300">{log.ip_address || "Internal Process"}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-zinc-500 block">Entity Class & ID</span>
                                                                    <span className="font-mono text-zinc-300 capitalize">{log.entity_type} ({log.entity_id?.substring(0, 8)})</span>
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <span className="text-zinc-500 block">User Agent</span>
                                                                    <span className="font-mono text-[10px] text-zinc-400 break-all leading-normal">{log.user_agent || "Server-side triggered"}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Changes JSON Diff Card */}
                                                        <div className="space-y-2.5 bg-zinc-950 p-3 rounded-lg border border-zinc-800/60">
                                                            <h4 className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                                                                <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                                                                State Modification Details
                                                            </h4>
                                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                                <div className="space-y-1">
                                                                    <span className="text-rose-500 font-semibold block text-[10px] uppercase">Original State</span>
                                                                    <pre className="bg-zinc-900 p-2 rounded border border-zinc-800 text-[10px] font-mono text-rose-300 max-h-36 overflow-y-auto leading-normal">
                                                                        {JSON.stringify(log.old_values, null, 2)}
                                                                    </pre>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <span className="text-emerald-500 font-semibold block text-[10px] uppercase">New State</span>
                                                                    <pre className="bg-zinc-900 p-2 rounded border border-zinc-800 text-[10px] font-mono text-emerald-300 max-h-36 overflow-y-auto leading-normal">
                                                                        {JSON.stringify(log.new_values, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
            {/* Pagination / Total count bar */}
            {!loading && logs.length > 0 && (
                <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
                    <span>Showing {logs.length} entries of {count} loaded</span>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="h-8 border-zinc-800 hover:bg-zinc-900 text-zinc-300"
                        >
                            Previous
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={logs.length < limit}
                            onClick={() => setPage(p => p + 1)}
                            className="h-8 border-zinc-800 hover:bg-zinc-900 text-zinc-300"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
