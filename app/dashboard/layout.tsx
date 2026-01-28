"use client"

import Link from "next/link"
import Image from "next/image"
import {
    Bell,
    Home,
    LineChart,
    Menu,
    Package,
    Settings,
    LogOut,
    Crown,
    Sparkles,
    ChevronRight,
    Folder
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navItems = [
    { href: '/dashboard', label: 'Overview', icon: Home },
    { href: '/dashboard/tools', label: 'My Tools', icon: Package },
    { href: '/dashboard/collections', label: 'Collections', icon: Folder },
    { href: '/dashboard/analytics', label: 'Analytics', icon: LineChart },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [userProfile, setUserProfile] = useState<{ name: string; avatar_url: string | null; email?: string } | null>(null)
    const [userPlan, setUserPlan] = useState<string>('free')

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('name, avatar_url')
                    .eq('id', user.id)
                    .single()

                setUserProfile({
                    name: profile?.name || user.user_metadata?.full_name || user.user_metadata?.name || 'User',
                    avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
                    email: user.email
                })

                // Get effective plan to check if we should show upgrade CTA
                try {
                    // Import dynamically or use the service if available globally/imported
                    // Assuming subscriptionService is imported in the file (I need to add import)
                    const { subscriptionService } = await import("@/lib/services/subscriptionService")
                    const plan = await subscriptionService.getEffectivePlan(user.id)
                    setUserPlan(plan)
                } catch (e) {
                    console.error("Failed to fetch plan", e)
                }
            }
        }
        fetchUser()
    }, [])

    const getInitials = (name: string | undefined) => {
        if (!name) return 'U'
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr]">
            {/* Sidebar */}
            <div className="hidden border-r bg-gradient-to-b from-muted/60 via-muted/40 to-background md:block">
                <div className="flex h-full max-h-screen flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center border-b px-4 lg:px-6 bg-gradient-to-r from-purple-500/5 to-pink-500/10">
                        <Link href="/" className="flex items-center gap-2 font-bold">
                            <div className="w-8 h-8 flex items-center justify-center">
                                <Image
                                    src="/logo.png"
                                    alt="The AI Select Logo"
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-contain drop-shadow-md"
                                />
                            </div>
                            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent text-lg">
                                My Dashboard
                            </span>
                        </Link>
                    </div>

                    <ScrollArea className="flex-1 py-4">
                        <nav className="grid items-start px-3 text-sm font-medium gap-1">
                            {navItems.map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10 group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Upgrade CTA - Only show if not on max plan (Sponsor) */}
                        {userPlan !== 'sponsor' && (
                            <div className="mx-3 mt-6 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                    <span className="font-semibold text-sm">Upgrade Plan</span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Get more visibility and features for your tools.
                                </p>
                                <Link href="/pricing">
                                    <Button size="sm" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                                        View Plans
                                        <ChevronRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col">
                {/* Header */}
                <header className="flex h-16 items-center gap-4 border-b bg-gradient-to-r from-background via-muted/30 to-background px-4 lg:px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0">
                            <div className="p-4 border-b bg-gradient-to-r from-purple-500/5 to-pink-500/10">
                                <Link href="/" className="flex items-center gap-2 font-bold">
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <Image
                                            src="/logo.png"
                                            alt="The AI Select Logo"
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-contain drop-shadow-md"
                                        />
                                    </div>
                                    <span>My Dashboard</span>
                                </Link>
                            </div>
                            <nav className="grid gap-1 text-sm font-medium p-4">
                                {navItems.map(item => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                            {/* Mobile Upgrade CTA - Also conditional */}
                            {userPlan !== 'sponsor' && (
                                <div className="mt-auto p-4 border-t">
                                    <Link href="/pricing">
                                        <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Upgrade Plan
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </SheetContent>
                    </Sheet>

                    <div className="flex-1">
                        <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            ← Back to The AI Select
                        </Link>
                    </div>

                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-4 w-4" />
                    </Button>

                    <ModeToggle />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={userProfile?.avatar_url || ''} alt={userProfile?.name || 'User'} />
                                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                        {getInitials(userProfile?.name || userProfile?.email)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <span>{userProfile?.name || 'My Account'}</span>
                                    <span className="text-xs font-normal text-muted-foreground">{userProfile?.email}</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/settings">Settings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/pricing">Upgrade Plan</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="text-red-500 focus:text-red-500">
                                <Link href="/">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-gradient-to-br from-background via-muted/10 to-background">
                    {children}
                </main>
            </div>
        </div>
    )
}
