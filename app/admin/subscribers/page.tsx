"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Mail, Download, Search, UserPlus, Calendar, TrendingUp, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { subscribersService } from "@/lib/services/subscribersService"
import { NewsletterSubscriber } from "@/lib/types"

export default function AdminSubscribersPage() {
    const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ total: 0, active: 0, unsubscribed: 0, thisWeek: 0 })
    const [sourceStats, setSourceStats] = useState<Record<string, number>>({})

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [subs, statsData, sourceData] = await Promise.all([
                    subscribersService.getSubscribers({ status: 'all' }),
                    subscribersService.getStats(),
                    subscribersService.getBySource()
                ])
                setSubscribers(subs)
                setStats(statsData)
                setSourceStats(sourceData)
            } catch (error) {
                console.error('Error fetching subscribers:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleExport = async () => {
        try {
            const csv = await subscribersService.exportCSV()
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'subscribers.csv'
            a.click()
        } catch (error) {
            console.error('Error exporting:', error)
        }
    }

    const filteredSubscribers = subscribers.filter(s =>
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Newsletter Subscribers</h1>
                    <p className="text-muted-foreground">Manage your email subscriber list</p>
                </div>
                <Button onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <Mail className="w-6 h-6 text-primary mb-2" />
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <div className="text-sm text-muted-foreground">Total Subscribers</div>
                    </CardContent>
                </Card>
                <Card className="border-green-500/20 bg-green-500/5">
                    <CardContent className="p-4">
                        <UserPlus className="w-6 h-6 text-green-500 mb-2" />
                        <div className="text-2xl font-bold text-green-500">{stats.active}</div>
                        <div className="text-sm text-muted-foreground">Active</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <TrendingUp className="w-6 h-6 text-blue-500 mb-2" />
                        <div className="text-2xl font-bold">+{stats.thisWeek}</div>
                        <div className="text-sm text-muted-foreground">This Week</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-red-500">{stats.unsubscribed}</div>
                        <div className="text-sm text-muted-foreground">Unsubscribed</div>
                    </CardContent>
                </Card>
            </div>

            {/* Source Breakdown */}
            {Object.keys(sourceStats).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Subscription Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            {Object.entries(sourceStats).map(([source, count]) => (
                                <div key={source} className="flex items-center gap-2">
                                    <Badge variant="outline">{source}</Badge>
                                    <span className="font-medium">{count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by email..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Subscribers Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Subscribed</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSubscribers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        {searchQuery ? 'No subscribers found matching your search' : 'No subscribers yet'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSubscribers.map(subscriber => (
                                    <TableRow key={subscriber.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-medium">{subscriber.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Calendar className="w-3 h-3" />
                                                {subscriber.subscribed_at ? new Date(subscriber.subscribed_at).toLocaleDateString() : '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{subscriber.source || 'Unknown'}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {subscriber.is_active ? (
                                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary">Unsubscribed</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
