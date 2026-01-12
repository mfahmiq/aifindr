"use client"

import Link from "next/link"
import {
    Bell,
    CircleUser,
    Home,
    LineChart,
    Menu,
    Package,
    Package2,
    Search,
    Users,
    Settings,
    BookOpen,
    Gift,
    MessageSquare,
    FolderOpen,
    Mail,
    DollarSign,
    Megaphone,
    Sparkles,
    Crown
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
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { ScrollArea } from "@/components/ui/scroll-area"

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: Home, badge: null },
    { href: '/admin/tools', label: 'Tools', icon: Package, badge: null },
    { href: '/admin/categories', label: 'Categories', icon: FolderOpen, badge: null },
    { href: '/admin/reviews', label: 'Reviews', icon: MessageSquare, badge: null },
    { href: '/admin/blog', label: 'Blog', icon: BookOpen, badge: null },
    { href: '/admin/deals', label: 'Deals', icon: Gift, badge: null },
    { href: '/admin/ads', label: 'Ads', icon: Megaphone, badge: null },
    { href: '/admin/subscriptions', label: 'Subscriptions', icon: Crown, badge: null },
    { href: '/admin/claims', label: 'Tool Claims', icon: DollarSign, badge: null },
    { href: '/admin/subscribers', label: 'Newsletter', icon: Mail, badge: null },
    { href: '/admin/users', label: 'Users', icon: Users, badge: null },
    { href: '/admin/analytics', label: 'Analytics', icon: LineChart, badge: null },
    { href: '/admin/pricing', label: 'Pricing', icon: Settings, badge: null },
    { href: '/admin/settings', label: 'Settings', icon: Settings, badge: null },
]

import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [pendingCount, setPendingCount] = useState(0)

    useEffect(() => {
        const fetchPendingCount = async () => {
            const supabase = createClient()
            const { count } = await supabase
                .from('tools')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending')

            if (count) setPendingCount(count)
        }
        fetchPendingCount()
    }, [])

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
            {/* Sidebar */}
            <div className="hidden border-r bg-gradient-to-b from-muted/60 via-muted/40 to-background md:block">
                <div className="flex h-full max-h-screen flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center border-b px-4 lg:px-6 bg-gradient-to-r from-primary/5 to-primary/10">
                        <Link href="/" className="flex items-center gap-2 font-bold">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent text-lg">
                                IndoAI Admin
                            </span>
                        </Link>
                        <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 relative">
                            <Bell className="h-4 w-4" />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 py-4">
                        <nav className="grid items-start px-3 text-sm font-medium">
                            {/* Main Section */}
                            <div className="text-xs font-semibold text-muted-foreground px-3 py-2 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Main
                            </div>
                            {navItems.slice(0, 2).map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10 group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    {item.label}
                                    {item.label === 'Tools' && pendingCount > 0 ? (
                                        <Badge className="ml-auto text-xs bg-red-500 hover:bg-red-600 text-white border-0">{pendingCount}</Badge>
                                    ) : item.badge && (
                                        <Badge variant="secondary" className="ml-auto text-xs">{item.badge}</Badge>
                                    )}
                                </Link>
                            ))}

                            {/* Content Section */}
                            <div className="text-xs font-semibold text-muted-foreground px-3 py-2 mt-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                Content
                            </div>
                            {navItems.slice(2, 8).map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10 group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    {item.label}
                                    {item.badge && (
                                        <Badge className="ml-auto text-xs bg-red-500 hover:bg-red-600">{item.badge}</Badge>
                                    )}
                                </Link>
                            ))}

                            {/* System Section */}
                            <div className="text-xs font-semibold text-muted-foreground px-3 py-2 mt-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                System
                            </div>
                            {navItems.slice(8).map(item => (
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
                    </ScrollArea>


                </div>
            </div >

            {/* Main Content */}
            < div className="flex flex-col" >
                {/* Header */}
                < header className="flex h-16 items-center gap-4 border-b bg-gradient-to-r from-background via-muted/30 to-background px-4 lg:px-6" >
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
                            <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                                <Link href="/" className="flex items-center gap-2 font-bold">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                                        <Sparkles className="h-4 w-4 text-white" />
                                    </div>
                                    <span>IndoAI Admin</span>
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
                                        {item.label === 'Tools' && pendingCount > 0 ? (
                                            <Badge className="ml-auto bg-red-500 hover:bg-red-600 text-white border-0">{pendingCount}</Badge>
                                        ) : item.badge && (
                                            <Badge className="ml-auto">{item.badge}</Badge>
                                        )}
                                    </Link>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>

                    <div className="w-full flex-1">
                        <form>
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search anything..."
                                    className="w-full pl-10 bg-muted/50 border-muted focus:bg-background transition-colors rounded-xl"
                                />
                            </div>
                        </form>
                    </div>

                    <ModeToggle />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-semibold">
                                    A
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <span>Admin User</span>
                                    <span className="text-xs font-normal text-muted-foreground">admin@indoai.com</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Settings</DropdownMenuItem>
                            <DropdownMenuItem>Support</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="text-red-500 focus:text-red-500">
                                <Link href="/">Logout</Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header >

                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-gradient-to-br from-background via-muted/10 to-background">
                    {children}
                </main>
            </div >
        </div >
    )
}
