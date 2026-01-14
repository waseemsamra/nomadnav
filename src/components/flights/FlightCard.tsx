
'use client';
import React from 'react';
import Image from 'next/image';
import { type Flight } from '@/services/travelpayoutsApi';
import { OTA_DATA } from '@/lib/ota-data';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, Plane, ShoppingCart, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface FlightCardProps {
  flight: Flight;
  onBookFlight: (flight: Flight) => void;
}

const getOtaInfo = (code: string | undefined) => {
    if (!code) return { name: 'Unknown', code: 'UNKNOWN' };
    const ota = OTA_DATA.find(o => o.code === code);
    return ota ? { name: ota.name, code: ota.code } : { name: code, code };
};

const formatTime = (dateString: string | undefined) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return dateString;
    }
};

const formatDuration = (minutes: number | undefined) => {
    if (minutes === undefined || isNaN(minutes)) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
};


const FlightCard: React.FC<FlightCardProps> = ({ flight, onBookFlight }) => {
    const price = flight.price || 0;
    const airlineCode = flight.airline_code || flight.airline || '??';
    const airlineName = flight.airline || 'Unknown Airline';
    const ota = getOtaInfo(flight.gate);
    const origin = flight.origin || '???';
    const destination = flight.destination || '???';
    const stops = flight.transfers ?? 0;
    const departureTime = formatTime(flight.departure_at);
    const arrivalTime = formatTime(flight.arrival_at);
    const duration = formatDuration(flight.duration);
    const flightNumber = `${airlineCode} ${flight.flight_number || ''}`.trim();
    const isMock = flight.is_mock || false;

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Airline Info */}
                    <div className="md:col-span-3 flex items-center gap-3">
                        <Image 
                            src={`https://pics.avs.io/80/40/${airlineCode}.png`}
                            alt={airlineName}
                            width={80}
                            height={40}
                            className="rounded-md object-contain"
                            unoptimized
                        />
                        <div>
                            <p className="font-semibold text-sm">{airlineName}</p>
                            <p className="text-xs text-muted-foreground">{flightNumber}</p>
                        </div>
                    </div>

                    {/* Flight Times */}
                    <div className="md:col-span-4 flex items-center justify-between md:justify-center gap-2">
                        <div>
                            <p className="font-bold text-lg">{departureTime}</p>
                            <p className="text-sm font-medium text-muted-foreground">{origin}</p>
                        </div>
                        <div className="flex-grow text-center px-2">
                            <p className="text-xs text-muted-foreground">{duration}</p>
                            <div className="w-full bg-gray-200 rounded-full h-1 my-1">
                                <div className="bg-primary h-1 rounded-full w-full"></div>
                            </div>
                            <p className="text-xs text-muted-foreground">{stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`}</p>
                        </div>
                        <div>
                            <p className="font-bold text-lg text-right">{arrivalTime}</p>
                            <p className="text-sm font-medium text-muted-foreground text-right">{destination}</p>
                        </div>
                    </div>

                    {/* Baggage Info */}
                    <div className="md:col-span-2 text-center text-xs text-muted-foreground space-y-1">
                        <p>
                            <User className="w-3 h-3 inline mr-1" />
                            {flight.baggage.hand.has_baggage ? 'Carry-on included' : `Carry-on from $${flight.baggage.hand.price}`}
                        </p>
                        <p>
                            <Plane className="w-3 h-3 inline mr-1" />
                            {flight.baggage.checked.has_baggage ? 'Checked bag included' : `Checked bag from $${flight.baggage.checked.price}`}
                        </p>
                    </div>

                    {/* Price and Booking */}
                    <div className="md:col-span-3 flex flex-col items-end gap-2">
                        <div className="text-right">
                            <p className="text-2xl font-bold">${price}</p>
                            <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                                <Image 
                                    src={`https://pics.avs.io/20/20/${ota.code}.png`} 
                                    alt={ota.name}
                                    width={16} height={16}
                                    className="rounded-sm"
                                    unoptimized
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                               <span>Sold by {ota.name}</span>
                                {isMock && <Badge variant="outline" className="text-xs">Demo</Badge>}
                            </div>
                        </div>
                        <Button 
                            size="sm"
                            onClick={() => onBookFlight(flight)}
                            className="w-full md:w-auto"
                        >
                           Select Flight
                        </Button>
                    </div>

                </div>
            </CardContent>
        </Card>
    );
};

export default FlightCard;
