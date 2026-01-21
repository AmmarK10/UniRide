'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    ArrowLeft, Car, Ticket
} from 'lucide-react'
import Link from 'next/link'
import UnreadBadge from '@/components/UnreadBadge'

import TripCard from './TripCard'

type TripsClientProps = {
    initialRequests: any[]
    userId: string
}

export default function TripsClient({ initialRequests, userId }: TripsClientProps) {
    const [requests, setRequests] = useState(initialRequests)
    const supabase = createClient()

    // --- REQUIREMENT 1 & 4: Top-Level Effect, No Guards ---
    const refreshRequests = useCallback(async () => {
        const { data: updatedRequests } = await supabase
            .from('ride_requests')
            .select(`
                id,
                status,
                created_at,
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
            .eq('passenger_id', userId)
            .neq('hidden_by_passenger', true)
            .order('created_at', { ascending: false })

        if (updatedRequests) {
            setRequests(updatedRequests)
        }
    }, [supabase, userId])

    // Realtime Animation Helper
    const animateAndRemoveRequest = useCallback((requestId: string) => {
        setRequests(prev => prev.map((r: any) => r.id === requestId ? { ...r, isDeleting: true } : r))
        setTimeout(() => {
            setRequests(prev => prev.filter((r: any) => r.id !== requestId))
        }, 500)
    }, [])

    useEffect(() => {
        // --- REQUIREMENT 2: LOUD LOGGING ---
        console.log("CRITICAL: Starting Ride Status Listener...")

        const channel = supabase
            .channel('passenger_requests_updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'ride_requests',
                    filter: `passenger_id=eq.${userId}`
                },
                (payload: any) => {
                    console.log("REALTIME_EVENT_RECEIVED (Request Status Updated):", payload.new?.status)
                    console.log("REALTIME_EVENT_RECEIVED (Passenger Hide):", payload)

                    if (payload.new.hidden_by_passenger) {
                        animateAndRemoveRequest(payload.new.id)
                    } else {
                        // Trigger re-fetch to update UI (Green badge etc.)
                        refreshRequests()
                    }
                }
            )
            .subscribe((status) => {
                console.log("CRITICAL: Ride Sub Status is:", status)
            })

        return () => {
            console.log("CRITICAL: Cleaning up listener")
            supabase.removeChannel(channel)
        }
    }, [supabase, userId, refreshRequests, animateAndRemoveRequest])

    // Separate into upcoming and past
    const now = new Date()
    const upcomingRequests = requests.filter((r: any) =>
        new Date(r.rides.departure_time) >= now && r.status !== 'cancelled'
    )
    const pastRequests = requests.filter((r: any) =>
        new Date(r.rides.departure_time) < now || r.status === 'cancelled'
    )

    const EmptyState = ({ message }: { message: string }) => (
        <Card className="border border-dashed border-slate-300 bg-slate-50/50 rounded-xl">
            <CardContent className="py-16 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                    <Ticket className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">{message}</h3>
                <p className="text-slate-500">
                    <Link href="/" className="text-indigo-600 hover:underline">
                        Find rides
                    </Link>{' '}
                    to get started
                </p>
            </CardContent>
        </Card>
    )

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-lg">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/">
                                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                                    <Car className="h-5 w-5 text-white" />
                                    <UnreadBadge />
                                </div>
                                <span className="text-xl font-bold text-slate-900">My Trips</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1 rounded-xl">
                        <TabsTrigger
                            value="upcoming"
                            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                            Upcoming ({upcomingRequests.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="history"
                            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                            History ({pastRequests.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upcoming" className="mt-0">
                        {upcomingRequests.length > 0 ? (
                            <div className="grid gap-4">
                                {upcomingRequests.map((req: any) => (
                                    <div key={req.id} className={`transition-all duration-500 ${req.isDeleting ? 'opacity-0 scale-95 h-0 overflow-hidden' : 'opacity-100'}`}>
                                        <TripCard request={req} userId={userId} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="No upcoming trips" />
                        )}
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                        {pastRequests.length > 0 ? (
                            <div className="grid gap-4">
                                {pastRequests.map((req: any) => (
                                    <div key={req.id} className={`transition-all duration-500 ${req.isDeleting ? 'opacity-0 scale-95 h-0 overflow-hidden' : 'opacity-100'}`}>
                                        <TripCard request={req} userId={userId} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="No past trips" />
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
