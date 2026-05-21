"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Send,
    MessageSquare,
    BookOpen,
    Twitter,
    Linkedin,
    Pin,
    Loader2,
    CheckCircle,
    XCircle,
    Activity,
    Sparkles,
    RefreshCw,
    Play,
    Clock,
    ShieldAlert,
    AlertCircle,
    ExternalLink
} from "lucide-react"
import { toast } from "sonner"

interface AdapterKey {
    key: string
    isSet: boolean
}

interface AdapterConfig {
    id: string
    name: string
    icon: string
    description: string
    keys: AdapterKey[]
    isEnabled: boolean
}

interface LogEntry {
    id: string
    created_at: string
    action: string
    entity_id: string
    notes: string
    tools?: {
        id: string
        name: string
        logo_url: string | null
        slug: string
    }
}

export default function AdminAutomationPage() {
    const [loading, setLoading] = useState(true)
    const [adapters, setAdapters] = useState<AdapterConfig[]>([])
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [approvedTools, setApprovedTools] = useState<any[]>([])
    const [selectedToolId, setSelectedToolId] = useState("")
    
    // Broadcast states
    const [broadcastLoading, setBroadcastLoading] = useState(false)
    const [broadcastResults, setBroadcastResults] = useState<any[] | null>(null)
    const [broadcastStatus, setBroadcastStatus] = useState<string>("")

    // Credential config states
    const [selectedAdapterForKeys, setSelectedAdapterForKeys] = useState<AdapterConfig | null>(null)
    const [credentialFormValues, setCredentialFormValues] = useState<Record<string, string>>({})
    const [savingKeys, setSavingKeys] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            // 1. Fetch status of social integrations
            const statusRes = await fetch("/api/admin/automation/status")
            const statusData = await statusRes.json()
            if (statusRes.ok) {
                setAdapters(statusData.adapters || [])
                setLogs(statusData.logs || [])
            }

            // 2. Fetch approved tools for dropdown selection
            const toolsRes = await fetch("/api/tools?status=approved&limit=100&sortBy=newest")
            const toolsData = await toolsRes.json()
            if (toolsRes.ok) {
                setApprovedTools(toolsData.tools || [])
                if (toolsData.tools?.length > 0) {
                    setSelectedToolId(toolsData.tools[0].id)
                }
            }
        } catch (error) {
            console.error("Failed to load automation data:", error)
            toast.error("Failed to fetch automation statuses")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedToolId) return

        const selectedToolName = approvedTools.find(t => t.id === selectedToolId)?.name || "selected tool"
        if (!confirm(`Are you sure you want to broadcast "${selectedToolName}" to all active social media networks?`)) return

        setBroadcastLoading(true)
        setBroadcastResults(null)
        setBroadcastStatus("Initiating social adapters orchestration...")

        try {
            const res = await fetch("/api/admin/automation/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ toolId: selectedToolId })
            })

            const data = await res.json()
            if (res.ok && data.success) {
                setBroadcastResults(data.results || [])
                toast.success("Broadcast completed successfully!")
                // Refresh status/logs
                const statusRes = await fetch("/api/admin/automation/status")
                const statusData = await statusRes.json()
                if (statusRes.ok) {
                    setLogs(statusData.logs || [])
                }
            } else {
                throw new Error(data.error || "Failed to broadcast tool alert")
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "An error occurred during broadcasting")
            setBroadcastStatus(`Failed: ${error.message}`)
        } finally {
            setBroadcastLoading(false)
        }
    }

    const openKeyConfig = (adapter: AdapterConfig) => {
        setSelectedAdapterForKeys(adapter)
        const initialFormValues: Record<string, string> = {}
        adapter.keys.forEach(k => {
            initialFormValues[k.key] = ""
        })
        setCredentialFormValues(initialFormValues)
    }

    const handleSaveCredentials = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedAdapterForKeys) return

        // Validate that at least one non-empty value was provided if not already set
        const keysToSave: Record<string, string> = {}
        let hasChanges = false

        for (const k of selectedAdapterForKeys.keys) {
            const val = credentialFormValues[k.key]
            if (val) {
                keysToSave[k.key] = val
                hasChanges = true
            }
        }

        if (!hasChanges) {
            toast.info("No changes to save.")
            setSelectedAdapterForKeys(null)
            return
        }

        setSavingKeys(true)
        try {
            const res = await fetch("/api/admin/automation/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    adapterId: selectedAdapterForKeys.id,
                    keys: keysToSave
                })
            })

            const data = await res.json()
            if (res.ok && data.success) {
                toast.success(`Successfully updated ${selectedAdapterForKeys.name} credentials!`)
                setSelectedAdapterForKeys(null)
                fetchData() // refresh configurations
            } else {
                throw new Error(data.error || "Failed to save credentials")
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Failed to save credentials")
        } finally {
            setSavingKeys(false)
        }
    }

    const getAdapterIcon = (iconName: string) => {
        switch (iconName) {
            case "Send":
                return <Send className="w-5 h-5 text-sky-500" />
            case "MessageSquare":
                return <MessageSquare className="w-5 h-5 text-indigo-500" />
            case "BookOpen":
                return <BookOpen className="w-5 h-5 text-emerald-500" />
            case "Twitter":
                return <Twitter className="w-5 h-5 text-sky-400" />
            case "Linkedin":
                return <Linkedin className="w-5 h-5 text-blue-600" />
            case "Pin":
                return <Pin className="w-5 h-5 text-rose-500" />
            default:
                return <Sparkles className="w-5 h-5 text-primary" />
        }
    }

    const activeCount = adapters.filter(a => a.isEnabled).length

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header Section with elegant Glassmorphism banner */}
            <div className="p-6 bg-gradient-to-r from-primary/10 via-purple-500/5 to-background rounded-3xl border border-primary/20 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/15 rounded-full blur-3xl -z-10" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                            AIFindr Social Automation Engine
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Fully native auto-post system alerting your social media channels of newly added or approved AI tools (100% Free).
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-card border-2 p-3 rounded-2xl shadow-sm shrink-0">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${activeCount > 0 ? "bg-green-500/20 text-green-600 animate-pulse" : "bg-red-500/20 text-red-500"} font-bold text-sm`}>
                            {activeCount}
                        </div>
                        <div className="text-xs">
                            <span className="font-bold block text-primary uppercase">ACTIVE ADAPTERS</span>
                            <span>{activeCount} of 6 Social channels configured</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Configured Adapters Status Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adapters.map((adapter) => (
                    <Card key={adapter.id} className="border-2 relative overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
                        
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-muted/65 flex items-center justify-center shadow-xs border">
                                        {getAdapterIcon(adapter.icon)}
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold">{adapter.name}</CardTitle>
                                        <CardDescription className="text-xs line-clamp-2 mt-0.5">{adapter.description}</CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4 pt-0">
                            {/* Required keys checklist */}
                            <div className="bg-muted/40 p-3 rounded-xl border space-y-2">
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Required Credentials (.env)</div>
                                <div className="space-y-1.5">
                                    {adapter.keys.map((k) => (
                                        <div key={k.key} className="flex items-center justify-between text-xs">
                                            <code className="text-muted-foreground font-mono text-[10px] select-all truncate max-w-[200px]" title={k.key}>{k.key}</code>
                                            {k.isSet ? (
                                                <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/15 border-green-500/20 text-[10px] font-bold">SET ✅</Badge>
                                            ) : (
                                                <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/15 border-red-500/20 text-[10px] font-bold">MISSING ❌</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full text-xs font-semibold gap-1.5 mt-1 bg-background/50 border hover:bg-muted"
                                onClick={() => openKeyConfig(adapter)}
                            >
                                Manage Keys 🔑
                            </Button>
 
                            {/* Enabled badge status */}
                            <div className="flex items-center justify-between border-t pt-3 mt-auto">
                                <span className="text-xs text-muted-foreground">Adapter Status</span>
                                {adapter.isEnabled ? (
                                    <Badge className="bg-green-500 text-white border-0 hover:bg-green-600 gap-1 animate-shimmer">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        Operational
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="gap-1 text-muted-foreground">
                                        Not Configured
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Split layout for Manual Broadcast & Recent Activities */}
            <div className="grid lg:grid-cols-5 gap-6">
                
                {/* Left Side: Manual Trigger Control */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-2 border-primary/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />
                        
                        <CardHeader className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-sm border border-primary/30">
                                    <Play className="w-4 h-4 fill-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Manual Social Broadcast</CardTitle>
                                    <CardDescription>Force publish a tool alert alertly across all active socials.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <form onSubmit={handleBroadcast} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="approved-tool-select" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                        Select Approved Tool
                                    </label>
                                    {approvedTools.length === 0 ? (
                                        <div className="p-3 bg-muted rounded-xl text-xs text-muted-foreground italic">
                                            No approved tools found in the database.
                                        </div>
                                    ) : (
                                        <select
                                            id="approved-tool-select"
                                            value={selectedToolId}
                                            onChange={(e) => setSelectedToolId(e.target.value)}
                                            disabled={broadcastLoading}
                                            className="w-full p-3 rounded-xl border bg-muted/40 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden text-sm transition-all"
                                        >
                                            {approvedTools.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name} ({t.pricing_type || "Free"})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={broadcastLoading || !selectedToolId || activeCount === 0}
                                    className="w-full py-6 rounded-xl font-bold bg-gradient-to-r from-primary via-purple-600 to-indigo-600 hover:from-primary hover:to-indigo-600 text-white flex items-center justify-center gap-2 shadow-md shadow-primary/20 group"
                                >
                                    {broadcastLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Broadcasting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            Launch Social Alert 🚀
                                        </>
                                    )}
                                </Button>
                            </form>

                            {/* Interactive execution logging screen */}
                            {broadcastStatus && (
                                <div className="mt-4 p-3.5 bg-muted/50 border rounded-2xl space-y-2 text-xs">
                                    <div className="flex items-center gap-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                                        <Activity className="w-3.5 h-3.5 animate-pulse text-primary" />
                                        Execution Monitor
                                    </div>
                                    <div className="font-mono text-[11px] leading-relaxed text-muted-foreground">
                                        {broadcastStatus}
                                    </div>

                                    {broadcastResults && (
                                        <div className="space-y-1.5 border-t pt-2 mt-2 font-mono text-[10px]">
                                            {broadcastResults.map((r, i) => (
                                                <div key={i} className="flex items-center justify-between">
                                                    <span>{r.adapterName}</span>
                                                    {r.success ? (
                                                        <span className="text-green-600 font-bold">SUCCESS ✅</span>
                                                    ) : (
                                                        <span className="text-red-500 font-bold" title={r.error}>
                                                            FAILED ❌
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeCount === 0 && (
                                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-400">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <div>
                                        <strong>No active channels!</strong> Add environment variables to `.env` to enable auto-posting, then restart the server.
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side: Recent Activity Audit Logs */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="border-2 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-500/20">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Recent Broadcast Logs</CardTitle>
                                    <CardDescription>Real-time audit history of native social postings.</CardDescription>
                                </div>
                            </div>
                            <Button variant="outline" size="icon" onClick={fetchData} className="w-8 h-8 rounded-lg shrink-0">
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </CardHeader>

                        <CardContent className="p-0 border-t">
                            <div className="overflow-x-auto max-h-[360px] scrollbar-thin">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="w-[120px] font-semibold text-xs py-2">Timestamp</TableHead>
                                            <TableHead className="font-semibold text-xs py-2">Target Tool</TableHead>
                                            <TableHead className="font-semibold text-xs py-2">Broadcast Results</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-12 text-muted-foreground text-xs italic">
                                                    No auto-post logs found. Alerts will be recorded once they are triggered.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            logs.map((log) => (
                                                <TableRow key={log.id} className="hover:bg-muted/10 transition-colors">
                                                    <TableCell className="text-xs font-mono text-muted-foreground py-3">
                                                        {new Date(log.created_at).toLocaleDateString(undefined, {
                                                            month: "short",
                                                            day: "2-digit",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            second: "2-digit"
                                                        })}
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        {log.tools ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-md border overflow-hidden shrink-0 bg-muted flex items-center justify-center text-[10px] font-bold">
                                                                    {log.tools.logo_url ? (
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        <img src={log.tools.logo_url} alt={log.tools.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        log.tools.name.substring(0,2)
                                                                    )}
                                                                </div>
                                                                <a
                                                                    href={`/tool/${log.tools.slug}`}
                                                                    target="_blank"
                                                                    className="text-xs font-bold text-foreground hover:text-primary hover:underline truncate max-w-[120px] inline-flex items-center gap-0.5"
                                                                >
                                                                    {log.tools.name}
                                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic font-mono">ID: {log.entity_id?.substring(0, 8)}</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-3 max-w-[220px]">
                                                        <div className="text-xs leading-relaxed line-clamp-3 text-muted-foreground" title={log.notes}>
                                                            {log.notes.replace("Auto-posted to social networks. Summary: ", "")}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>

            {/* Premium Credentials Configuration Modal */}
            {selectedAdapterForKeys && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
                    <div className="bg-card border-2 border-primary/20 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative transition-transform duration-300 scale-100">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />
                        
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                {getAdapterIcon(selectedAdapterForKeys.icon)}
                                Configure {selectedAdapterForKeys.name} Keys
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Securely configure API credentials. Saved credentials are stored inside database site settings.
                            </p>
                        </div>

                        <form onSubmit={handleSaveCredentials}>
                            <div className="p-6 space-y-4">
                                {selectedAdapterForKeys.keys.map((k) => (
                                    <div key={k.key} className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground font-mono block text-left">
                                            {k.key}
                                        </label>
                                        <input
                                            type="password"
                                            value={credentialFormValues[k.key] || ""}
                                            onChange={(e) => setCredentialFormValues({
                                                ...credentialFormValues,
                                                [k.key]: e.target.value
                                            })}
                                            placeholder={k.isSet ? "•••••••••••••••• (Already Set)" : "Enter key value..."}
                                            className="w-full p-2.5 rounded-xl border bg-muted/40 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden font-mono text-white placeholder-muted-foreground"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 bg-muted/20 border-t flex justify-end gap-3">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setSelectedAdapterForKeys(null)}
                                    disabled={savingKeys}
                                    className="rounded-xl border bg-background/50 hover:bg-muted"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={savingKeys}
                                    className="bg-primary hover:bg-primary/95 text-white rounded-xl font-semibold px-5"
                                >
                                    {savingKeys ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Saving...
                                        </>
                                    ) : "Save Credentials"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
