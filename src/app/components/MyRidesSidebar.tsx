'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { LayoutDashboard, Ticket } from 'lucide-react'
import MyRideCard from './MyRideCard'

type MyRidesSidebarProps = {
    initialRequests: any[]
    userId: string
}

export default function MyRidesSidebar({ initialRequests, userId }: MyRidesSidebarProps) {
    const [requests, setRequests] = useState(initialRequests)
    const supabase = createClient()

    const refreshRequests = useCallback(async () => {
        const { data: updatedRequests } = await supabase
            .from('ride_requests')
            .select(`
                id,
                ride_id,
                status,
                rides:ride_id (
                    origin_location,
                    destination_university,
                    departure_time,
                    driver:driver_id(full_name, university_name)
                )
            `)
            .eq('passenger_id', userId)
            .in('status', ['pending', 'accepted'])
            .neq('hidden_by_passenger', true)
            .order('created_at', { ascending: false })

        if (updatedRequests) {
            setRequests(updatedRequests)
        }
    }, [supabase, userId])

    const animateAndRemoveRequest = useCallback((requestId: string) => {
        setRequests(prev => prev.map((r: any) =>
            r.id === requestId ? { ...r, isDeleting: true } : r
        ))
        setTimeout(() => {
            setRequests(prev => prev.filter((r: any) => r.id !== requestId))
        }, 400)
    }, [])

    useEffect(() => {
        const channel = supabase
            .channel('passenger_my_rides_sidebar')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'ride_requests',
                    filter: `passenger_id=eq.${userId}`
                },
                (payload: any) => {
                    console.log("MY_RIDES_SIDEBAR: Realtime update received:", payload.new?.status)
                    if (payload.new.hidden_by_passenger) {
                        animateAndRemoveRequest(payload.new.id)
                    } else {
                        // Status changed (e.g. pending -> accepted), refresh data
                        refreshRequests()
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ride_requests',
                    filter: `passenger_id=eq.${userId}`
                },
                () => {
                    console.log("MY_RIDES_SIDEBAR: New ride request inserted")
                    refreshRequests()
                }
            )
            .subscribe((status) => {
                console.log("MY_RIDES_SIDEBAR: Subscription status:", status)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, userId, refreshRequests, animateAndRemoveRequest])

    return (
        <div className="lg:col-span-4 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-indigo-600" />
                My Rides
            </h2>

            {requests && requests.length > 0 ? (
                <div className="space-y-4">
                    {requests.map((req: any) => (
                        <div
                            key={req.id}
                            className={`transition-all duration-400 ${req.isDeleting ? 'opacity-0 scale-95 h-0 overflow-hidden' : 'opacity-100'}`}
                        >
                            <MyRideCard
                                request={req}
                                onDelete={animateAndRemoveRequest}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <Card className="bg-white border-slate-200">
                    <CardContent className="py-8 text-center">
                        <Ticket className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <h3 className="font-medium text-slate-900">No active trips</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            You haven't requested any rides yet.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
