import { createRide } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CreateRidePage() {
    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Post a New Ride</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={createRide} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="origin">Origin</Label>
                                <Input id="origin" name="origin" placeholder="e.g. Downtown" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="destination">Destination University</Label>
                                <Input id="destination" name="destination" placeholder="e.g. Harvard" required />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" name="date" type="date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time">Time</Label>
                                <Input id="time" name="time" type="time" required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="seats">Available Seats</Label>
                            <Input id="seats" name="seats" type="number" min="1" max="6" defaultValue="3" required />
                        </div>

                        <Button type="submit" className="w-full">
                            Publish Ride
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
