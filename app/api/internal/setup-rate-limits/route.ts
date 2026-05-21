import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * TEMPORARY SETUP ENDPOINT — Run once to create rate_limits table.
 * Protected by CRON_SECRET. Delete this file after migration succeeds.
 * 
 * Call: POST /api/internal/setup-rate-limits
 * Header: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: Request) {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    try {
        // Step 1: Try to insert a test record to see if table exists
        const { error: checkError } = await supabase
            .from('rate_limits')
            .select('ip')
            .limit(1)

        if (!checkError) {
            return NextResponse.json({
                success: true,
                message: 'Table rate_limits already exists. No migration needed.',
                status: 'already_exists'
            })
        }

        // Step 2: Table doesn't exist — use pg_meta or direct RPC
        // Try using supabase's internal pg function if available
        const { error: rpcError } = await supabase.rpc('exec_sql', {
            sql_string: `
                create table if not exists rate_limits (
                    ip text primary key,
                    request_count integer not null default 0,
                    reset_time timestamp with time zone not null,
                    created_at timestamp with time zone default timezone('utc'::text, now()) not null
                );
                alter table rate_limits enable row level security;
            `
        })

        if (!rpcError) {
            return NextResponse.json({
                success: true,
                message: 'Table rate_limits created via exec_sql RPC',
                status: 'created'
            })
        }

        // Step 3: Return the SQL with clear instructions
        return NextResponse.json({
            success: false,
            message: 'Cannot auto-create table. Please run this SQL in your Supabase dashboard.',
            dashboard_url: `https://supabase.com/dashboard/project/qrbeecfakoqovivatccm/sql/new`,
            sql: `
-- =============================================
-- AIFindr Rate Limiter: Database Setup
-- Run this in your Supabase SQL Editor
-- =============================================

create table if not exists rate_limits (
  ip text primary key,
  request_count integer not null default 0,
  reset_time timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table rate_limits enable row level security;

create policy "Service role full access on rate_limits" on rate_limits
  for all using (true);

-- Cleanup old entries (optional: run periodically)
-- delete from rate_limits where reset_time < now() - interval '1 hour';
            `.trim()
        }, { status: 202 })

    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            message: 'Failed to setup rate_limits table'
        }, { status: 500 })
    }
}

export async function GET(request: Request) {
    return NextResponse.json({
        message: 'Use POST method with Authorization: Bearer <CRON_SECRET> header',
        dashboard_url: 'https://supabase.com/dashboard/project/qrbeecfakoqovivatccm/sql/new'
    })
}
