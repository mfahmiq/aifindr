"use client"

import { HeroSection } from "@/components/hero-section"
import { ToolCard } from "@/components/tool-card"
import { FilterSidebar, defaultFilters } from "@/components/filter-sidebar"
import { NewsletterSection } from "@/components/newsletter-section"
import { TopBannerAd, SidebarAd, InlineToolAd, FooterCtaAd, SponsorToolBanner } from "@/components/ad-sections"
import { ToolWithRelations } from "@/lib/types" // Updated import
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { TrendingUp, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [filters, setFilters] = useState(defaultFilters)
  const [tools, setTools] = useState<ToolWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [inlineAds, setInlineAds] = useState<any[]>([])

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

  // Fetch tools when filters change
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

        if (filters.sortBy) params.append('sortBy', filters.sortBy)

        const res = await fetch(`/api/tools?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch')

        const data = await res.json()
        setTools(data.tools || [])
      } catch (error) {
        console.error("Error fetching tools:", error)
        setTools([])
      } finally {
        setLoading(false)
      }
    }

    // Debounce search slightly
    const timer = setTimeout(fetchTools, 300)
    return () => clearTimeout(timer)
  }, [filters])

  return (
    <div className="min-h-screen">
      <HeroSection />

      {/* Top Banner Ad */}
      <TopBannerAd />

      {/* Sponsor Tools Banner */}
      <SponsorToolBanner />

      <div className="container mx-auto px-4 py-12">
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
                  ({loading ? '...' : tools.length})
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
          </div>
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
