/**
 * Color utility functions for extracting dominant colors and manipulating colors
 */

// Convert hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null
}

// Convert RGB to Hex
export function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16)
        return hex.length === 1 ? '0' + hex : hex
    }).join('')
}

// Adjust color brightness (positive = lighter, negative = darker)
export function adjustColor(hexColor: string, amount: number): string {
    const rgb = hexToRgb(hexColor)
    if (!rgb) return hexColor

    return rgbToHex(
        rgb.r + amount,
        rgb.g + amount,
        rgb.b + amount
    )
}

// Convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255
    g /= 255
    b /= 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6
                break
            case g:
                h = ((b - r) / d + 2) / 6
                break
            case b:
                h = ((r - g) / d + 4) / 6
                break
        }
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    }
}

// Convert HSL to RGB
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h /= 360
    s /= 100
    l /= 100

    let r, g, b

    if (s === 0) {
        r = g = b = l
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1 / 6) return p + (q - p) * 6 * t
            if (t < 1 / 2) return q
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
            return p
        }

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        r = hue2rgb(p, q, h + 1 / 3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1 / 3)
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    }
}

// Get a gradient pair from a single color
export function getGradientPair(hexColor: string): { from: string; to: string } {
    const rgb = hexToRgb(hexColor)
    if (!rgb) return { from: '#3b82f6', to: '#06b6d4' } // Default blue-cyan

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)

    // Create a secondary color that is more vibrant and premium
    // Logic: 
    // - If it's a cold color (Blue, Green, Purple), shift hue towards a warmer side slightly
    // - If it's a warm color (Red, Orange, Yellow), shift hue towards a cooler side slightly
    // - Increase saturation slightly for vibrancy
    // - Adjust lightness to create depth

    let hueShift = 20
    if (hsl.h > 180 && hsl.h < 300) { // Purposefully shift cold colors
        hueShift = 40
    }

    const secondaryHsl = {
        h: (hsl.h + hueShift) % 360,
        s: Math.min(hsl.s + 15, 100),
        l: hsl.l > 50 ? Math.max(hsl.l - 15, 30) : Math.min(hsl.l + 15, 70)
    }

    const secondaryRgb = hslToRgb(secondaryHsl.h, secondaryHsl.s, secondaryHsl.l)

    return {
        from: hexColor,
        to: rgbToHex(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b)
    }
}

/**
 * Extract dominant color from an image URL (client-side only)
 * Uses canvas to sample colors from the image
 */
// Extract dominant color from an image URL (client-side only)
// Uses canvas to sample colors from the image
export async function extractDominantColor(imageUrl: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
        // Only works in browser environment
        if (typeof window === 'undefined') {
            resolve(null)
            return
        }

        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    resolve(null)
                    return
                }

                // Sample at a smaller size for performance
                const sampleSize = 50
                canvas.width = sampleSize
                canvas.height = sampleSize
                ctx.drawImage(img, 0, 0, sampleSize, sampleSize)

                const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
                const data = imageData.data

                // Color bucket for counting
                const colorCounts: Record<string, number> = {}

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i]
                    const g = data[i + 1]
                    const b = data[i + 2]
                    const a = data[i + 3]

                    // Skip transparent pixels
                    if (a < 128) continue

                    // Skip very light (white) or very dark (black) colors
                    const brightness = (r + g + b) / 3
                    if (brightness > 240 || brightness < 15) continue

                    // Round to reduce color variations (bucket colors)
                    const bucketR = Math.round(r / 32) * 32
                    const bucketG = Math.round(g / 32) * 32
                    const bucketB = Math.round(b / 32) * 32

                    const key = `${bucketR},${bucketG},${bucketB}`
                    colorCounts[key] = (colorCounts[key] || 0) + 1
                }

                // Find the most common color
                let maxCount = 0
                let dominantColor: string | null = null

                for (const [key, count] of Object.entries(colorCounts)) {
                    if (count > maxCount) {
                        maxCount = count
                        const [r, g, b] = key.split(',').map(Number)
                        dominantColor = rgbToHex(r, g, b)
                    }
                }

                resolve(dominantColor)
            } catch (e) {
                resolve(null)
            }
        }

        img.onerror = () => {
            resolve(null)
        }

        img.src = imageUrl
    })
}

// Predefined color map for common tool categories (fallback)
export const categoryColorMap: Record<string, { color: string; gradient: string }> = {
    'Chat': { color: '#3b82f6', gradient: 'from-blue-500 to-cyan-500' },
    'Image': { color: '#a855f7', gradient: 'from-purple-500 to-pink-500' },
    'Video': { color: '#ec4899', gradient: 'from-pink-500 to-rose-500' },
    'Coding': { color: '#22c55e', gradient: 'from-green-500 to-emerald-500' },
    'Audio': { color: '#f97316', gradient: 'from-orange-500 to-amber-500' },
    'Writing': { color: '#06b6d4', gradient: 'from-cyan-500 to-teal-500' },
    'Voice': { color: '#ef4444', gradient: 'from-red-500 to-pink-500' },
    'Productivity': { color: '#f59e0b', gradient: 'from-yellow-500 to-orange-500' },
    'default': { color: '#6366f1', gradient: 'from-primary to-purple-500' },
}
