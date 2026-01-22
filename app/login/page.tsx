"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { Sparkles, ArrowLeft } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function LoginPage() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gray-50/50 dark:bg-black">
            <Card className="w-full max-w-[400px] shadow-xl border-none dark:bg-slate-950 dark:border dark:border-slate-800">
                <CardHeader className="text-center pt-8 pb-2">
                    <div className="mx-auto w-12 h-12 mb-4 flex items-center justify-center bg-white dark:bg-slate-900 rounded-full shadow-sm">
                        <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-medium text-slate-900 dark:text-white">Welcome back</h1>
                    <p className="text-base text-slate-600 dark:text-slate-400 mt-1">Sign in to IndoAI</p>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <Auth
                        supabaseClient={supabase}
                        appearance={{
                            theme: ThemeSupa,
                            variables: {
                                default: {
                                    colors: {
                                        brand: '#2563eb',
                                        brandAccent: '#1d4ed8',
                                    },
                                },
                            },
                            className: {
                                container: 'w-full',
                                button: 'w-full px-4 py-2 rounded-lg font-medium',
                                input: 'w-full px-4 py-2 rounded-lg border-slate-200 dark:border-slate-800',
                            }
                        }}
                        providers={['google']}
                        redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
                        onlyThirdPartyProviders={false}
                        view="sign_in"
                        theme="dark" // or "default" depending on system, but let's try to detect or force dark if parent is dark? Auth UI handles theme prop.
                    // Ideally we pass standard 'dark' or 'light' string. 
                    // For now we can force 'default' which usually adapts or 'dark' if the app is dark mode.
                    // Let's assume standard behavior first.
                    />
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
