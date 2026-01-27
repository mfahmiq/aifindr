"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Link2, Save, RotateCcw, CheckCircle, ExternalLink, Sparkles, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

import { settingsService } from "@/lib/services/settingsService"
import { toast } from "sonner"

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [utmSaved, setUtmSaved] = useState(false)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await settingsService.getSettings()
                setSettings(data)
            } catch (error) {
                console.error("Error fetching settings:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

    const handleSaveUTM = async () => {
        if (!settings) return
        setSaving(true)
        try {
            await settingsService.updateSettings({
                utm_config: settings.utm_config
            })
            setUtmSaved(true)
            setTimeout(() => setUtmSaved(false), 2000)
            toast.success("UTM settings saved")
        } catch (error) {
            toast.error("Failed to save UTM settings")
        } finally {
            setSaving(false)
        }
    }

    const handleSaveGeneral = async () => {
        if (!settings) return
        setSaving(true)
        try {
            await settingsService.updateSettings({
                site_name: settings.site_name,
                site_description: settings.site_description,
                feature_flags: settings.feature_flags
            })
            toast.success("Settings saved successfully")
        } catch (error) {
            toast.error("Failed to save settings")
        } finally {
            setSaving(false)
        }
    }

    const handleResetUTM = () => {
        setSettings({
            ...settings,
            utm_config: {
                enabled: true,
                source: 'theaiselect',
                medium: 'directory',
                campaign: 'tool_listing'
            }
        })
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>
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
                        <Input
                            id="site-name"
                            value={settings?.site_name || ''}
                            onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="site-description">Site Description</Label>
                        <Input
                            id="site-description"
                            value={settings?.site_description || ''}
                            onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                        />
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
                        <Switch
                            checked={settings?.utm_config?.enabled}
                            onCheckedChange={(enabled: boolean) => setSettings({
                                ...settings,
                                utm_config: { ...settings.utm_config, enabled }
                            })}
                        />
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* UTM Parameters */}
                    <div className={`space-y-4 ${!settings?.utm_config?.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="utm-source" className="flex items-center gap-2">
                                    utm_source
                                    <Badge variant="outline" className="text-xs font-normal">Required</Badge>
                                </Label>
                                <Input
                                    id="utm-source"
                                    placeholder="e.g., theaiselect"
                                    value={settings?.utm_config?.source || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        utm_config: { ...settings.utm_config, source: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="utm-medium">utm_medium</Label>
                                <Input
                                    id="utm-medium"
                                    placeholder="e.g., directory"
                                    value={settings?.utm_config?.medium || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        utm_config: { ...settings.utm_config, medium: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="utm-campaign">utm_campaign</Label>
                                <Input
                                    id="utm-campaign"
                                    placeholder="e.g., tool_listing"
                                    value={settings?.utm_config?.campaign || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        utm_config: { ...settings.utm_config, campaign: e.target.value }
                                    })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <Button onClick={handleSaveUTM} disabled={saving}>
                            {utmSaved ? (
                                <><CheckCircle className="w-4 h-4 mr-2 text-green-500" />Saved!</>
                            ) : (
                                <><Save className="w-4 h-4 mr-2" />Save UTM Settings</>
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
                        <Checkbox
                            id="allow-submissions"
                            checked={settings?.feature_flags?.allow_submissions}
                            onCheckedChange={(checked) => setSettings({
                                ...settings,
                                feature_flags: { ...settings.feature_flags, allow_submissions: !!checked }
                            })}
                        />
                        <Label htmlFor="allow-submissions">Allow user submissions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="enable-blog"
                            checked={settings?.feature_flags?.enable_blog}
                            onCheckedChange={(checked) => setSettings({
                                ...settings,
                                feature_flags: { ...settings.feature_flags, enable_blog: !!checked }
                            })}
                        />
                        <Label htmlFor="enable-blog">Enable Blog/News section</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="maintenance-mode"
                            checked={settings?.feature_flags?.maintenance_mode}
                            onCheckedChange={(checked) => setSettings({
                                ...settings,
                                feature_flags: { ...settings.feature_flags, maintenance_mode: !!checked }
                            })}
                        />
                        <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-2">
                <Button onClick={handleSaveGeneral} disabled={saving}>Save All Changes</Button>
            </div>
        </div>
    )
}
