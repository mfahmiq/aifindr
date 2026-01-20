'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    // Get user info to check role
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
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
                    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
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

        revalidatePath('/', 'layout')

        // Redirect based on role
        if (userProfile?.role === 'admin') {
            redirect('/admin')
        } else {
            redirect('/dashboard')
        }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name,
            }
        }
    })

    if (error) {
        return { error: error.message }
    }

    // Create user profile in users table
    if (data.user) {
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: data.user.id,
                email: data.user.email,
                name: name || data.user.email?.split('@')[0] || 'User',
                role: 'user'
            })

        if (insertError) {
            console.error('Error creating user profile:', insertError)
        }
    }

    revalidatePath('/', 'layout')

    // If email confirmation is enabled, we might want to redirect to a confirmation page
    // But for now, let's assume auto-confirm or redirect to login with message
    return { success: 'Check your email to verify your account.' }
}

export async function signout() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )

    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}
