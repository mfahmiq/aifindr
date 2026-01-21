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
import { Sparkles, X } from "lucide-react"

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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4">
                            <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <DialogTitle className="text-2xl">Selamat Datang di IndoAI</DialogTitle>
                        <DialogDescription className="text-base">
                            {message || "Login untuk mengakses semua fitur"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Google Login Button - Primary */}
                        <Button
                            className="w-full h-12 text-base bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                            onClick={handleGoogleLogin}
                        >
                            <svg className="mr-3 h-5 w-5" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                            </svg>
                            Lanjutkan dengan Google
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Atau
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" asChild>
                                <a href="/login">Login dengan Email</a>
                            </Button>
                            <Button variant="outline" className="flex-1" asChild>
                                <a href="/register">Daftar Baru</a>
                            </Button>
                        </div>
                    </div>

                    <p className="text-center text-xs text-muted-foreground">
                        Dengan melanjutkan, Anda menyetujui{" "}
                        <a href="/terms" className="underline hover:text-primary">Syarat & Ketentuan</a>
                        {" "}dan{" "}
                        <a href="/privacy" className="underline hover:text-primary">Kebijakan Privasi</a>
                    </p>
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
