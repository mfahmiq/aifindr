import { createAdminClient } from '@/lib/supabase/admin'

export interface RateLimitResult {
    success: boolean
    limit: number
    remaining: number
    resetTime: Date
}

/**
 * AIFindr Supabase-Backed Rate Limiter
 * 
 * Uses a fixed-window strategy:
 * - Each IP gets `limit` requests per `windowMs` milliseconds
 * - State is stored centrally in Supabase `rate_limits` table
 * - Fail-safe: if DB is down, requests pass through (never crash the site)
 * 
 * @param ip        Client IP address
 * @param limit     Maximum requests allowed per window (default: 60)
 * @param windowMs  Window duration in milliseconds (default: 60000 = 1 minute)
 */
export async function checkRateLimit(
    ip: string,
    limit: number = 60,
    windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
    const supabase = createAdminClient()
    const now = new Date()

    try {
        // 1. Fetch existing record for this IP
        const { data, error } = await supabase
            .from('rate_limits')
            .select('*')
            .eq('ip', ip)
            .single()

        // PGRST116 = no rows found (first request from this IP)
        // PGRST205 = table not in schema cache (table doesn't exist yet)
        if (error) {
            if (error.code === 'PGRST205') {
                // Table doesn't exist yet — fail-safe: allow request to pass
                console.warn('[RateLimiter] rate_limits table not found. Run migration. Allowing request.')
                return { success: true, limit, remaining: limit, resetTime: now }
            }
            if (error.code !== 'PGRST116') {
                // Unexpected DB error — fail-safe: allow request to pass
                console.error('[RateLimiter] DB error, allowing request:', error.message)
                return { success: true, limit, remaining: limit, resetTime: now }
            }
        }

        // 2. No record exists — first request from this IP
        if (!data) {
            const resetTime = new Date(now.getTime() + windowMs)
            await supabase.from('rate_limits').insert({
                ip,
                request_count: 1,
                reset_time: resetTime.toISOString()
            })
            return { success: true, limit, remaining: limit - 1, resetTime }
        }

        const resetTime = new Date(data.reset_time)

        // 3. Window has expired — reset counter
        if (now > resetTime) {
            const newResetTime = new Date(now.getTime() + windowMs)
            await supabase
                .from('rate_limits')
                .update({
                    request_count: 1,
                    reset_time: newResetTime.toISOString()
                })
                .eq('ip', ip)

            return { success: true, limit, remaining: limit - 1, resetTime: newResetTime }
        }

        // 4. Rate limit exceeded — block request
        if (data.request_count >= limit) {
            return {
                success: false,
                limit,
                remaining: 0,
                resetTime
            }
        }

        // 5. Within limit — increment counter
        await supabase
            .from('rate_limits')
            .update({ request_count: data.request_count + 1 })
            .eq('ip', ip)

        return {
            success: true,
            limit,
            remaining: limit - data.request_count - 1,
            resetTime
        }

    } catch (err: any) {
        // Fail-safe: never crash on rate limit errors
        console.error('[RateLimiter] Unexpected error, allowing request:', err.message)
        return { success: true, limit, remaining: limit, resetTime: now }
    }
}

/**
 * Gemini API Key Load Balancer
 * 
 * Parses a comma-separated list of API keys and randomly selects one.
 * This distributes Gemini API quota across multiple keys, avoiding 429 errors.
 * 
 * Usage in .env:
 *   GEMINI_API_KEY=key1,key2,key3
 * 
 * @param rawKeys   Comma-separated API key string (from env or database)
 * @returns         A single API key, randomly selected for load balancing
 */
export function getLoadBalancedGeminiKey(rawKeys: string | undefined): string {
    if (!rawKeys) return ''

    const keys = rawKeys
        .split(',')
        .map(k => k.trim())
        .filter(Boolean)

    if (keys.length === 0) return ''
    if (keys.length === 1) return keys[0]

    // Random selection for load balancing
    const randomIndex = Math.floor(Math.random() * keys.length)
    const selected = keys[randomIndex]
    
    console.log(`[GeminiLoadBalancer] Selected key ${randomIndex + 1} of ${keys.length} (first 8: ${selected.substring(0, 8)}...)`)
    return selected
}
