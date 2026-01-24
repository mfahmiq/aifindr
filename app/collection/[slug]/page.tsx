
import { createClient } from "@/lib/supabase/client"
import { notFound } from "next/navigation"
import { collectionService } from "@/lib/services/collectionService"
import { ToolCard } from "@/components/tool-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Share2 } from "lucide-react"
import { Metadata } from "next"

// Force dynamic rendering as these are user-generated and can change
export const dynamic = 'force-dynamic'

interface CollectionPageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
    const { slug } = await params
    const data = await collectionService.getCollectionBySlug(slug)

    if (!data) return { title: 'Collection Not Found' }

    return {
        title: `${data.name} - AI Tool Collection`,
        description: data.description || `A curated list of ${data.items.length} AI tools.`,
    }
}

export default async function CollectionPage({ params }: CollectionPageProps) {
    const { slug } = await params
    const collection = await collectionService.getCollectionBySlug(slug)

    if (!collection) {
        notFound()
    }

    // Determine Author Name (handle simplified relation response)
    // Supabase can return array or single object depending on relationship type
    // We cast to any here because types.ts relations can be tricky to infer perfectly without deeper generics
    const author = (collection as any).users
    const authorName = author?.name || "Anonymous"
    const authorAvatar = author?.avatar_url

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black/95">
            {/* Header / Hero */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="container mx-auto px-4 py-16 text-center max-w-4xl">
                    <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200">
                        COMMUNITY COLLECTION
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                        {collection.name}
                    </h1>
                    {collection.description && (
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                            {collection.description}
                        </p>
                    )}

                    <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8 border">
                                <AvatarImage src={authorAvatar} />
                                <AvatarFallback>{authorName[0]}</AvatarFallback>
                            </Avatar>
                            <span>Curated by <b className="text-gray-900 dark:text-gray-200">{authorName}</b></span>
                        </div>
                        <div className="hidden md:flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Updated {new Date(collection.updated_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items List */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid gap-8 max-w-5xl mx-auto">
                    {collection.items.map((item: any, index: number) => (
                        <div key={item.id} className="relative flex flex-col md:flex-row gap-6 bg-white dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                            {/* Rank Number */}
                            <div className="absolute -left-3 -top-3 w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-bold shadow-lg">
                                {index + 1}
                            </div>

                            {/* Tool Card Preview - Compact */}
                            <div className="w-full md:w-[320px] shrink-0">
                                <ToolCard tool={item.tools} />
                            </div>

                            {/* Note / Context */}
                            <div className="flex-1 flex flex-col">
                                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                                    Curator's Note
                                    <div className="h-px bg-gray-200 flex-1 ml-4" />
                                </h3>
                                {item.note ? (
                                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl p-4 text-gray-700 dark:text-gray-300 italic relative">
                                        <span className="text-4xl text-amber-200 absolute -top-2 -left-1 opacity-50">"</span>
                                        <p className="relative z-10 whitespace-pre-wrap">
                                            {/* Render Note with @mentions highlighting (simple implementation) */}
                                            {item.note.split(' ').map((word: string, i: number) =>
                                                word.startsWith('@') ? <span key={i} className="font-bold text-blue-600 dark:text-blue-400">{word} </span> : word + ' '
                                            )}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-gray-400 italic">No note provided for this tool.</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
