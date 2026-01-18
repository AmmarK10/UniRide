import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Server-side debug logging
    console.log('=== SUPABASE SERVER DEBUG ===')
    console.log('URL exists:', !!supabaseUrl)
    console.log('Key exists:', !!supabaseAnonKey)

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables on server!')
        throw new Error(
            'Missing Supabase environment variables. Check Vercel Environment Variables.'
        )
    }

    return createServerClient(
        supabaseUrl,
        supabaseAnonKey,
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
}
