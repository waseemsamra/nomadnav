'use client';
import {
  Plane,
  Clock,
  Wallet,
  SlidersHorizontal,
  ArrowRight,
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
import {Progress} from '../ui/progress';

const FlightCard = ({
  ticket,
  flightLegs,
  airlines: airlinesMap,
  agents: agentsMap,
}: {
  ticket: any;
  flightLegs: any[];
  airlines: Map<string, any>;
  agents: Map<string, any>;
}) => {
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
  const agent = agentsMap.get(mainProposal.agent_id);

  const firstSegment = ticket.segments[0];
  const lastSegment = ticket.segments[ticket.segments.length - 1];
  const firstLegOfFirstSegment = flightLegs[firstSegment.flights[0]];
  const lastLegOfFirstSegment =
    flightLegs[firstSegment.flights[firstSegment.flights.length - 1]];

  const airlineIata =
    firstLegOfFirstSegment.operating_carrier_designator.carrier;
  const airline = airlinesMap.get(airlineIata);
  const airlineLogoUrl = `https://pics.aviasales.com/200/200/${airlineIata}.png`;

  const totalStops = ticket.segments.reduce(
    (acc: number, seg: any) => acc + seg.transfers.length,
    0
  );

  const departureTime = firstLegOfFirstSegment.local_departure_date_time;
  const arrivalTime = lastLegOfFirstSegment.local_arrival_date_time;

  const totalDuration = ticket.segments.reduce((total: number, segment: any) => {
    const departure = flightLegs[segment.flights[0]].departure_unix_timestamp;
    const arrival =
      flightLegs[segment.flights[segment.flights.length - 1]]
        .arrival_unix_timestamp;
    return total + (arrival - departure) / 60;
  }, 0);

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
        <div className="flex items-center gap-4 col-span-2 md:col-span-2">
          <img
            src={airlineLogoUrl}
            alt={airline?.name || airlineIata}
            className="h-10 w-10 object-contain"
          />
        </div>

        <div className="flex items-center justify-between md:justify-center gap-4 col-span-7 md:col-span-3 text-sm">
          <div className="text-left">
            <p className="font-bold text-lg">{formatDate(departureTime)}</p>
            <p className="text-muted-foreground">
              {firstLegOfFirstSegment.origin}
            </p>
          </div>
          <div className="text-center text-muted-foreground min-w-24">
            <p className="text-xs">{formatDuration(totalDuration)}</p>
            <div className="relative h-px w-full bg-border my-1">
              <div className="absolute -left-1 -top-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground"></div>
              <div className="absolute -right-1 -top-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground"></div>
            </div>
            <p className="text-xs">
              {totalStops === 0 ? 'Direct' : `${totalStops} stop(s)`}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{formatDate(arrivalTime)}</p>
            <p className="text-muted-foreground">
              {lastLegOfFirstSegment.destination}
            </p>
          </div>
        </div>

        <div className="col-span-7 md:col-span-2 flex justify-between items-center md:flex-col md:items-end md:text-right gap-2">
          <div className='text-left'>
            <p className="text-xl font-bold text-primary">
              ${mainProposal.price.value.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">
              via {agent?.gate_name || 'Agent'}
            </p>
          </div>
          <Button asChild className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
            <a
              href={`https://www.aviasales.com${mainProposal.deeplink}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book
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
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [visibleCount, setVisibleCount] = useState(5);
  const [filters, setFilters] = useState({
    maxPrice: 5000,
    sortBy: 'price',
    stops: 'all',
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

          let results: any = {};
          let attempts = 0;
          const maxAttempts = 10;

          while (attempts < maxAttempts) {
            results = await travelpayoutsApi.getFlightSearchResults(searchId);
            const currentProgress = ((attempts + 1) / maxAttempts) * 80 + 20;
            setLoadingProgress(currentProgress > 100 ? 100 : currentProgress);

            if (results.tickets && results.tickets.length > 0) {
              setTickets(results.tickets || []);
              setFlightLegs(results.flight_legs || []);
              setAgents(Object.values(results.agents || {}));
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
      .filter(ticket => {
        const stops = ticket.segments.reduce(
          (acc: number, seg: any) => acc + seg.transfers.length,
          0
        );
        const price = ticket.proposals[0].price.value;
        const stopFilter =
          filters.stops === 'all' ||
          (filters.stops === 'direct' && stops === 0) ||
          (filters.stops === '1' && stops === 1) ||
          (filters.stops === '2+' && stops >= 2);

        return price <= filters.maxPrice && stopFilter;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'price':
            return a.proposals[0].price.value - b.proposals[0].price.value;
          case 'duration':
            const durationA = a.segments.reduce(
              (total: number, segment: any) => {
                const departure =
                  flightLegs[segment.flights[0]].departure_unix_timestamp;
                const arrival =
                  flightLegs[segment.flights[segment.flights.length - 1]]
                    .arrival_unix_timestamp;
                return total + (arrival - departure) / 60;
              },
              0
            );
            const durationB = b.segments.reduce(
              (total: number, segment: any) => {
                const departure =
                  flightLegs[segment.flights[0]].departure_unix_timestamp;
                const arrival =
                  flightLegs[segment.flights[segment.flights.length - 1]]
                    .arrival_unix_timestamp;
                return total + (arrival - departure) / 60;
              },
              0
            );
            return durationA - durationB;
          case 'departure':
            const departureA =
              flightLegs[a.segments[0].flights[0]].departure_unix_timestamp;
            const departureB =
              flightLegs[b.segments[0].flights[0]].departure_unix_timestamp;
            return departureA - departureB;
          default:
            return 0;
        }
      });
  }, [tickets, filters, flightLegs]);

  const airlinesMap = useMemo(
    () => new Map(airlines.map((a: any) => [a.code, a])),
    [airlines]
  );

  const agentsMap = useMemo(
    () => new Map(agents.map((a: any) => [a.id, a])),
    [agents]
  );
  
  const showMoreFlights = () => {
    setVisibleCount(prevCount => prevCount + 5);
  };


  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
              <Plane /> Searching for Flights...
            </h2>
          </div>
          <Progress value={loadingProgress} className="w-full" />
          <p className="text-center text-muted-foreground">
            Please wait while we find the best deals for you. This may take a
            moment.
          </p>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-4">
            <div className='flex justify-between items-center'>
                <h2 className="text-xl font-bold font-headline">Available Flights</h2>
                 <Select
                  value={filters.sortBy}
                  onValueChange={value =>
                    setFilters(prev => ({...prev, sortBy: value}))
                  }
                >
                  <SelectTrigger id="sort-by" className="w-auto">
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
          
            {filteredAndSortedFlights.length > 0 ? (
                <>
                {filteredAndSortedFlights.slice(0, visibleCount).map((ticket, index) => (
                    <FlightCard
                    key={`${ticket.signature}-${index}`}
                    ticket={ticket}
                    flightLegs={flightLegs}
                    airlines={airlinesMap}
                    agents={agentsMap}
                    />
                ))}
                {visibleCount < filteredAndSortedFlights.length && (
                    <Button onClick={showMoreFlights} variant="outline" className="w-full">
                    Show More Flights
                    </Button>
                )}
                </>
            ) : (
                <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    No flights found for this route or your filter criteria. Try a
                    different search or adjust your filters.
                </CardContent>
                </Card>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
