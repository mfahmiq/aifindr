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
import { Loader2, ShieldCheck, Copy, Check, AlertCircle, RefreshCw } from "lucide-react"
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
    
    // Stable token for this claim session
    const [token] = useState(() => `aifindr-${Math.random().toString(36).substring(2, 12)}`)
    const [copied, setCopied] = useState(false)
    
    // Post-submission verification flow states
    const [createdClaim, setCreatedClaim] = useState<any | null>(null)
    const [verifying, setVerifying] = useState(false)
    const [verificationError, setVerificationError] = useState<string | null>(null)
    const [verificationSuccess, setVerificationSuccess] = useState<boolean>(false)

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setVerificationError(null)

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

            // Create the claim with token stored in verification_data
            const claim = await toolClaimsService.createClaim({
                tool_id: toolId,
                user_id: user.id,
                verification_method: method as any,
                verification_data: {
                    email,
                    token,
                    additional_info: data
                }
            })

            setCreatedClaim(claim)
            
            // If the user chose Email method, let's attempt auto-verification right away!
            if (method === "email") {
                await handleInstantVerify(claim.id)
            }
        } catch (error: any) {
            alert(error.message || "Failed to submit claim")
        } finally {
            setLoading(false)
        }
    }

    const handleInstantVerify = async (claimId: string) => {
        setVerifying(true)
        setVerificationError(null)
        try {
            const res = await fetch("/api/claims/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ claimId })
            })

            const result = await res.json()
            if (!res.ok) {
                throw new Error(result.error || "Verification failed")
            }

            setVerificationSuccess(true)
        } catch (err: any) {
            setVerificationError(err.message || "Failed to verify. Please try again.")
        } finally {
            setVerifying(false)
        }
    }

    const handleReset = () => {
        setCreatedClaim(null)
        setVerificationSuccess(false)
        setVerificationError(null)
        setEmail("")
        setData("")
    }

    const metaTagSnippet = `<meta name="aifindr-verification" content="${token}" />`
    const dnsRecordSnippet = `aifindr-verification=${token}`

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (!val) {
                // Reset states on close
                handleReset()
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full mt-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5">
                    <ShieldCheck className="w-4 h-4 mr-2 text-primary" />
                    Claim this tool
                </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[500px] border-zinc-800 bg-zinc-950 text-zinc-100">
                {/* 1. SUCCESS SCREEN */}
                {verificationSuccess ? (
                    <div className="flex flex-col items-center text-center py-6 space-y-4">
                        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-emerald-400">Ownership Verified!</DialogTitle>
                            <DialogDescription className="text-zinc-400 mt-2">
                                Congratulations! Your claim for <strong>{toolName}</strong> has been successfully verified.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="bg-emerald-950/20 border border-emerald-800/30 text-emerald-300 p-4 rounded-lg text-sm max-w-sm">
                            You are now the official owner of this tool. You can now access detailed analytics, manage promotions, and configure settings from your dashboard.
                        </div>
                        <DialogFooter className="w-full mt-4">
                            <Button 
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white" 
                                onClick={() => setOpen(false)}
                            >
                                Awesome, thank you!
                            </Button>
                        </DialogFooter>
                    </div>
                ) : createdClaim ? (
                    /* 2. PENDING INTERACTIVE VERIFICATION SCREEN */
                    <div className="space-y-4 py-2">
                        <DialogHeader>
                            <DialogTitle className="text-zinc-100">Verify Ownership: {toolName}</DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                Your claim has been registered. Complete the steps below to instantly approve and link this tool to your account.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Error Card */}
                        {verificationError && (
                            <div className="bg-red-950/30 border border-red-800/40 text-red-400 p-3 rounded-lg flex items-start gap-2.5 text-xs animate-shake">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold">Verification unsuccessful:</span> {verificationError}
                                </div>
                            </div>
                        )}

                        {/* Instructions panel based on method */}
                        {method === "meta_tag" && (
                            <div className="space-y-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">HTML Meta Tag Instructions</h4>
                                <p className="text-xs text-zinc-400">
                                    Copy and paste this code inside the <code className="text-primary bg-zinc-950 px-1 py-0.5 rounded">&lt;head&gt;</code> section of your site's homepage:
                                </p>
                                <div className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                                    <code className="text-xs font-mono text-zinc-300 break-all select-all flex-1">
                                        {metaTagSnippet}
                                    </code>
                                    <Button 
                                        type="button" 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                                        onClick={() => handleCopy(metaTagSnippet)}
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    </Button>
                                </div>
                                <p className="text-[10px] text-zinc-500">
                                    Make sure your site is publicly accessible and isn't blocked by a firewall or captcha.
                                </p>
                            </div>
                        )}

                        {method === "dns" && (
                            <div className="space-y-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">DNS TXT Record Instructions</h4>
                                <p className="text-xs text-zinc-400">
                                    Add a new <strong className="text-zinc-200">TXT</strong> record to your domain's DNS settings:
                                </p>
                                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                                    <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                                        <div className="text-[10px] text-zinc-500 uppercase font-sans">Type</div>
                                        <div className="text-zinc-300 mt-0.5 font-bold">TXT</div>
                                    </div>
                                    <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                                        <div className="text-[10px] text-zinc-500 uppercase font-sans">Host</div>
                                        <div className="text-zinc-300 mt-0.5">@ <span className="text-[10px] text-zinc-600">(or blank)</span></div>
                                    </div>
                                    <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800 flex items-center justify-between col-span-1">
                                        <div>
                                            <div className="text-[10px] text-zinc-500 uppercase font-sans">Value</div>
                                            <div className="text-zinc-300 mt-0.5 truncate max-w-[80px]">...{token.substring(10)}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                                    <code className="text-xs font-mono text-zinc-300 break-all select-all flex-1">
                                        {dnsRecordSnippet}
                                    </code>
                                    <Button 
                                        type="button" 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                                        onClick={() => handleCopy(dnsRecordSnippet)}
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    </Button>
                                </div>
                                <p className="text-[10px] text-zinc-500">
                                    DNS changes can take anything from a few minutes up to 24 hours to propagate globally.
                                </p>
                            </div>
                        )}

                        {method === "email" && (
                            <div className="space-y-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Business Email Match</h4>
                                <p className="text-xs text-zinc-400">
                                    We are attempting to automatically match your provided business email domain:
                                    <strong className="text-zinc-200 block mt-1">{email}</strong>
                                </p>
                                <p className="text-[10px] text-zinc-500">
                                    If your email domain doesn't match the tool's website hostname, verification will fail and you will need to try another method.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2.5 mt-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="flex-1 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                                onClick={() => setOpen(false)}
                            >
                                Verify Later
                            </Button>
                            <Button 
                                type="button" 
                                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-1.5"
                                disabled={verifying}
                                onClick={() => handleInstantVerify(createdClaim.id)}
                            >
                                {verifying ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Verify Instantly
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* 3. INITIAL CLAIM FORM */
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-zinc-100 text-lg font-semibold flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                                Claim Ownership: {toolName}
                            </DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                Prove that you own this tool to gain access to analytics, premium ad campaigns, and owner settings.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleSubmit} className="space-y-4 py-3">
                            <div className="space-y-1.5">
                                <Label className="text-zinc-300">Verification Method</Label>
                                <Select value={method} onValueChange={setMethod}>
                                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                        <SelectItem value="email">Business Email (Instant Auto-Match)</SelectItem>
                                        <SelectItem value="dns">DNS TXT Record (Instant Verification)</SelectItem>
                                        <SelectItem value="meta_tag">HTML Meta Tag (Instant Verification)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-zinc-300">Business Email</Label>
                                <Input
                                    type="email"
                                    placeholder="name@tool-domain.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="bg-zinc-900 border-zinc-800 text-zinc-100 focus-visible:ring-primary"
                                    required
                                />
                                <p className="text-[11px] text-zinc-500">
                                    Provide an email associated with this tool's domain.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-zinc-300">Additional Information (Optional)</Label>
                                <Textarea
                                    placeholder="Any other details to help us verify your ownership..."
                                    value={data}
                                    onChange={e => setData(e.target.value)}
                                    className="bg-zinc-900 border-zinc-800 text-zinc-100 focus-visible:ring-primary min-h-[70px] resize-none"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Proceed to Verification
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
