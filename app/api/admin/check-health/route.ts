
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Timeout helper
const fetchWithTimeout = async (url: string, timeout = 8000) => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)

    try {
        // Try HEAD first
        const res = await fetch(encodeURI(url), {
            method: 'HEAD',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ToolHealthCheck/1.0' },
            signal: controller.signal
        })
        clearTimeout(id)
        if (res.ok) return true
        if (res.status === 405 || res.status === 403) throw new Error('Try GET')
        return res.status < 400
    } catch (e: any) {
        clearTimeout(id)
        if (e.message !== 'Try GET' && e.name !== 'AbortError') throw e

        // Try GET
        const controllerGet = new AbortController()
        const idGet = setTimeout(() => controllerGet.abort(), timeout)
        try {
            const res = await fetch(encodeURI(url), {
                method: 'GET',
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ToolHealthCheck/1.0' },
                signal: controllerGet.signal
            })
            clearTimeout(idGet)
            return res.ok
        } catch (err) {
            clearTimeout(idGet)
            return false
        }
    }
}

export async function POST(request: Request) {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userProfile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { toolIds, limit = 10 } = body

        let toolsToCheck: { id: string, website_url: string, name: string }[] = []

        if (toolIds && Array.isArray(toolIds) && toolIds.length > 0) {
            // Check specific tools
            const { data } = await supabase
                .from('tools')
                .select('id, website_url, name')
                .in('id', toolIds)
            // @ts-ignore
            toolsToCheck = data || []
        } else {
            // Check outdated tools (batch)
            // Prioritize tools that haven't been checked or were checked long ago
            const { data } = await supabase
                .from('tools')
                .select('id, website_url, name')
                .order('last_checked_at', { ascending: true, nullsFirst: true }) // Oldest first
                .limit(limit)
            // @ts-ignore
            toolsToCheck = data || []
        }

        if (toolsToCheck.length === 0) {
            return NextResponse.json({ message: 'No tools to check', processed: 0, dead: 0 })
        }

        let processed = 0
        let dead = 0
        const results: { id: string, name: string, is_active: boolean }[] = []

        // Process in parallel
        await Promise.all(toolsToCheck.map(async (tool) => {
            if (!tool.website_url) return

            const isActive = await fetchWithTimeout(tool.website_url)

            await supabase
                .from('tools')
                .update({
                    is_active: isActive,
                    last_checked_at: new Date().toISOString()
                })
                .eq('id', tool.id)

            processed++
            if (!isActive) dead++
            results.push({ id: tool.id, name: tool.name, is_active: isActive })
        }))

        return NextResponse.json({
            message: 'Health check complete',
            processed,
            dead,
            results
        })

    } catch (error) {
        console.error('Health check error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
