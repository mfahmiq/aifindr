"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { login } from "./actions"
import { useState } from "react"
import { Loader2, Sparkles, UserPlus, Mail, ArrowLeft } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showEmailForm, setShowEmailForm] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        setError(null)
        const result = await login(formData)
        if (result?.error) {
            setError(result.error)
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        })
        if (error) setError(error.message)
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gray-50/50 dark:bg-black">
            <Card className="w-full max-w-[400px] shadow-xl border-none dark:bg-slate-950 dark:border dark:border-slate-800">
                <CardHeader className="text-center pt-8 pb-4">
                    <div className="mx-auto w-12 h-12 mb-4 flex items-center justify-center bg-white dark:bg-slate-900 rounded-full shadow-sm">
                        <svg viewBox="0 0 24 24" className="w-10 h-10" aria-hidden="true">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-medium text-slate-900 dark:text-white">Sign in</h1>
                    <p className="text-base text-slate-600 dark:text-slate-400 mt-1">to continue to IndoAI</p>
                </CardHeader>
                <CardContent className="px-8 pb-10">
                    {!showEmailForm ? (
                        <div className="space-y-4">
                            {/* Account Selector Style Buttons */}
                            <button
                                onClick={handleGoogleLogin}
                                className="w-full text-left flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Sign in with Google</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Fast & Secure</div>
                                </div>
                            </button>

                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

                            <button
                                onClick={() => setShowEmailForm(true)}
                                className="w-full text-left flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all"
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                    <Mail className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-slate-900 dark:text-slate-100">Use Email</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Traditional login</div>
                                </div>
                            </button>

                            <Link
                                href="/register"
                                className="w-full text-left flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all"
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                    <UserPlus className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-slate-900 dark:text-slate-100">Create account</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Sign up for free</div>
                                </div>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-right-5 fade-in duration-200">
                            <button
                                onClick={() => setShowEmailForm(false)}
                                className="flex items-center text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-2"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back
                            </button>

                            <form action={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="dark:text-slate-200">Email</Label>
                                    <Input id="email" name="email" type="email" placeholder="name@example.com" required className="h-11 dark:bg-slate-900 dark:border-slate-800" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="dark:text-slate-200">Password</Label>
                                        <Link href="#" className="text-sm text-primary hover:underline">Forgot?</Link>
                                    </div>
                                    <Input id="password" name="password" type="password" required className="h-11 dark:bg-slate-900 dark:border-slate-800" />
                                </div>

                                {error && <div className="text-sm text-red-500">{error}</div>}

                                <div className="pt-2">
                                    <div className="flex gap-3 justify-end">
                                        <Button type="button" variant="ghost" onClick={() => setShowEmailForm(false)} className="dark:text-slate-200 dark:hover:bg-slate-800">
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="absolute bottom-6 flex gap-6 text-sm text-slate-500">
                <Link href="#" className="hover:text-slate-800">Help</Link>
                <Link href="#" className="hover:text-slate-800">Privacy</Link>
                <Link href="#" className="hover:text-slate-800">Terms</Link>
            </div>
        </div>
    )
}
