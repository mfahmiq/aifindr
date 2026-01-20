"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Search, X, SlidersHorizontal } from "lucide-react"
import { useState, useEffect } from "react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { categoriesService } from "@/lib/services/categoriesService"
import { Category } from "@/lib/types"

// Popular tags - could be fetched from database in future
const popularTags = [
    'GPT-4', 'Claude', 'Image Generation', 'Voice', 'Productivity',
    'Writing', 'Video', 'Music', 'Code', 'Research'
]

interface FilterState {
    search: string
    category: string
    pricing: string[]
    tags: string[]
    sortBy: string
    features: {
        hasFreeTrial: boolean
        hasAPI: boolean
        isOpenSource: boolean
        isVerified: boolean
    }
    highlight: boolean
}

interface FilterSidebarProps {
    filters: FilterState
    onFilterChange: (filters: FilterState) => void
}

export function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const pricingOptions = ['Free', 'Freemium', 'Paid', 'Trial']

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoriesService.getCategories()
                setCategories(data)
            } catch (error) {
                console.error('Error fetching categories:', error)
            }
        }
        fetchCategories()
    }, [])

    const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        onFilterChange({ ...filters, [key]: value })
    }

    const togglePricing = (pricing: string) => {
        const newPricing = filters.pricing.includes(pricing)
            ? filters.pricing.filter(p => p !== pricing)
            : [...filters.pricing, pricing]
        updateFilter('pricing', newPricing)
    }

    const toggleTag = (tag: string) => {
        const newTags = filters.tags.includes(tag)
            ? filters.tags.filter(t => t !== tag)
            : [...filters.tags, tag]
        updateFilter('tags', newTags)
    }

    const clearFilters = () => {
        onFilterChange({
            search: '',
            category: 'All',
            pricing: [],
            tags: [],
            sortBy: 'popular',
            features: {
                hasFreeTrial: false,
                hasAPI: false,
                isOpenSource: false,
                isVerified: false,
            },
            highlight: false
        })
    }

    const activeFilterCount =
        filters.pricing.length +
        filters.tags.length +
        (filters.category !== 'All' ? 1 : 0) +
        Object.values(filters.features).filter(Boolean).length

    const FilterContent = () => (
        <div className="space-y-6">
            {/* Search */}
            <div>
                <Label className="text-sm font-medium mb-2 block">Search</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tools..."
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Category */}
            <div>
                <Label className="text-sm font-medium mb-2 block">Category</Label>
                <Select value={filters.category} onValueChange={(v) => updateFilter('category', v)}>
                    <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Categories</SelectItem>
                        {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Sort By */}
            <div>
                <Label className="text-sm font-medium mb-2 block">Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(v) => updateFilter('sortBy', v)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="popular">Most Popular</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="trending">Trending</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Pricing */}
            <div>
                <Label className="text-sm font-medium mb-3 block">Pricing</Label>
                <div className="space-y-2">
                    {pricingOptions.map(option => (
                        <div key={option} className="flex items-center space-x-2">
                            <Checkbox
                                id={`pricing-${option}`}
                                checked={filters.pricing.includes(option)}
                                onCheckedChange={() => togglePricing(option)}
                            />
                            <Label htmlFor={`pricing-${option}`} className="text-sm cursor-pointer">
                                {option}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Features */}
            <div>
                <Label className="text-sm font-medium mb-3 block">Features</Label>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="hasFreeTrial"
                            checked={filters.features.hasFreeTrial}
                            onCheckedChange={(checked) => updateFilter('features', { ...filters.features, hasFreeTrial: !!checked })}
                        />
                        <Label htmlFor="hasFreeTrial" className="text-sm cursor-pointer">Free Trial</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="hasAPI"
                            checked={filters.features.hasAPI}
                            onCheckedChange={(checked) => updateFilter('features', { ...filters.features, hasAPI: !!checked })}
                        />
                        <Label htmlFor="hasAPI" className="text-sm cursor-pointer">API Available</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isOpenSource"
                            checked={filters.features.isOpenSource}
                            onCheckedChange={(checked) => updateFilter('features', { ...filters.features, isOpenSource: !!checked })}
                        />
                        <Label htmlFor="isOpenSource" className="text-sm cursor-pointer">Open Source</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isVerified"
                            checked={filters.features.isVerified}
                            onCheckedChange={(checked) => updateFilter('features', { ...filters.features, isVerified: !!checked })}
                        />
                        <Label htmlFor="isVerified" className="text-sm cursor-pointer">Verified Only</Label>
                    </div>
                </div>
            </div>

            {/* Tags */}
            <div>
                <Label className="text-sm font-medium mb-3 block">Popular Tags</Label>
                <div className="flex flex-wrap gap-2">
                    {popularTags.map(tag => (
                        <Badge
                            key={tag}
                            variant={filters.tags.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleTag(tag)}
                        >
                            {tag}
                        </Badge>
                    ))}
                </div>
            </div>

            {activeFilterCount > 0 && (
                <Button variant="outline" className="w-full" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Clear All Filters ({activeFilterCount})
                </Button>
            )}
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-20 bg-card border rounded-lg p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                    </h3>
                    <FilterContent />
                </div>
            </div>

            {/* Mobile Filter Sheet */}
            <div className="lg:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <SlidersHorizontal className="w-4 h-4 mr-2" />
                            Filters
                            {activeFilterCount > 0 && (
                                <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>Filters</SheetTitle>
                            <SheetDescription>Refine your search</SheetDescription>
                        </SheetHeader>
                        <div className="mt-6">
                            <FilterContent />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    )
}

export const defaultFilters: FilterState = {
    search: '',
    category: 'All',
    pricing: [],
    tags: [],
    sortBy: 'popular',
    features: {
        hasFreeTrial: false,
        hasAPI: false,
        isOpenSource: false,
        isVerified: false,
    },
    highlight: false
}
