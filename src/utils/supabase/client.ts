import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Debug logging - check browser console
    if (typeof window !== 'undefined') {
        console.log('=== SUPABASE CLIENT DEBUG ===')
        console.log('Supabase URL exists:', !!supabaseUrl)
        console.log('Supabase Key exists:', !!supabaseAnonKey)
        if (supabaseUrl) {
            console.log('URL preview:', supabaseUrl.substring(0, 40) + '...')
        }
    }

    if (!supabaseUrl || !supabaseAnonKey) {
        const errorMsg = 'Missing Supabase environment variables. Check Vercel Environment Variables settings.'
        console.error(errorMsg, {
            NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'SET' : 'MISSING',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? 'SET' : 'MISSING',
        })
        throw new Error(errorMsg)
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce',
        },
        global: {
            headers: {
                'x-client-info': 'uniride-web',
            },
        },
    })
}
