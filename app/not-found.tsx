import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
            <div className="space-y-6 max-w-md">
                <h1 className="text-9xl font-extrabold text-primary/20 select-none">404</h1>
                <div className="space-y-4 -mt-12 relative z-10">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">Page not found</h2>
                    <p className="text-muted-foreground text-lg">
                        Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
                    </p>
                </div>
                <div className="pt-4">
                    <Button asChild size="lg" className="rounded-full font-semibold shadow-lg hover:shadow-xl transition-all">
                        <Link href="/">
                            Back to Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
