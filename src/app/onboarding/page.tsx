'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Car, Users, Loader2, AlertCircle } from "lucide-react"
import { UNIVERSITIES } from "@/lib/constants"

export default function OnboardingPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedRole, setSelectedRole] = useState<'passenger' | 'driver'>('passenger')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const fullName = formData.get('fullName') as string
        const university = formData.get('university') as string

        try {
            console.log('=== ONBOARDING SUBMIT ===')
            const supabase = createClient()

            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setError('You must be logged in to complete your profile.')
                setIsLoading(false)
                router.push('/login')
                return
            }

            console.log('Saving profile for user:', user.id)
            console.log('Data:', { fullName, university, role: selectedRole })

            // Upsert profile
            const { error: upsertError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: fullName,
                    university_name: university,
                    is_driver: selectedRole === 'driver',
                }, {
                    onConflict: 'id'
                })

            if (upsertError) {
                console.error('Profile upsert error:', upsertError)
                setError(`Failed to save profile: ${upsertError.message}`)
                setIsLoading(false)
                return
            }

            console.log('Profile saved successfully!')

            // Redirect based on role
            if (selectedRole === 'driver') {
                console.log('Redirecting to driver dashboard...')
                router.push('/driver/dashboard')
            } else {
                console.log('Redirecting to passenger home...')
                router.push('/')
            }

            router.refresh()
        } catch (err: any) {
            console.error('Onboarding error:', err)
            setError(`An error occurred: ${err.message}`)
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
            <Card className="w-full max-w-lg border-0 shadow-2xl bg-white">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-slate-900">Complete Your Profile</CardTitle>
                    <CardDescription className="text-slate-600">
                        Tell us a bit more about yourself to get started.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-4 mb-6 text-red-700">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-slate-700">Full Name</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                placeholder="Ahmad Khan"
                                required
                                disabled={isLoading}
                                className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="university" className="text-slate-700">University</Label>
                            <Select name="university" required disabled={isLoading}>
                                <SelectTrigger className="border-slate-300 bg-white text-slate-900">
                                    <SelectValue placeholder="Select your university" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {UNIVERSITIES.map((uni) => (
                                        <SelectItem key={uni.value} value={uni.value}>
                                            {uni.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-slate-700">I want to be a...</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRole('passenger')}
                                    disabled={isLoading}
                                    className={`flex flex-col items-center space-y-2 rounded-lg border-2 p-4 transition-all ${selectedRole === 'passenger'
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                                        }`}
                                >
                                    <Users className={`h-8 w-8 ${selectedRole === 'passenger' ? 'text-blue-600' : 'text-slate-400'}`} />
                                    <span className={`text-base font-medium ${selectedRole === 'passenger' ? 'text-blue-700' : 'text-slate-700'}`}>
                                        Passenger
                                    </span>
                                    <span className="text-xs text-slate-500">Find rides</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedRole('driver')}
                                    disabled={isLoading}
                                    className={`flex flex-col items-center space-y-2 rounded-lg border-2 p-4 transition-all ${selectedRole === 'driver'
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                                        }`}
                                >
                                    <Car className={`h-8 w-8 ${selectedRole === 'driver' ? 'text-blue-600' : 'text-slate-400'}`} />
                                    <span className={`text-base font-medium ${selectedRole === 'driver' ? 'text-blue-700' : 'text-slate-700'}`}>
                                        Driver
                                    </span>
                                    <span className="text-xs text-slate-500">Offer rides</span>
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Complete Profile'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
