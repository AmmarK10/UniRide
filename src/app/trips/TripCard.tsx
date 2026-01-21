'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    MapPin, Clock, MessageCircle, CheckCircle, XCircle, Clock3, Ticket, Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'

type TripCardProps = {
    request: any
    userId: string
}

export default function TripCard({ request, userId }: TripCardProps) {
    const [unreadCount, setUnreadCount] = useState(0)
    const supabase = createClient()

    const handleArchive = async () => {
        await supabase
            .from('ride_requests')
            .update({ hidden_by_passenger: true })
            .eq('id', request.id)
    }

    // Fetch and Subscribe to unread messages for this specific request
    useEffect(() => {
        // 1. Fetch initial unread count
        const fetchUnread = async () => {
            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('ride_request_id', request.id)
                .eq('receiver_id', userId)
                .eq('is_read', false)

            if (count !== null) {
                setUnreadCount(count)
            }
        }

        fetchUnread()

        // 2. Subscribe to NEW messages for this request
        const channel = supabase
            .channel(`unread_messages_${request.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `ride_request_id=eq.${request.id}`,
                },
                (payload) => {
                    const newMessage = payload.new as any
                    if (newMessage.receiver_id === userId) {
                        console.log('New message for this trip:', newMessage)
                        setUnreadCount(prev => prev + 1)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [request.id, userId, supabase])

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

    const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending
    const StatusIcon = status.icon

    const driverInitials = request.rides.driver.full_name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase() || '?'

    return (
        <Card className="border border-slate-200 bg-white hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden group">
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
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                            {format(new Date(request.created_at), 'MMM d, yyyy')}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleArchive}
                            className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50 -mr-2"
                            title="Archive / Hide"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                <div className="p-5">
                    {/* Driver Info with Unread Badge */}
                    <div className="flex items-center gap-3 mb-4 relative">
                        <div className="relative">
                            <Avatar className="h-10 w-10 border-2 border-indigo-100">
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-medium">
                                    {driverInitials}
                                </AvatarFallback>
                            </Avatar>
                            {/* Unread Badge - Red Dot */}
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                            )}
                        </div>
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
                                {unreadCount > 0 && (
                                    <Badge variant="secondary" className="ml-auto bg-red-100 text-red-600 hover:bg-red-200">
                                        {unreadCount} new
                                    </Badge>
                                )}
                            </Button>
                        </Link>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
