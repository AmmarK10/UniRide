'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    console.log('=== LOGIN ATTEMPT ===')
    console.log('Email:', email)

    const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('Login error:', error.message, error.status)
        redirect('/login?error=' + encodeURIComponent(error.message))
    }

    console.log('Login successful! User:', data.user?.id)
    console.log('Session:', data.session ? 'Created' : 'Not created')

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    console.log('=== SIGNUP ATTEMPT ===')
    console.log('Email:', email)

    const { error, data } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        console.error('Signup error:', error.message)
        redirect('/login?error=' + encodeURIComponent(error.message))
    }

    console.log('Signup response:', {
        userId: data.user?.id,
        emailConfirmedAt: data.user?.email_confirmed_at,
        identities: data.user?.identities?.length
    })

    // Check if email confirmation is required
    if (data.user && data.user.identities && data.user.identities.length === 0) {
        redirect('/login?message=' + encodeURIComponent('Check your email for a confirmation link.'))
    }

    revalidatePath('/', 'layout')
    redirect('/onboarding')
}
