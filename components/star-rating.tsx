"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
    rating: number
    maxRating?: number
    size?: "sm" | "md" | "lg"
    showValue?: boolean
    interactive?: boolean
    onRatingChange?: (rating: number) => void
}

export function StarRating({
    rating,
    maxRating = 5,
    size = "md",
    showValue = false,
    interactive = false,
    onRatingChange
}: StarRatingProps) {
    const sizes = {
        sm: "w-3 h-3",
        md: "w-4 h-4",
        lg: "w-5 h-5"
    }

    return (
        <div className="flex items-center gap-1">
            {[...Array(maxRating)].map((_, i) => (
                <Star
                    key={i}
                    className={cn(
                        sizes[size],
                        i < Math.floor(rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : i < rating
                                ? "fill-yellow-400/50 text-yellow-400"
                                : "text-muted-foreground/30",
                        interactive && "cursor-pointer hover:scale-110 transition-transform"
                    )}
                    onClick={() => interactive && onRatingChange?.(i + 1)}
                />
            ))}
            {showValue && (
                <span className="text-sm text-muted-foreground ml-1">
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    )
}
