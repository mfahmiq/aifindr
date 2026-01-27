/**
 * UTM Parameter Utility Functions
 * Handles automatic appending of UTM tracking parameters to URLs
 */

export interface UTMConfig {
    enabled: boolean
    source: string       // utm_source (e.g., 'indoai')
    medium: string       // utm_medium (e.g., 'directory')
    campaign: string     // utm_campaign (e.g., 'tool_listing')
}

// Default UTM configuration
export const DEFAULT_UTM_CONFIG: UTMConfig = {
    enabled: true,
    source: 'theaiselect',
    medium: 'directory',
    campaign: 'tool_listing'
}

// LocalStorage key for UTM settings
export const UTM_STORAGE_KEY = 'theaiselect_utm_config'

import { settingsService } from "./services/settingsService"

/**
 * Get UTM configuration from localStorage
 */
export function getUTMConfig(): UTMConfig {
    if (typeof window === 'undefined') return DEFAULT_UTM_CONFIG

    try {
        const stored = localStorage.getItem(UTM_STORAGE_KEY)
        if (stored) {
            return { ...DEFAULT_UTM_CONFIG, ...JSON.parse(stored) }
        }
    } catch (e) {
        console.error('Error reading UTM config:', e)
    }
    return DEFAULT_UTM_CONFIG
}

/**
 * Get UTM configuration from Database
 */
export async function getUTMConfigFromDB(): Promise<UTMConfig> {
    try {
        const settings = await settingsService.getSettings()
        if (settings && settings.utm_config) {
            return settings.utm_config as unknown as UTMConfig
        }
    } catch (e) {
        console.error('Error reading UTM config from DB:', e)
    }
    return getUTMConfig() // Fallback to localStorage if DB fails
}

/**
 * Save UTM configuration to localStorage
 */
export function saveUTMConfig(config: UTMConfig): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(config))
    } catch (e) {
        console.error('Error saving UTM config:', e)
    }
}

/**
 * Append UTM parameters to a URL
 * - Respects existing UTM parameters (doesn't overwrite)
 * - Handles URLs with or without existing query strings
 * 
 * @param url - The original URL
 * @param config - Optional UTM config (uses stored config if not provided)
 * @returns URL with UTM parameters appended
 */
export function appendUTMParams(url: string, config?: UTMConfig): string {
    const utmConfig = config || getUTMConfig()

    // If UTM is disabled, return original URL
    if (!utmConfig.enabled) return url

    try {
        const urlObj = new URL(url)

        // Only add UTM params if they don't already exist
        if (!urlObj.searchParams.has('utm_source') && utmConfig.source) {
            urlObj.searchParams.set('utm_source', utmConfig.source)
        }
        if (!urlObj.searchParams.has('utm_medium') && utmConfig.medium) {
            urlObj.searchParams.set('utm_medium', utmConfig.medium)
        }
        if (!urlObj.searchParams.has('utm_campaign') && utmConfig.campaign) {
            urlObj.searchParams.set('utm_campaign', utmConfig.campaign)
        }

        return urlObj.toString()
    } catch (e) {
        // If URL parsing fails, return original
        console.error('Error appending UTM params:', e)
        return url
    }
}

/**
 * Hook-friendly version that returns the URL with UTM appended
 * Use this in React components
 */
export function useUTMUrl(url: string): string {
    if (typeof window === 'undefined') return url
    return appendUTMParams(url)
}
