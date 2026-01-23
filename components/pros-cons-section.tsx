"use client"

import { Check, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToolWithRelations } from "@/lib/types"

interface ProsConsSectionProps {
    pros?: string[]
    cons?: string[]
}

export function ProsConsSection({ pros = [], cons = [] }: ProsConsSectionProps) {
    if ((!pros || pros.length === 0) && (!cons || cons.length === 0)) {
        return null
    }

    return (
        <div className="grid md:grid-cols-2 gap-6 my-8">
            {/* Pros */}
            <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <div className="bg-emerald-100 dark:bg-emerald-900/50 p-1 rounded-full">
                            <Check className="w-4 h-4" />
                        </div>
                        Pros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300">{pro}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            {/* Cons */}
            <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/10">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-rose-700 dark:text-rose-400">
                        <div className="bg-rose-100 dark:bg-rose-900/50 p-1 rounded-full">
                            <X className="w-4 h-4" />
                        </div>
                        Cons
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm">
                                <X className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300">{con}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
