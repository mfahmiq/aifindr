"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { collectionService } from "@/lib/services/collectionService"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Check, Loader2, Bookmark, FolderPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { validateNoteContent } from "@/lib/utils/validation"

interface AddToCollectionModalProps {
    toolId: string
    toolName: string
    trigger?: React.ReactNode
}

export function AddToCollectionModal({ toolId, toolName, trigger }: AddToCollectionModalProps) {
    const [open, setOpen] = useState(false)
    const [collections, setCollections] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [createMode, setCreateMode] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const { toast } = useToast()

    // Form States
    const [newCollectionName, setNewCollectionName] = useState("")
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
    const [note, setNote] = useState("")
    const [noteError, setNoteError] = useState<string | null>(null)

    // Auth Check
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        if (open) {
            checkAuthAndFetch()
        }
    }, [open])

    const checkAuthAndFetch = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setIsAuthenticated(false)
            setLoading(false)
            return
        }

        setIsAuthenticated(true)
        try {
            const data = await collectionService.getUserCollections()
            setCollections(data || [])
            if (data && data.length > 0) {
                const firstCollection = data[0];
                if (firstCollection && typeof firstCollection.id === 'string') {
                    setSelectedCollectionId(firstCollection.id);
                } else {
                    setCreateMode(true);
                }
            } else {
                setCreateMode(true) // Force create mode if no collections exist
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const validateNote = (value: string) => {
        setNote(value)
        const validation = validateNoteContent(value)
        setNoteError(validation.isValid ? null : validation.error || "Invalid content")
    }

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim()) return

        setSubmitting(true)
        try {
            const newCollection = await collectionService.createCollection(newCollectionName)
            // Add to list and select it
            setCollections([newCollection, ...collections])
            setSelectedCollectionId(newCollection.id)
            setCreateMode(false)
            setNewCollectionName("")
            toast({
                title: "Collection Created",
                description: `"${newCollection.name}" is ready.`
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create collection.",
                variant: "destructive"
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleAddToCollection = async () => {
        if (!selectedCollectionId) return
        if (noteError) return

        setSubmitting(true)
        try {
            await collectionService.addToCollection(selectedCollectionId, toolId, note)
            toast({
                title: "Saved!",
                description: `${toolName} added to your collection.`
            })
            setOpen(false)
            setNote("")
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save tool. It might already be in this list.",
                variant: "destructive"
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Bookmark className="w-4 h-4" />
                        Save
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add to Collection</DialogTitle>
                    <DialogDescription>
                        Save <b>{toolName}</b> to one of your curated lists.
                    </DialogDescription>
                </DialogHeader>

                {!isAuthenticated ? (
                    <div className="py-6 text-center space-y-4">
                        <p className="text-gray-500">You need to be logged in to create playlists.</p>
                        <Button onClick={() => window.location.href = '/login'} className="w-full">
                            Log In / Sign Up
                        </Button>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid gap-4 py-2">
                        {/* Selector or Creator */}
                        {createMode ? (
                            <div className="space-y-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                                <Label htmlFor="name">New Collection Name</Label>
                                <Input
                                    id="name"
                                    value={newCollectionName}
                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                    placeholder="e.g., Best SEO Tools for 2024"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setCreateMode(false)} disabled={collections.length === 0}>
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={handleCreateCollection} disabled={!newCollectionName || submitting}>
                                        {submitting && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                                        Create
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Select Collection</Label>
                                <div className="flex gap-2">
                                    <select
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedCollectionId || ""}
                                        onChange={(e) => setSelectedCollectionId(e.target.value)}
                                    >
                                        {collections.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <Button variant="outline" size="icon" onClick={() => setCreateMode(true)} title="Create New">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Note Input */}
                        <div className="space-y-2 mt-2">
                            <Label htmlFor="note"> Note <span className="text-xs text-gray-400 font-normal">(Optional)</span></Label>
                            <Textarea
                                id="note"
                                value={note}
                                onChange={(e) => validateNote(e.target.value)}
                                placeholder="Why do you use this tool? (No links allowed, use @ToolName)"
                                className={noteError ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {noteError ? (
                                <p className="text-xs text-red-500 font-medium animate-in slide-in-from-top-1">{noteError}</p>
                            ) : (
                                <p className="text-xs text-gray-400 text-right">{note.length}/280</p>
                            )}
                        </div>

                        <Button onClick={handleAddToCollection} className="w-full mt-2" disabled={submitting || !!noteError || !selectedCollectionId}>
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                                </>
                            ) : (
                                "Add to Collection"
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
