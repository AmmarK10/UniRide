import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Car, LogOut, User } from 'lucide-react'
import UnreadBadge from '@/components/UnreadBadge'

export default async function DriverLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_driver, full_name')
        .eq('id', user.id)
        .single()

    if (!profile?.is_driver) {
        redirect('/')
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/driver/dashboard" className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                                <Car className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                UniRide
                            </span>
                        </Link>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm relative">
                                <User className="h-4 w-4" />
                                <span>{profile?.full_name || 'Driver'}</span>
                                <UnreadBadge />
                            </div>
                            <form action="/auth/signout" method="post">
                                <Button
                                    type="submit"
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 gap-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline">Sign Out</span>
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>
            <main>
                {children}
            </main>
        </div>
    )
}
