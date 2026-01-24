"use client"

import { ToolWithRelations } from "@/lib/types"
import { ToolCard } from "@/components/tool-card"
import { Trophy, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export function AISelectPicks() {
    const [picks, setPicks] = useState<ToolWithRelations[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPicks = async () => {
            try {
                // Fetch "picks" - prioritizing manually selected (is_priority) and then high rated/sponsors
                const res = await fetch('/api/tools?picks=true&limit=4')
                if (res.ok) {
                    const data = await res.json()
                    setPicks(data.tools || [])
                }
            } catch (error) {
                console.error("Failed to fetch picks:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchPicks()
    }, [])

    if (!loading && picks.length === 0) return null

    return (
        <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            The AI Select Picks
                            <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                        </h2>
                        <p className="text-muted-foreground text-sm">Hand-picked top performers and editor's favorites</p>
                    </div>
                </div>
                {/* <Link href="/categories">
                    <Button variant="ghost" className="gap-2">
                        View All
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </Link> */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="h-48 w-full rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                    ))
                ) : (
                    picks.map((tool, index) => (
                        // @ts-ignore
                        <ToolCard key={tool.id} tool={tool} index={index} compact={true} />
                    ))
                )}
            </div>
        </div>
    )
}
