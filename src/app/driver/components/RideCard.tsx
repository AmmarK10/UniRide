import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Users, Trash2, CalendarDays, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { formatTimePKT, formatDatePKT } from '@/lib/timezone'
import { createClient } from '@/utils/supabase/client'

type RideCardProps = {
    ride: {
        id: string
        origin_location: string
        destination_university: string
        departure_time: string
        return_time?: string
        available_seats: number
        recurrence_pattern?: string
        status: string
    }
}

export default function RideCard({ ride }: RideCardProps) {
    const [isPending, startTransition] = useTransition()
    const supabase = createClient()

    const statusColors = {
        active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        full: 'bg-amber-100 text-amber-700 border-amber-200',
        cancelled: 'bg-red-100 text-red-700 border-red-200',
        completed: 'bg-slate-100 text-slate-600 border-slate-200',
    }

    const statusColor = statusColors[ride.status as keyof typeof statusColors] || statusColors.active
    const isFull = ride.available_seats === 0

    const handleDelete = () => {
        if (!window.confirm('Are you sure you want to delete this ride? This cannot be undone.')) return

        startTransition(async () => {
            try {
                const { error } = await supabase.from('rides').delete().eq('id', ride.id)
                if (error) throw error
                console.log("REALTIME_SYNC_SUCCESS", { id: ride.id, action: 'DELETE' })
            } catch (err) {
                console.error("Failed to delete ride:", err)
                alert("Failed to delete ride. Please try again.")
            }
        })
    }

    return (
        <Card className="group border border-slate-200 bg-white hover:shadow-lg hover:border-indigo-200 transition-all duration-300 rounded-xl overflow-hidden">
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
                    {/* Left: Route Info */}
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                                <MapPin className="h-5 w-5 text-indigo-500" />
                                <span className="truncate max-w-[120px] sm:max-w-[200px]">{ride.origin_location}</span>
                                <span className="text-slate-300">→</span>
                                <span className="text-indigo-600 truncate max-w-[120px] sm:max-w-[200px]">{ride.destination_university}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-slate-400" />
                                <span>{formatTimePKT(ride.departure_time)}</span>
                                {ride.return_time && (
                                    <span className="text-slate-400">
                                        - {formatTimePKT(ride.return_time)}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Users className="h-4 w-4 text-slate-400" />
                                <span>{ride.available_seats} seats available</span>
                            </div>
                        </div>

                        {/* Schedule Days */}
                        {ride.recurrence_pattern && ride.recurrence_pattern !== 'One-off' && (
                            <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-slate-400" />
                                <div className="flex gap-1">
                                    {ride.recurrence_pattern.split(',').map((day) => (
                                        <span
                                            key={day}
                                            className="px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-600 rounded"
                                        >
                                            {day}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {ride.recurrence_pattern === 'One-off' && (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <CalendarDays className="h-4 w-4 text-slate-400" />
                                <span>{formatDatePKT(ride.departure_time)}</span>
                                <Badge variant="outline" className="text-xs border-slate-200">One-off</Badge>
                            </div>
                        )}
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex items-center gap-3">
                        <Badge className={`${isFull ? statusColors.full : statusColor} border`}>
                            {isFull ? 'Full' : ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                        </Badge>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleDelete}
                            disabled={isPending}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Ride"
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
