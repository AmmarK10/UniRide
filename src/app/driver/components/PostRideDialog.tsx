'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, MapPin, Clock, Users, CalendarDays } from 'lucide-react'
import { createRide } from '../actions'

const DAYS_OF_WEEK = [
    { id: 'Mon', label: 'Mon' },
    { id: 'Tue', label: 'Tue' },
    { id: 'Wed', label: 'Wed' },
    { id: 'Thu', label: 'Thu' },
    { id: 'Fri', label: 'Fri' },
    { id: 'Sat', label: 'Sat' },
    { id: 'Sun', label: 'Sun' },
]

export default function PostRideDialog() {
    const [open, setOpen] = useState(false)
    const [selectedDays, setSelectedDays] = useState<string[]>([])

    const toggleDay = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        )
    }

    const handleSubmit = async (formData: FormData) => {
        // Add selected days to form data
        formData.set('recurrence', selectedDays.length > 0 ? selectedDays.join(',') : 'One-off')
        await createRide(formData)
        setOpen(false)
        setSelectedDays([])
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25">
                    <Plus className="h-4 w-4" />
                    Post a Ride
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white border-0 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl text-slate-900">Post a New Ride</DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Share your commute with fellow students. Fill in the details below.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-6 mt-4">
                    {/* Origin */}
                    <div className="space-y-2">
                        <Label htmlFor="origin" className="text-slate-700 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-indigo-500" />
                            Origin Area
                        </Label>
                        <Input
                            id="origin"
                            name="origin"
                            placeholder="e.g., Downtown, North Campus"
                            required
                            className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Time Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="departureTime" className="text-slate-700 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-indigo-500" />
                                Departure Time
                            </Label>
                            <Input
                                id="departureTime"
                                name="departureTime"
                                type="time"
                                required
                                className="border-slate-200 bg-slate-50 text-slate-900 focus:border-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="returnTime" className="text-slate-700 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-slate-400" />
                                Return Time <span className="text-slate-400 text-xs">(Optional)</span>
                            </Label>
                            <Input
                                id="returnTime"
                                name="returnTime"
                                type="time"
                                className="border-slate-200 bg-slate-50 text-slate-900 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Seats */}
                    <div className="space-y-2">
                        <Label htmlFor="seats" className="text-slate-700 flex items-center gap-2">
                            <Users className="h-4 w-4 text-indigo-500" />
                            Available Seats
                        </Label>
                        <Input
                            id="seats"
                            name="seats"
                            type="number"
                            min="1"
                            max="6"
                            defaultValue="3"
                            required
                            className="border-slate-200 bg-slate-50 text-slate-900 focus:border-indigo-500 w-24"
                        />
                    </div>

                    {/* Schedule Days */}
                    <div className="space-y-3">
                        <Label className="text-slate-700 flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-indigo-500" />
                            Schedule (Select Days)
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS_OF_WEEK.map((day) => (
                                <button
                                    key={day.id}
                                    type="button"
                                    onClick={() => toggleDay(day.id)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedDays.includes(day.id)
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400">
                            Leave empty for a one-off ride
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            Post Ride
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
