"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { StarRating } from "@/components/star-rating"
import { CheckCircle, XCircle, Flag, Search, MessageSquare, ThumbsUp, Eye, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { reviewsService } from "@/lib/services/reviewsService"

interface AdminReview {
    id: string
    rating: number
    comment: string
    created_at: string | null
    status: string | null
    helpful_count: number | null
    guest_name: string | null
    users: { name: string; avatar_url: string | null } | null
    tools: { name: string; slug: string } | null
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<AdminReview[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, flagged: 0, rejected: 0 })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [reviewsData, statsData] = await Promise.all([
                reviewsService.getAdminReviews(),
                reviewsService.getStats()
            ])
            setReviews(reviewsData as AdminReview[])
            setStats(statsData)
        } catch (error) {
            console.error('Error fetching reviews:', error)
        } finally {
            setLoading(false)
        }
    }

    const pendingReviews = reviews.filter(r => r.status === 'pending')
    const approvedReviews = reviews.filter(r => r.status === 'approved')
    const flaggedReviews = reviews.filter(r => r.status === 'flagged')
    const rejectedReviews = reviews.filter(r => r.status === 'rejected')

    const updateStatus = async (reviewId: string, status: 'approved' | 'rejected' | 'flagged') => {
        try {
            await reviewsService.updateStatus(reviewId, status)
            setReviews(reviews.map(r => r.id === reviewId ? { ...r, status } : r))
            // Update stats
            setStats(await reviewsService.getStats())
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    const ReviewTable = ({ reviewList, showActions = true }: { reviewList: AdminReview[], showActions?: boolean }) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Tool</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead>Date</TableHead>
                    {showActions && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {reviewList.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                            No reviews found
                        </TableCell>
                    </TableRow>
                ) : (
                    reviewList.map(review => (
                        <TableRow key={review.id}>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                                        {(review.guest_name || review.users?.name || '?').charAt(0)}
                                    </div>
                                    <span className="font-medium">{review.guest_name || review.users?.name || 'Anonymous'}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{review.tools?.name || 'Unknown'}</Badge>
                            </TableCell>
                            <TableCell>
                                <StarRating rating={review.rating} size="sm" />
                            </TableCell>
                            <TableCell className="max-w-xs">
                                <p className="truncate text-sm">{review.comment}</p>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {review.created_at ? new Date(review.created_at).toLocaleDateString() : '-'}
                            </TableCell>
                            {showActions && (
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        {review.status === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-green-600"
                                                    onClick={() => updateStatus(review.id, 'approved')}
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600"
                                                    onClick={() => updateStatus(review.id, 'rejected')}
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                        {review.status === 'flagged' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-green-600"
                                                    onClick={() => updateStatus(review.id, 'approved')}
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600"
                                                    onClick={() => updateStatus(review.id, 'rejected')}
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                        {review.status === 'approved' && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => updateStatus(review.id, 'flagged')}
                                            >
                                                <Flag className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button size="sm" variant="ghost">
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            )}
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
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
                    <h1 className="text-2xl font-bold tracking-tight">Review Moderation</h1>
                    <p className="text-muted-foreground">Approve, reject, or flag user reviews</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <MessageSquare className="w-6 h-6 text-blue-500 mb-2" />
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <div className="text-sm text-muted-foreground">Total Reviews</div>
                    </CardContent>
                </Card>
                <Card className="border-orange-500/20 bg-orange-500/5">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
                        <div className="text-sm text-muted-foreground">Pending Review</div>
                    </CardContent>
                </Card>
                <Card className="border-red-500/20 bg-red-500/5">
                    <CardContent className="p-4">
                        <Flag className="w-6 h-6 text-red-500 mb-2" />
                        <div className="text-2xl font-bold text-red-500">{stats.flagged}</div>
                        <div className="text-sm text-muted-foreground">Flagged</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <ThumbsUp className="w-6 h-6 text-green-500 mb-2" />
                        <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
                        <div className="text-sm text-muted-foreground">Approved</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search reviews..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="pending" className="w-full">
                <TabsList>
                    <TabsTrigger value="pending" className="relative">
                        Pending
                        {stats.pending > 0 && (
                            <span className="ml-2 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                {stats.pending}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="flagged" className="relative">
                        Flagged
                        {stats.flagged > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                {stats.flagged}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <ReviewTable reviewList={pendingReviews} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="flagged" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <ReviewTable reviewList={flaggedReviews} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="approved" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <ReviewTable reviewList={approvedReviews} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rejected" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <ReviewTable reviewList={rejectedReviews} showActions={false} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
