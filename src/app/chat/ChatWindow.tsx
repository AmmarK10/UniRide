'use client'
import { useUnread } from '@/context/UnreadContext'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sendMessage } from './actions'
import { Send, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type Message = {
    id: string
    content: string
    sender_id: string
    created_at: string
}

export default function ChatWindow({
    requestId,
    initialMessages,
    currentUserId,
    receiverId
}: {
    requestId: string
    initialMessages: Message[]
    currentUserId: string
    receiverId: string
}) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [isSending, setIsSending] = useState(false)
    const [showScrollButton, setShowScrollButton] = useState(false)
    const supabase = createClient()
    const formRef = useRef<HTMLFormElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const { refreshUnreadCount } = useUnread()

    // Mark messages as read
    useEffect(() => {
        const markRead = async () => {
            const { error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('ride_request_id', requestId)
                .eq('receiver_id', currentUserId)
                .eq('is_read', false)

            if (!error) {
                // Refresh global count after marking read
                refreshUnreadCount()
            }
        }
        markRead()
    }, [requestId, currentUserId, messages, supabase, refreshUnreadCount])

    // Scroll to bottom function
    const scrollToBottom = useCallback((smooth = true) => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto'
            })
        }
    }, [])

    // Handle scroll to detect if user scrolled up
    const handleScroll = useCallback(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
            setShowScrollButton(!isNearBottom)
        }
    }, [])

    // Scroll to bottom on initial load
    useEffect(() => {
        scrollToBottom(false)
    }, [scrollToBottom])

    // Set up Supabase Realtime subscription
    useEffect(() => {
        console.log('Setting up realtime for requestId:', requestId)

        const channel = supabase
            .channel(`messages_${requestId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `ride_request_id=eq.${requestId}`,
                },
                (payload) => {
                    console.log('Realtime message received:', payload)
                    const newMessage = payload.new as Message

                    // Add message to state (avoid duplicates)
                    setMessages((current) => {
                        const exists = current.some(m => m.id === newMessage.id)
                        if (exists) return current
                        return [...current, newMessage]
                    })

                    // Scroll to bottom after new message
                    setTimeout(() => scrollToBottom(true), 50)
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status)
            })

        return () => {
            console.log('Cleaning up realtime channel')
            supabase.removeChannel(channel)
        }
    }, [requestId, supabase, scrollToBottom])

    const handleSubmit = async (formData: FormData) => {
        const content = formData.get('content') as string
        if (!content?.trim()) return

        setIsSending(true)

        // Optimistic update - add message immediately
        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,
            content: content.trim(),
            sender_id: currentUserId,
            created_at: new Date().toISOString()
        }

        setMessages(prev => [...prev, optimisticMessage])
        formRef.current?.reset()
        scrollToBottom(true)
        inputRef.current?.focus()

        try {
            // Append receiverId to formData
            formData.append('receiverId', receiverId)
            await sendMessage(formData)
        } catch (error) {
            console.error('Failed to send message:', error)
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-280px)] min-h-[400px] border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xl">
            {/* Messages Area */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-3"
                style={{
                    background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
                }}
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="text-4xl mb-3">👋</div>
                        <p className="text-slate-500 font-medium">No messages yet</p>
                        <p className="text-slate-400 text-sm">Say hi to start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === currentUserId
                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex",
                                    isMe ? "justify-end" : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm",
                                        isMe
                                            ? "bg-indigo-600 text-white rounded-br-md"
                                            : "bg-slate-100 text-slate-900 rounded-bl-md"
                                    )}
                                >
                                    <p className="leading-relaxed break-words">{msg.content}</p>
                                    <span className={cn(
                                        "text-[10px] block mt-1.5",
                                        isMe ? "text-indigo-200 text-right" : "text-slate-500"
                                    )}>
                                        {new Date(msg.created_at).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Scroll to bottom button */}
            {showScrollButton && (
                <button
                    onClick={() => scrollToBottom(true)}
                    className="absolute bottom-24 right-8 p-2 rounded-full bg-white shadow-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:shadow-xl transition-all"
                >
                    <ChevronDown className="h-5 w-5" />
                </button>
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-slate-100 bg-white">
                <form
                    ref={formRef}
                    action={handleSubmit}
                    className="flex gap-3"
                >
                    <input type="hidden" name="requestId" value={requestId} />
                    <Input
                        ref={inputRef}
                        name="content"
                        placeholder="Type a message..."
                        autoComplete="off"
                        disabled={isSending}
                        className="flex-1 h-12 border-slate-200 bg-slate-50 focus:bg-white transition-colors rounded-xl text-slate-900 placeholder:text-slate-400"
                    />
                    <Button
                        type="submit"
                        disabled={isSending}
                        size="lg"
                        className="h-12 px-5 bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                    >
                        {isSending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
