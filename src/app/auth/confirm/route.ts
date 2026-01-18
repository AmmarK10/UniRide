import { createClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)

    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as 'email' | 'recovery' | 'invite' | 'magiclink' | null
    const next = searchParams.get('next') ?? '/onboarding'

    console.log('=== AUTH CONFIRM ===')
    console.log('Token hash:', token_hash ? 'present' : 'missing')
    console.log('Type:', type)
    console.log('Next:', next)

    if (token_hash && type) {
        const supabase = await createClient()

        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })

        if (error) {
            console.error('OTP verification error:', error.message)
            // Redirect to login with error
            return NextResponse.redirect(
                `${origin}/login?error=${encodeURIComponent('Email verification failed. Please try again.')}`
            )
        }

        console.log('Email verified successfully!')

        // Redirect to next page (onboarding for new users)
        return NextResponse.redirect(`${origin}${next}`)
    }

    // If missing params, redirect to login with error
    console.error('Missing token_hash or type')
    return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Invalid verification link.')}`
    )
}
