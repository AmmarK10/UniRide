'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createTimestampFromTimeInput } from '@/lib/timezone'

export async function createRide(formData: FormData): Promise<void> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        console.error('Create ride: Not authenticated')
        return
    }

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

    // Create timestamps with proper PKT timezone handling
    const departureTimestamp = createTimestampFromTimeInput(departureTime)

    let returnTimestamp = null
    if (returnTime) {
        returnTimestamp = createTimestampFromTimeInput(returnTime)
    }

    console.log('Creating ride with times:', {
        input: departureTime,
        timestamp: departureTimestamp,
        returnInput: returnTime,
        returnTimestamp
    })

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
        return
    }

    revalidatePath('/driver/dashboard')
}

export async function cancelRide(rideId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('rides')
        .update({ status: 'cancelled' })
        .eq('id', rideId)

    if (error) {
        console.error('Cancel ride error:', error)
        return
    }

    revalidatePath('/driver/dashboard')
}

export async function updateRequestStatus(requestId: string, status: 'accepted' | 'rejected'): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('ride_requests')
        .update({ status })
        .eq('id', requestId)

    if (error) {
        console.error('Update request error:', error)
        return
    }

    revalidatePath('/driver/dashboard')
}
