'use client';
import {
  Plane,
} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {useEffect, useState, useMemo} from 'react';
import {travelpayoutsApi} from '@/lib/travelpayouts';
import {Skeleton} from '../ui/skeleton';
import {format, parseISO} from 'date-fns';
import {Progress} from '../ui/progress';
import { FlightSearchParams } from '@/types/travel';
import { useFlightSearch } from '@/hooks/use-travel-search';
import { useAirlines } from '@/hooks/use-travel-search';


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

export function FlightResults({params}: {params: FlightSearchParams}) {
  const [visibleCount, setVisibleCount] = useState(5);
  const { data: airlinesData } = useAirlines();
  
  const { data: flightData, isLoading } = useFlightSearch(params, !!(params.origin && params.destination));
  
  const tickets = flightData?.tickets || [];
  const flightLegs = flightData?.flight_legs || [];
  const agents = Object.values(flightData?.agents || {});

  const airlinesMap = useMemo(
    () => new Map(airlinesData?.map((a: any) => [a.code, a]) || []),
    [airlinesData]
  );

  const agentsMap = useMemo(
    () => new Map(agents.map((a: any) => [a.id, a])),
    [agents]
  );
  
  const showMoreFlights = () => {
    setVisibleCount(prevCount => prevCount + 5);
  };


  if (isLoading && !flightData) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
              <Plane /> Searching for Flights...
            </h2>
          </div>
          <Progress value={flightData?.is_over ? 100 : undefined} className="w-full" />
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
            </div>
          
            {tickets.length > 0 ? (
                <>
                {tickets.slice(0, visibleCount).map((ticket, index) => (
                    <FlightCard
                    key={`${ticket.signature}-${index}`}
                    ticket={ticket}
                    flightLegs={flightLegs}
                    airlines={airlinesMap}
                    agents={agentsMap}
                    />
                ))}
                {visibleCount < tickets.length && (
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
