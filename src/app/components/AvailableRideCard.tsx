'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Clock, Users, CheckCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { requestRide } from '../passenger/actions'
import { getUniversityLabel } from '@/lib/constants'
import { formatTimePKT } from '@/lib/timezone'

type RideCardProps = {
    ride: {
        id: string
        origin_location: string
        destination_university: string
        departure_time: string
        available_seats: number
        recurrence_pattern?: string
        driver: {
            full_name: string
            university_name: string
            avatar_url?: string
        }
    }
}

export default function AvailableRideCard({ ride }: RideCardProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [requested, setRequested] = useState(false)

    const initials = ride.driver.full_name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase() || '?'

    const seatsLeft = ride.available_seats
    const isLowSeats = seatsLeft <= 2

    const handleRequest = async () => {
        // Optimistic update
        setRequested(true)

        try {
            await requestRide(ride.id)
        } catch (error) {
            console.error('Request failed:', error)
            // Rollback on error
            setRequested(false)
            // TODO: Add toast notification here
        }
    }

    return (
        <Card className="group border border-slate-200 bg-white hover:shadow-xl hover:border-indigo-200 transition-all duration-300 rounded-2xl overflow-hidden">
            <CardContent className="p-0">
                {/* Driver Header */}
                <div className="p-5 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-indigo-100 ring-2 ring-white">
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-slate-900 truncate">
                                    {ride.driver.full_name}
                                </h4>
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0 text-xs gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Verified
                                </Badge>
                            </div>
                            <p className="text-sm text-slate-500 truncate">
                                {getUniversityLabel(ride.driver.university_name)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Route Visualization */}
                <div className="px-5 py-4">
                    <div className="flex gap-4">
                        {/* Vertical Line with Dots */}
                        <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-indigo-100" />
                            <div className="w-0.5 h-12 bg-gradient-to-b from-indigo-500 to-purple-500" />
                            <div className="w-3 h-3 rounded-full bg-purple-500 ring-4 ring-purple-100" />
                        </div>

                        {/* Location Text */}
                        <div className="flex-1 flex flex-col justify-between py-0.5">
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">From</p>
                                <p className="text-base font-semibold text-slate-900">{ride.origin_location}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">To</p>
                                <p className="text-base font-semibold text-slate-900">{getUniversityLabel(ride.destination_university)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Time & Seats */}
                <div className="px-5 pb-4">
                    <div className="flex items-center justify-between gap-4 py-3 px-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-medium">
                                {formatTimePKT(ride.departure_time)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-400" />
                            <Badge
                                variant="secondary"
                                className={`${isLowSeats
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-600'
                                    } border-0 text-xs`}
                            >
                                {seatsLeft} seat{seatsLeft !== 1 ? 's' : ''} left
                            </Badge>
                        </div>
                    </div>

                    {/* Recurrence */}
                    {ride.recurrence_pattern && ride.recurrence_pattern !== 'One-off' && (
                        <div className="flex flex-wrap gap-1 mt-3">
                            {ride.recurrence_pattern.split(',').map((day) => (
                                <span
                                    key={day}
                                    className="px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-600 rounded"
                                >
                                    {day}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <div className="px-5 pb-5">
                    <Button
                        onClick={handleRequest}
                        disabled={isLoading || requested}
                        className={`w-full h-12 rounded-xl text-base font-medium transition-all ${requested
                            ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl'
                            }`}
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : requested ? (
                            <>
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Request Sent
                            </>
                        ) : (
                            'Request Seat'
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
