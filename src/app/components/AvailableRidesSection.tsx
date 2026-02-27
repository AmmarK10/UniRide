'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Car, Search } from 'lucide-react'
import AvailableRideCard from './AvailableRideCard'
import RefreshButton from '@/components/RefreshButton'

type AvailableRidesSectionProps = {
    initialRides: any[]
    requestedRideIds: string[]
    userId: string
}

export default function AvailableRidesSection({
    initialRides,
    requestedRideIds: initialRequestedIds,
    userId
}: AvailableRidesSectionProps) {
    const [rides, setRides] = useState(initialRides)
    const [requestedIds, setRequestedIds] = useState<string[]>(initialRequestedIds)
    const supabase = createClient()

    const refreshRides = useCallback(async () => {
        // Fetch user's current requests to know which rides to exclude
        const { data: userRequests } = await supabase
            .from('ride_requests')
            .select('ride_id')
            .eq('passenger_id', userId)
            .in('status', ['pending', 'accepted'])

        const currentRequestedIds = userRequests?.map(r => r.ride_id) || []
        setRequestedIds(currentRequestedIds)

        // Fetch all active rides
        const { data: allRides } = await supabase
            .from('rides')
            .select(`
                *,
                driver:driver_id(full_name, university_name, avatar_url)
            `)
            .eq('status', 'active')
            .gt('available_seats', 0)
            .order('departure_time', { ascending: true })

        if (allRides) {
            // Filter out rides the user already requested
            const available = allRides.filter(r => !currentRequestedIds.includes(r.id))
            setRides(available)
        }
    }, [supabase, userId])

    useEffect(() => {
        // Listen for new rides being posted or deleted
        const ridesChannel = supabase
            .channel('passenger_available_rides')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'rides'
                },
                (payload) => {
                    console.log("AVAILABLE_RIDES: Realtime event:", payload.eventType)
                    refreshRides()
                }
            )
            .subscribe((status) => {
                console.log("AVAILABLE_RIDES: Subscription status:", status)
            })

        // Also listen for ride_request changes (so when user requests a ride, it disappears)
        const requestsChannel = supabase
            .channel('passenger_requests_for_available')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'ride_requests',
                    filter: `passenger_id=eq.${userId}`
                },
                () => {
                    console.log("AVAILABLE_RIDES: Ride request changed, refreshing")
                    refreshRides()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(ridesChannel)
            supabase.removeChannel(requestsChannel)
        }
    }, [supabase, userId, refreshRides])

    // Filter rides the user has already requested
    const availableRides = rides.filter(r => !requestedIds.includes(r.id))

    return (
        <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Search className="h-5 w-5 text-indigo-600" />
                    Available Rides
                </h2>
            </div>

            {availableRides.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {availableRides.map((ride: any) => (
                        <AvailableRideCard key={ride.id} ride={ride} />
                    ))}
                </div>
            ) : (
                <Card className="border border-dashed border-slate-300 bg-slate-50/50 rounded-2xl">
                    <CardContent className="py-12 text-center">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                            <Car className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            No rides available
                        </h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-6 text-sm">
                            There are no rides available right now. New rides will appear automatically.
                        </p>
                        <RefreshButton />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
