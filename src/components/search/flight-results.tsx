'use client';
import {
  Plane,
  Clock,
  ArrowRightLeft,
  Wallet,
  SlidersHorizontal,
} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';
import {Badge} from '@/components/ui/badge';
import {useEffect, useState, useMemo} from 'react';
import {travelpayoutsApi} from '@/lib/travelpayouts';
import {Skeleton} from '../ui/skeleton';
import {format, parseISO} from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Label} from '@/components/ui/label';
import {Slider} from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '../ui/progress';

const FlightCard = ({ ticket, flightLegs, airlines: airlinesMap }: { ticket: any; flightLegs: any[]; airlines: Map<string, any> }) => {
    
  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    try {
      const parsedDate = parseISO(dateString);
      return format(parsedDate, 'hh:mm a');
    } catch (e) {
      return dateString;
    }
  };

  const mainProposal = ticket.proposals[0];
  const firstSegment = ticket.segments[0];
  const lastSegment = ticket.segments[ticket.segments.length - 1];
  const firstLegOfFirstSegment = flightLegs[firstSegment.flights[0]];
  const lastLegOfFirstSegment = flightLegs[firstSegment.flights[firstSegment.flights.length - 1]];

  const airlineIata = firstLegOfFirstSegment.operating_carrier_designator.carrier;
  const airline = airlinesMap.get(airlineIata);
  const airlineLogoUrl = `https://pics.aviasales.com/200/200/${airlineIata}.png`;

  const totalStops = ticket.segments.reduce((acc: number, seg: any) => acc + seg.transfers.length, 0);

  const departureTime = firstLegOfFirstSegment.local_departure_date_time;
  const arrivalTime = lastLegOfFirstSegment.local_arrival_date_time;
  
  const totalDuration = ticket.segments.reduce((total: number, segment: any) => {
    const departure = flightLegs[segment.flights[0]].departure_unix_timestamp;
    const arrival = flightLegs[segment.flights[segment.flights.length-1]].arrival_unix_timestamp;
    return total + ((arrival - departure) / 60);
  }, 0);


  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
        <div className="flex items-center gap-4 col-span-2 md:col-span-2">
          <img
            src={airlineLogoUrl}
            alt={airline?.name || airlineIata}
            className="h-10 w-10 object-contain"
          />
          <div>
            <p className="font-semibold">{airline?.name || airlineIata}</p>
            <p className="text-xs text-muted-foreground">
              Flight {firstLegOfFirstSegment.operating_carrier_designator.number}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-center gap-4 col-span-2 md:col-span-3 text-sm">
          <div className="text-center">
            <p className="font-bold text-lg">
              {formatDate(departureTime)}
            </p>
            <p className="text-muted-foreground">{firstLegOfFirstSegment.origin}</p>
          </div>
          <div className="text-center text-muted-foreground min-w-24">
            <Clock className="mx-auto mb-1 h-4 w-4" />
            <p className="text-xs">{formatDuration(totalDuration)}</p>
            <Separator className="my-1" />
            <Badge variant="outline">
              <ArrowRightLeft className="mr-1 h-3 w-3" />
              {totalStops} stops
            </Badge>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">
              {formatDate(arrivalTime)}
            </p>
            <p className="text-muted-foreground">{lastLegOfFirstSegment.destination}</p>
          </div>
        </div>

        <div className="text-center md:text-right col-span-2 md:col-span-1">
          <p className="text-2xl font-bold">${mainProposal.price.value.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">per traveler</p>
          <Button asChild className="mt-2 w-full md:w-auto">
            <a
              href={`https://www.aviasales.com${mainProposal.deeplink}`}
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
  const [tickets, setTickets] = useState<any[]>([]);
  const [flightLegs, setFlightLegs] = useState<any[]>([]);
  const [airlines, setAirlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [filters, setFilters] = useState({
    maxPrice: 5000,
    sortBy: 'price',
  });

  useEffect(() => {
    const fetchFlights = async () => {
      if (params.origin && params.destination) {
        setLoading(true);
        setLoadingProgress(0);
        setTickets([]);
        try {
          const searchId = await travelpayoutsApi.searchFlightsRealtime(params);
          setLoadingProgress(20);

          let results:any = {};
          let attempts = 0;
          const maxAttempts = 10;
          
          while(attempts < maxAttempts) {
            results = await travelpayoutsApi.getFlightSearchResults(searchId);
            const currentProgress = (attempts + 1) / maxAttempts * 80 + 20;
            setLoadingProgress(currentProgress > 100 ? 100 : currentProgress);
            
            if (results.tickets && results.tickets.length > 0) {
              setTickets(results.tickets || []);
              setFlightLegs(results.flight_legs || []);
            }

            if (results.is_over) {
              setLoadingProgress(100);
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds
            attempts++;
          }

          const airlinesData = await travelpayoutsApi.getAirlines();
          setAirlines(airlinesData);

        } catch (error) {
          console.error('Failed to fetch flights:', error);
          setTickets([]);
        }
        setLoading(false);
      } else {
        setLoading(false);
        setTickets([]);
      }
    };
    fetchFlights();
  }, [params]);

  const filteredAndSortedFlights = useMemo(() => {
    if (!tickets || tickets.length === 0) return [];
    
    return tickets
      .filter(ticket => ticket.proposals[0].price.value <= filters.maxPrice)
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'price':
            return a.proposals[0].price.value - b.proposals[0].price.value;
          case 'duration':
            const durationA = a.segments.reduce((total: number, segment: any) => {
              const departure = flightLegs[segment.flights[0]].departure_unix_timestamp;
              const arrival = flightLegs[segment.flights[segment.flights.length-1]].arrival_unix_timestamp;
              return total + ((arrival - departure) / 60);
            }, 0);
            const durationB = b.segments.reduce((total: number, segment: any) => {
                const departure = flightLegs[segment.flights[0]].departure_unix_timestamp;
                const arrival = flightLegs[segment.flights[segment.flights.length-1]].arrival_unix_timestamp;
                return total + ((arrival - departure) / 60);
            }, 0);
            return durationA - durationB;
          case 'departure':
             const departureA = flightLegs[a.segments[0].flights[0]].departure_unix_timestamp;
             const departureB = flightLegs[b.segments[0].flights[0]].departure_unix_timestamp;
            return departureA - departureB;
          default:
            return 0;
        }
      });
  }, [tickets, filters, flightLegs]);

  const airlinesMap = useMemo(() => new Map(airlines.map((a: any) => [a.code, a])), [airlines]);


  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
            <Plane /> Searching for Flights...
          </h2>
        </div>
        <Progress value={loadingProgress} className="w-full" />
        <p className='text-center text-muted-foreground'>Please wait while we find the best deals for you. This may take a moment.</p>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
          <Plane /> Available Flights
        </h2>
        <Collapsible className="w-full sm:w-auto">
          <CollapsibleTrigger asChild>
            <Button variant="outline">
              <SlidersHorizontal className="mr-2" />
              Filter & Sort
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 sm:mt-0 sm:absolute sm:right-0 sm:top-full sm:z-10 sm:w-80 sm:p-4 sm:bg-card sm:border sm:rounded-lg sm:shadow-lg">
            <div className="space-y-4">
              <div>
                <Label htmlFor="sort-by">Sort by</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={value =>
                    setFilters(prev => ({...prev, sortBy: value}))
                  }
                >
                  <SelectTrigger id="sort-by" className="w-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Price: Low to High</SelectItem>
                    <SelectItem value="duration">Shortest Duration</SelectItem>
                    <SelectItem value="departure">
                      Earliest Departure
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="max-price">Max Price</Label>
                  <span className="text-sm font-medium text-primary">
                    ${filters.maxPrice}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet />
                  <Slider
                    id="max-price"
                    min={0}
                    max={5000}
                    step={10}
                    value={[filters.maxPrice]}
                    onValueChange={value =>
                      setFilters(prev => ({...prev, maxPrice: value[0]}))
                    }
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {filteredAndSortedFlights.length > 0 ? (
        filteredAndSortedFlights.map((ticket, index) => (
          <FlightCard key={`${ticket.signature}-${index}`} ticket={ticket} flightLegs={flightLegs} airlines={airlinesMap} />
        ))
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No flights found for this route or your filter criteria. Try a
            different search or adjust your filters.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
