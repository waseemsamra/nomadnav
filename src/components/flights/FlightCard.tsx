
'use client';
import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { type Flight, travelpayoutsApi } from '@/services/travelpayoutsApi';
import { format, parseISO, addMinutes, isValid } from 'date-fns';
import { Briefcase, ChevronDown, ChevronUp, XIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { OTA_DATA } from '@/lib/ota-data';

interface FlightCardProps {
  offers: Flight[];
  onBookFlight: (flight: Flight) => void;
  baggageFilter: 'all' | 'without' | 'with';
}

const AirArabiaLogo = () => (
    <div className="text-3xl font-bold" style={{color: '#d71921'}}>
        Air<span style={{color: '#d71921'}}>Arabia</span>
    </div>
);

const getOtaName = (code: string) => {
    const ota = OTA_DATA.find(o => o.code === code);
    return ota ? ota.name : code;
}

const FlightCard: React.FC<FlightCardProps> = ({ offers, onBookFlight, baggageFilter }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localBaggagePref, setLocalBaggagePref] = useState<'without' | 'with'>('without');
    
    const actualBaggagePref = baggageFilter === 'all' ? localBaggagePref : baggageFilter;

    const cheapestOffer = useMemo(() => {
        return [...offers].sort((a, b) => travelpayoutsApi.getFlightDisplayPrice(a, actualBaggagePref) - travelpayoutsApi.getFlightDisplayPrice(b, actualBaggagePref))[0];
    }, [offers, actualBaggagePref]);
    
    const otherOffers = useMemo(() => {
        return offers.filter(o => o.id !== cheapestOffer.id).sort((a,b) => travelpayoutsApi.getFlightDisplayPrice(a, actualBaggagePref) - travelpayoutsApi.getFlightDisplayPrice(b, actualBaggagePref));
    }, [offers, cheapestOffer, actualBaggagePref]);

    const displayPrice = (flight: Flight): number => {
        let price = flight.price;
        if (actualBaggagePref === 'with' && flight.baggage?.checked?.price) {
            price += flight.baggage.checked.price;
        }
        return Math.round(price);
    };

    const formatTime = (dateString: string | Date | undefined) => {
        if (!dateString) return 'N/A';
        // Directly extract time from string to avoid timezone conversion
        if (typeof dateString === 'string' && dateString.includes('T')) {
            try {
                const timePart = dateString.split('T')[1];
                return timePart.substring(0, 5); // HH:mm
            } catch {
                // Fallback for unexpected formats
            }
        }
        // Fallback to original method
        try {
            const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
            if (!isValid(date)) return 'N/A';
            return format(date, 'HH:mm');
        } catch {
            return 'N/A';
        }
    }
    const formatDate = (dateString: string | Date | undefined) => {
        if (!dateString) return 'N/A';
        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
        if (!isValid(date)) return 'N/A';
        return format(date, 'd MMM').toUpperCase();
    }
    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };
    
    const arrivalTime = useMemo(() => {
      // Prefer API-provided arrival time
      if (cheapestOffer.arrival_at) {
        const apiArrival = parseISO(cheapestOffer.arrival_at);
        if(isValid(apiArrival)) return apiArrival;
      }
      // Fallback to calculation
      if (!cheapestOffer.departure_at || !cheapestOffer.duration) return undefined;
      try {
          const departure = parseISO(cheapestOffer.departure_at);
          if(!isValid(departure)) return undefined;
          return addMinutes(departure, cheapestOffer.duration);
      } catch {
          return undefined;
      }
    }, [cheapestOffer.arrival_at, cheapestOffer.departure_at, cheapestOffer.duration]);

    return (
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
           <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex flex-col md:flex-row">
                {/* Left Column - Booking */}
                <div className="w-full md:w-[280px] p-4 border-b md:border-b-0 md:border-r flex flex-col justify-between bg-gray-50/50">
                    <div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <div 
                                className={cn(
                                    "p-2 border rounded-md text-center cursor-pointer",
                                    actualBaggagePref === 'without' ? 'border-primary ring-1 ring-primary bg-blue-50' : 'border-gray-200 bg-white'
                                )}
                                onClick={() => setLocalBaggagePref('without')}
                            >
                                <div className="relative inline-block">
                                    <Briefcase className="w-5 h-5 text-gray-500 mx-auto" />
                                    <XIcon className="w-4 h-4 text-red-500 absolute -top-1 -right-1" strokeWidth={3} />
                                </div>
                                <p className="text-xs mt-1 text-gray-600">Without baggage</p>
                            </div>
                            <div 
                                className={cn(
                                    "p-2 border rounded-md text-center cursor-pointer",
                                    actualBaggagePref === 'with' ? 'border-primary ring-1 ring-primary bg-blue-50' : 'border-gray-200 bg-white'
                                )}
                                onClick={() => setLocalBaggagePref('with')}
                            >
                               <div className='flex justify-center items-center gap-1'>
                                <Briefcase className="w-5 h-5 text-gray-500" />
                               </div>
                                <p className="text-xs mt-1 text-gray-600">+{cheapestOffer.baggage.checked.price} $</p>
                            </div>
                        </div>

                        <Button 
                            className="w-full h-auto py-2 px-3 text-center bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg mb-1"
                            onClick={() => onBookFlight(cheapestOffer)}
                        >
                            Book ${displayPrice(cheapestOffer)}
                        </Button>
                        <p className="text-center text-sm text-gray-500">{getOtaName(cheapestOffer.gate)}</p>
                    </div>
                     {otherOffers.length > 0 && (
                        <CollapsibleTrigger asChild>
                            <Button variant="link" className="w-full mt-4">
                                {isOpen ? 'Hide other deals' : `Cheapest of ${offers.length} deals`}
                                {isOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                            </Button>
                        </CollapsibleTrigger>
                    )}
                </div>

                {/* Right Column - Flight Details */}
                <div className="w-full flex-1 p-6 flex flex-col justify-center">
                    <div className="flex justify-start items-center mb-6">
                       {cheapestOffer.airline_code === 'G9' ? (
                            <AirArabiaLogo />
                        ) : (
                             <Image
                                src={`https://pics.aviasales.com/160/80/${cheapestOffer.airline_code}.png`}
                                alt={`${cheapestOffer.airline} logo`}
                                width={120}
                                height={40}
                                className="object-contain"
                                unoptimized
                            />
                        )}
                        {cheapestOffer.return_at && new Date(cheapestOffer.return_at).getTime() !== new Date(cheapestOffer.departure_at).getTime() && <Badge variant="secondary" className="ml-auto">Round Trip</Badge>}
                    </div>

                    <div className="flex items-center justify-between">
                        {/* Departure */}
                        <div className="text-left w-28">
                            <p className="text-3xl font-bold">{formatTime(cheapestOffer.departure_at)}</p>
                             <p className="text-sm text-gray-500">{formatDate(cheapestOffer.departure_at)}</p>
                             <p className="text-sm font-semibold">{cheapestOffer.origin}</p>
                        </div>
                        
                        {/* Timeline */}
                        <div className="flex-grow mx-4 text-center">
                            <div className="text-sm text-gray-500 mb-1">{formatDuration(cheapestOffer.duration)}</div>
                            <div className="relative w-full">
                                <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-400"></div>
                                <div className="relative flex justify-between items-center">
                                    <span className="block w-2.5 h-2.5 bg-gray-500 rounded-full border-2 border-white"></span>
                                    <div className="text-xs text-gray-500 uppercase absolute left-1/2 -translate-x-1/2 top-2.5">
                                      {cheapestOffer.transfers === 0 ? 'Direct Flight' : `${cheapestOffer.transfers} stop(s)`}
                                    </div>
                                    {cheapestOffer.transfers > 0 && 
                                        Array.from({ length: cheapestOffer.transfers }).map((_, i) => (
                                           <span key={i} className="block w-1.5 h-1.5 bg-gray-400 rounded-full border-2 border-white"></span>
                                        ))
                                    }
                                    <span className="block w-2.5 h-2.5 bg-gray-500 rounded-full border-2 border-white"></span>
                                </div>
                            </div>
                             <div className="flex justify-between text-sm font-semibold mt-1 text-gray-500">
                                <span>{cheapestOffer.origin}</span>
                                <span>{cheapestOffer.destination}</span>
                            </div>
                        </div>

                        {/* Arrival */}
                        <div className="text-right w-28">
                           <p className="text-3xl font-bold">{formatTime(arrivalTime)}</p>
                           <p className="text-sm text-gray-500">{formatDate(arrivalTime)}</p>
                           <p className="text-sm font-semibold">{cheapestOffer.destination}</p>
                        </div>
                    </div>
                </div>
            </div>

            <CollapsibleContent>
                <div className="p-4 bg-gray-50 border-t">
                    <h4 className="font-semibold mb-2 text-center">Other Deals for this Flight</h4>
                     <div className="space-y-2 max-w-lg mx-auto">
                        {otherOffers.map((offer) => (
                            <div key={offer.id} className="flex justify-between items-center bg-white p-3 rounded-md border">
                                <div>
                                    <p className="font-semibold">{getOtaName(offer.gate)}</p>
                                </div>
                                <Button 
                                    size="sm"
                                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
                                    onClick={() => onBookFlight(offer)}
                                >
                                    Book ${displayPrice(offer)}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </CollapsibleContent>
            </Collapsible>
        </div>
    );
};

export default FlightCard;

      