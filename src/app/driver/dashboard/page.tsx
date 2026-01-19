import { createClient } from '@/utils/supabase/server'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DriverDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch driver profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, university_name')
        .eq('id', user.id)
        .single()

    // Fetch active rides
    const { data: rides } = await supabase
        .from('rides')
        .select('*')
        .eq('driver_id', user.id)
        .neq('status', 'cancelled')
        .order('departure_time', { ascending: true })

    // Fetch requests - BOTH pending AND accepted
    const { data: allRequests } = await supabase
        .from('ride_requests')
        .select(`
            id,
            status,
            created_at,
            profiles:passenger_id(full_name, university_name),
            rides:ride_id(origin_location, destination_university, departure_time)
        `)
        .in('ride_id', rides?.map(r => r.id) || [])
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false })

    // Separate pending and accepted for display
    const pendingRequests = allRequests?.filter(r => r.status === 'pending') || []
    const acceptedRequests = allRequests?.filter(r => r.status === 'accepted') || []

    // Stats
    const activeRidesCount = rides?.filter(r => r.status === 'active').length || 0
    const pendingRequestsCount = pendingRequests.length
    const acceptedRequestsCount = acceptedRequests.length

    return (
        <DashboardClient
            profile={profile}
            initialRides={rides || []}
            initialPendingRequests={pendingRequests}
            initialAcceptedRequests={acceptedRequests}
        />
    )
}
