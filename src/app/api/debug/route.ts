import { NextResponse } from 'next/server'

// Debug endpoint to check environment variables
// Access at: https://your-app.vercel.app/api/debug
export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    return NextResponse.json({
        message: 'Environment Check',
        timestamp: new Date().toISOString(),
        environment: {
            NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? 'SET (hidden)' : 'MISSING',
            NODE_ENV: process.env.NODE_ENV,
            VERCEL: process.env.VERCEL || 'false',
        },
        checks: {
            urlConfigured: !!supabaseUrl,
            keyConfigured: !!supabaseAnonKey,
            urlIsHttps: supabaseUrl?.startsWith('https://') || false,
            urlIsSupabase: supabaseUrl?.includes('.supabase.co') || false,
        }
    })
}
