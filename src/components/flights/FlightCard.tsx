
'use client';
import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { type Flight } from '@/services/travelpayoutsApi';
import { format, parseISO, addMinutes, isValid } from 'date-fns';
import { Briefcase, ChevronDown, ChevronUp, XIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { OTA_DATA } from '@/lib/ota-data';

interface FlightCardProps {
  bestFlight: Flight;
  otherOffers: Flight[];
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


const FlightCard: React.FC<FlightCardProps> = ({ bestFlight, otherOffers, onBookFlight, baggageFilter }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localBaggagePref, setLocalBaggagePref] = useState<'without' | 'with'>('without');
    
    const actualBaggagePref = baggageFilter === 'all' ? localBaggagePref : baggageFilter;

    const formatTime = (dateString: string | Date | undefined) => {
        if (!dateString) return 'N/A';
        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
        if (!isValid(date)) return 'N/A';
        return format(date, 'HH:mm');
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
    
    const displayPrice = (flight: Flight): number => {
        let price = flight.price;
        if (actualBaggagePref === 'with') {
            price += flight.baggage.checked.price;
        }
        return Math.round(price);
    };

    const allOffers = useMemo(() => [bestFlight, ...otherOffers], [bestFlight, otherOffers]);

    const cheapestOffer = useMemo(() => {
        if (!allOffers || allOffers.length === 0) return bestFlight;
        return allOffers.reduce((cheapest, current) => {
            return displayPrice(current) < displayPrice(cheapest) ? current : cheapest;
        }, allOffers[0]);
    }, [allOffers, actualBaggagePref, bestFlight]);

    const arrivalTime = useMemo(() => {
        if (!cheapestOffer.departure_at || !cheapestOffer.duration) return undefined;
        try {
            const departure = parseISO(cheapestOffer.departure_at);
            if(!isValid(departure)) return undefined;
            return addMinutes(departure, cheapestOffer.duration);
        } catch {
            return undefined;
        }
    }, [cheapestOffer.departure_at, cheapestOffer.duration]);

    const sortedOtherOffers = useMemo(() => {
        return allOffers
            .filter(offer => offer.id !== cheapestOffer.id)
            .sort((a, b) => displayPrice(a) - displayPrice(b));
    }, [allOffers, cheapestOffer.id, actualBaggagePref]);
    

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
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
                    
                    <div className='mt-4'>
                        <CollapsibleContent className="space-y-1">
                            {sortedOtherOffers.slice(0, 2).map(offer => (
                                <div key={offer.id} className="flex justify-between items-center text-sm">
                                    <span className="text-blue-600 hover:underline cursor-pointer" onClick={() => onBookFlight(offer)}>
                                        {getOtaName(offer.gate)}
                                    </span>
                                    <span className='font-semibold text-blue-600'>${displayPrice(offer)}</span>
                                </div>
                            ))}
                        </CollapsibleContent>

                        {sortedOtherOffers.length > 0 && (
                            <CollapsibleTrigger asChild>
                                <button className="w-full mt-2 text-sm text-blue-600 font-semibold flex items-center justify-start gap-1">
                                <span>{isOpen ? 'Hide deals' : `+${sortedOtherOffers.length} more deals`}</span>
                                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            </CollapsibleTrigger>
                        )}
                    </div>
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
           
        </Collapsible>
    );
};

export default FlightCard;

    