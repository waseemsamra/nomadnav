'use client';
import {
  Plane,
  Clock,
  Landmark,
  ArrowRight,
  MoreHorizontal,
} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {useEffect, useState, useMemo} from 'react';
import {Skeleton} from '../ui/skeleton';
import {parseISO, getHours} from 'date-fns';
import {Progress} from '../ui/progress';
import { FlightSearchParams, FilterState } from '@/types/travel';
import { useFlightSearch } from '@/hooks/use-travel-search';
import { useAirlines } from '@/hooks/use-travel-search';
import { Badge } from '@/components/ui/badge';
import { formatDuration, formatDateString } from '@/lib/utils';


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
  const formatDate = (dateString: string) => {
    try {
      return formatDateString(dateString, 'hh:mm a');
    } catch (e) {
      return dateString;
    }
  };

  if (!ticket.proposals || ticket.proposals.length === 0) {
    return null;
  }

  const mainProposal = ticket.proposals[0];
  const agent = agentsMap.get(mainProposal.agent_id);

  const firstSegment = ticket.segments[0];
  const lastSegment = ticket.segments[ticket.segments.length - 1];
  
  if (!firstSegment || !lastSegment) return null;

  const firstLegOfFirstSegment = flightLegs[firstSegment.flights[0]];
  const lastLegOfLastSegment = flightLegs[lastSegment.flights[lastSegment.flights.length - 1]];

  if (!firstLegOfFirstSegment || !lastLegOfLastSegment) return null;

  const departureTime = firstLegOfFirstSegment.local_departure_date_time;
  const arrivalTime = lastLegOfLastSegment.local_arrival_date_time;
  
  const airlineIata = firstLegOfFirstSegment.operating_carrier_designator.carrier;
  const airline = airlinesMap.get(airlineIata);
  const airlineLogoUrl = `https://pics.aviasales.com/200/200/${airlineIata}.png`;
  
  const totalStops = ticket.segments.reduce((acc: number, seg: any) => acc + seg.transfers.length, 0);

  const totalDuration = useMemo(() => {
    return ticket.segments.reduce((total: number, segment: any) => {
      const firstLeg = flightLegs[segment.flights[0]];
      const lastLeg = flightLegs[segment.flights[segment.flights.length - 1]];
      if (firstLeg && lastLeg) {
        return total + (lastLeg.arrival_unix_timestamp - firstLeg.departure_unix_timestamp);
      }
      return total;
    }, 0) / 60;
  }, [ticket.segments, flightLegs]);
  
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Airline Info */}
        <div className="flex items-center gap-4 col-span-12 md:col-span-3">
          {airlineLogoUrl && <img src={airlineLogoUrl} alt={airline?.name || airlineIata} className="h-10 w-10 object-contain rounded-md" />}
          <div>
            <p className="font-semibold">{airline?.name || airlineIata}</p>
            <p className="text-xs text-muted-foreground">{firstLegOfFirstSegment.operating_carrier_designator.carrier} {firstLegOfFirstSegment.operating_carrier_designator.number}</p>
          </div>
        </div>

        {/* Flight Details */}
        <div className="flex items-center justify-between col-span-12 md:col-span-6 text-sm">
          <div className="text-left w-28">
            <p className="font-bold text-lg">{formatDate(departureTime)}</p>
            <p className="text-muted-foreground">{firstLegOfFirstSegment.origin}</p>
          </div>
          <div className="flex-grow text-center text-muted-foreground mx-4">
            <p className="text-xs">{formatDuration(totalDuration)}</p>
            <div className="relative h-px w-full bg-border my-1">
              {ticket.segments.flatMap((seg: any) => seg.transfers).map((transfer: any, i: number) => (
                  <div key={i} className="absolute -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" style={{left: `${(i+1)/(totalStops+1) * 100}%`}}></div>
              ))}
            </div>
            <p className="text-xs font-semibold text-primary">{totalStops === 0 ? 'Direct' : `${totalStops} stop(s)`}</p>
          </div>
          <div className="text-right w-28">
            <p className="font-bold text-lg">{formatDate(arrivalTime)}</p>
            <p className="text-muted-foreground">{lastLegOfLastSegment.destination}</p>
          </div>
        </div>

        {/* Pricing & Booking */}
        <div className="col-span-12 md:col-span-3 flex justify-between items-center md:flex-col md:items-end md:text-right gap-2 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-4">
          <div className='text-left md:text-right'>
            <p className="text-2xl font-bold text-primary">
              ${mainProposal.price.value.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">
              via {agent?.gate_name || 'Agent'}
            </p>
          </div>
          <Button asChild className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
            <a href={`https://www.aviasales.com${mainProposal.deeplink}`} target="_blank" rel="noopener noreferrer">
              Book
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export function FlightResults({params, filters}: {params: FlightSearchParams, filters: FilterState}) {
  const [visibleCount, setVisibleCount] = useState(5);
  const { data: airlinesData } = useAirlines();
  
  const { data: flightData, isLoading } = useFlightSearch(params, !!(params.origin && params.destination));
  
  const agents = Object.values(flightData?.agents || {});

  const airlinesMap = useMemo(
    () => new Map(airlinesData?.map((a: any) => [a.code, a]) || []),
    [airlinesData]
  );

  const agentsMap = useMemo(
    () => new Map(agents.map((a: any) => [a.id, a])),
    [agents]
  );
  
  const filteredAndSortedFlights = useMemo(() => {
    if (!flightData || !flightData.tickets) return [];
    
    let filtered = flightData.tickets.filter((ticket: any) => {
      if (!ticket.proposals || ticket.proposals.length === 0) return false;
      const mainProposal = ticket.proposals[0];
      const totalStops = ticket.segments.reduce((acc: number, seg: any) => acc + seg.transfers.length, 0);

      const firstLeg = flightData.flight_legs[ticket.segments[0].flights[0]];
      const departureHour = getHours(parseISO(firstLeg.local_departure_date_time));

      const lastLeg = flightData.flight_legs[ticket.segments[ticket.segments.length-1].flights[ticket.segments[ticket.segments.length-1].flights.length-1]];
      const arrivalHour = getHours(parseISO(lastLeg.local_arrival_date_time));

      const airlineIata = firstLeg.operating_carrier_designator.carrier;
      const airline = airlinesMap.get(airlineIata);

      const priceFilter = mainProposal.price.value <= filters.maxPrice;
      const stopsFilter = totalStops <= filters.maxStops;
      const airlineFilter = filters.airlines.length === 0 || (airline && filters.airlines.includes(airline.name));
      const departureFilter = departureHour >= filters.departureTime[0] && departureHour <= filters.departureTime[1];
      const arrivalFilter = arrivalHour >= filters.arrivalTime[0] && arrivalHour <= filters.arrivalTime[1];

      return priceFilter && stopsFilter && airlineFilter && departureFilter && arrivalFilter;
    });

    return filtered.sort((a: any, b: any) => {
      const priceA = a.proposals[0].price.value;
      const priceB = b.proposals[0].price.value;
      
      const durationA = a.segments.reduce((total: number, segment: any) => total + (flightData.flight_legs[segment.flights[segment.flights.length-1]].arrival_unix_timestamp - flightData.flight_legs[segment.flights[0]].departure_unix_timestamp), 0);
      const durationB = b.segments.reduce((total: number, segment: any) => total + (flightData.flight_legs[segment.flights[segment.flights.length-1]].arrival_unix_timestamp - flightData.flight_legs[segment.flights[0]].departure_unix_timestamp), 0);

      const departureA = flightData.flight_legs[a.segments[0].flights[0]].departure_unix_timestamp;
      const departureB = flightData.flight_legs[b.segments[0].flights[0]].departure_unix_timestamp;

      switch (filters.sortBy) {
        case 'price':
          return priceA - priceB;
        case 'duration':
          return durationA - durationB;
        case 'departure':
          return departureA - departureB;
        default:
          return 0;
      }
    });

  }, [flightData, filters, airlinesMap]);
  
  const showMoreFlights = () => {
    setVisibleCount(prevCount => prevCount + 5);
  };


  if (isLoading && !flightData) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane /> Searching for Flights...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={flightData?.is_over ? 100 : undefined} className="w-full" />
            <p className="text-center text-muted-foreground">
              Please wait while we find the best deals for you. This may take a moment.
            </p>
          </CardContent>
        </Card>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className='flex justify-between items-center'>
        <h2 className="text-2xl font-bold font-headline">Available Flights</h2>
        <Badge variant="secondary">{filteredAndSortedFlights.length} results</Badge>
      </div>
      
      {filteredAndSortedFlights.length > 0 ? (
          <>
          {filteredAndSortedFlights.slice(0, visibleCount).map((ticket, index) => (
              <FlightCard
              key={`${ticket.signature}-${index}`}
              ticket={ticket}
              flightLegs={flightData.flight_legs}
              airlines={airlinesMap}
              agents={agentsMap}
              />
          ))}
          {visibleCount < filteredAndSortedFlights.length && (
              <Button onClick={showMoreFlights} variant="outline" className="w-full">
                <MoreHorizontal className="mr-2"/>
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
    </div>
  );
}
