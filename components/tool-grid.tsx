"use client"

import { Tool } from "@/lib/types"
import { ToolCard } from "./tool-card"

interface ToolGridProps {
    tools: Tool[]
}

export function ToolGrid({ tools }: ToolGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
            {tools.map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} index={index} />
            ))}
        </div>
    )
}
