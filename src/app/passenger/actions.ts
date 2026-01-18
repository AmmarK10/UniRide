'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function requestRide(rideId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    // Check if already requested
    const { data: existing } = await supabase
        .from('ride_requests')
        .select('id')
        .eq('ride_id', rideId)
        .eq('passenger_id', user.id)
        .single()

    if (existing) {
        throw new Error('You have already requested this ride.')
    }

    const { error } = await supabase.from('ride_requests').insert({
        ride_id: rideId,
        passenger_id: user.id,
        status: 'pending'
    })

    if (error) {
        console.error('Request ride error:', error)
        throw new Error(error.message)
    }

    revalidatePath('/')
    revalidatePath('/trips')
}

export async function cancelRequest(requestId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('ride_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)

    if (error) {
        console.error('Cancel request error:', error)
        throw new Error(error.message)
    }

    revalidatePath('/trips')
}
