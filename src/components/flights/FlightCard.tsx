
'use client';
import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { type Flight, travelpayoutsApi } from '@/services/travelpayoutsApi';
import { format, parseISO } from 'date-fns';
import { Briefcase, ChevronDown } from 'lucide-react';

interface FlightCardProps {
  bestFlight: Flight;
  otherOffers: Flight[];
  onBookFlight: (flight: Flight) => void;
  baggageFilter: 'all' | 'without' | 'with';
}

const FlightCard: React.FC<FlightCardProps> = ({ bestFlight, otherOffers, onBookFlight, baggageFilter }) => {
    const formatTime = (dateString: string) => format(parseISO(dateString), 'HH:mm');
    const formatDate = (dateString: string) => format(parseISO(dateString), 'd MMM').toUpperCase();
    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const displayPrice = (flight: Flight) => Math.round(travelpayoutsApi.getFlightDisplayPrice(flight, baggageFilter));

    return (
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="flex">
                {/* Left Column - Booking */}
                <div className="w-1/4 p-4 border-r flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 border rounded-md">
                                <Briefcase className="w-5 h-5 text-gray-500" />
                            </div>
                            <div className="p-2 border rounded-md">
                                <div className='text-xs font-bold'>+ ${bestFlight.baggage.checked.price}</div>
                            </div>
                        </div>

                        <Button 
                            className="w-full h-auto py-2 px-3 text-center bg-yellow-400 hover:bg-yellow-500 text-black"
                            onClick={() => onBookFlight(bestFlight)}
                        >
                            <span className="font-bold text-lg">Book</span>
                            <span className="font-bold text-xl ml-2">${displayPrice(bestFlight)}</span>
                        </Button>
                        <p className="text-center text-sm text-gray-500 mt-1">{bestFlight.gate}</p>
                    </div>

                    <div className="mt-4 space-y-1">
                        {otherOffers.slice(0, 2).map(offer => (
                            <button 
                                key={offer.id} 
                                className="w-full flex justify-between items-center text-sm text-blue-600 hover:underline"
                                onClick={() => onBookFlight(offer)}
                            >
                                <span>{offer.gate}</span>
                                <span className="font-semibold">${displayPrice(offer)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Column - Flight Details */}
                <div className="w-3/4 p-4 flex-grow relative">
                    <div className="flex justify-between items-start mb-4">
                        <Image
                            src={`https://pics.aviasales.com/160/80/${bestFlight.airline_code}.png`}
                            alt={`${bestFlight.airline} logo`}
                            width={120}
                            height={40}
                            className="object-contain"
                            unoptimized
                        />
                         <button className="text-gray-400 hover:text-gray-600">
                           <ChevronDown className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        {/* Departure */}
                        <div className="text-left">
                            <p className="text-3xl font-bold">{formatTime(bestFlight.departure_at)}</p>
                            <p className="font-semibold">{bestFlight.origin}</p>
                            <p className="text-sm text-gray-500">{formatDate(bestFlight.departure_at)}</p>
                        </div>
                        
                        {/* Timeline */}
                        <div className="flex-grow mx-4 text-center">
                            <div className="relative w-full">
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300"></div>
                                <div className="relative flex justify-between items-center">
                                    <span className="block w-2.5 h-2.5 bg-gray-500 rounded-full"></span>
                                    <div className="flex flex-col text-xs text-gray-500 -translate-y-3">
                                       <span>{formatDuration(bestFlight.duration)}</span>
                                        <div className="w-2 h-2 bg-gray-300 rounded-full self-center translate-y-3 border-2 border-gray-500"></div>
                                    </div>
                                    <span className="block w-2.5 h-2.5 bg-gray-500 rounded-full"></span>
                                </div>
                            </div>
                             <div className="text-xs text-gray-500 mt-1">
                                {bestFlight.transfers === 0 ? 'Non-stop' : `${bestFlight.transfers} stop(s)`}
                            </div>
                        </div>

                        {/* Arrival */}
                        <div className="text-right">
                           <p className="text-3xl font-bold">{bestFlight.return_at ? formatTime(bestFlight.return_at) : 'N/A'}</p>
                           <p className="font-semibold">{bestFlight.destination}</p>
                           <p className="text-sm text-gray-500">{bestFlight.return_at ? formatDate(bestFlight.return_at) : ''}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlightCard;
