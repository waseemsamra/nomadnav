'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { type Flight } from '@/services/travelpayoutsApi';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Clock, Wind, Calendar, Plane } from 'lucide-react';
import { format } from 'date-fns';
import { travelpayoutsApi } from '@/services/travelpayoutsApi';


interface GroupedFlightResultsProps {
  flights: Flight[];
  onBookFlight: (flight: Flight) => void;
  baggageFilter: 'all' | 'without' | 'with';
}

interface OtaGroup {
  otaName: string;
  otaLogo: string;
  cheapestPrice: number;
  bestFlight: Flight;
  flights: Flight[];
}

const FlightDetailCard = ({ flight, baggageFilter }: { flight: Flight; baggageFilter: 'all' | 'without' | 'with' }) => {

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const formatDate = (dateString: string) => {
        try {
        return format(new Date(dateString), 'MMM dd, HH:mm');
        } catch {
        return dateString;
        }
    };

    const displayPrice = travelpayoutsApi.getFlightDisplayPrice(flight, baggageFilter);

    return (
        <div className="border-t">
            <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="col-span-1 flex items-center gap-3">
                    <Image
                        src={`https://pics.aviasales.com/92/92/${flight.airline_code}.png`}
                        alt={`${flight.airline || 'Airline'} logo`}
                        width={32}
                        height={32}
                        className="rounded-full bg-gray-100"
                        unoptimized
                    />
                    <div>
                        <div className="font-semibold text-sm">{flight.airline}</div>
                        <div className="text-xs text-gray-500">{flight.flight_number}</div>
                    </div>
                </div>

                <div className="col-span-2 grid grid-cols-3 gap-2 text-sm">
                     <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400"/>
                        <div>
                            <div className="text-gray-500 text-xs">Depart</div>
                            <div className="font-medium">{formatDate(flight.departure_at)}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                            <div className="text-gray-500 text-xs">Duration</div>
                            <div className="font-medium">{formatDuration(flight.duration)}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Wind className="w-4 h-4 text-gray-400" />
                        <div>
                            <div className="text-gray-500 text-xs">Stops</div>
                            <div className={`font-medium text-xs ${flight.transfers > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                {flight.transfers === 0 ? 'Non-stop' : `${flight.transfers} stop(s)`}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-1 text-right">
                    <div className="font-bold text-lg">${Math.round(displayPrice)}</div>
                </div>
            </div>
        </div>
    );
};


const GroupedFlightResults: React.FC<GroupedFlightResultsProps> = ({
  flights,
  onBookFlight,
  baggageFilter,
}) => {
  
  const otaGroups = useMemo(() => {
    const groups: { [key: string]: OtaGroup } = {};

    flights.forEach(flight => {
      const otaName = flight.gate || 'Unknown OTA';
      const displayPrice = travelpayoutsApi.getFlightDisplayPrice(flight, baggageFilter);

      if (!groups[otaName]) {
        groups[otaName] = {
          otaName,
          otaLogo: `https://pics.aviasales.com/92/36/${otaName.replace(/\s/g, '').replace('.com', '').toUpperCase()}.png`,
          cheapestPrice: displayPrice,
          bestFlight: flight,
          flights: [],
        };
      }

      groups[otaName].flights.push(flight);

      if (displayPrice < groups[otaName].cheapestPrice) {
        groups[otaName].cheapestPrice = displayPrice;
        groups[otaName].bestFlight = flight;
      }
    });

    return Object.values(groups).sort((a,b) => a.cheapestPrice - b.cheapestPrice);
  }, [flights, baggageFilter]);
  
  const [openOta, setOpenOta] = useState<string | null>(null);

  if (otaGroups.length === 0) return null;

  return (
    <div className="space-y-4">
      {otaGroups.map(group => (
        <div key={group.otaName} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            {/* OTA Header */}
            <div className="p-4 md:grid md:grid-cols-4 md:gap-6 items-center">
                <div className="col-span-2 flex items-center gap-4 mb-4 md:mb-0">
                    <Image
                        src={group.otaLogo}
                        alt={`${group.otaName} logo`}
                        width={64}
                        height={32}
                        className="bg-gray-100 rounded p-1 object-contain"
                        unoptimized
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div>
                        <div className="font-bold text-gray-900">{group.otaName}</div>
                        <div className="text-sm text-gray-500">
                           {group.flights.length} offer{group.flights.length > 1 ? 's' : ''} from ${Math.round(group.cheapestPrice)}
                        </div>
                    </div>
                </div>

                <div className="col-span-1 flex items-center justify-center text-sm">
                    <Button variant="link" onClick={() => setOpenOta(openOta === group.otaName ? null : group.otaName)}>
                       {openOta === group.otaName ? 'Hide all' : 'Show all'}
                    </Button>
                </div>
                
                <div className="col-span-1 text-center md:text-right mt-4 md:mt-0">
                    <Button
                        onClick={() => onBookFlight(group.bestFlight)}
                        className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        disabled={!group.bestFlight.link}
                    >
                        <Plane className="w-5 h-5 mr-2" />
                        Book Now
                    </Button>
                </div>
            </div>
            
            {/* Expanded Flights List */}
            {openOta === group.otaName && (
                <div className="bg-gray-50/50">
                    {group.flights.map(flight => (
                        <FlightDetailCard 
                            key={flight.id} 
                            flight={flight} 
                            baggageFilter={baggageFilter}
                        />
                    ))}
                </div>
            )}
        </div>
      ))}
    </div>
  );
};

export default GroupedFlightResults;
