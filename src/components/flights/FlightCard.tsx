
'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { type Flight, travelpayoutsApi } from '@/services/travelpayoutsApi';
import { format, parseISO } from 'date-fns';
import { Briefcase, ChevronDown, ChevronUp, XIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '../ui/badge';

interface FlightCardProps {
  bestFlight: Flight;
  otherOffers: Flight[];
  onBookFlight: (flight: Flight) => void;
  baggageFilter: 'all' | 'without' | 'with';
}

const FlightCard: React.FC<FlightCardProps> = ({ bestFlight, otherOffers, onBookFlight, baggageFilter }) => {
    const [isOpen, setIsOpen] = useState(false);

    const formatTime = (dateString: string) => format(parseISO(dateString), 'HH:mm');
    const formatDate = (dateString: string) => format(parseISO(dateString), 'd MMM').toUpperCase();
    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const displayPrice = (flight: Flight) => Math.round(travelpayoutsApi.getFlightDisplayPrice(flight, baggageFilter));
    const basePrice = (flight: Flight) => Math.round(flight.price);


    const allOffers = [bestFlight, ...otherOffers].sort((a,b) => displayPrice(a) - displayPrice(b));
    const cheapestOffer = allOffers[0];
    const otherSortedOffers = allOffers.slice(1);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="flex flex-col md:flex-row">
                {/* Left Column - Booking */}
                <div className="w-full md:w-1/4 p-4 border-b md:border-b-0 md:border-r flex flex-col justify-between">
                    <div className="flex-grow">
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className={`p-2 border rounded-md text-center cursor-pointer ${baggageFilter !== 'with' ? 'border-primary' : ''}`}>
                                <div className="relative inline-block">
                                    <Briefcase className="w-5 h-5 text-gray-500 mx-auto" />
                                    {baggageFilter !== 'with' && <XIcon className="w-5 h-5 text-red-500 absolute -top-1 -right-1" />}
                                </div>
                                <p className="text-xs mt-1">Without baggage</p>
                            </div>
                             <div className={`p-2 border rounded-md text-center cursor-pointer ${baggageFilter === 'with' ? 'border-primary' : ''}`}>
                               <div className='flex justify-center items-center gap-1'>
                                <Briefcase className="w-5 h-5 text-gray-500" />
                                <div className='text-xs font-bold'>+${cheapestOffer.baggage.checked.price}</div>
                               </div>
                                <p className="text-xs mt-1">With baggage</p>
                            </div>
                        </div>

                        <Button 
                            className="w-full h-auto py-2 px-3 text-center bg-yellow-400 hover:bg-yellow-500 text-black mb-2"
                            onClick={() => onBookFlight(cheapestOffer)}
                        >
                            <span className="font-semibold text-base">Book</span>
                            <span className="font-bold text-lg ml-2">${displayPrice(cheapestOffer)}</span>
                        </Button>
                        <div className="flex items-center justify-center gap-2">
                            <Image src={`https://pics.avs.io/20/20/${cheapestOffer.gate}.png`} alt={cheapestOffer.gate} width={16} height={16} unoptimized />
                            <p className="text-center text-sm text-gray-500">{cheapestOffer.gate}</p>
                        </div>
                    </div>
                     <CollapsibleContent className="mt-4">
                        <div className="space-y-2">
                            {otherSortedOffers.map(offer => (
                                <div key={offer.id} className="flex justify-between items-center">
                                    <span className="text-sm text-blue-600 hover:underline cursor-pointer">{offer.gate}</span>
                                    <span className="font-semibold text-blue-600">${displayPrice(offer)}</span>
                                </div>
                            ))}
                        </div>
                    </CollapsibleContent>

                    {otherSortedOffers.length > 0 && (
                         <CollapsibleTrigger asChild>
                            <button className="w-full mt-3 text-sm text-blue-600 font-semibold flex items-center justify-center gap-1">
                               <span>{isOpen ? 'Hide deals' : 'Show more deals'}</span>
                               {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                           </button>
                        </CollapsibleTrigger>
                    )}
                </div>

                {/* Right Column - Flight Details */}
                <div className="w-full md:w-3/4 p-6 flex-grow relative">
                    <div className="flex justify-between items-start mb-6">
                        <Image
                            src={`https://pics.aviasales.com/160/80/${cheapestOffer.airline_code}.png`}
                            alt={`${cheapestOffer.airline} logo`}
                            width={120}
                            height={40}
                            className="object-contain"
                            unoptimized
                        />
                        {cheapestOffer.return_at && <Badge variant="secondary">Round Trip</Badge>}
                    </div>

                    <div className="flex items-center justify-between">
                        {/* Departure */}
                        <div className="text-left">
                            <p className="text-3xl font-bold">{formatTime(cheapestOffer.departure_at)}</p>
                            <p className="font-semibold">{cheapestOffer.origin}</p>
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
                                        <span className="block w-2.5 h-2.5 bg-gray-500 rounded-full border-2 border-white"></span>
                                    }
                                    <span className="block w-2.5 h-2.5 bg-gray-500 rounded-full border-2 border-white"></span>
                                </div>
                            </div>
                             <div className="text-xs text-gray-500 uppercase font-semibold mt-1">
                                {cheapestOffer.transfers === 0 ? 'Direct Flight' : `${cheapestOffer.transfers} stop(s)`}
                            </div>
                        </div>

                        {/* Arrival */}
                        <div className="text-right">
                           <p className="text-3xl font-bold">{cheapestOffer.return_at ? formatTime(cheapestOffer.return_at) : formatTime(cheapestOffer.departure_at.replace(/\d{2}:\d{2}:\d{2}/, '00:00:00'))}</p>
                           <p className="font-semibold">{cheapestOffer.destination}</p>
                           <p className="text-sm text-gray-500">{cheapestOffer.return_at ? formatDate(cheapestOffer.return_at) : formatDate(cheapestOffer.departure_at)}</p>
                        </div>
                    </div>
                </div>
            </div>
           
        </Collapsible>
    );
};

export default FlightCard;

    