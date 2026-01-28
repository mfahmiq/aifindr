import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Megaphone } from "lucide-react"
import Link from "next/link"

export function SubmitToolFiller() {
    return (
        <Card className="h-full flex flex-col items-center justify-center p-6 text-center border-dashed border-2 border-muted hover:border-primary/50 hover:bg-muted/30 transition-all group cursor-pointer bg-transparent shadow-none">
            <div className="w-16 h-16 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
                <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="font-bold text-lg mb-2">Have a Tool?</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-[200px]">
                Submit your AI tool to our directory and reach more users.
            </p>
            <Link href="/submit" className="w-full">
                <Button variant="outline" className="w-full">
                    Submit Tool
                </Button>
            </Link>
        </Card>
    )
}

export function AdvertiseFiller() {
    return (
        <Card className="h-full flex flex-col items-center justify-center p-6 text-center border-dashed border-2 border-muted hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group cursor-pointer bg-transparent shadow-none">
            <div className="w-16 h-16 rounded-full bg-muted group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 flex items-center justify-center mb-4 transition-colors">
                <Megaphone className="w-8 h-8 text-muted-foreground group-hover:text-blue-500 transition-colors" />
            </div>
            <h3 className="font-bold text-lg mb-2">Advertise Here</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-[200px]">
                Promote your tool to thousands of daily active users.
            </p>
            <Link href="/pricing" className="w-full">
                <Button variant="outline" className="w-full">
                    View Pricing
                </Button>
            </Link>
        </Card>
    )
}
