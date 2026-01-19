'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MapPin, Clock, Check, X, MessageCircle, CheckCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { updateRequestStatus } from '../actions'
import Link from 'next/link'
import { useState, useTransition } from 'react'

type RequestCardProps = {
    request: {
        id: string
        status: string
        profiles: {
            full_name: string
            university_name: string
            avatar_url?: string
        }
        rides: {
            origin_location: string
            destination_university: string
            departure_time: string
        }
    }
    onOptimisticUpdate?: (requestId: string, status: 'accepted' | 'rejected') => void
}

export default function RequestCard({ request, onOptimisticUpdate }: RequestCardProps) {
    const [isPending, startTransition] = useTransition()
    const [pendingAction, setPendingAction] = useState<'accept' | 'reject' | null>(null)

    const initials = request.profiles.full_name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase() || '?'

    const isPendingStatus = request.status === 'pending'
    const isAccepted = request.status === 'accepted'

    const handleAccept = () => {
        setPendingAction('accept')
        // Optimistic update
        if (onOptimisticUpdate) {
            onOptimisticUpdate(request.id, 'accepted')
        }

        startTransition(async () => {
            await updateRequestStatus(request.id, 'accepted')
            setPendingAction(null)
        })
    }

    const handleReject = () => {
        setPendingAction('reject')
        // Optimistic update
        if (onOptimisticUpdate) {
            onOptimisticUpdate(request.id, 'rejected')
        }

        startTransition(async () => {
            await updateRequestStatus(request.id, 'rejected')
            setPendingAction(null)
        })
    }

    return (
        <Card className={`border bg-white hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden ${isAccepted ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white' : 'border-slate-200'
            }`}>
            <CardContent className="p-5">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className={`h-12 w-12 border-2 ${isAccepted ? 'border-emerald-200' : 'border-indigo-100'}`}>
                        <AvatarFallback className={`font-medium text-white ${isAccepted
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                            : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                            }`}>
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900 truncate">
                                {request.profiles.full_name}
                            </h4>
                            {isPendingStatus && (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-0 text-xs">
                                    Pending
                                </Badge>
                            )}
                            {isAccepted && (
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0 text-xs gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Accepted
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 mb-3">
                            {request.profiles.university_name}
                        </p>

                        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                            <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                <span>{request.rides.origin_location} → {request.rides.destination_university}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                <span>{format(new Date(request.rides.departure_time), 'MMM d, h:mm a')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    {isPendingStatus && (
                        <>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleAccept}
                                disabled={isPending}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                            >
                                {pendingAction === 'accept' ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4" />
                                )}
                                Accept
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleReject}
                                disabled={isPending}
                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-1.5"
                            >
                                {pendingAction === 'reject' ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <X className="h-4 w-4" />
                                )}
                                Reject
                            </Button>
                        </>
                    )}
                    {isAccepted && (
                        <Link href={`/chat/${request.id}`} className="flex-1">
                            <Button
                                size="sm"
                                className="w-full gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                <MessageCircle className="h-4 w-4" />
                                Chat with {request.profiles.full_name.split(' ')[0]}
                            </Button>
                        </Link>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
