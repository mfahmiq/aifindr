"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, Trash2, ExternalLink, Globe, Lock, MoreHorizontal, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { collectionService } from "@/lib/services/collectionService"
import { ToolCard } from "@/components/tool-card"
import { ToolWithRelations } from "@/lib/types"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export default function CollectionDetailPage({ params }: { params: { id: string } }) {
    const [collection, setCollection] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        loadCollection()
    }, [])

    const loadCollection = async () => {
        try {
            setLoading(true)
            const data = await collectionService.getCollectionById(params.id)
            setCollection(data)
        } catch (error) {
            console.error("Failed to load collection:", error)
        } finally {
            setLoading(false)
        }
    }

    const removeTool = async (toolId: string) => {
        if (!confirm("Are you sure you want to remove this tool from the collection?")) return
        try {
            await collectionService.removeToolFromCollection(params.id, toolId)
            toast.success("Tool removed from collection")
            loadCollection() // Reload to refresh list
        } catch (error) {
            console.error("Failed to remove tool:", error)
            toast.error("Failed to remove tool")
        }
    }

    const deleteCollection = async () => {
        if (!confirm("Are you sure you want to delete this collection? This action cannot be undone.")) return
        try {
            await collectionService.deleteCollection(params.id)
            toast.success("Collection deleted")
            router.push('/dashboard/collections')
        } catch (error) {
            console.error("Failed to delete collection:", error)
            toast.error("Failed to delete collection")
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    }

    if (!collection) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <h1 className="text-2xl font-bold">Collection Not Found</h1>
                <Button onClick={() => router.push('/dashboard/collections')}>Back to Collections</Button>
            </div>
        )
    }

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="space-y-4">
                <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary" onClick={() => router.push('/dashboard/collections')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Collections
                </Button>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tight">{collection.name}</h1>
                            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium border-primary/20 bg-primary/5 text-primary">
                                {collection.is_public ? <><Globe className="w-3 h-3 mr-1" /> Public</> : <><Lock className="w-3 h-3 mr-1" /> Private</>}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground max-w-2xl text-lg">{collection.description || "No description provided."}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => window.open(`/collection/${collection.slug}`, '_blank')}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Public Page
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-border/50 bg-background/50 backdrop-blur-sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                <DropdownMenuItem onClick={() => alert("Edit Metadata Modal to be implemented")}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20" onClick={deleteCollection}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Collection
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Tools Grid */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Tools in this Collection ({collection.items?.length || 0})</h2>

                {collection.items && collection.items.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {collection.items.map((item: any) => (
                            <div key={item.id} className="relative group">
                                <ToolCard tool={item.tools} />
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8 rounded-full shadow-lg"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            removeTool(item.tools.id)
                                        }}
                                        title="Remove from collection"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/50 rounded-3xl bg-muted/20">
                        <p className="text-muted-foreground mb-4">No tools in this collection yet.</p>
                        <Button variant="outline" onClick={() => router.push('/')}>
                            Browse Tools to Add
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
