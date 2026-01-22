"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { User } from "@supabase/supabase-js"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, X, UserPlus, Mail } from "lucide-react"
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

// Context for login popup
interface LoginPopupContextType {
    showLoginPopup: (options?: { message?: string; returnUrl?: string }) => void
    hideLoginPopup: () => void
    user: User | null
    isLoading: boolean
}

const LoginPopupContext = createContext<LoginPopupContextType | null>(null)

export const useLoginPopup = () => {
    const context = useContext(LoginPopupContext)
    if (!context) {
        throw new Error("useLoginPopup must be used within LoginPopupProvider")
    }
    return context
}

interface LoginPopupProviderProps {
    children: ReactNode
}

export function LoginPopupProvider({ children }: LoginPopupProviderProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [message, setMessage] = useState("")
    const [returnUrl, setReturnUrl] = useState("")
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasShownTimedPopup, setHasShownTimedPopup] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Check auth state
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setIsLoading(false)
        }
        checkAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                setIsOpen(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    // Timed popup - show after 1 minute on page, only if not logged in
    useEffect(() => {
        if (user || hasShownTimedPopup || isLoading) return

        const timer = setTimeout(() => {
            // Check if popup was shown in this session
            const alreadyShown = sessionStorage.getItem('loginPopupShown')
            if (!alreadyShown && !user) {
                setMessage("Daftar untuk bookmark tool favorit dan submit tool Anda!")
                setIsOpen(true)
                setHasShownTimedPopup(true)
                sessionStorage.setItem('loginPopupShown', 'true')
            }
        }, 60000) // 1 minute

        return () => clearTimeout(timer)
    }, [user, hasShownTimedPopup, isLoading])

    const showLoginPopup = (options?: { message?: string; returnUrl?: string }) => {
        setMessage(options?.message || "Login untuk melanjutkan")
        setReturnUrl(options?.returnUrl || window.location.href)
        setIsOpen(true)
    }

    const hideLoginPopup = () => {
        setIsOpen(false)
    }

    const handleGoogleLogin = async () => {
        const redirectUrl = returnUrl || window.location.href

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        })

        if (error) {
            console.error('Google login error:', error)
        }
    }

    return (
        <LoginPopupContext.Provider value={{ showLoginPopup, hideLoginPopup, user, isLoading }}>
            {children}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[380px] p-0 border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
                    <DialogHeader className="pt-10 pb-6 px-6 text-center select-none">
                        <div className="mx-auto w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Sparkles className="w-8 h-8 text-white fill-white/20" />
                        </div>
                        <DialogTitle className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
                            Unlock Full Access
                        </DialogTitle>
                        <DialogDescription className="text-base text-slate-500 dark:text-slate-400 mt-2 max-w-[280px] mx-auto leading-relaxed">
                            Sign in to bookmark tools, track trends, and access premium features.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 pb-8">
                        <Auth
                            supabaseClient={supabase}
                            appearance={{
                                theme: ThemeSupa,
                                variables: {
                                    default: {
                                        colors: {
                                            brand: '#2563eb', // Blue-600
                                            brandAccent: '#1d4ed8', // Blue-700
                                        },
                                    },
                                },
                                className: {
                                    container: 'w-full',
                                    button: 'w-full px-4 py-2 rounded-lg font-medium',
                                    input: 'w-full px-4 py-2 rounded-lg border-slate-200 dark:border-slate-800 !bg-white dark:!bg-slate-950 !text-slate-900 dark:!text-white placeholder:text-slate-400',
                                    label: 'text-slate-600 dark:text-slate-400 font-medium',
                                }
                            }}
                            providers={['google']}
                            redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
                            onlyThirdPartyProviders={false}
                            view="sign_in"
                            theme="default" // Defaulting to dark to match the popup style if needed, or let it inherit.
                        // The user has dark mode toggle, so typically we might want to pass dynamic theme.
                        // But for now, let's stick to 'default' or a strict one. 
                        // Given the popup has dark mode classes, let's try 'default' and hope it picks up system or we might need a prop.
                        // Actually, let's force strict colors via variables if needed, OR just pass 'dark' if we want it to look good in dark mode mostly.
                        // Let's use "default" which is usually light, but since the dialog is adaptive...
                        // Let's pass 'preferredTheme' if supported or just leave it. 
                        // 'theme' prop usually accepts 'default', 'dark', 'light'.
                        // Let's assume the user might be in either. simpler to just hardcode 'default' or 'dark' based on parent class? 
                        // Since I can't easily detect the parent class state here without context (theme provider), I'll set 'default'.
                        // Wait, NextThemes is in use? I can use useTheme().
                        // But to keep it simple and effective as requested ("original"), 'default' is safe.
                        />
                        <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-4 leading-normal">
                            By continuing, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </LoginPopupContext.Provider>
    )
}

// Compact login prompt for navbar (corner notification)
export function NavbarLoginPrompt() {
    const [isVisible, setIsVisible] = useState(false)
    const [user, setUser] = useState<User | null>(null)
    const [dismissed, setDismissed] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        checkAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    // Show prompt periodically (every 5 minutes) if not logged in
    useEffect(() => {
        if (user || dismissed) return

        // First show after 2 minutes
        const initialTimer = setTimeout(() => {
            const lastShown = localStorage.getItem('navbarLoginPromptTime')
            const now = Date.now()

            // Only show if more than 5 minutes since last shown
            if (!lastShown || now - parseInt(lastShown) > 5 * 60 * 1000) {
                setIsVisible(true)
                localStorage.setItem('navbarLoginPromptTime', now.toString())
            }
        }, 120000) // 2 minutes

        return () => clearTimeout(initialTimer)
    }, [user, dismissed])

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        })

        if (error) {
            console.error('Google login error:', error)
        }
    }

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation()
        setDismissed(true)
        setIsVisible(false)
    }

    if (!isVisible || user) return null

    // Simplified, Eye-Catching Navbar Prompt
    return (
        <div className="fixed top-[80px] right-4 z-[60] animate-in slide-in-from-right-10 fade-in duration-500">
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-[300px]">
                {/* Decorative Background Blur */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />

                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors z-10"
                >
                    <X className="w-3.5 h-3.5" />
                </button>

                <div className="p-5 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                        Unlock Full Access
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed px-2">
                        Join 10,000+ users exploring the best AI tools daily.
                    </p>

                    <div className="w-full grid grid-cols-2 gap-2">
                        <button
                            onClick={handleDismiss}
                            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Later
                        </button>
                        <button
                            onClick={handleGoogleLogin}
                            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity shadow-md"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
