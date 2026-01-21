"use client"

import React, { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { TrendingUp, ArrowRight, Loader2, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"

import { HeroSection } from "@/components/hero-section"
import { ToolCard } from "@/components/tool-card"
import { FilterSidebar, defaultFilters } from "@/components/filter-sidebar"
import { NewsletterSection } from "@/components/newsletter-section"
import { TopBannerAd, SidebarAd, InlineToolAd, FooterCtaAd, SponsorToolBanner } from "@/components/ad-sections"
import { CategoryLists } from "@/components/category-lists"
import { Button } from "@/components/ui/button"
import { ToolWithRelations } from "@/lib/types"

const ITEMS_PER_PAGE = 12

import { FeaturedToolCard } from "@/components/featured-tool-card"

// ... imports

function HomeContent() {
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState(defaultFilters)
  const [tools, setTools] = useState<ToolWithRelations[]>([])
  const [featuredTools, setFeaturedTools] = useState<ToolWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [featuredLoading, setFeaturedLoading] = useState(true)
  const [inlineAds, setInlineAds] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // Sync URL params to filters state on load/change
  useEffect(() => {
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || 'All'
    const sortBy = searchParams.get('sortBy') || 'popular'
    const highlight = searchParams.get('highlight') === 'true'

    setFilters(prev => {
      // Only update if changed to avoid loop/render thrashing
      if (
        prev.search === search &&
        prev.category === category &&
        prev.sortBy === sortBy &&
        prev.highlight === highlight
      ) return prev

      return {
        ...prev,
        search,
        category,
        sortBy,
        highlight
      }
    })
  }, [searchParams])

  // Fetch featured tools (Spotlight)
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch('/api/tools?highlight=true&limit=2')
        if (res.ok) {
          const data = await res.json()
          setFeaturedTools(data.tools || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setFeaturedLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  // Fetch inline ads
  useEffect(() => {
    const fetchAds = async () => {
      const { adsService } = await import("@/lib/services/adsService")
      try {
        const ads = await adsService.getAdsForDisplay('inline')
        setInlineAds(ads)
      } catch (e) {
        console.error("Error fetching inline ads:", e)
      }
    }
    fetchAds()
  }, [])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  // Fetch tools when filters or page change
  useEffect(() => {
    const fetchTools = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (filters.search) params.append('search', filters.search)
        if (filters.category && filters.category !== 'All') params.append('category', filters.category)

        filters.pricing.forEach(p => params.append('pricing', p))
        filters.tags.forEach(t => params.append('tags', t))

        if (filters.features.hasFreeTrial) params.append('hasFreeTrial', 'true')
        if (filters.features.hasAPI) params.append('hasAPI', 'true')
        if (filters.features.isOpenSource) params.append('isOpenSource', 'true')
        if (filters.features.isVerified) params.append('isVerified', 'true')

        if (filters.highlight) params.append('highlight', 'true')

        if (filters.sortBy) params.append('sortBy', filters.sortBy)

        params.append('limit', ITEMS_PER_PAGE.toString())
        params.append('page', currentPage.toString())

        const res = await fetch(`/api/tools?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch')

        const data = await res.json()
        setTools(data.tools || [])
        setTotalCount(data.count || 0)
      } catch (error) {
        console.error("Error fetching tools:", error)
        setTools([])
        setTotalCount(0)
      } finally {
        setLoading(false)
      }
    }

    // Debounce search slightly
    const timer = setTimeout(fetchTools, 300)
    return () => clearTimeout(timer)
  }, [filters, currentPage])

  return (
    <div className="min-h-screen">
      <HeroSection />

      {/* Top Banner Ad */}
      <TopBannerAd />

      <SponsorToolBanner />

      <div className="container mx-auto px-4 py-12">
        {/* Editor's Choice / Spotlight Section - Psychological Anchor */}
        {!featuredLoading && featuredTools.length > 0 && filters.category === 'All' && !filters.search && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Editor's Choice</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredTools.map((tool, index) => (
                <div key={tool.id} className="h-[320px]">
                  {/* @ts-ignore */}
                  <FeaturedToolCard tool={tool} index={index} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block w-64 space-y-6">
            {/* Sidebar Ad - Above filter for maximum visibility */}
            <SidebarAd />
            <FilterSidebar filters={filters} onFilterChange={setFilters} />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {filters.category === 'All' ? 'All Tools' : filters.category}
                <span className="text-muted-foreground font-normal ml-2">
                  ({loading ? '...' : totalCount})
                </span>
              </h2>
              <Link href="/trending">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  View Trending
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-6">
              <FilterSidebar filters={filters} onFilterChange={setFilters} />
            </div>

            {/* Tools Grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : tools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {tools.map((tool, index) => (
                  <React.Fragment key={tool.id}>
                    {/* @ts-ignore */}
                    <ToolCard tool={tool} index={index} />

                    {/* Inject Ad after 3rd item (index 2) using first ad */}
                    {index === 2 && inlineAds.length > 0 && (
                      <div className="col-span-1">
                        <InlineToolAd adData={inlineAds[0]} />
                      </div>
                    )}

                    {/* Inject Ad after 9th item (index 8) using second ad */}
                    {index === 8 && inlineAds.length > 1 && (
                      <div className="col-span-1">
                        <InlineToolAd adData={inlineAds[1]} />
                      </div>
                    )}

                    {/* Inject Ad after 15th item (index 14) using third ad */}
                    {index === 14 && inlineAds.length > 2 && (
                      <div className="col-span-1">
                        <InlineToolAd adData={inlineAds[2]} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg mb-2">No tools match your filters</p>
                <Button variant="outline" onClick={() => setFilters(defaultFilters)}>
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <Button
                        variant={currentPage === 1 ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        className="w-9 h-9 p-0"
                      >
                        1
                      </Button>
                      {currentPage > 4 && <span className="px-2 text-muted-foreground">...</span>}
                    </>
                  )}

                  {/* Page numbers around current */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      if (totalPages <= 7) return true
                      return Math.abs(page - currentPage) <= 2
                    })
                    .map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-9 h-9 p-0"
                      >
                        {page}
                      </Button>
                    ))}

                  {/* Last page */}
                  {currentPage < totalPages - 2 && totalPages > 7 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="px-2 text-muted-foreground">...</span>}
                      <Button
                        variant={currentPage === totalPages ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-9 h-9 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Show current page info */}
            {!loading && totalCount > 0 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} tools
              </p>
            )}
          </div>
        </div>

        {/* Category Lists Section */}
        <div className="-mx-4 md:-mx-0 mt-8">
          <CategoryLists />
        </div>

        {/* Newsletter Section */}
        <div className="mt-20">
          <NewsletterSection />
        </div>

        {/* Footer CTA Ad - Last chance conversion */}
        <FooterCtaAd />
      </div>

      {/* Footer */}
      <footer className="border-t mt-8">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-4">Explore</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/" className="hover:text-foreground">All Tools</Link></li>
                <li><Link href="/categories" className="hover:text-foreground">Categories</Link></li>
                <li><Link href="/trending" className="hover:text-foreground">Trending</Link></li>
                <li><Link href="/compare" className="hover:text-foreground">Compare</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/deals" className="hover:text-foreground">Deals</Link></li>
                <li><a href="#" className="hover:text-foreground">Newsletter</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Creators</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/pricing" className="hover:text-foreground">Submit Tool</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground">Advertise</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2026 IndoAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
