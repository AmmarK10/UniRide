import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, CalendarDays, Car, TrendingUp, MessageCircle } from 'lucide-react'
import PostRideDialog from '../components/PostRideDialog'
import RideCard from '../components/RideCard'
import RequestCard from '../components/RequestCard'

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
                    {/* My Schedule - Takes 2 columns */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-indigo-500" />
                                My Schedule
                            </h2>
                        </div>

                        {rides && rides.length > 0 ? (
                            <div className="space-y-3">
                                {rides.map(ride => (
                                    <RideCard key={ride.id} ride={ride} />
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

                    {/* Ride Requests - Takes 1 column */}
                    <div className="space-y-6">
                        {/* Pending Requests */}
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
                                        <RequestCard key={req.id} request={req} />
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

                        {/* Accepted Passengers */}
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
                                        <RequestCard key={req.id} request={req} />
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
