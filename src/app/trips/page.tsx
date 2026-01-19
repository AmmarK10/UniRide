import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TripsClient from './TripsClient'

export const dynamic = 'force-dynamic'

export default async function MyTripsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: requests } = await supabase
        .from('ride_requests')
        .select(`
            id,
            status,
            created_at,
            passenger_id,
            rides:ride_id (
                id,
                origin_location,
                destination_university,
                departure_time,
                driver:driver_id (
                    full_name,
                    phone_number,
                    avatar_url
                )
            )
        `)
        .eq('passenger_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <TripsClient initialRequests={requests || []} userId={user.id} />
    )
}
