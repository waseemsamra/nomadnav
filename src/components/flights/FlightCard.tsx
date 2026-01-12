
'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { type Flight, travelpayoutsApi } from '@/services/travelpayoutsApi';
import { format, parseISO } from 'date-fns';
import { Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

    const allOffers = [bestFlight, ...otherOffers].sort((a,b) => displayPrice(a) - displayPrice(b));
    const cheapestOffer = allOffers[0];
    const otherSortedOffers = allOffers.slice(1);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="flex">
                {/* Left Column - Booking */}
                <div className="w-1/4 p-4 border-r flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 border rounded-md">
                                <Briefcase className="w-5 h-5 text-gray-500" />
                            </div>
                            <div className="p-2 border rounded-md">
                                <div className='text-xs font-bold'>+ ${cheapestOffer.baggage.checked.price}</div>
                            </div>
                        </div>

                        <Button 
                            className="w-full h-auto py-2 px-3 text-center bg-yellow-400 hover:bg-yellow-500 text-black"
                            onClick={() => onBookFlight(cheapestOffer)}
                        >
                            <span className="font-bold text-lg">Book</span>
                            <span className="font-bold text-xl ml-2">${displayPrice(cheapestOffer)}</span>
                        </Button>
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <Image src={`https://pics.avs.io/20/20/${cheapestOffer.gate}.png`} alt={cheapestOffer.gate} width={16} height={16} unoptimized />
                            <p className="text-center text-sm text-gray-500">{cheapestOffer.gate}</p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Flight Details */}
                <div className="w-3/4 p-4 flex-grow relative">
                    <div className="flex justify-between items-start mb-4">
                        <Image
                            src={`https://pics.aviasales.com/160/80/${cheapestOffer.airline_code}.png`}
                            alt={`${cheapestOffer.airline} logo`}
                            width={120}
                            height={40}
                            className="object-contain"
                            unoptimized
                        />
                         <CollapsibleTrigger asChild>
                            <button className="text-gray-400 hover:text-gray-600">
                               {otherSortedOffers.length > 0 && (
                                   <div className="flex items-center gap-1 text-sm text-blue-600 font-semibold">
                                       <span>{otherSortedOffers.length} more offers</span>
                                       {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                   </div>
                                )}
                            </button>
                        </CollapsibleTrigger>
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
                            <div className="relative w-full">
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300"></div>
                                <div className="relative flex justify-between items-center">
                                    <span className="block w-2.5 h-2.5 bg-gray-500 rounded-full"></span>
                                    <div className="flex flex-col text-xs text-gray-500 -translate-y-3">
                                       <span>{formatDuration(cheapestOffer.duration)}</span>
                                        <div className="w-2 h-2 bg-gray-300 rounded-full self-center translate-y-3 border-2 border-gray-500"></div>
                                    </div>
                                    <span className="block w-2.5 h-2.5 bg-gray-500 rounded-full"></span>
                                </div>
                            </div>
                             <div className="text-xs text-gray-500 mt-1">
                                {cheapestOffer.transfers === 0 ? 'Non-stop' : `${cheapestOffer.transfers} stop(s)`}
                            </div>
                        </div>

                        {/* Arrival */}
                        <div className="text-right">
                           <p className="text-3xl font-bold">{cheapestOffer.return_at ? formatTime(cheapestOffer.return_at) : 'N/A'}</p>
                           <p className="font-semibold">{cheapestOffer.destination}</p>
                           <p className="text-sm text-gray-500">{cheapestOffer.return_at ? formatDate(cheapestOffer.return_at) : ''}</p>
                        </div>
                    </div>
                </div>
            </div>
            <CollapsibleContent>
                <div className="bg-gray-50 p-4 border-t">
                    <h4 className="font-semibold mb-3">Other Offers</h4>
                    <div className="space-y-3">
                        {otherSortedOffers.map(offer => (
                            <div key={offer.id} className="flex justify-between items-center bg-white p-3 rounded-md border">
                                <div className="flex items-center gap-3">
                                    <Image src={`https://pics.avs.io/80/40/${offer.gate}.png`} alt={offer.gate} width={60} height={30} unoptimized className="object-contain" />
                                    <span className="text-sm font-medium">{offer.gate}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-lg">${displayPrice(offer)}</span>
                                    <Button size="sm" onClick={() => onBookFlight(offer)}>Book</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

export default FlightCard;
