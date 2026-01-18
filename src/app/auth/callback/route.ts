import { createClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

// This route handles the OAuth callback from Supabase
// It exchanges the auth code for a session and redirects the user
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)

    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/onboarding'

    console.log('=== AUTH CALLBACK ===')
    console.log('Origin:', origin)
    console.log('Code present:', !!code)
    console.log('Next:', next)

    if (code) {
        const supabase = await createClient()

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
            console.error('Code exchange error:', error.message)
            return NextResponse.redirect(
                `${origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
            )
        }

        console.log('Auth callback successful, redirecting to:', next)

        // Use the origin from the request to ensure correct domain
        const redirectUrl = next.startsWith('/') ? `${origin}${next}` : next
        return NextResponse.redirect(redirectUrl)
    }

    // No code present, redirect to login with error
    console.error('No code in callback')
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Invalid authentication callback.')}`)
}
