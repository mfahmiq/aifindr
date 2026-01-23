"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Link2, Save, RotateCcw, CheckCircle, ExternalLink, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"
import { UTMConfig, DEFAULT_UTM_CONFIG, getUTMConfig, saveUTMConfig } from "@/lib/utm"

export default function AdminSettingsPage() {
    const [utmConfig, setUtmConfig] = useState<UTMConfig>(DEFAULT_UTM_CONFIG)
    const [saved, setSaved] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Load config from localStorage on mount
    useEffect(() => {
        setUtmConfig(getUTMConfig())
        setMounted(true)
    }, [])

    const handleSaveUTM = () => {
        saveUTMConfig(utmConfig)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleResetUTM = () => {
        setUtmConfig(DEFAULT_UTM_CONFIG)
        saveUTMConfig(DEFAULT_UTM_CONFIG)
    }

    // Generate preview URL
    const getPreviewUrl = () => {
        if (!utmConfig.enabled) return 'https://example.com'
        const params = []
        if (utmConfig.source) params.push(`utm_source=${utmConfig.source}`)
        if (utmConfig.medium) params.push(`utm_medium=${utmConfig.medium}`)
        if (utmConfig.campaign) params.push(`utm_campaign=${utmConfig.campaign}`)
        return `https://example.com${params.length ? '?' + params.join('&') : ''}`
    }

    return (
        <div className="flex flex-col gap-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your directory configuration</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Manage your directory details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="site-name">Site Name</Label>
                        <Input id="site-name" defaultValue="The AI Select" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="site-description">Site Description</Label>
                        <Input id="site-description" defaultValue="Curated directory of AI tools for Indonesian creators." />
                    </div>
                </CardContent>
            </Card>

            {/* UTM Configuration Card */}
            <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                                <Link2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    Auto-Append UTM
                                    <Badge variant="secondary" className="text-xs">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Tracking
                                    </Badge>
                                </CardTitle>
                                <CardDescription>
                                    Automatically add UTM parameters to all outgoing tool links
                                </CardDescription>
                            </div>
                        </div>
                        {mounted && (
                            <Switch
                                checked={utmConfig.enabled}
                                onCheckedChange={(enabled: boolean) => setUtmConfig({ ...utmConfig, enabled })}
                            />
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* UTM Parameters */}
                    <div className={`space-y-4 ${!utmConfig.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="utm-source" className="flex items-center gap-2">
                                    utm_source
                                    <Badge variant="outline" className="text-xs font-normal">Required</Badge>
                                </Label>
                                <Input
                                    id="utm-source"
                                    placeholder="e.g., theaiselect"
                                    value={utmConfig.source}
                                    onChange={(e) => setUtmConfig({ ...utmConfig, source: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">Identifies the source of traffic</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="utm-medium">utm_medium</Label>
                                <Input
                                    id="utm-medium"
                                    placeholder="e.g., directory"
                                    value={utmConfig.medium}
                                    onChange={(e) => setUtmConfig({ ...utmConfig, medium: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">Marketing medium or channel</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="utm-campaign">utm_campaign</Label>
                                <Input
                                    id="utm-campaign"
                                    placeholder="e.g., tool_listing"
                                    value={utmConfig.campaign}
                                    onChange={(e) => setUtmConfig({ ...utmConfig, campaign: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">Campaign name for tracking</p>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="p-4 rounded-xl bg-muted/50 border">
                            <Label className="text-xs text-muted-foreground mb-2 block">Preview URL</Label>
                            <div className="flex items-center gap-2">
                                <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                                <code className="text-sm break-all font-mono text-primary">
                                    {getPreviewUrl()}
                                </code>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                            <p className="text-sm text-muted-foreground">
                                <strong className="text-foreground">Note:</strong> UTM parameters will only be added if the destination URL doesn't already have them.
                                This respects any existing tracking parameters set by tool owners.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                        <Button onClick={handleSaveUTM} disabled={!utmConfig.enabled && !mounted}>
                            {saved ? (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                    Saved!
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save UTM Settings
                                </>
                            )}
                        </Button>
                        <Button variant="outline" onClick={handleResetUTM}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset to Default
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Features</CardTitle>
                    <CardDescription>Toggle optional features for your directory.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="allow-submissions" defaultChecked />
                        <Label htmlFor="allow-submissions">Allow user submissions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="enable-blog" />
                        <Label htmlFor="enable-blog">Enable Blog/News section</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="maintenance-mode" />
                        <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-2">
                <Button>Save Changes</Button>
                <Button variant="outline">Discard</Button>
            </div>
        </div>
    )
}
