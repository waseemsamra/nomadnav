
'use client';
import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { type Flight, travelpayoutsApi } from '@/services/travelpayoutsApi';
import { format, parseISO, add } from 'date-fns';
import { Briefcase, ChevronDown, ChevronUp, XIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

interface FlightCardProps {
  bestFlight: Flight;
  otherOffers: Flight[];
  onBookFlight: (flight: Flight) => void;
  baggageFilter: 'all' | 'without' | 'with';
}

const AirArabiaLogo = () => (
    <div className="text-2xl font-bold" style={{color: '#d71921'}}>
        Air<span style={{color: '#d71921'}}>Arabia</span>
    </div>
);


const FlightCard: React.FC<FlightCardProps> = ({ bestFlight, otherOffers, onBookFlight, baggageFilter }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localBaggagePref, setLocalBaggagePref] = useState<'without' | 'with'>('without');
    
    const actualBaggagePref = baggageFilter === 'all' ? localBaggagePref : baggageFilter;

    const formatTime = (dateString: string | Date) => {
        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
        return format(date, 'HH:mm');
    }
    const formatDate = (dateString: string | Date) => {
        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
        return format(date, 'd MMM').toUpperCase();
    }
    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const displayPrice = (flight: Flight, baggagePref: 'without' | 'with'): number => {
        const price = travelpayoutsApi.getFlightDisplayPrice(flight, baggagePref);
        return Math.round(price);
    };

    const allOffers = useMemo(() => [bestFlight, ...otherOffers], [bestFlight, otherOffers]);

    const cheapestOffer = useMemo(() => {
        return allOffers.reduce((cheapest, current) => {
            return displayPrice(current, 'without') < displayPrice(cheapest, 'without') ? current : cheapest;
        }, allOffers[0]);
    }, [allOffers]);

    const arrivalTime = useMemo(() => {
        const departureDate = parseISO(cheapestOffer.departure_at);
        return add(departureDate, { minutes: cheapestOffer.duration });
    }, [cheapestOffer.departure_at, cheapestOffer.duration]);

    const sortedOtherOffers = useMemo(() => {
        return allOffers
            .filter(offer => offer.id !== cheapestOffer.id)
            .sort((a, b) => displayPrice(a, actualBaggagePref) - displayPrice(b, actualBaggagePref));
    }, [allOffers, cheapestOffer.id, actualBaggagePref]);
    

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="flex flex-col md:flex-row">
                {/* Left Column - Booking */}
                <div className="w-full md:w-1/4 p-4 border-b md:border-b-0 md:border-r flex flex-col justify-between">
                    <div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <div 
                                className={cn(
                                    "p-2 border rounded-md text-center cursor-pointer",
                                    actualBaggagePref === 'without' ? 'border-primary ring-1 ring-primary' : 'border-gray-200'
                                )}
                                onClick={() => setLocalBaggagePref('without')}
                            >
                                <div className="relative inline-block">
                                    <Briefcase className="w-5 h-5 text-gray-500 mx-auto" />
                                    <XIcon className="w-4 h-4 text-red-500 absolute -top-1 -right-1" strokeWidth={3} />
                                </div>
                                <p className="text-xs mt-1">Without baggage</p>
                            </div>
                            <div 
                                className={cn(
                                    "p-2 border rounded-md text-center cursor-pointer",
                                    actualBaggagePref === 'with' ? 'border-primary ring-1 ring-primary' : 'border-gray-200'
                                )}
                                onClick={() => setLocalBaggagePref('with')}
                            >
                               <div className='flex justify-center items-center gap-1'>
                                <Briefcase className="w-5 h-5 text-gray-500" />
                                <div className='text-xs font-bold'>+${cheapestOffer.baggage.checked.price}</div>
                               </div>
                                <p className="text-xs mt-1">With baggage</p>
                            </div>
                        </div>

                        <Button 
                            className="w-full h-auto py-2 px-3 text-center bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg mb-2"
                            onClick={() => onBookFlight(cheapestOffer)}
                        >
                            Book ${displayPrice(cheapestOffer, actualBaggagePref)}
                        </Button>
                        <div className="flex items-center justify-center gap-2">
                            <Image src={`https://pics.avs.io/20/20/${cheapestOffer.gate}.png`} alt={cheapestOffer.gate} width={16} height={16} unoptimized />
                            <p className="text-center text-sm text-gray-500">{cheapestOffer.gate}</p>
                        </div>
                    </div>
                     <CollapsibleContent className="mt-4 space-y-2">
                        {sortedOtherOffers.map(offer => (
                            <div key={offer.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                                <div className="flex items-center gap-2">
                                  <Image src={`https://pics.avs.io/20/20/${offer.gate}.png`} alt={offer.gate} width={16} height={16} unoptimized />
                                  <span className="text-sm text-gray-700">{offer.gate}</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  className="h-auto p-0 font-bold text-base"
                                  onClick={() => onBookFlight(offer)}
                                >
                                  ${displayPrice(offer, actualBaggagePref)}
                                </Button>
                            </div>
                        ))}
                    </CollapsibleContent>

                    {sortedOtherOffers.length > 0 && (
                         <CollapsibleTrigger asChild>
                            <button className="w-full mt-3 text-sm text-blue-600 font-semibold flex items-center justify-center gap-1">
                               <span>{isOpen ? 'Hide deals' : 'Show more deals'}</span>
                               {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                           </button>
                        </CollapsibleTrigger>
                    )}
                </div>

                {/* Right Column - Flight Details */}
                <div className="w-full md:w-3/4 p-6 flex flex-col justify-center">
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
                        {cheapestOffer.return_at && <Badge variant="secondary" className="ml-auto">Round Trip</Badge>}
                    </div>

                    <div className="flex items-center justify-between">
                        {/* Departure */}
                        <div className="text-left">
                            <p className="text-3xl font-bold">{formatTime(cheapestOffer.departure_at)}</p>
                             <p className="text-sm text-gray-500">{formatDate(cheapestOffer.departure_at)}</p>
                        </div>
                        
                        {/* Timeline */}
                        <div className="flex-grow mx-4 text-center">
                            <div className="text-sm text-gray-500 mb-1">{formatDuration(cheapestOffer.duration)}</div>
                            <div className="relative w-full">
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300"></div>
                                <div className="relative flex justify-between items-center">
                                    <span className="block w-2.5 h-2.5 bg-gray-500 rounded-full border-2 border-white"></span>
                                    {cheapestOffer.transfers > 0 && 
                                        Array.from({ length: cheapestOffer.transfers }).map((_, i) => (
                                           <span key={i} className="block w-1.5 h-1.5 bg-gray-400 rounded-full border-2 border-white"></span>
                                        ))
                                    }
                                    <span className="block w-2.5 h-2.5 bg-gray-500 rounded-full border-2 border-white"></span>
                                </div>
                            </div>
                             <div className="flex justify-between text-sm font-semibold mt-1">
                                <span>{cheapestOffer.origin}</span>
                                <span className="text-xs text-gray-500 uppercase">
                                  {cheapestOffer.transfers === 0 ? 'Direct Flight' : `${cheapestOffer.transfers} stop(s)`}
                                </span>
                                <span>{cheapestOffer.destination}</span>
                            </div>
                        </div>

                        {/* Arrival */}
                        <div className="text-right">
                           <p className="text-3xl font-bold">{formatTime(arrivalTime)}</p>
                           <p className="text-sm text-gray-500">{formatDate(arrivalTime)}</p>
                        </div>
                    </div>
                </div>
            </div>
           
        </Collapsible>
    );
};

export default FlightCard;
