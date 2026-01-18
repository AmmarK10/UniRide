import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    MapPin, Clock, MessageCircle, ArrowLeft, Car,
    CheckCircle, XCircle, Clock3, Ticket
} from 'lucide-react'
import { format } from 'date-fns'

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

    // Separate into upcoming and past
    const now = new Date()
    const upcomingRequests = requests?.filter((r: any) =>
        new Date(r.rides.departure_time) >= now && r.status !== 'cancelled'
    ) || []
    const pastRequests = requests?.filter((r: any) =>
        new Date(r.rides.departure_time) < now || r.status === 'cancelled'
    ) || []

    const statusConfig = {
        pending: {
            label: 'Pending',
            className: 'bg-amber-100 text-amber-700 border-0',
            icon: Clock3
        },
        accepted: {
            label: 'Accepted',
            className: 'bg-emerald-100 text-emerald-700 border-0',
            icon: CheckCircle
        },
        rejected: {
            label: 'Rejected',
            className: 'bg-red-100 text-red-700 border-0',
            icon: XCircle
        },
        cancelled: {
            label: 'Cancelled',
            className: 'bg-slate-100 text-slate-600 border-0',
            icon: XCircle
        }
    }

    const TripCard = ({ request }: { request: any }) => {
        const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending
        const StatusIcon = status.icon

        const driverInitials = request.rides.driver.full_name
            ?.split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase() || '?'

        return (
            <Card className="border border-slate-200 bg-white hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden">
                <CardContent className="p-0">
                    {/* Status Header */}
                    <div className={`px-5 py-3 flex items-center justify-between ${request.status === 'accepted'
                            ? 'bg-gradient-to-r from-emerald-50 to-teal-50'
                            : 'bg-slate-50'
                        }`}>
                        <Badge variant="secondary" className={`${status.className} gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                        </Badge>
                        <span className="text-xs text-slate-500">
                            {format(new Date(request.created_at), 'MMM d, yyyy')}
                        </span>
                    </div>

                    <div className="p-5">
                        {/* Driver Info */}
                        <div className="flex items-center gap-3 mb-4">
                            <Avatar className="h-10 w-10 border-2 border-indigo-100">
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-medium">
                                    {driverInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-slate-900">
                                    {request.rides.driver.full_name}
                                </p>
                                <p className="text-sm text-slate-500">Driver</p>
                            </div>
                        </div>

                        {/* Route */}
                        <div className="flex gap-3 mb-4">
                            <div className="flex flex-col items-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-indigo-100" />
                                <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-500 to-purple-500" />
                                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-100" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <p className="text-sm font-medium text-slate-900">{request.rides.origin_location}</p>
                                <p className="text-sm font-medium text-slate-900">{request.rides.destination_university}</p>
                            </div>
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span>{format(new Date(request.rides.departure_time), 'EEEE, MMM d • h:mm a')}</span>
                        </div>

                        {/* Action Button */}
                        {request.status === 'accepted' && (
                            <Link href={`/chat/${request.id}`} className="block">
                                <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                                    <MessageCircle className="h-4 w-4" />
                                    Contact Driver
                                </Button>
                            </Link>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

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
                                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                                    <Car className="h-5 w-5 text-white" />
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
                                    <TripCard key={req.id} request={req} />
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
                                    <TripCard key={req.id} request={req} />
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
