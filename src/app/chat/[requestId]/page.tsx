import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ChatWindow from '../ChatWindow'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Car, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function ChatPage({
    params
}: {
    params: Promise<{ requestId: string }>
}) {
    // Await params first (Next.js 16+ requirement)
    const { requestId } = await params

    console.log('=== CHAT PAGE DEBUG ===')
    console.log('Request ID from URL:', requestId)

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
        console.error('Auth error:', authError.message)
    }

    if (!user) {
        console.log('No user found, redirecting to login')
        redirect('/login')
    }

    console.log('Current user ID:', user.id)

    // Fetch request details to verify access and get context
    const { data: request, error } = await supabase
        .from('ride_requests')
        .select(`
            *,
            rides:ride_id (
                origin_location, 
                destination_university, 
                driver_id,
                driver:driver_id(full_name, university_name),
                departure_time
            ),
            passenger:passenger_id(full_name, university_name)
        `)
        .eq('id', requestId)
        .single()

    if (error) {
        console.error('Chat page error:', error.message || error.code || JSON.stringify(error))
    }

    console.log('Request data:', request ? 'Found' : 'Not found')

    // Handle not found
    if (!request) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-red-200">
                    <CardContent className="py-12 text-center">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">Request Not Found</h2>
                        <p className="text-slate-500 mb-4">
                            The ride request you're looking for doesn't exist or you don't have permission to view it.
                        </p>
                        <p className="text-xs text-slate-400 mb-4">Request ID: {requestId}</p>
                        <Link href="/">
                            <Button className="bg-indigo-600 hover:bg-indigo-700">Go Home</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Verify access (must be driver or passenger)
    const isDriver = request.rides?.driver_id === user.id
    const isPassenger = request.passenger_id === user.id

    console.log('Access check - isDriver:', isDriver, 'isPassenger:', isPassenger)

    if (!isDriver && !isPassenger) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="py-12 text-center">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
                        <p className="text-slate-500 mb-4">You don't have permission to view this chat.</p>
                        <Link href="/">
                            <Button className="bg-indigo-600 hover:bg-indigo-700">Go Home</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Verify status is accepted
    if (request.status !== 'accepted') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="py-12 text-center">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mb-4">
                            <Clock className="h-8 w-8 text-amber-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">Chat Not Available</h2>
                        <p className="text-slate-500 mb-2">Chat is only available for accepted ride requests.</p>
                        <Badge className="mb-4">Current status: {request.status}</Badge>
                        <div>
                            <Link href={isDriver ? "/driver/dashboard" : "/trips"}>
                                <Button className="bg-indigo-600 hover:bg-indigo-700">Go Back</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Fetch initial messages
    const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('ride_request_id', requestId)
        .order('created_at', { ascending: true })

    if (messagesError) {
        console.error('Messages fetch error:', messagesError.message)
    }

    console.log('Messages count:', messages?.length || 0)
    console.log('=== END DEBUG ===')

    const otherPerson = isDriver ? request.passenger : request.rides?.driver
    const otherPersonInitials = otherPerson?.full_name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase() || '?'

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-lg">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <div className="flex h-16 items-center gap-4">
                        <Link href={isDriver ? "/driver/dashboard" : "/trips"}>
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-indigo-100">
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">
                                    {otherPersonInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="font-semibold text-slate-900">{otherPerson?.full_name || 'Unknown'}</h1>
                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0 text-xs gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        {isDriver ? 'Passenger' : 'Driver'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500">{otherPerson?.university_name || ''}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Ride Info Card */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
                <Card className="border border-slate-200 bg-white rounded-xl">
                    <CardContent className="py-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-100">
                                    <Car className="h-4 w-4 text-indigo-600" />
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-slate-400" />
                                    <span className="font-medium text-slate-900">{request.rides?.origin_location}</span>
                                    <span className="text-slate-400">→</span>
                                    <span className="font-medium text-indigo-600">{request.rides?.destination_university}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Clock className="h-4 w-4 text-slate-400" />
                                <span>{format(new Date(request.rides?.departure_time), 'MMM d, h:mm a')}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Chat Window */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
                <ChatWindow
                    requestId={requestId}
                    initialMessages={messages || []}
                    currentUserId={user.id}
                />
            </div>
        </div>
    )
}
