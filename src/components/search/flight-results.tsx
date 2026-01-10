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

const FlightCard = ({flight}: {flight: any}) => {
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

  const airlineLogoUrl = `https://pics.aviasales.com/200/200/${flight.airline}.png`;

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
        <div className="flex items-center gap-4 col-span-2 md:col-span-2">
          <img
            src={airlineLogoUrl}
            alt={flight.airline}
            className="h-10 w-10 object-contain"
          />
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
            <Badge variant="outline">
              <ArrowRightLeft className="mr-1 h-3 w-3" />
              {flight.transfers} stops
            </Badge>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">
              {flight.return_at ? formatDate(flight.return_at) : 'N/A'}
            </p>
            <p className="text-muted-foreground">{flight.destination}</p>
          </div>
        </div>

        <div className="text-center md:text-right col-span-2 md:col-span-1">
          <p className="text-2xl font-bold">${flight.price}</p>
          <p className="text-xs text-muted-foreground">per traveler</p>
          <Button asChild className="mt-2 w-full md:w-auto">
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
  const [filters, setFilters] = useState({
    maxPrice: 5000,
    sortBy: 'price',
  });

  useEffect(() => {
    const fetchFlights = async () => {
      if (params.origin && params.destination) {
        setLoading(true);
        try {
          const results = await travelpayoutsApi.searchFlights(params);
          const airlines = await travelpayoutsApi.getAirlines();
          const airlinesMap = new Map(
            airlines.map((a: any) => [a.code, a.name])
          );
          const enrichedResults = results.map((flight: any) => ({
            ...flight,
            airline_name: airlinesMap.get(flight.airline) || flight.airline,
          }));
          setFlights(enrichedResults);
        } catch (error) {
          console.error('Failed to fetch flights:', error);
          setFlights([]);
        }
        setLoading(false);
      } else {
        setLoading(false);
        setFlights([]);
      }
    };
    fetchFlights();
  }, [params]);

  const filteredAndSortedFlights = useMemo(() => {
    return flights
      .filter(flight => flight.price <= filters.maxPrice)
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'price':
            return a.price - b.price;
          case 'duration':
            return a.duration - b.duration;
          case 'departure':
            return (
              new Date(a.departure_at).getTime() -
              new Date(b.departure_at).getTime()
            );
          default:
            return 0;
        }
      });
  }, [flights, filters]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-10 w-24" />
        </div>
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
        filteredAndSortedFlights.map((flight, index) => (
          <FlightCard key={`${flight.link}-${index}`} flight={flight} />
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
