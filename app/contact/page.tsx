"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageSquare, Send } from "lucide-react"
import { motion } from "framer-motion"

export default function ContactPage() {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // In a real app, this would send an email or save to a database
        alert("Thank you for your message! We will get back to you soon.")
    }

    return (
        <div className="container mx-auto px-4 py-20 max-w-2xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="border-2 shadow-xl bg-card">
                    <CardHeader className="text-center pb-8 border-b bg-muted/30">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                            <Mail className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="text-3xl font-extrabold tracking-tight">Contact Support & Sales</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Have questions or need help? Send us a message and we'll get back to you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8 bg-card">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" placeholder="John Doe" required className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="john@example.com" required className="h-11" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input id="subject" placeholder="General Inquiry" required className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Tell us what you're thinking..."
                                    className="min-h-[150px] resize-none"
                                    required
                                />
                            </div>
                            <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity">
                                <Send className="w-4 h-4 mr-2" />
                                Send Message
                            </Button>
                        </form>

                        <div className="mt-10 pt-8 border-t text-center space-y-4">
                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                Prefer direct email?
                                <a href="mailto:support@theaiselect.com" className="text-primary font-medium hover:underline">
                                    support@theaiselect.com
                                </a>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
