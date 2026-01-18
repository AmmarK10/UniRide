'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createRide(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    // Get user's university from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('university_name')
        .eq('id', user.id)
        .single()

    const origin = formData.get('origin') as string
    const departureTime = formData.get('departureTime') as string
    const returnTime = formData.get('returnTime') as string
    const seats = parseInt(formData.get('seats') as string)
    const recurrence = formData.get('recurrence') as string

    // Create a date for today with the specified time
    const today = new Date()
    const [depHours, depMinutes] = departureTime.split(':')
    today.setHours(parseInt(depHours), parseInt(depMinutes), 0, 0)
    const departureTimestamp = today.toISOString()

    let returnTimestamp = null
    if (returnTime) {
        const returnDate = new Date()
        const [retHours, retMinutes] = returnTime.split(':')
        returnDate.setHours(parseInt(retHours), parseInt(retMinutes), 0, 0)
        returnTimestamp = returnDate.toISOString()
    }

    const { error } = await supabase.from('rides').insert({
        driver_id: user.id,
        origin_location: origin,
        destination_university: profile?.university_name || 'University',
        departure_time: departureTimestamp,
        return_time: returnTimestamp,
        available_seats: seats,
        recurrence_pattern: recurrence || 'One-off',
        status: 'active'
    })

    if (error) {
        console.error('Create ride error:', error)
        return { error: error.message }
    }

    revalidatePath('/driver/dashboard')
}

export async function cancelRide(rideId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('rides')
        .update({ status: 'cancelled' })
        .eq('id', rideId)

    if (error) {
        console.error('Cancel ride error:', error)
        return { error: error.message }
    }

    revalidatePath('/driver/dashboard')
}

export async function updateRequestStatus(requestId: string, status: 'accepted' | 'rejected') {
    const supabase = await createClient()

    const { error } = await supabase
        .from('ride_requests')
        .update({ status })
        .eq('id', requestId)

    if (error) {
        console.error('Update request error:', error)
        return { error: error.message }
    }

    revalidatePath('/driver/dashboard')
}
