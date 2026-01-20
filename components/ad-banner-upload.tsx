"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Upload, Image as ImageIcon } from "lucide-react"
import { adsService } from "@/lib/services/adsService"

interface AdBannerUploadProps {
    onSuccess?: () => void
    trigger?: React.ReactNode
}

export function AdBannerUpload({ onSuccess, trigger }: AdBannerUploadProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        link_url: '',
        image_url: '',
        placement: 'sidebar',
        title: '',
        description: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await adsService.createAd({
                ...formData,
                is_active: true // Auto-activate for now, logic might change
            })
            setOpen(false)
            setFormData({
                name: '',
                link_url: '',
                image_url: '',
                placement: 'sidebar',
                title: '',
                description: ''
            })
            if (onSuccess) onSuccess()
            alert("Ad campaign created successfully!")
        } catch (error) {
            console.error("Error creating ad:", error)
            alert("Failed to create ad. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Create Ad</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Ad Campaign</DialogTitle>
                    <DialogDescription>
                        Set up a new ad banner to promote your services.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Campaign Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Summer Sale 2024"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="placement">Placement</Label>
                            <Select
                                value={formData.placement}
                                onValueChange={(val) => setFormData({ ...formData, placement: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select placement" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sidebar">Sidebar</SelectItem>
                                    <SelectItem value="banner">Top Banner</SelectItem>
                                    <SelectItem value="navbar">Navbar</SelectItem>
                                    <SelectItem value="inline">Inline (Feed)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="link_url">Target URL</Label>
                            <Input
                                id="link_url"
                                type="url"
                                placeholder="https://..."
                                value={formData.link_url}
                                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image_url">Banner Image URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="image_url"
                                type="url"
                                placeholder="https://..."
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                required
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Provide a direct link to your banner image. Recommended size: 300x250px for sidebar.
                        </p>
                    </div>

                    {(formData.placement === 'sidebar' || formData.placement === 'inline') && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="title">Ad Title (Optional)</Label>
                                <Input
                                    id="title"
                                    placeholder="Catchy headline"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Ad Description (Optional)</Label>
                                <Input
                                    id="description"
                                    placeholder="Short description text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    {formData.image_url && (
                        <div className="mt-4 border rounded-lg p-2 bg-muted/50 text-center">
                            <p className="text-xs text-muted-foreground mb-2">Preview</p>
                            <img
                                src={formData.image_url}
                                alt="Preview"
                                className="max-h-32 mx-auto rounded object-cover"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Campaign
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
