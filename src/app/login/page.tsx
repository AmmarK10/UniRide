'use client'

import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Car, AlertCircle, CheckCircle, MailCheck, Loader2, ArrowLeft } from "lucide-react"

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSignedUp, setIsSignedUp] = useState(false)
    const [signupEmail, setSignupEmail] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setIsLoading(false)
            return
        }

        router.push('/')
        router.refresh()
    }

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        const { error, data } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/confirm`,
            },
        })

        if (error) {
            setError(error.message)
            setIsLoading(false)
            return
        }

        // Check if email confirmation is required (session is null but user exists)
        if (data.user && !data.session) {
            setSignupEmail(email)
            setIsSignedUp(true)
        } else if (data.session) {
            // Auto-confirmed (email confirmation disabled)
            router.push('/onboarding')
            router.refresh()
        }

        setIsLoading(false)
    }

    // Show success message after signup
    if (isSignedUp) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
                <Card className="w-full max-w-md border-0 shadow-2xl bg-white">
                    <CardContent className="pt-10 pb-8 px-8 text-center">
                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mb-6">
                            <MailCheck className="h-10 w-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3">
                            Check Your Email!
                        </h2>
                        <p className="text-slate-600 mb-2">
                            We've sent a confirmation link to:
                        </p>
                        <p className="font-medium text-indigo-600 mb-6">
                            {signupEmail}
                        </p>
                        <p className="text-sm text-slate-500 mb-8">
                            Please check your inbox and click the link to verify your account before logging in.
                        </p>
                        <Button
                            onClick={() => {
                                setIsSignedUp(false)
                                setError(null)
                            }}
                            className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Login
                        </Button>
                        <p className="text-xs text-slate-400 mt-4">
                            Didn't receive the email? Check your spam folder or try signing up again.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-blue-600 p-3 shadow-lg shadow-blue-500/50">
                        <Car className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
                        Welcome to UniRide
                    </h1>
                    <p className="mt-2 text-sm text-blue-200">
                        Connect, share rides, and save money on your commute.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-500/20 border border-red-500/50 p-4 text-red-200">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur">
                        <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-white">Login</TabsTrigger>
                        <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-white">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <Card className="border-0 shadow-2xl bg-white">
                            <CardHeader>
                                <CardTitle className="text-slate-900">Login</CardTitle>
                                <CardDescription className="text-slate-600">
                                    Enter your email below to login to your account
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleLogin} className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="text-slate-700">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="m@example.com"
                                            required
                                            disabled={isLoading}
                                            className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password" className="text-slate-700">Password</Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            disabled={isLoading}
                                            className="border-slate-300 bg-white text-slate-900"
                                        />
                                    </div>
                                    <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="signup">
                        <Card className="border-0 shadow-2xl bg-white">
                            <CardHeader>
                                <CardTitle className="text-slate-900">Sign Up</CardTitle>
                                <CardDescription className="text-slate-600">
                                    Create an account to get started
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSignup} className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="signup-email" className="text-slate-700">Email</Label>
                                        <Input
                                            id="signup-email"
                                            name="email"
                                            type="email"
                                            placeholder="m@example.com"
                                            required
                                            disabled={isLoading}
                                            className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="signup-password" className="text-slate-700">Password</Label>
                                        <Input
                                            id="signup-password"
                                            name="password"
                                            type="password"
                                            minLength={6}
                                            required
                                            disabled={isLoading}
                                            className="border-slate-300 bg-white text-slate-900"
                                        />
                                    </div>
                                    <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
