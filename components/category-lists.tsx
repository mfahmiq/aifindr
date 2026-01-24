"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ToolWithRelations } from "@/lib/types"
import Image from "next/image"
import {
    Sparkles,
    Zap,
    MessageSquare,
    ExternalLink,
    ArrowRight,
    Trophy,
    Flame
} from "lucide-react"

interface ListProps {
    title: string
    icon: React.ElementType
    tools: ToolWithRelations[]
    loading: boolean
    color: string
    showRank?: boolean
    link: string
    totalCount: number
}

function ToolListCard({ title, icon: Icon, tools, loading, color, showRank, link, totalCount }: ListProps) {
    return (
        <Card className="h-full bg-white dark:bg-gray-900 shadow-md hover:shadow-lg transition-shadow border-0 rounded-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 pb-2 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100">{title}</h3>
                </div>
                {/* Colored Line */}
                <div className={`h-0.5 w-full bg-gradient-to-r ${title.includes('Latest') ? 'from-blue-400 to-purple-400' :
                    title.includes('Select') ? 'from-amber-400 to-orange-400' :
                        title.includes('Super') ? 'from-emerald-400 to-teal-400' :
                            'from-rose-400 to-pink-400'
                    } opacity-80`} />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 max-h-[400px] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                {loading ? (
                    <div className="space-y-3 p-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="flex items-center gap-3 p-2">
                                <div className="w-5 h-5 bg-gray-100 dark:bg-gray-800 rounded animate-pulse shrink-0" />
                                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse flex-1" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <ul className="space-y-1 p-2">
                        {tools.map((tool, idx) => (
                            <li key={tool.id} className="group">
                                <Link
                                    href={`/tool/${tool.slug}`}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    {/* Rank or Bullet */}
                                    {showRank ? (
                                        <span className="text-xs font-mono text-gray-400 w-5 text-right font-medium">
                                            {idx + 1}.
                                        </span>
                                    ) : (
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400/50 shrink-0 ml-1.5 mr-2" />
                                    )}

                                    {/* Logo (Small) */}
                                    <div className="w-5 h-5 rounded overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center border border-gray-100 dark:border-gray-800">
                                        {tool.logo_url ? (
                                            <Image
                                                src={tool.logo_url}
                                                alt={tool.name}
                                                width={20}
                                                height={20}
                                                className="w-full h-full object-contain"
                                                priority={idx < 3} // Priority for top 3 tools in each list
                                                unoptimized={true} // For external logos
                                            />
                                        ) : (
                                            <Zap className="w-3 h-3 text-gray-300" />
                                        )}
                                    </div>

                                    {/* Name */}
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate flex-1 group-hover:text-primary">
                                        {tool.name}
                                    </span>

                                    {/* External Link Icon */}
                                    <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Footer Button */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 mt-auto">
                <Link href={link} className="block">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-gray-500 hover:text-primary h-8">
                        See all category ({totalCount}) <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                </Link>
            </div>
        </Card>
    )
}

export function CategoryLists() {
    const [latest, setLatest] = useState<ToolWithRelations[]>([])
    const [selection, setSelection] = useState<ToolWithRelations[]>([])
    const [popular, setPopular] = useState<ToolWithRelations[]>([])
    const [chat, setChat] = useState<ToolWithRelations[]>([])
    const [counts, setCounts] = useState<{ [key: string]: number }>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all data in parallel for significant performance boost
                const [resLatest, resSelection, resPopular, resChat] = await Promise.all([
                    fetch('/api/tools?limit=10&sortBy=newest'),
                    fetch('/api/tools?limit=10&picks=true'),
                    fetch('/api/tools?limit=10&sortBy=popular'),
                    fetch('/api/tools?limit=10&category=Chat')
                ])

                const [dataLatest, dataSelection, dataPopular, dataChat] = await Promise.all([
                    resLatest.json(),
                    resSelection.json(),
                    resPopular.json(),
                    resChat.json()
                ])

                setLatest(dataLatest.tools || [])
                setSelection(dataSelection.tools || [])
                setPopular(dataPopular.tools || [])
                setChat(dataChat.tools || [])

                setCounts({
                    latest: dataLatest.count || 0,
                    selection: dataSelection.count || 0,
                    popular: dataPopular.count || 0,
                    chat: dataChat.count || 0
                })

            } catch (error) {
                console.error("Error fetching category lists", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    return (
        <div className="w-full py-12">
            {/* Section Header */}
            <div className="flex items-center justify-center gap-4 mb-10">
                <div className="h-px bg-gray-200 dark:bg-gray-800 w-24 md:w-64" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Some AI Categories
                </h2>
                <div className="h-px bg-gray-200 dark:bg-gray-800 w-24 md:w-64" />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 container mx-auto px-4">
                <ToolListCard
                    title="Latest AI"
                    icon={Sparkles}
                    tools={latest}
                    loading={loading}
                    color="text-blue-500"
                    link="/?sortBy=newest"
                    totalCount={counts.latest || 0}
                />
                <ToolListCard
                    title="The AI Select Picks"
                    icon={Trophy}
                    tools={selection}
                    loading={loading}
                    color="text-amber-500"
                    showRank
                    link="/?picks=true"
                    totalCount={counts.selection || 0}
                />
                <ToolListCard
                    title="SuperTools"
                    icon={Flame}
                    tools={popular}
                    loading={loading}
                    color="text-emerald-500"
                    showRank
                    link="/trending"
                    totalCount={counts.popular || 0}
                />
                <ToolListCard
                    title="AI Chat & Assistant"
                    icon={MessageSquare}
                    tools={chat}
                    loading={loading}
                    color="text-rose-500"
                    showRank
                    link="/?category=Chat"
                    totalCount={counts.chat || 0}
                />
            </div>
        </div>
    )
}
