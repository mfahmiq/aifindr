
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, ShieldCheck } from "lucide-react"
import { toolClaimsService } from "@/lib/services/toolClaimsService"
import { createBrowserClient } from "@supabase/ssr"

interface ClaimToolDialogProps {
    toolId: string
    toolName: string
}

export function ClaimToolDialog({ toolId, toolName }: ClaimToolDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [method, setMethod] = useState("email")
    const [email, setEmail] = useState("")
    const [data, setData] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                alert("Authentication required. Please login to claim this tool.")
                return
            }

            await toolClaimsService.createClaim({
                tool_id: toolId,
                user_id: user.id,
                verification_method: method as any,
                verification_data: {
                    email,
                    additional_info: data
                }
            })

            alert("Claim submitted! Your claim has been submitted for review.")
            setOpen(false)
        } catch (error: any) {
            alert(error.message || "Failed to submit claim")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full mt-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5">
                    <ShieldCheck className="w-4 h-4 mr-2 text-primary" />
                    Claim this tool
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Claim Ownership: {toolName}</DialogTitle>
                    <DialogDescription>
                        Prove that you own this tool to gain access to analytics, ad management, and more.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Verification Method</Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="email">Business Email</SelectItem>
                                <SelectItem value="dns">DNS Record</SelectItem>
                                <SelectItem value="meta_tag">Meta Tag</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Business Email</Label>
                        <Input
                            type="email"
                            placeholder="name@tool-domain.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            We'll send a verification code to this email.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Additional Information</Label>
                        <Textarea
                            placeholder="Any other details to help us verify your ownership..."
                            value={data}
                            onChange={e => setData(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Submit Claim
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
