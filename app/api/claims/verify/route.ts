import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { activityLogsService } from '@/lib/services/activityLogsService'
import { socialPosterService } from '@/lib/services/social'
import dns from 'dns'

function getDomain(url: string): string {
    try {
        const parsed = new URL(url)
        let host = parsed.hostname.toLowerCase()
        if (host.startsWith('www.')) {
            host = host.substring(4)
        }
        return host
    } catch (e) {
        return ''
    }
}

export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate user
        const authSupabase = await createClient()
        const { data: { user }, error: authError } = await authSupabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // 2. Read claimId
        const body = await request.json()
        const { claimId } = body

        if (!claimId) {
            return NextResponse.json(
                { error: 'Claim ID is required' },
                { status: 400 }
            )
        }

        // 3. Fetch claim and tool details (use Admin client to bypass RLS restrictions during update)
        const supabaseAdmin = createAdminClient()
        const { data: claim, error: claimError } = await supabaseAdmin
            .from('tool_claims')
            .select(`
                *,
                tools (*)
            `)
            .eq('id', claimId)
            .single()

        if (claimError || !claim) {
            return NextResponse.json(
                { error: 'Claim not found' },
                { status: 404 }
            )
        }

        // Verify that the claim belongs to the logged-in user
        if (claim.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized to verify this claim' },
                { status: 403 }
            )
        }

        // Check if already approved
        if (claim.status === 'approved') {
            return NextResponse.json({
                success: true,
                message: 'This claim has already been successfully verified and approved.',
                claim
            })
        }

        const method = claim.verification_method
        const vData = claim.verification_data || {}
        const tool = claim.tools
        const toolUrl = tool?.website_url || ''
        const toolDomain = getDomain(toolUrl)

        if (!toolDomain) {
            return NextResponse.json(
                { error: 'Invalid tool website URL' },
                { status: 400 }
            )
        }

        let isVerified = false
        let verificationMessage = ''

        const userAgent = request.headers.get('user-agent') || ''
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''

        // 4. Run automated verification based on the selected method
        if (method === 'email') {
            // Email domain match
            const emailInput = vData.email || user.email || ''
            if (!emailInput.includes('@')) {
                return NextResponse.json(
                    { error: 'Valid business email is required for email verification' },
                    { status: 400 }
                )
            }

            const emailDomain = emailInput.split('@').pop()?.toLowerCase() || ''
            
            // Check if domain matches (either exact match or apex match)
            if (emailDomain === toolDomain || toolDomain.endsWith('.' + emailDomain)) {
                isVerified = true
                verificationMessage = `Email domain ${emailDomain} matches tool domain ${toolDomain}.`
            } else {
                return NextResponse.json(
                    { error: `Email domain (${emailDomain}) does not match the tool's domain (${toolDomain})` },
                    { status: 400 }
                )
            }

        } else if (method === 'dns') {
            const token = vData.token
            if (!token) {
                return NextResponse.json(
                    { error: 'Verification token not found in claim data. Please recreate the claim.' },
                    { status: 400 }
                )
            }

            // Perform DNS lookup
            try {
                const dnsPromises = dns.promises
                // Try full toolDomain first
                let records: string[][] = []
                try {
                    records = await dnsPromises.resolveTxt(toolDomain)
                } catch (dnsErr) {
                    // If full domain fails, try apex domain if it's different
                    const parts = toolDomain.split('.')
                    if (parts.length > 2) {
                        const apexDomain = parts.slice(-2).join('.')
                        records = await dnsPromises.resolveTxt(apexDomain)
                    } else {
                        throw dnsErr
                    }
                }

                // Check records
                isVerified = records.some(record => {
                    const joined = record.join('')
                    return joined.includes(token) || joined.includes(`aifindr-verification=${token}`)
                })

                if (!isVerified) {
                    return NextResponse.json(
                        { error: `DNS TXT record verification failed. Could not find token "${token}" in DNS records for ${toolDomain}` },
                        { status: 400 }
                    )
                }

                verificationMessage = `DNS TXT record containing token found for ${toolDomain}.`
            } catch (dnsError: any) {
                console.error('DNS Verification Error:', dnsError)
                return NextResponse.json(
                    { error: `DNS query failed: ${dnsError.message || 'Domain not resolvable'}. Please ensure your DNS TXT record has propagated.` },
                    { status: 400 }
                )
            }

        } else if (method === 'meta_tag') {
            const token = vData.token
            if (!token) {
                return NextResponse.json(
                    { error: 'Verification token not found in claim data. Please recreate the claim.' },
                    { status: 400 }
                )
            }

            try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 seconds timeout

                const response = await fetch(toolUrl, {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'AIFindr-Verification-Bot/1.0',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9'
                    }
                })

                clearTimeout(timeoutId)

                if (!response.ok) {
                    return NextResponse.json(
                        { error: `Failed to fetch website ${toolUrl}. HTTP Status: ${response.status}` },
                        { status: 400 }
                    )
                }

                const html = await response.text()
                
                // Case-insensitive regex matches: <meta name="aifindr-verification" content="[token/value]"> or reversed order
                const metaRegex = new RegExp(`<meta[^>]*name=["']aifindr-verification["'][^>]*content=["']([^"']*)["']`, 'i')
                const metaRegexAlt = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']aifindr-verification["']`, 'i')
                
                const match = html.match(metaRegex) || html.match(metaRegexAlt)

                if (match) {
                    const contentValue = match[1]
                    if (contentValue.includes(token)) {
                        isVerified = true
                        verificationMessage = `HTML Meta tag with verification token successfully verified on ${toolUrl}.`
                    }
                }

                if (!isVerified) {
                    return NextResponse.json(
                        { error: `Meta tag verification failed. Make sure <meta name="aifindr-verification" content="${token}" /> is added inside the <head> of your homepage.` },
                        { status: 400 }
                    )
                }

            } catch (fetchError: any) {
                console.error('Meta Tag Verification Error:', fetchError)
                return NextResponse.json(
                    { error: `Could not fetch website: ${fetchError.message || 'Connection timeout'}. Please ensure your website is accessible.` },
                    { status: 400 }
                )
            }
        } else {
            return NextResponse.json(
                { error: 'Automatic verification not supported for manual method' },
                { status: 400 }
            )
        }

        // 5. Successful Verification: Auto-approve claim and update tool owner
        if (isVerified) {
            // Update claim status to approved
            const { error: updateClaimError } = await supabaseAdmin
                .from('tool_claims')
                .update({
                    status: 'approved',
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: user.id, // Verified by the owner themselves via system validation
                    verification_data: {
                        ...vData,
                        auto_verified: true,
                        verified_at: new Date().toISOString(),
                        verification_details: verificationMessage
                    }
                })
                .eq('id', claimId)

            if (updateClaimError) throw updateClaimError

            // Set the tool owner and set is_verified to true
            const { error: updateToolError } = await supabaseAdmin
                .from('tools')
                .update({ 
                    owner_id: user.id,
                    is_verified: true 
                })
                .eq('id', claim.tool_id)

            if (updateToolError) throw updateToolError

            // Trigger social poster to announce verified status
            socialPosterService.postNewToolAlert(claim.tool_id, supabaseAdmin).catch(err => {
                console.error("Failed to auto-post verified claimed tool:", err)
            })

            // Create admin activity log
            await activityLogsService.log({
                user_id: user.id,
                action: 'claim.auto_approve',
                entity_type: 'claim',
                entity_id: claimId,
                old_values: { status: claim.status, is_verified: false },
                new_values: { status: 'approved', is_verified: true, verification_method: method },
                notes: `Auto-verified ownership of "${tool.name}" using method: ${method}. Details: ${verificationMessage}`,
                ip_address: ipAddress,
                user_agent: userAgent
            }, supabaseAdmin)

            return NextResponse.json({
                success: true,
                message: `Ownership successfully verified! You are now the official owner of "${tool.name}".`,
                verifiedMethod: method
            })
        }

        return NextResponse.json(
            { error: 'Verification failed' },
            { status: 400 }
        )

    } catch (error: any) {
        console.error('Verify claim endpoint error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
