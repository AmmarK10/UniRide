'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays, Car, Bell, MessageCircle } from 'lucide-react'
import RideCard from '../components/RideCard'
import RequestCard from '../components/RequestCard'
import PostRideDialog from '../components/PostRideDialog'

type DashboardClientProps = {
    profile: any
    initialRides: any[]
    initialPendingRequests: any[]
    initialAcceptedRequests: any[]
}

export default function DashboardClient({
    profile,
    initialRides,
    initialPendingRequests,
    initialAcceptedRequests
}: DashboardClientProps) {
    const [rides, setRides] = useState(initialRides)
    const [pendingRequests, setPendingRequests] = useState(initialPendingRequests)
    const [acceptedRequests, setAcceptedRequests] = useState(initialAcceptedRequests)
    const supabase = createClient()

    // Helper to refresh data
    const refreshData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch refreshed rides
        const { data: updatedRides } = await supabase
            .from('rides')
            .select('*')
            .eq('driver_id', user.id)
            .neq('status', 'cancelled')
            .order('departure_time', { ascending: true })

        if (updatedRides) setRides(updatedRides)

        // Fetch requests
        const { data: updatedRequests } = await supabase
            .from('ride_requests')
            .select(`
                id,
                status,
                created_at,
                passenger_id,
                ride_id,
                profiles:passenger_id(full_name, university_name),
                rides:ride_id(origin_location, destination_university, departure_time)
            `)
            .in('ride_id', updatedRides?.map(r => r.id) || [])
            .in('status', ['pending', 'accepted'])
            .neq('hidden_by_driver', true)
            .order('created_at', { ascending: false })

        if (updatedRequests) {
            setPendingRequests(updatedRequests.filter(r => r.status === 'pending'))
            setAcceptedRequests(updatedRequests.filter(r => r.status === 'accepted'))
        }
    }, [supabase])

    // Optimistic Update Callback for RequestCard
    const handleOptimisticUpdate = (requestId: string, newStatus: string) => {
        if (newStatus === 'accepted') {
            const req = pendingRequests.find(r => r.id === requestId)
            if (req) {
                setPendingRequests(prev => prev.filter(r => r.id !== requestId))
                setAcceptedRequests(prev => [{ ...req, status: 'accepted' }, ...prev])
            }
        } else if (newStatus === 'rejected') {
            setPendingRequests(prev => prev.filter(r => r.id !== requestId))
        }
    }

    // Realtime Animation Handlers
    const animateAndRemoveRide = useCallback((rideId: string) => {
        setRides(prev => prev.map(r => r.id === rideId ? { ...r, isDeleting: true } : r))
        setTimeout(() => {
            setRides(prev => prev.filter(r => r.id !== rideId))
        }, 500)
    }, [])

    const animateAndRemoveRequest = useCallback((requestId: string) => {
        setPendingRequests(prev => prev.map(r => r.id === requestId ? { ...r, isDeleting: true } : r))
        setAcceptedRequests(prev => prev.map(r => r.id === requestId ? { ...r, isDeleting: true } : r))
        setTimeout(() => {
            setPendingRequests(prev => prev.filter(r => r.id !== requestId))
            setAcceptedRequests(prev => prev.filter(r => r.id !== requestId))
        }, 500)
    }, [])

    useEffect(() => {
        let requestsChannel: any;
        let ridesChannel: any;

        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                console.error("DashboardClient: No user found for realtime")
                return
            }

            // Subscribe to ride_requests changes
            requestsChannel = supabase
                .channel('driver_requests')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'ride_requests'
                    },
                    (payload) => {
                        console.log('REALTIME_EVENT_RECEIVED (Request):', payload)
                        if (payload.new.hidden_by_driver) {
                            animateAndRemoveRequest(payload.new.id)
                        } else {
                            // Regular status update
                            refreshData()
                        }
                    }
                )
                .subscribe()

            ridesChannel = supabase
                .channel('driver_rides_sub')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'rides',
                        filter: `driver_id=eq.${user.id}`
                    },
                    (payload) => {
                        console.log("REALTIME_EVENT_RECEIVED (New Ride):", payload)
                        refreshData()
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'rides',
                        filter: `driver_id=eq.${user.id}`
                    },
                    (payload) => {
                        console.log("REALTIME_EVENT_RECEIVED (Delete Ride):", payload)
                        animateAndRemoveRide(payload.old.id)
                    }
                )
                .subscribe()
        }

        setupRealtime()

        return () => {
            if (requestsChannel) supabase.removeChannel(requestsChannel)
            if (ridesChannel) supabase.removeChannel(ridesChannel)
        }
    }, [supabase, refreshData, animateAndRemoveRide, animateAndRemoveRequest])

    const activeRidesCount = rides.filter(r => r.status === 'active').length
    const pendingRequestsCount = pendingRequests.length
    const acceptedRequestsCount = acceptedRequests.length

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            Welcome back, {profile?.full_name?.split(' ')[0] || 'Driver'}
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Manage your rides and connect with passengers
                        </p>
                    </div>
                    <PostRideDialog />
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="border-0 shadow-sm bg-white rounded-xl">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-indigo-100">
                                    <Car className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Active Rides</p>
                                    <p className="text-2xl font-bold text-slate-900">{activeRidesCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-white rounded-xl">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-amber-100">
                                    <Bell className="h-6 w-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Pending Requests</p>
                                    <p className="text-2xl font-bold text-slate-900">{pendingRequestsCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-white rounded-xl">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-emerald-100">
                                    <MessageCircle className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Active Passengers</p>
                                    <p className="text-2xl font-bold text-slate-900">{acceptedRequestsCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-white rounded-xl">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-purple-100">
                                    <CalendarDays className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">University</p>
                                    <p className="text-lg font-semibold text-slate-900 truncate">
                                        {profile?.university_name || 'Not set'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* My Schedule */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-indigo-500" />
                                My Schedule
                            </h2>
                        </div>

                        {rides.length > 0 ? (
                            <div className="space-y-3">
                                {rides.map(ride => (
                                    <div key={ride.id} className={`transition-all duration-500 ${ride.isDeleting ? 'opacity-0 scale-95 h-0 overflow-hidden' : 'opacity-100'}`}>
                                        <RideCard ride={ride} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Card className="border border-dashed border-slate-300 bg-slate-50/50 rounded-xl">
                                <CardContent className="py-16 text-center">
                                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                                        <Car className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900 mb-1">
                                        No rides posted yet
                                    </h3>
                                    <p className="text-slate-500 mb-4">
                                        Start by posting your first ride to connect with passengers.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Ride Requests */}
                    <div className="space-y-6">
                        {/* Pending */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                                <Bell className="h-5 w-5 text-amber-500" />
                                Incoming Requests
                                {pendingRequestsCount > 0 && (
                                    <span className="ml-2 px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                                        {pendingRequestsCount}
                                    </span>
                                )}
                            </h2>

                            {pendingRequests.length > 0 ? (
                                <div className="space-y-3">
                                    {pendingRequests.map((req: any) => (
                                        <div key={req.id} className={`transition-all duration-500 ${req.isDeleting ? 'opacity-0 scale-95 h-0 overflow-hidden' : 'opacity-100'}`}>
                                            <RequestCard
                                                request={req}
                                                onOptimisticUpdate={handleOptimisticUpdate}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Card className="border border-dashed border-slate-300 bg-slate-50/50 rounded-xl">
                                    <CardContent className="py-8 text-center">
                                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 mb-2">
                                            <Bell className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            No pending requests
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Accepted */}
                        {acceptedRequests.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                                    <MessageCircle className="h-5 w-5 text-emerald-500" />
                                    Your Passengers
                                    <span className="ml-2 px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                                        {acceptedRequestsCount}
                                    </span>
                                </h2>
                                <div className="space-y-3">
                                    {acceptedRequests.map((req: any) => (
                                        <div key={req.id} className={`transition-all duration-500 ${req.isDeleting ? 'opacity-0 scale-95 h-0 overflow-hidden' : 'opacity-100'}`}>
                                            <RequestCard request={req} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
