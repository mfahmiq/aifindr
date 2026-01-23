import Link from 'next/link'

export function Footer() {
    return (
        <footer className="border-t bg-slate-50/50 dark:bg-slate-950/50 mt-auto">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Explore</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/" className="hover:text-primary transition-colors">All Tools</Link></li>
                            <li><Link href="/categories" className="hover:text-primary transition-colors">Categories</Link></li>
                            <li><Link href="/trending" className="hover:text-primary transition-colors">Trending</Link></li>
                            <li><Link href="/compare" className="hover:text-primary transition-colors">Compare</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Resources</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                            <li><Link href="/deals" className="hover:text-primary transition-colors">Deals</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Newsletter</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">For Creators</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/pricing" className="hover:text-primary transition-colors">Submit Tool</Link></li>
                            <li><Link href="/pricing" className="hover:text-primary transition-colors">Advertise</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Legal</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
                            <li><Link href="/terms" className="hover:text-primary transition-colors">Terms</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} The AI Select. All rights reserved.</p>
                    <p className="mt-2 text-xs opacity-70">The premier AI tool directory for finding the best artificial intelligence software.</p>
                </div>
            </div>
        </footer>
    )
}
