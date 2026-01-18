'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Search, Clock } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

function SearchBarContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [origin, setOrigin] = useState(searchParams.get('origin') || '')
    const [time, setTime] = useState(searchParams.get('time') || '')

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams()
        if (origin) params.set('origin', origin)
        if (time) params.set('time', time)
        router.push(`/?${params.toString()}`)
    }

    return (
        <form onSubmit={handleSearch} className="w-full">
            <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                {/* Origin Input */}
                <div className="flex-1 relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500" />
                    <Input
                        type="text"
                        placeholder="Where are you coming from?"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        className="pl-12 h-14 border-0 bg-slate-50 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                </div>

                {/* Time Input */}
                <div className="flex-1 relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500" />
                    <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="pl-12 h-14 border-0 bg-slate-50 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                </div>

                {/* Search Button */}
                <Button
                    type="submit"
                    size="lg"
                    className="h-14 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30"
                >
                    <Search className="h-5 w-5 mr-2" />
                    Search Rides
                </Button>
            </div>
        </form>
    )
}

export default function SearchBar() {
    return (
        <Suspense fallback={
            <div className="w-full p-2 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 h-20 animate-pulse" />
        }>
            <SearchBarContent />
        </Suspense>
    )
}
