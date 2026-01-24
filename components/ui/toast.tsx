"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastProps = {
    id: string
    title?: React.ReactNode
    description?: React.ReactNode
    action?: React.ReactNode
    variant?: "default" | "destructive"
    onClose?: (id: string) => void
}

export const Toast = ({ id, title, description, action, variant = "default", onClose }: ToastProps) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={cn(
                "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
                variant === "destructive"
                    ? "destructive border-destructive bg-destructive text-destructive-foreground"
                    : "border bg-background text-foreground"
            )}
        >
            <div className="grid gap-1">
                {title && <div className="text-sm font-semibold">{title}</div>}
                {description && <div className="text-sm opacity-90">{description}</div>}
            </div>
            {action}
            <button
                onClick={() => onClose?.(id)}
                className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
            >
                <X className="h-4 w-4" />
            </button>
        </motion.div>
    )
}
