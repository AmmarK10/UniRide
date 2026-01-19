'use client'

import { useUnread } from '@/context/UnreadContext'
import { cn } from '@/lib/utils'

export default function UnreadBadge({ className }: { className?: string }) {
    const { unreadCount } = useUnread()

    if (unreadCount === 0) return null

    return (
        <span className={cn(
            "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-in zoom-in duration-300",
            unreadCount > 9 && "w-auto px-1 min-w-[1rem]",
            className
        )}>
            {unreadCount > 9 ? '9+' : unreadCount}
        </span>
    )
}
