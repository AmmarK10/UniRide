'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function completeProfile(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        console.error('Onboarding: User not authenticated')
        redirect('/login')
    }

    const fullName = formData.get('fullName') as string
    const university = formData.get('university') as string
    const role = formData.get('role') as string
    const isDriver = role === 'driver'

    console.log('Onboarding data:', { fullName, university, role, isDriver, userId: user.id })

    // Use upsert to handle both insert and update cases
    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            full_name: fullName,
            university_name: university,
            is_driver: isDriver,
        }, {
            onConflict: 'id'
        })

    if (error) {
        console.error('Profile upsert error:', error)
        redirect('/onboarding?error=' + encodeURIComponent(error.message))
    }

    revalidatePath('/', 'layout')

    if (isDriver) {
        redirect('/driver/dashboard')
    } else {
        redirect('/')
    }
}
