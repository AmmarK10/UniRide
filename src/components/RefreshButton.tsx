'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RefreshButton() {
    const router = useRouter()
    const [isRefreshing, setIsRefreshing] = useState(false)

    const handleRefresh = () => {
        setIsRefreshing(true)
        router.refresh()

        // Reset state after a short delay
        setTimeout(() => setIsRefreshing(false), 1000)
    }

    return (
        <Button
            onClick={handleRefresh}
            variant="outline"
            className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50"
        >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Rides
        </Button>
    )
}
