import { Plane, Clock, Landmark } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { mockFlights } from '@/lib/placeholder-data';

export function FlightResults() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold font-headline flex items-center gap-2"><Plane /> Available Flights</h2>
      {mockFlights.map((flight) => (
        <Card key={flight.id} className="transition-shadow hover:shadow-lg">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
            <div className="flex items-center gap-4 col-span-2 md:col-span-2">
              <Landmark className="h-8 w-8 text-muted-foreground hidden sm:block" />
              <div>
                <p className="font-semibold">{flight.airline}</p>
                <p className="text-xs text-muted-foreground">Flight {flight.id}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between md:justify-center gap-4 col-span-2 md:col-span-3 text-sm">
              <div className="text-center">
                <p className="font-bold text-lg">{flight.departureTime}</p>
                <p className="text-muted-foreground">{flight.from}</p>
              </div>
              <div className="text-center text-muted-foreground min-w-24">
                <Clock className="mx-auto mb-1 h-4 w-4" />
                <p className="text-xs">{flight.duration}</p>
                <Separator className="my-1"/>
                <Badge variant="outline">{flight.stops}</Badge>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{flight.arrivalTime}</p>
                <p className="text-muted-foreground">{flight.to}</p>
              </div>
            </div>

            <div className="text-center md:text-right col-span-2 md:col-span-1">
              <p className="text-2xl font-bold">${flight.price}</p>
              <p className="text-xs text-muted-foreground">per traveler</p>
              <Button className="mt-2 w-full md:w-auto">Select Flight</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
