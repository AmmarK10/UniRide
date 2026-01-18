import { completeProfile } from "./actions"
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
import { Car, Users } from "lucide-react"
import { UNIVERSITIES } from "@/lib/constants"

export default function OnboardingPage() {
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
                    <form action={completeProfile} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-slate-700">Full Name</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                placeholder="Ahmad Khan"
                                required
                                className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="university" className="text-slate-700">University</Label>
                            <Select name="university" required>
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
                                <label htmlFor="passenger" className="cursor-pointer">
                                    <div className="flex flex-col items-center space-y-2 rounded-lg border-2 border-slate-200 p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                                        <Users className="h-8 w-8 text-blue-600" />
                                        <input type="radio" id="passenger" name="role" value="passenger" className="sr-only" defaultChecked />
                                        <span className="text-base font-medium text-slate-900">Passenger</span>
                                        <span className="text-xs text-slate-500">Find rides</span>
                                    </div>
                                </label>
                                <label htmlFor="driver" className="cursor-pointer">
                                    <div className="flex flex-col items-center space-y-2 rounded-lg border-2 border-slate-200 p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                                        <Car className="h-8 w-8 text-blue-600" />
                                        <input type="radio" id="driver" name="role" value="driver" className="sr-only" />
                                        <span className="text-base font-medium text-slate-900">Driver</span>
                                        <span className="text-xs text-slate-500">Offer rides</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            Complete Profile
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
