import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { checkRateLimit } from '@/lib/utils/rateLimiter'

// Routes to skip rate limiting (admin routes have their own auth protection)
const RATE_LIMIT_BYPASS_PATHS = [
    '/api/admin/',
    '/api/internal/',
]

// Rate limit configurations
const PUBLIC_API_LIMIT = 60   // 60 requests per minute per IP
const PUBLIC_API_WINDOW = 60 * 1000 // 1 minute

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Apply rate limits ONLY on public API endpoints
    const isApiRoute = pathname.startsWith('/api/')
    const isBypassPath = RATE_LIMIT_BYPASS_PATHS.some(p => pathname.startsWith(p))

    if (isApiRoute && !isBypassPath) {
        // Extract client IP from headers (Vercel provides x-forwarded-for)
        const forwarded = request.headers.get('x-forwarded-for')
        const ip = forwarded
            ? forwarded.split(',')[0].trim()
            : request.headers.get('x-real-ip') || '127.0.0.1'

        try {
            const limitResult = await checkRateLimit(ip, PUBLIC_API_LIMIT, PUBLIC_API_WINDOW)

            if (!limitResult.success) {
                const resetSeconds = Math.ceil(limitResult.resetTime.getTime() / 1000)

                return new NextResponse(
                    JSON.stringify({
                        error: 'Too Many Requests',
                        message: 'You have exceeded the rate limit. Please try again later.',
                        retry_after: Math.max(0, Math.ceil((limitResult.resetTime.getTime() - Date.now()) / 1000))
                    }),
                    {
                        status: 429,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-RateLimit-Limit': limitResult.limit.toString(),
                            'X-RateLimit-Remaining': '0',
                            'X-RateLimit-Reset': resetSeconds.toString(),
                            'Retry-After': Math.max(0, Math.ceil((limitResult.resetTime.getTime() - Date.now()) / 1000)).toString(),
                        }
                    }
                )
            }

            // Add rate limit info headers to successful responses
            const response = await updateSession(request)
            response.headers.set('X-RateLimit-Limit', limitResult.limit.toString())
            response.headers.set('X-RateLimit-Remaining', limitResult.remaining.toString())
            response.headers.set('X-RateLimit-Reset', Math.ceil(limitResult.resetTime.getTime() / 1000).toString())
            return response

        } catch (err) {
            // Fail-safe: if rate limiter throws, continue normally
            console.error('[Middleware] Rate limiter error, bypassing:', err)
        }
    }

    return await updateSession(request)
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
