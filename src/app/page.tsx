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

  // Fetch ALL active rides
  console.log('=== PASSENGER DASHBOARD DEBUG ===')
  console.log('Fetching rides with status="active" and available_seats > 0')

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
    console.error('Query error:', ridesError)
  } else {
    console.log('Rides fetched:', allRides?.length)
    // Log first ride to check structure if exists
    if (allRides && allRides.length > 0) {
      console.log('First ride sample:', JSON.stringify(allRides[0], null, 2))
    }
  }

  console.log('Today:', getTodayAbbrev())

  // Filter rides
  let filteredRides = allRides || []
  const totalRides = filteredRides.length

  // 1. Filter by recurrence pattern
  // For debugging: We'll keep track of what's filtered
  const nonRecurrenceRides = filteredRides.filter(ride => !isRideAvailableToday(ride.recurrence_pattern))
  if (nonRecurrenceRides.length > 0) {
    console.log(`Filtered out ${nonRecurrenceRides.length} rides due to recurrence mismatch (Today: ${getTodayAbbrev()})`)
  }

  filteredRides = filteredRides.filter(ride => isRideAvailableToday(ride.recurrence_pattern))
  console.log('After recurrence filter:', filteredRides.length)

  // 2. Filter by Origin
  if (origin) {
    const searchOrigin = origin.toLowerCase()
    filteredRides = filteredRides.filter(ride =>
      ride.origin_location.toLowerCase().includes(searchOrigin) ||
      ride.destination_university.toLowerCase().includes(searchOrigin)
    )
    console.log('After origin filter:', filteredRides.length)
  }

  // 3. Filter by Time
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
    console.log('After time filter:', filteredRides.length)
  }

  // Get user's requests to filter out already requested rides
  const { data: userRequests } = await supabase
    .from('ride_requests')
    .select('ride_id, status')
    .eq('passenger_id', user.id)
    .in('status', ['pending', 'accepted'])

  const requestedRideIds = userRequests?.map(r => r.ride_id) || []

  // 4. Filter out already requested rides
  const availableRides = filteredRides.filter(r => !requestedRideIds.includes(r.id))

  console.log(`Filtered out ${filteredRides.length - availableRides.length} already requested rides`)
  console.log('Final available rides:', availableRides.length)
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
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                {origin
                  ? `No rides found from "${origin}". Try a different location.`
                  : 'Check back soon for new rides!'}
              </p>

              <RefreshButton />

              {/* Debug info */}
              <div className="mt-8 p-4 bg-slate-100 rounded-lg text-left text-xs text-slate-500 font-mono overflow-auto max-w-md mx-auto">
                <p className="font-bold mb-2">Debug Info:</p>
                <p>Total Active Rides in DB: {totalRides}</p>
                <p>Filtered by Day ({getTodayAbbrev()}): {nonRecurrenceRides.length} hidden</p>
                <p>Already Requested: {requestedRideIds.length}</p>
                <p>Final Visible: {availableRides.length}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
