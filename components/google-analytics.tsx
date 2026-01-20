"use client"

import Script from "next/script"

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export function GoogleAnalytics() {
    if (!GA_MEASUREMENT_ID) {
        return null
    }

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_MEASUREMENT_ID}', {
                        page_path: window.location.pathname,
                    });
                `}
            </Script>
        </>
    )
}

// Helper function to track custom events
export function trackEvent(action: string, category: string, label?: string, value?: number) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
        })
    }
}

// Pre-defined event tracking functions
export const gaEvents = {
    // Tool interactions
    visitWebsite: (toolName: string) => trackEvent('visit_website', 'Tool', toolName),
    favoriteAdd: (toolName: string) => trackEvent('favorite_add', 'Tool', toolName),
    favoriteRemove: (toolName: string) => trackEvent('favorite_remove', 'Tool', toolName),
    shareClick: (toolName: string, platform: string) => trackEvent('share', 'Tool', `${toolName}_${platform}`),

    // Search & Filter
    search: (query: string) => trackEvent('search', 'Search', query),
    filterApply: (filterType: string, value: string) => trackEvent('filter_apply', 'Filter', `${filterType}_${value}`),

    // Compare
    compareAdd: (toolName: string) => trackEvent('compare_add', 'Compare', toolName),
    compareRemove: (toolName: string) => trackEvent('compare_remove', 'Compare', toolName),

    // User actions
    submitTool: () => trackEvent('submit_tool', 'User'),
    claimTool: (toolName: string) => trackEvent('claim_tool', 'User', toolName),
    writeReview: (toolName: string) => trackEvent('write_review', 'User', toolName),

    // Newsletter
    newsletterSignup: () => trackEvent('newsletter_signup', 'Marketing'),
}
