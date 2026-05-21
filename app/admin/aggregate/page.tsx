"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Sparkles,
    Import,
    Activity,
    CheckCircle,
    XCircle,
    Loader2,
    Link2,
    ShieldAlert,
    RefreshCw,
    Check,
    ListFilter,
    ArrowRight
} from "lucide-react"

interface IngestionResult {
    name: string
    url: string
    success: boolean
    reason?: string
}

export default function AdminAggregatePage() {
    const [singleUrl, setSingleUrl] = useState("")
    const [autoPublish, setAutoPublish] = useState(false)
    const [singleLoading, setSingleLoading] = useState(false)
    const [singleStep, setSingleStep] = useState("")
    const [singleResult, setSingleResult] = useState<any | null>(null)
    const [errorMsg, setErrorMsg] = useState("")

    // PH RSS states
    const [rssLoading, setRssLoading] = useState(false)
    const [rssResults, setRssResults] = useState<IngestionResult[]>([])
    const [rssMessage, setRssMessage] = useState("")

    // Moderation Queue States
    const [pendingTools, setPendingTools] = useState<any[]>([])
    const [queueLoading, setQueueLoading] = useState(true)

    const fetchPendingTools = async () => {
        setQueueLoading(true)
        try {
            const res = await fetch("/api/tools?status=pending&limit=20&sortBy=newest")
            if (res.ok) {
                const data = await res.json()
                setPendingTools(data.tools || [])
            }
        } catch (e) {
            console.error("Failed to fetch pending tools:", e)
        } finally {
            setQueueLoading(false)
        }
    }

    useEffect(() => {
        fetchPendingTools()
    }, [])

    const handleSingleImport = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!singleUrl.trim()) return

        setSingleLoading(true)
        setSingleResult(null)
        setErrorMsg("")
        
        try {
            // Step-by-step visual feedback sequence
            setSingleStep("Scraping website homepage & meta tags...")
            await new Promise((r) => setTimeout(r, 800))

            setSingleStep("Calling Gemini 1.5 Flash Free Tier for extraction...")
            await new Promise((r) => setTimeout(r, 800))

            setSingleStep("Matching categories and generating custom tags...")
            await new Promise((r) => setTimeout(r, 600))

            setSingleStep("Querying Clearbit & Google for high-res logo...")
            
            const res = await fetch("/api/admin/aggregate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: singleUrl,
                    autoPublish,
                    saveToDb: true
                })
            })

            const data = await res.json()

            if (!res.ok || data.success === false) {
                throw new Error(data.message || data.error || "Failed to aggregate website")
            }

            setSingleResult(data)
            setSingleUrl("")
            fetchPendingTools()
        } catch (err: any) {
            console.error(err)
            setErrorMsg(err.message || "An unexpected error occurred during ingestion")
        } finally {
            setSingleLoading(false)
            setSingleStep("")
        }
    }

    const handlePHIngest = async () => {
        setRssLoading(true)
        setRssResults([])
        setRssMessage("")
        
        try {
            const res = await fetch("/api/admin/aggregate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "rss",
                    autoPublish
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to process Product Hunt RSS feed")

            setRssResults(data.results || [])
            setRssMessage(data.message || "Product Hunt Ingestion complete!")
            fetchPendingTools()
        } catch (err: any) {
            console.error(err)
            setRssMessage(`Error: ${err.message}`)
        } finally {
            setRssLoading(false)
        }
    }

    const handleApproveTool = async (slug: string) => {
        try {
            const res = await fetch(`/api/tools/${slug}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "approved", is_verified: true })
            })
            if (res.ok) {
                setPendingTools(pendingTools.filter(t => t.slug !== slug))
            } else {
                alert("Failed to approve tool.")
            }
        } catch (e) {
            alert("Error approving tool.")
        }
    }

    const handleDeleteTool = async (slug: string) => {
        if (!confirm("Are you sure you want to delete this pending tool?")) return
        try {
            const res = await fetch(`/api/tools/${slug}`, { method: "DELETE" })
            if (res.ok) {
                setPendingTools(pendingTools.filter(t => t.slug !== slug))
            } else {
                alert("Failed to delete tool.")
            }
        } catch (e) {
            alert("Error deleting tool.")
        }
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header section with glassmorphism */}
            <div className="p-6 bg-gradient-to-r from-primary/10 via-purple-500/5 to-background rounded-3xl border border-primary/20 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                            Automated AI Tool Ingestion
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Fully automated 1-click aggregation and enrichment powered by Gemini 1.5 Flash (100% Free).
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-card border-2 p-3 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/20 text-green-600 font-bold animate-pulse text-sm">
                            $0
                        </div>
                        <div className="text-xs">
                            <span className="font-bold block text-green-600">100% FREE OPERATIONAL COST</span>
                            <span>Gemini Free Tier (1,500 RPD / 15 RPM)</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Single Website Aggregator */}
                <div className="bg-card border-2 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold">1-Click URL Importer</h2>
                        </div>
                        <p className="text-muted-foreground text-sm mb-6">
                            Enter any AI tool homepage URL. AI will automatically scrape the site, extract metadata, structure prices, fetch the logo, and save to Supabase.
                        </p>

                        <form onSubmit={handleSingleImport} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="website-url" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Website Homepage URL</Label>
                                <div className="relative">
                                    <Input
                                        id="website-url"
                                        type="url"
                                        placeholder="https://example-ai-tool.com"
                                        value={singleUrl}
                                        onChange={(e) => setSingleUrl(e.target.value)}
                                        disabled={singleLoading}
                                        className="pl-4 pr-10 py-5 bg-muted/30 border-muted focus:border-primary rounded-xl transition-all"
                                        required
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        <Link2 className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3.5 bg-muted/20 border rounded-2xl">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold">Auto-Publish Tool</span>
                                    <span className="text-xs text-muted-foreground">If active, tool will bypass moderation queue and go live instantly.</span>
                                </div>
                                <Switch
                                    checked={autoPublish}
                                    onCheckedChange={setAutoPublish}
                                    disabled={singleLoading}
                                />
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full py-6 rounded-xl font-bold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/95 hover:to-purple-600/95 transition-all text-white flex items-center justify-center gap-2 shadow-md shadow-primary/20"
                                disabled={singleLoading}
                            >
                                {singleLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Aggregating...
                                    </>
                                ) : (
                                    <>
                                        <Import className="w-5 h-5" />
                                        Auto Ingest Website
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Step feedback */}
                        {singleLoading && (
                            <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3 animate-pulse">
                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                <span className="text-xs text-primary font-medium">{singleStep}</span>
                            </div>
                        )}

                        {/* Success Result Panel */}
                        {singleResult && (
                            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl space-y-3 relative overflow-hidden transition-all duration-300">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-xl" />
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold text-sm">
                                    <CheckCircle className="w-5 h-5" />
                                    Successfully Ingested!
                                </div>
                                
                                <div className="flex items-center gap-3 p-2 bg-background border rounded-xl shadow-xs">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden border flex items-center justify-center bg-muted">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={singleResult.data.logo_url} alt={singleResult.data.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm truncate">{singleResult.data.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">{singleResult.data.website_url}</div>
                                    </div>
                                    <Badge variant="outline" className="text-xs font-semibold uppercase">{singleResult.data.pricing_type}</Badge>
                                </div>

                                <div className="text-xs space-y-1 text-muted-foreground bg-background/50 p-2.5 rounded-xl border border-dashed">
                                    <div><strong className="text-foreground">Category:</strong> {singleResult.data.category_name || "Detected Automatically"}</div>
                                    <div><strong className="text-foreground">Short Description:</strong> {singleResult.data.short_description}</div>
                                    <div><strong className="text-foreground">Tags:</strong> {singleResult.data.tags?.join(", ") || "none"}</div>
                                    <div><strong className="text-foreground">Features:</strong> {singleResult.data.features?.join(", ") || "none"}</div>
                                </div>

                                <div className="flex justify-end gap-2 text-xs font-medium">
                                    {autoPublish ? (
                                        <a href={`/tool/${singleResult.slug}`} target="_blank" className="text-primary hover:underline flex items-center gap-1">
                                            View Live Tool <ArrowRight className="w-3.5 h-3.5" />
                                        </a>
                                    ) : (
                                        <span className="text-amber-600 dark:text-amber-400">Added to Moderation Queue</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Error Result Panel */}
                        {errorMsg && (
                            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <div className="font-bold text-sm text-red-700 dark:text-red-400">Aggregation Failed</div>
                                    <p className="text-xs text-red-600/90 leading-relaxed">{errorMsg}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Hunt RSS Aggregator */}
                <div className="bg-card border-2 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 shadow-sm">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold">Product Hunt AI Aggregator</h2>
                        </div>
                        <p className="text-muted-foreground text-sm mb-6">
                            Automatically parses the global Product Hunt launch feed for products in the 'Artificial Intelligence' category, resolves redirects, filters duplicates, and enriches new tools dynamically.
                        </p>

                        <div className="p-4 bg-muted/20 border border-dashed rounded-2xl mb-6 space-y-3 text-xs leading-relaxed text-muted-foreground">
                            <div className="flex items-center gap-2 font-semibold text-foreground">
                                <Check className="w-4 h-4 text-green-600" />
                                RSS Target Feed
                            </div>
                            <code className="block p-2 bg-background rounded-lg border overflow-x-auto text-[10px]">
                                https://www.producthunt.com/feed?category=artificial-intelligence
                            </code>
                            <p>
                                Triggering this aggregation manually will fetch the latest 5 AI launches, follow their destination links, extract full profiles using Gemini 1.5 Flash, and save them.
                            </p>
                        </div>

                        <Button 
                            onClick={handlePHIngest}
                            className="w-full py-6 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-600/95 hover:to-indigo-600/95 transition-all text-white flex items-center justify-center gap-2 shadow-md shadow-purple-500/20"
                            disabled={rssLoading}
                        >
                            {rssLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing RSS Feed...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-5 h-5" />
                                    Run RSS Aggregator
                                </>
                            )}
                        </Button>

                        {/* RSS Results Log */}
                        {rssMessage && (
                            <div className="mt-6 space-y-3">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                                    <span>Feed Processing Log</span>
                                    {rssLoading && <Loader2 className="w-3 h-3 animate-spin text-purple-600" />}
                                </div>
                                <div className="max-h-[220px] overflow-y-auto border-2 rounded-2xl p-3 bg-muted/40 font-mono text-[11px] leading-relaxed space-y-1.5 scrollbar-thin">
                                    <div className="text-purple-600 font-bold">{rssMessage}</div>
                                    {rssResults.length > 0 ? (
                                        rssResults.map((res, i) => (
                                            <div key={i} className={`flex items-start gap-1.5 ${res.success ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                                <span>{res.success ? '✅' : '❌'}</span>
                                                <div className="min-w-0 flex-1">
                                                    <strong>{res.name}</strong> ({res.url})
                                                    {!res.success && <span className="block text-[10px] text-red-500/80">Reason: {res.reason}</span>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        !rssLoading && <div className="text-muted-foreground text-xs italic">No entries parsed yet. Click button to begin.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Moderation Queue Section */}
            <div className="bg-card border-2 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shadow-sm">
                            <ListFilter className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Moderation Queue</h2>
                            <p className="text-xs text-muted-foreground">Review automatically ingested pending tools before making them live.</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchPendingTools} disabled={queueLoading} className="rounded-xl">
                        {queueLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                        Refresh List
                    </Button>
                </div>

                <div className="rounded-2xl border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40">
                                <TableHead className="font-semibold">Tool</TableHead>
                                <TableHead className="font-semibold">Category</TableHead>
                                <TableHead className="font-semibold">Pricing</TableHead>
                                <TableHead className="font-semibold">Created At</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {queueLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs">
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                                        Loading moderation queue...
                                    </TableCell>
                                </TableRow>
                            ) : pendingTools.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs italic">
                                        No pending tools in queue. Ingested tools will appear here if Auto-Publish is disabled.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pendingTools.map((tool) => (
                                    <TableRow key={tool.id} className="hover:bg-muted/10">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg overflow-hidden border bg-muted shrink-0">
                                                    {tool.logo_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={tool.logo_url} alt={tool.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center font-bold text-xs">{tool.name.substring(0,2)}</div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-sm truncate">{tool.name}</div>
                                                    <a href={tool.website_url} target="_blank" className="text-xs text-primary hover:underline truncate flex items-center gap-0.5">
                                                        {tool.website_url.replace(/^https?:\/\//, "")}
                                                        <Link2 className="w-3 h-3 shrink-0" />
                                                    </a>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-medium">
                                            {tool.category?.name || "Uncategorized"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] font-semibold uppercase">{tool.pricing_type || "Free"}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(tool.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    onClick={() => handleApproveTool(tool.slug)}
                                                    className="h-8 rounded-lg text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                                >
                                                    Approve
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    onClick={() => handleDeleteTool(tool.slug)}
                                                    className="h-8 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
