'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageCircle, Clock, MapPin, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatDateTimePKT } from '@/lib/timezone'
import { getUniversityLabel } from '@/lib/constants'

type MyRideCardProps = {
    request: {
        id: string
        status: string
        rides: {
            origin_location: string
            destination_university: string
            departure_time: string
            driver: {
                full_name: string
                university_name: string
            }
        }
    }
}

export default function MyRideCard({ request }: MyRideCardProps) {
    const isAccepted = request.status === 'accepted'
    const isPending = request.status === 'pending'

    // Extract driver initials
    const driverInitials = request.rides?.driver?.full_name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase() || '?'

    return (
        <Card className={`transition-all duration-300 hover:shadow-md ${isAccepted ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/30'
            }`}>
            <CardContent className="p-5">
                {/* Header with Status */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar className={`h-10 w-10 border-2 ${isAccepted ? 'border-emerald-200' : 'border-amber-200'}`}>
                            <AvatarFallback className={`text-white text-sm font-medium ${isAccepted
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                    : 'bg-gradient-to-br from-amber-500 to-orange-600'
                                }`}>
                                {driverInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-slate-900 text-sm">
                                {request.rides?.driver?.full_name}
                            </p>
                            <p className="text-xs text-slate-500">
                                {getUniversityLabel(request.rides?.driver?.university_name)}
                            </p>
                        </div>
                    </div>
                    <Badge variant="secondary" className={`border-0 ${isAccepted
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                        {isAccepted ? (
                            <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Accepted
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Pending
                            </div>
                        )}
                    </Badge>
                </div>

                {/* Route Info */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div className="text-sm">
                            <span className="font-medium text-slate-900">{request.rides?.origin_location}</span>
                            <span className="text-slate-400 mx-1">→</span>
                            <span className="font-medium text-slate-900">{getUniversityLabel(request.rides.destination_university)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600">
                            {formatDateTimePKT(request.rides?.departure_time)}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                {isAccepted && (
                    <Link href={`/chat/${request.id}`} className="block mt-2">
                        <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                            <MessageCircle className="h-4 w-4" />
                            Message Driver
                        </Button>
                    </Link>
                )}

                {isPending && (
                    <Button variant="outline" disabled className="w-full border-amber-200 text-amber-700 bg-amber-50/50 opacity-80 cursor-not-allowed">
                        Waiting for approval...
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
