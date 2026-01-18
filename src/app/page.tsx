import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Car, MapPin, Ticket, LogOut, User, MessageCircle, CheckCircle, Clock } from 'lucide-react'
import SearchBar from './components/SearchBar'
import AvailableRideCard from './components/AvailableRideCard'
import { formatDateTimePKT } from '@/lib/timezone'

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

  // Fetch ALL active rides (no driver filter - passengers see all rides)
  console.log('=== PASSENGER DASHBOARD DEBUG ===')

  const { data: allRides, error: ridesError } = await supabase
    .from('rides')
    .select(`
            *,
            driver:driver_id(full_name, university_name, avatar_url)
        `)
    .eq('status', 'active')
    .gt('available_seats', 0)
    .order('departure_time', { ascending: true })

  if (ridesError) {
    console.error('Rides fetch error:', ridesError)
  }

  console.log('Total active rides from DB:', allRides?.length || 0)
  console.log('Today:', getTodayAbbrev())

  // Filter rides
  let filteredRides = allRides || []

  // Filter by recurrence pattern
  filteredRides = filteredRides.filter(ride => isRideAvailableToday(ride.recurrence_pattern))
  console.log('After recurrence filter:', filteredRides.length)

  if (origin) {
    const searchOrigin = origin.toLowerCase()
    filteredRides = filteredRides.filter(ride =>
      ride.origin_location.toLowerCase().includes(searchOrigin) ||
      ride.destination_university.toLowerCase().includes(searchOrigin)
    )
    console.log('After origin filter:', filteredRides.length)
  }

  if (time) {
    const [searchHour, searchMin] = time.split(':').map(Number)
    const searchMinutes = searchHour * 60 + searchMin
    filteredRides = filteredRides.filter(ride => {
      const rideDate = new Date(ride.departure_time)
      const rideMinutes = rideDate.getHours() * 60 + rideDate.getMinutes()
      const diff = Math.abs(rideMinutes - searchMinutes)
      return diff <= 120
    })
    console.log('After time filter:', filteredRides.length)
  }

  // Get user's requests
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

  const requestedRideIds = userRequests?.map(r => r.ride_id) || []
  const acceptedRequests = userRequests?.filter(r => r.status === 'accepted') || []
  const pendingRequests = userRequests?.filter(r => r.status === 'pending') || []

  // Filter out already requested rides
  const availableRides = filteredRides.filter(r => !requestedRideIds.includes(r.id))
  console.log('Final available rides (after filtering requested):', availableRides.length)
  console.log('=== END DEBUG ===')

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
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
              <Link href="/trips">
                <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-900">
                  <Ticket className="h-4 w-4" />
                  <span className="hidden sm:inline">My Trips</span>
                </Button>
              </Link>
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

      {/* Active Chats Section - Show if there are accepted requests */}
      {acceptedRequests.length > 0 && (
        <section className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900">Active Rides</h2>
              <Badge className="bg-emerald-100 text-emerald-700 border-0">
                {acceptedRequests.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {acceptedRequests.map((req: any) => {
                const driverInitials = req.rides?.driver?.full_name
                  ?.split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase() || '?'

                return (
                  <Card key={req.id} className="border-emerald-200 bg-white hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-10 w-10 border-2 border-emerald-200">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-medium">
                            {driverInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 truncate">
                              {req.rides?.driver?.full_name}
                            </p>
                            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          </div>
                          <p className="text-xs text-slate-500">
                            {req.rides?.origin_location} → {req.rides?.destination_university}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDateTimePKT(req.rides?.departure_time)}</span>
                      </div>
                      <Link href={`/chat/${req.id}`}>
                        <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                          <MessageCircle className="h-4 w-4" />
                          Chat with {req.rides?.driver?.full_name?.split(' ')[0]}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Pending Requests Notification */}
      {pendingRequests.length > 0 && (
        <section className="bg-amber-50 border-b border-amber-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  {pendingRequests.length} pending request{pendingRequests.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-slate-500">Waiting for driver approval</p>
              </div>
              <Link href="/trips" className="ml-auto">
                <Button variant="outline" size="sm" className="border-amber-200 text-amber-700 hover:bg-amber-100">
                  View All
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-4 bg-indigo-100 text-indigo-700 border-0">
              <MapPin className="h-3 w-3 mr-1" />
              {profile.university_name}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
              Find your ride to{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                campus
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-8">
              Connect with verified students, share rides, and make your commute better.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Available Rides</h2>
            <p className="text-slate-500 mt-1">
              {availableRides.length} ride{availableRides.length !== 1 ? 's' : ''} found
              {origin && ` for "${origin}"`}
            </p>
          </div>
          {(origin || time) && (
            <Link href="/">
              <Button variant="outline" size="sm">Clear Filters</Button>
            </Link>
          )}
        </div>

        {availableRides.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableRides.map((ride: any) => (
              <AvailableRideCard key={ride.id} ride={ride} />
            ))}
          </div>
        ) : (
          <Card className="border border-dashed border-slate-300 bg-slate-50/50 rounded-2xl">
            <CardContent className="py-20 text-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-6">
                <Car className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No rides available yet
              </h3>
              <p className="text-slate-500 max-w-md mx-auto mb-4">
                {origin
                  ? `No rides found from "${origin}". Try a different location.`
                  : 'Check back soon for new rides!'}
              </p>
              {/* Debug info */}
              <p className="text-xs text-slate-400 mt-4">
                Debug: {allRides?.length || 0} total rides in DB | Today: {getTodayAbbrev()}
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
