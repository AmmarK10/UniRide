'use server'

import { createClient } from '@/utils/supabase/server'

export async function sendMessage(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const requestId = formData.get('requestId') as string
    const content = formData.get('content') as string
    const receiverId = formData.get('receiverId') as string

    if (!content || !content.trim()) return

    const { error } = await supabase.from('messages').insert({
        ride_request_id: requestId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: content
    })

    if (error) return { error: error.message }
    // No revalidatePath needed because we use Realtime in the client
}
