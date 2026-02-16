"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, Globe, Lock } from "lucide-react"

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
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { collectionService } from "@/lib/services/collectionService"
import { toast } from "sonner"

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Collection name must be at least 2 characters.",
    }).max(50, {
        message: "Collection name cannot exceed 50 characters."
    }),
    description: z.string().max(200, {
        message: "Description cannot exceed 200 characters.",
    }).optional(),
    isPublic: z.boolean(),
})

interface CreateCollectionDialogProps {
    onSuccess?: () => void
    trigger?: React.ReactNode
}

export function CreateCollectionDialog({ onSuccess, trigger }: CreateCollectionDialogProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            isPublic: true,
        },
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            await collectionService.createCollection(values.name, values.description || "", values.isPublic)
            toast.success("Collection created successfully")
            setOpen(false)
            form.reset()
            onSuccess?.()
            router.refresh()
        } catch (error) {
            console.error("Failed to create collection:", error)
            toast.error("Failed to create collection")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Collection
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Collection</DialogTitle>
                    <DialogDescription>
                        Create a collection to organize your favorite AI tools.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Content Creation Tools" {...field} className="rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Briefly describe what this collection is for..."
                                            className="resize-none rounded-xl"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isPublic"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            {field.value ? <Globe className="w-4 h-4 text-blue-500" /> : <Lock className="w-4 h-4" />}
                                            <FormLabel className="text-base">
                                                {field.value ? "Public Collection" : "Private Collection"}
                                            </FormLabel>
                                        </div>
                                        <FormDescription>
                                            {field.value
                                                ? "Anyone with the link can view this collection."
                                                : "Only you can view this collection."}
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full rounded-xl font-bold">
                                {form.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Create Collection
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
