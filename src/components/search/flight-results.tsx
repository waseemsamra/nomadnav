'use client';
import {Plane, Clock, Landmark} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';
import {Badge} from '@/components/ui/badge';
import {useEffect, useState} from 'react';
import {travelpayoutsApi} from '@/lib/travelpayouts';
import {Skeleton} from '../ui/skeleton';
import {format, parseISO} from 'date-fns';

const FlightCard = ({flight}: {flight: any}) => {
  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'hh:mm a');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
        <div className="flex items-center gap-4 col-span-2 md:col-span-2">
          <Landmark className="h-8 w-8 text-muted-foreground hidden sm:block" />
          <div>
            <p className="font-semibold">{flight.airline_name}</p>
            <p className="text-xs text-muted-foreground">
              Flight {flight.flight_number}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-center gap-4 col-span-2 md:col-span-3 text-sm">
          <div className="text-center">
            <p className="font-bold text-lg">
              {formatDate(flight.departure_at)}
            </p>
            <p className="text-muted-foreground">{flight.origin}</p>
          </div>
          <div className="text-center text-muted-foreground min-w-24">
            <Clock className="mx-auto mb-1 h-4 w-4" />
            <p className="text-xs">{formatDuration(flight.duration)}</p>
            <Separator className="my-1" />
            <Badge variant="outline">{flight.transfers} stops</Badge>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{formatDate(flight.return_at)}</p>
            <p className="text-muted-foreground">{flight.destination}</p>
          </div>
        </div>

        <div className="text-center md:text-right col-span-2 md:col-span-1">
          <p className="text-2xl font-bold">${flight.price}</p>
          <p className="text-xs text-muted-foreground">per traveler</p>
          <Button
            asChild
            className="mt-2 w-full md:w-auto"
          >
            <a
              href={`https://www.aviasales.com${flight.link}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Select Flight
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export function FlightResults({params}: {params: any}) {
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlights = async () => {
      if (params.origin && params.destination) {
        setLoading(true);
        try {
          const results = await travelpayoutsApi.searchFlights(params);
          setFlights(results);
        } catch (error) {
          console.error('Failed to fetch flights:', error);
        }
        setLoading(false);
      }
    };
    fetchFlights();
  }, [params]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4 mb-4" />
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
        <Plane /> Available Flights
      </h2>
      {flights.length > 0 ? (
        flights.map((flight, index) => <FlightCard key={index} flight={flight} />)
      ) : (
        <p>No flights found for this route.</p>
      )}
    </div>
  );
}
