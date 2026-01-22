"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, TrendingUp, Gift, BarChart3, BookOpen, Sparkles, ExternalLink, Zap, User, Settings, LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { adsService, Ad } from "@/lib/services/adsService"
import { createBrowserClient } from "@supabase/ssr"
import { User as SupabaseUser } from "@supabase/supabase-js"

export default function Navbar() {
    const pathname = usePathname()

    // Hide navbar on admin routes (admin has its own layout)
    if (pathname?.startsWith('/admin')) {
        return null
    }
    const [navbarAd, setNavbarAd] = useState<Ad | null>(null)
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [userProfile, setUserProfile] = useState<{ name: string; avatar_url: string | null } | null>(null)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Check auth state
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (user) {
                // Fetch user profile
                const { data: profile } = await supabase
                    .from('users')
                    .select('name, avatar_url')
                    .eq('id', user.id)
                    .single()
                setUserProfile(profile)
            }
        }
        checkAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                supabase
                    .from('users')
                    .select('name, avatar_url')
                    .eq('id', session.user.id)
                    .single()
                    .then(({ data }) => setUserProfile(data))
            } else {
                setUserProfile(null)
            }
        })

        // Fetch navbar ad
        const fetchAd = async () => {
            try {
                const ad = await adsService.getActiveAdByPlacement('navbar')
                setNavbarAd(ad)
            } catch (error) {
                console.error('Error fetching navbar ad:', error)
            }
        }
        fetchAd()

        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    const getInitials = (name: string | undefined) => {
        if (!name) return 'U'
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    // Helper for mobile links to close menu
    const MobileLink = ({ href, children, icon: Icon, className }: any) => (
        <Link
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 text-lg font-medium transition-colors hover:bg-muted/50 rounded-xl ${className}`}
        >
            {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
            {children}
        </Link>
    )

    return (
        <div className="sticky top-0 z-50">
            {/* Navbar Ad Strip - Maximum visibility across all pages */}
            {navbarAd && (
                <a
                    href={navbarAd.link_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="block bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-white text-center py-1.5 text-xs sm:text-sm hover:opacity-90 transition-opacity group"
                    onClick={() => adsService.trackClick(navbarAd.id)}
                >
                    <div className="container mx-auto flex items-center justify-center gap-2 sm:gap-3">
                        <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[9px] sm:text-[10px] hidden xs:inline-flex">
                            Ad
                        </Badge>
                        <div className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="font-semibold">{navbarAd.title}</span>
                            <span className="opacity-80 hidden sm:inline">— {navbarAd.description}</span>
                        </div>
                        <span className="flex items-center gap-1 font-medium group-hover:underline">
                            Try Free
                            <ExternalLink className="w-3 h-3" />
                        </span>
                    </div>
                </a>
            )}

            {/* Main Navbar */}
            <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-14 items-center justify-between px-4">
                    {/* Logo & Mobile Menu Trigger */}
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu */}
                        <Sheet open={open} onOpenChange={setOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden -ml-2">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 z-[100]">
                                <ScrollArea className="h-[calc(100vh)] pt-12">
                                    <div className="flex flex-col py-4 px-2 space-y-1">
                                        <MobileLink href="/" icon={Sparkles}>Tools</MobileLink>
                                        <MobileLink href="/categories" icon={BookOpen}>Categories</MobileLink>
                                        <MobileLink href="/trending" icon={TrendingUp}>Trending</MobileLink>
                                        <MobileLink href="/compare" icon={BarChart3}>Compare</MobileLink>
                                        <MobileLink href="/deals" icon={Gift} className="text-red-500">Deals</MobileLink>
                                        <MobileLink href="/blog" icon={BookOpen}>Blog</MobileLink>
                                        <div className="h-px bg-border my-4" />
                                        <MobileLink href="/pricing" icon={Zap} className="text-primary">Submit Tool</MobileLink>
                                    </div>
                                </div>
                            </ScrollArea>
                        </SheetContent>
                    </Sheet>

                    <Link href="/" className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <span className="font-bold">IndoAI</span>
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                    <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        Tools
                    </Link>
                    <Link href="/categories" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        Categories
                    </Link>
                    <Link href="/trending" className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Trending
                    </Link>
                    <Link href="/compare" className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        Compare
                    </Link>
                    <Link href="/deals" className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-1 text-red-500">
                        <Gift className="w-3 h-3" />
                        Deals
                    </Link>
                    <Link href="/blog" className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        Blog
                    </Link>
                </nav>

                {/* Right Side */}
                <div className="flex items-center gap-2">
                    <Button variant="default" size="sm" asChild className="hidden sm:flex">
                        <Link href="/pricing">Submit Tool</Link>
                    </Button>

                    <ModeToggle />

                    {/* User Avatar / Login */}
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={userProfile?.avatar_url || user.user_metadata?.avatar_url} alt={userProfile?.name || 'User'} />
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                            {getInitials(userProfile?.name || user.user_metadata?.name || user.email)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{userProfile?.name || user.user_metadata?.name || 'User'}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/settings" className="flex items-center">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard" className="flex items-center">
                                        <User className="mr-2 h-4 w-4" />
                                        Dashboard
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/login">Login</Link>
                        </Button>
                    )}
                </div>
        </div>
            </nav >
        </div >
    )
}

