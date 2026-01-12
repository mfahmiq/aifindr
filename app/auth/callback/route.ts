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
            return response
        }

        // Get user and check role for redirect
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            // Check if user exists in users table
            let { data: userProfile } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single()

            // If user doesn't exist in users table, create them with default 'user' role
            if (!userProfile) {
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert({
                        id: user.id,
                        email: user.email,
                        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                        avatar_url: user.user_metadata?.avatar_url || null,
                        role: 'user'
                    })
                    .select('role')
                    .single()

                if (insertError) {
                    console.error('Error creating user profile:', insertError)
                }
                userProfile = newUser
            }

            // Redirect based on role
            const redirectPath = userProfile?.role === 'admin' ? '/admin' : '/dashboard'
            response = NextResponse.redirect(new URL(redirectPath, origin))

            // Re-set cookies on the new response
            const cookieStore = request.cookies.getAll()
            cookieStore.forEach(cookie => {
                response.cookies.set(cookie.name, cookie.value)
            })
        }

        return response
    }

    // No token_hash or code provided
    return NextResponse.redirect(new URL('/login?error=missing_auth_params', origin))
}
