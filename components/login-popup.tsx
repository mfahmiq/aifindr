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

                    <div className="px-6 pb-8 space-y-3">
                        {/* Google Login Button - Eye Catching */}
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full relative group flex items-center justify-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-0.5"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">Sign in with Google</span>
                        </button>

                        {/* Email Login Button - Simple */}
                        <a
                            href="/login"
                            className="w-full flex items-center justify-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium transition-colors text-sm"
                        >
                            <Mail className="w-4 h-4" />
                            <span>Continue with Email</span>
                        </a>

                        <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-4 px-4 leading-normal">
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
