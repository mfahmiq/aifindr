import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    // Create a response that we'll modify with cookies
    let response = NextResponse.redirect(new URL(next, origin))

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // Handle email OTP verification
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })

        if (error) {
            console.error('OTP verification error:', error)
            response = NextResponse.redirect(new URL('/login?error=auth_code_error', origin))
        }

        return response
    }

    // Handle OAuth code exchange (Google, etc.)
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
            console.error('Code exchange error:', error)
            response = NextResponse.redirect(new URL('/login?error=auth_code_error', origin))
        }

        return response
    }

    // No token_hash or code provided
    return NextResponse.redirect(new URL('/login?error=missing_auth_params', origin))
}
