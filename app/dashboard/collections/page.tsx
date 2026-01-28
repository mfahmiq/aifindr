"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Folder, MoreHorizontal, Globe, Lock, Trash2, ExternalLink, Pencil, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { collectionService } from "@/lib/services/collectionService"
import { format } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CreateCollectionDialog } from "@/components/collections/create-collection-dialog"

export default function CollectionsPage() {
    const [collections, setCollections] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const router = useRouter()

    useEffect(() => {
        loadCollections()
    }, [])

    const loadCollections = async () => {
        try {
            setLoading(true)
            const data = await collectionService.getUserCollections()
            setCollections(data || [])
        } catch (error) {
            console.error("Failed to load collections:", error)
        } finally {
            setLoading(false)
        }
    }

    const deleteCollection = async (id: string) => {
        if (!confirm("Are you sure you want to delete this collection?")) return
        try {
            await collectionService.deleteCollection(id)
            setCollections(collections.filter(c => c.id !== id))
        } catch (error) {
            console.error("Failed to delete collection:", error)
            alert("Failed to delete collection")
        }
    }

    const filteredCollections = collections.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">My Collections</h1>
                    <p className="text-muted-foreground">Manage and organize your favorite AI tools</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search collections..."
                            className="pl-9 bg-background/50 border-border/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Create Dialog */}
                    <CreateCollectionDialog onSuccess={loadCollections} />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-3xl bg-muted/50 animate-pulse" />
                    ))}
                </div>
            ) : filteredCollections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/50 rounded-3xl bg-muted/20">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <Folder className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">No collections yet</h2>
                    <p className="text-muted-foreground max-w-md mb-8">
                        Create collections to organize your tools and share them with others.
                    </p>
                    <CreateCollectionDialog
                        onSuccess={loadCollections}
                        trigger={
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create your first collection
                            </Button>
                        }
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCollections.map((collection, index) => (
                        <motion.div
                            key={collection.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="h-full hover:shadow-lg transition-all duration-300 group rounded-3xl overflow-hidden border-border/50 bg-gradient-to-br from-background to-muted/20">
                                <CardHeader className="relative">
                                    <div className="flex justify-between items-start">
                                        <div className="bg-primary/10 p-3 rounded-2xl w-fit mb-4">
                                            <Folder className="w-6 h-6 text-primary" />
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                                <DropdownMenuItem onClick={() => router.push(`/dashboard/collections/${collection.id}`)}>
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Edit Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => window.open(`/collection/${collection.slug}`, '_blank')}>
                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                    View Public Page
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20" onClick={() => deleteCollection(collection.id)}>
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardTitle className="text-xl font-bold line-clamp-1 group-hover:text-primary transition-colors">
                                        <Link href={`/dashboard/collections/${collection.id}`} className="hover:underline decoration-2 underline-offset-4 decoration-primary/30">
                                            {collection.name}
                                        </Link>
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 min-h-[40px]">
                                        {collection.description || "No description provided."}
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter className="pt-0 flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded-full">
                                        {collection.is_public ? (
                                            <>
                                                <Globe className="w-3 h-3 text-blue-500" />
                                                <span className="font-medium text-blue-500">Public</span>
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="w-3 h-3" />
                                                <span>Private</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="font-medium">
                                        {format(new Date(collection.created_at), "MMM d, yyyy")}
                                    </div>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
