
'use client';
import React from 'react';
import Image from 'next/image';
import { type Flight } from '@/services/travelpayoutsApi';
import { OTA_DATA } from '@/lib/ota-data';
import { Button } from '@/components/ui/button';
import { formatDuration, formatDateString } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface FlightCardProps {
  flight: Flight;
  onBookFlight: (flight: Flight) => void;
}

const getOtaName = (code: string | undefined): string => {
    if (!code) return 'Unknown';
    const ota = OTA_DATA.find(o => o.code === code);
    return ota ? ota.name : code;
};

const FlightCard: React.FC<FlightCardProps> = ({ flight, onBookFlight }) => {
    const price = flight.price ?? 'N/A';
    const airlineCode = flight.airline_code || '??';
    const airlineName = flight.airline || 'Unknown Airline';
    const otaCode = flight.gate || 'unknown';
    const otaName = getOtaName(otaCode);
    const origin = flight.origin || '???';
    const destination = flight.destination || '???';
    const stops = flight.transfers ?? 0;
    const departureTime = flight.departure_at ? formatDateString(flight.departure_at, 'h:mm a') : 'N/A';
    // The cheap prices API doesn't provide arrival time, so we calculate it as a fallback.
    const arrivalTime = flight.arrival_at ? formatDateString(flight.arrival_at, 'h:mm a') : 'N/A';
    const durationFormatted = typeof flight.duration === 'number' ? formatDuration(flight.duration * 60) : 'N/A';
    const airlineLogoUrl = `https://pics.avs.io/120/40/${airlineCode}.png`;

    return (
        <div className="bg-white rounded-lg border border-border shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="grid grid-cols-12 gap-4 items-center p-4">
                
                {/* Airline & OTA */}
                <div className="col-span-3 flex flex-col items-start justify-center gap-2">
                     <Image 
                        src={airlineLogoUrl}
                        alt={airlineName}
                        width={120}
                        height={40}
                        className="object-contain h-8 w-auto"
                        unoptimized // prevents next/image optimization issues with external dynamic URLs
                    />
                    <div className="text-sm text-muted-foreground">{otaName}</div>
                </div>

                {/* Flight Details */}
                <div className="col-span-6 flex flex-col items-center justify-center">
                    <div className="flex items-center w-full">
                        <div className="flex-1 text-center">
                            <p className="text-2xl font-semibold">{origin}</p>
                            <p className="text-sm text-muted-foreground">{departureTime}</p>
                        </div>
                        <div className="px-4 text-center">
                            <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1"/>
                            <p className="text-xs text-muted-foreground whitespace-nowrap">{durationFormatted}</p>
                        </div>
                        <div className="flex-1 text-center">
                            <p className="text-2xl font-semibold">{destination}</p>
                            <p className="text-sm text-muted-foreground">{arrivalTime}</p>
                        </div>
                    </div>
                    <div className="w-full flex items-center justify-center text-xs text-muted-foreground mt-2">
                        <div className="flex-grow h-px bg-border"></div>
                        <div className="px-2">{stops === 0 ? 'Non-stop' : `${stops} stop${stops > 1 ? 's' : ''}`}</div>
                        <div className="flex-grow h-px bg-border"></div>
                    </div>
                </div>
                
                {/* Price & Booking */}
                <div className="col-span-3 flex flex-col items-end justify-center text-right">
                    <p className="text-3xl font-bold text-primary">${price}</p>
                    <p className="text-xs text-muted-foreground mb-3">per person</p>
                    <Button 
                        size="sm"
                        onClick={() => onBookFlight(flight)}
                        className="w-full"
                    >
                       Select Flight
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FlightCard;

    