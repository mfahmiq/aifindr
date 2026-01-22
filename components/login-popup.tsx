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
import { Sparkles, X, UserPlus } from "lucide-react"

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
                <DialogContent className="sm:max-w-[400px] p-0 border-none shadow-2xl overflow-hidden gap-0">
                    <DialogHeader className="px-6 pt-8 pb-4 text-center">
                        <div className="mx-auto w-10 h-10 mb-3 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-8 h-8" aria-hidden="true">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        </div>
                        <DialogTitle className="text-xl font-medium text-slate-900">Sign in to IndoAI</DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 mt-1">
                            {message || "Choose an account to continue"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-4 pb-6 space-y-2">
                        {/* Google Item */}
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full text-left flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <Sparkles className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors truncate">Continue with Google</div>
                                <div className="text-xs text-slate-500 truncate">user@example.com</div>
                            </div>
                        </button>

                        <div className="h-px bg-slate-100 mx-4" />

                        {/* Other Account Item */}
                        <a
                            href="/login"
                            className="w-full text-left flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <UserPlus className="w-5 h-5 text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-slate-900">Use another account</div>
                            </div>
                        </a>
                    </div>

                    <div className="bg-slate-50 px-6 py-4 text-center">
                        <p className="text-xs text-slate-400">
                            By continuing, Google will share your name, email address, and profile picture with IndoAI.
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

    const handleDismiss = () => {
        setDismissed(true)
        setIsVisible(false)
    }

    if (!isVisible || user) return null

    return (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
            <div className="bg-background border-2 border-primary/20 shadow-xl rounded-xl p-4 max-w-xs">
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                >
                    <X className="w-4 h-4" />
                </button>
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium mb-2">Login cepat dengan Google</p>
                        <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-primary to-purple-500"
                            onClick={handleGoogleLogin}
                        >
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                            </svg>
                            Login
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
