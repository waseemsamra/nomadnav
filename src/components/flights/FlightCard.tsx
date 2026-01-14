
'use client';
import React from 'react';
import Image from 'next/image';
import { type Flight } from '@/services/travelpayoutsApi';
import { OTA_DATA } from '@/lib/ota-data';
import { Button } from '@/components/ui/button';

interface FlightCardProps {
  flight: Flight;
  onBookFlight: (flight: Flight) => void;
}

const getOtaName = (code: string | undefined): string => {
    if (!code) return 'Unknown';
    const ota = OTA_DATA.find(o => o.code === code);
    return ota ? ota.name : code;
};

const formatSimpleDateTime = (dateString: string | undefined): string => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    } catch (e) {
        return dateString;
    }
};

const FlightCard: React.FC<FlightCardProps> = ({ flight, onBookFlight }) => {
    // Safely extract data with fallbacks, just like in the guaranteed function
    const price = flight.price ?? 'N/A';
    const airlineCode = flight.airline_code || flight.airline || '??';
    const otaCode = flight.gate || 'OTA';
    const otaName = getOtaName(otaCode);
    const origin = flight.origin || '???';
    const destination = flight.destination || '???';
    const stops = flight.transfers ?? 0;
    const departure = flight.departure_at || 'N/A';
    const duration = flight.duration ?? 'N/A';

    return (
        <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="p-4">
                <div className="grid grid-cols-12 gap-4">
                    {/* Price */}
                    <div className="col-span-3">
                        <p className="text-2xl font-bold text-primary">${price}</p>
                        <p className="text-xs text-muted-foreground">per person</p>
                    </div>

                    {/* Middle Details */}
                    <div className="col-span-6">
                        <div className="flex items-center justify-center font-semibold text-lg">
                            <span>{origin}</span>
                            <span className="mx-2 text-muted-foreground">→</span>
                            <span>{destination}</span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground grid grid-cols-3 gap-2 text-center">
                            <div>
                                <span className="font-semibold">Departure:</span> {formatSimpleDateTime(departure)}
                            </div>
                            <div>
                                <span className="font-semibold">Stops:</span> {stops}
                            </div>
                            <div>
                                <span className="font-semibold">Duration:</span> {duration} min
                            </div>
                        </div>
                    </div>
                    
                    {/* OTA and Airline */}
                    <div className="col-span-3 text-right">
                        <p className="font-bold">{otaName}</p>
                        <p className="text-sm text-muted-foreground">{airlineCode}</p>
                    </div>
                </div>
            </div>
            
            {/* Action Button */}
            <div className="bg-gray-50 px-4 py-3">
                 <Button 
                    size="sm"
                    onClick={() => onBookFlight(flight)}
                    className="w-full"
                >
                   Select Flight
                </Button>
            </div>
        </div>
    );
};

export default FlightCard;
