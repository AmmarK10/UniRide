import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Car, MapPin, Ticket, LogOut, User, LayoutDashboard, Search } from 'lucide-react'
import SearchBar from './components/SearchBar'
import AvailableRideCard from './components/AvailableRideCard'
import MyRideCard from './components/MyRideCard'
import RefreshButton from '@/components/RefreshButton'

export const dynamic = 'force-dynamic'

// Helper to get day abbreviation
function getTodayAbbrev(): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[new Date().getDay()]
}

// Helper to check if ride is available today based on recurrence
function isRideAvailableToday(recurrencePattern: string | null): boolean {
  if (!recurrencePattern || recurrencePattern === 'One-off') {
    return true
  }
  const today = getTodayAbbrev()
  return recurrencePattern.includes(today)
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ origin?: string; time?: string }>
}) {
  const { origin, time } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.university_name) {
    redirect('/onboarding')
  }

  if (profile.is_driver) {
    redirect('/driver/dashboard')
  }

  // Fetch user's requests first
  const { data: userRequests } = await supabase
    .from('ride_requests')
    .select(`
            id,
            ride_id,
            status,
            rides:ride_id (
                origin_location,
                destination_university,
                departure_time,
                driver:driver_id(full_name, university_name)
            )
        `)
    .eq('passenger_id', user.id)
    .in('status', ['pending', 'accepted'])
    .order('created_at', { ascending: false }) // Newest first

  const requestedRideIds = userRequests?.map(r => r.ride_id) || []

  // Fetch ALL active rides
  const { data: allRides } = await supabase
    .from('rides')
    .select(`
            *,
            driver:driver_id(full_name, university_name, avatar_url)
        `)
    .eq('status', 'active')
    .gt('available_seats', 0)
    .order('departure_time', { ascending: true })

  // Filter rides
  let filteredRides = allRides || []

  // Filter by recurrence pattern
  filteredRides = filteredRides.filter(ride => isRideAvailableToday(ride.recurrence_pattern))

  if (origin) {
    const searchOrigin = origin.toLowerCase()
    filteredRides = filteredRides.filter(ride =>
      ride.origin_location.toLowerCase().includes(searchOrigin) ||
      ride.destination_university.toLowerCase().includes(searchOrigin)
    )
  }

  if (time) {
    const [searchHour, searchMin] = time.split(':').map(Number)
    const searchMinutes = searchHour * 60 + searchMin
    filteredRides = filteredRides.filter(ride => {
      const rideDate = new Date(ride.departure_time)
      const rideMinutes = rideDate.getHours() * 60 + rideDate.getMinutes()
      const diff = Math.abs(rideMinutes - searchMinutes)
      // Allow rides within 2 hours
      return diff <= 120
    })
  }

  // Filter out already requested rides
  const availableRides = filteredRides.filter(r => !requestedRideIds.includes(r.id))

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                UniRide
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm">
                <User className="h-4 w-4" />
                <span>{profile.full_name || 'Passenger'}</span>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

        {/* Hero / Search Section */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />

          <div className="relative z-10 max-w-2xl">
            <Badge variant="secondary" className="mb-4 bg-indigo-100 text-indigo-700 border-0">
              <MapPin className="h-3 w-3 mr-1" />
              {profile.university_name}
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Where are you heading today?
            </h1>
            <p className="text-slate-500 mb-6">
              Find fellow students to share your commute.
            </p>
            <SearchBar />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Content: Available Rides */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Search className="h-5 w-5 text-indigo-600" />
                Available Rides
              </h2>
              {(origin || time) && (
                <Link href="/">
                  <Button variant="outline" size="sm">Clear Filters</Button>
                </Link>
              )}
            </div>

            {availableRides.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {availableRides.map((ride: any) => (
                  <AvailableRideCard key={ride.id} ride={ride} />
                ))}
              </div>
            ) : (
              <Card className="border border-dashed border-slate-300 bg-slate-50/50 rounded-2xl">
                <CardContent className="py-12 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                    <Car className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No rides available
                  </h3>
                  <p className="text-slate-500 max-w-sm mx-auto mb-6 text-sm">
                    {origin
                      ? `No rides matches for "${origin}".`
                      : 'There are no other rides available right now.'}
                  </p>
                  <RefreshButton />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar: My Rides */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-indigo-600" />
              My Rides
            </h2>

            {userRequests && userRequests.length > 0 ? (
              <div className="space-y-4">
                {userRequests.map((req: any) => (
                  <MyRideCard key={req.id} request={req} />
                ))}
              </div>
            ) : (
              <Card className="bg-white border-slate-200">
                <CardContent className="py-8 text-center">
                  <Ticket className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-medium text-slate-900">No active trips</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    You haven't requested any rides yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
