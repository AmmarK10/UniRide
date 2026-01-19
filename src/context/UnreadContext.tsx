'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type UnreadContextType = {
    unreadCount: number
    refreshUnreadCount: () => Promise<void>
}

const UnreadContext = createContext<UnreadContextType | undefined>(undefined)

export function UnreadProvider({ children }: { children: React.ReactNode }) {
    const [unreadCount, setUnreadCount] = useState(0)
    const supabase = createClient()
    const router = useRouter()

    const refreshUnreadCount = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', user.id)
                .eq('is_read', false)

            if (!error && count !== null) {
                setUnreadCount(count)
            }
        } catch (error) {
            console.error('Error fetching unread count:', error)
        }
    }

    useEffect(() => {
        let channel: any

        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Initial fetch
            refreshUnreadCount()

            // Subscribe to new messages
            channel = supabase
                .channel('global_unread_messages')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `receiver_id=eq.${user.id}`,
                    },
                    (payload) => {
                        console.log('Realtime Update Received (Unread):', payload)
                        setUnreadCount(prev => prev + 1)
                    }
                )
                .subscribe((status) => {
                    console.log('Unread subscription status:', status)
                })
        }

        setupRealtime()

        return () => {
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [])

    return (
        <UnreadContext.Provider value={{ unreadCount, refreshUnreadCount }}>
            {children}
        </UnreadContext.Provider>
    )
}

export function useUnread() {
    const context = useContext(UnreadContext)
    if (context === undefined) {
        throw new Error('useUnread must be used within an UnreadProvider')
    }
    return context
}
