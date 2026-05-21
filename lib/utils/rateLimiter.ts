import { createAdminClient } from '@/lib/supabase/admin'

export interface RateLimitResult {
    success: boolean
    limit: number
    remaining: number
    resetTime: Date
}

// =============================================
// In-Memory Fallback Rate Limiter
// =============================================
// Used when Supabase rate_limits table doesn't exist yet.
// Works per serverless instance (not globally shared), but still
// provides meaningful protection against abuse.

interface InMemoryEntry {
    count: number
    resetTime: number // unix ms
}

const memoryStore = new Map<string, InMemoryEntry>()

// Cleanup stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanupMemoryStore() {
    const now = Date.now()
    if (now - lastCleanup < CLEANUP_INTERVAL) return
    lastCleanup = now
    for (const [ip, entry] of memoryStore.entries()) {
        if (now > entry.resetTime) {
            memoryStore.delete(ip)
        }
    }
}

function checkRateLimitInMemory(
    ip: string,
    limit: number,
    windowMs: number
): RateLimitResult {
    cleanupMemoryStore()
    const now = Date.now()

    const existing = memoryStore.get(ip)

    // First request or window expired
    if (!existing || now > existing.resetTime) {
        const resetTime = now + windowMs
        memoryStore.set(ip, { count: 1, resetTime })
        return {
            success: true,
            limit,
            remaining: limit - 1,
            resetTime: new Date(resetTime)
        }
    }

    // Rate limit exceeded
    if (existing.count >= limit) {
        return {
            success: false,
            limit,
            remaining: 0,
            resetTime: new Date(existing.resetTime)
        }
    }

    // Increment counter
    existing.count += 1
    return {
        success: true,
        limit,
        remaining: limit - existing.count,
        resetTime: new Date(existing.resetTime)
    }
}

// Track whether DB table exists (cached per instance lifetime)
let dbTableAvailable: boolean | null = null

/**
 * AIFindr Hybrid Rate Limiter
 * 
 * Strategy:
 *   1. Try Supabase `rate_limits` table (centralized, works across all serverless instances)
 *   2. If table doesn't exist → fall back to in-memory rate limiting (per-instance)
 *   3. If DB error → fail-safe: allow request through
 * 
 * The system is fully functional from the first deploy — no manual SQL setup required.
 * Once the rate_limits table is created in Supabase, it automatically upgrades to
 * centralized mode.
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
    const now = new Date()

    // If we already know the DB table doesn't exist, skip DB entirely
    if (dbTableAvailable === false) {
        return checkRateLimitInMemory(ip, limit, windowMs)
    }

    try {
        const supabase = createAdminClient()

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
                // Table doesn't exist — switch to in-memory mode permanently for this instance
                console.warn('[RateLimiter] rate_limits table not found. Using in-memory fallback.')
                dbTableAvailable = false
                return checkRateLimitInMemory(ip, limit, windowMs)
            }
            if (error.code !== 'PGRST116') {
                // Unexpected DB error — fail-safe: use in-memory
                console.error('[RateLimiter] DB error, using in-memory fallback:', error.message)
                return checkRateLimitInMemory(ip, limit, windowMs)
            }
        }

        // Mark DB as available
        dbTableAvailable = true

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
        // Fail-safe: fall back to in-memory on any unexpected error
        console.error('[RateLimiter] Unexpected error, using in-memory fallback:', err.message)
        return checkRateLimitInMemory(ip, limit, windowMs)
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
