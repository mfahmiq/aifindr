"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Sparkles } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

interface NewsletterSectionProps {
    source?: string
}

export function NewsletterSection({ source = 'homepage' }: NewsletterSectionProps) {
    const [email, setEmail] = useState("")
    const [subscribed, setSubscribed] = useState(false)

    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setLoading(true)
        try {
            const res = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, source })
            })

            if (res.ok) {
                setSubscribed(true)
            } else {
                const data = await res.json()
                alert(data.error || "Failed to subscribe")
            }
        } catch (error) {
            console.error("Newsletter error:", error)
            alert("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    if (subscribed) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-8 text-center"
            >
                <Sparkles className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">You are subscribed!</h3>
                <p className="text-muted-foreground">Welcome aboard! You will receive our weekly AI tools digest.</p>
            </motion.div>
        )
    }

    return (
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12">
            <div className="max-w-2xl mx-auto text-center">
                <Mail className="w-12 h-12 mx-auto text-primary mb-4" />
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                    Stay Updated with AI Tools
                </h2>
                <p className="text-muted-foreground mb-6">
                    Get weekly curated AI tools, exclusive deals, and insider tips delivered to your inbox.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1"
                        required
                    />
                    <Button type="submit" disabled={loading}>
                        {loading ? "..." : "Subscribe"}
                    </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-3">
                    Join 500+ AI enthusiasts. Unsubscribe anytime.
                </p>
            </div>
        </div>
    )
}
