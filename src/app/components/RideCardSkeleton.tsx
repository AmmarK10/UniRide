import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function RideCardSkeleton() {
    return (
        <Card className="border border-slate-200 bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-0">
                {/* Driver Header Skeleton */}
                <div className="p-5 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                </div>

                {/* Route Skeleton */}
                <div className="px-5 py-4">
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <Skeleton className="w-3 h-3 rounded-full" />
                            <Skeleton className="w-0.5 h-12" />
                            <Skeleton className="w-3 h-3 rounded-full" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-0.5 gap-8">
                            <div className="space-y-1">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-4 w-28" />
                            </div>
                            <div className="space-y-1">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-4 w-36" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Time & Seats Skeleton */}
                <div className="px-5 pb-4">
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>

                {/* Button Skeleton */}
                <div className="px-5 pb-5">
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
            </CardContent>
        </Card>
    )
}
