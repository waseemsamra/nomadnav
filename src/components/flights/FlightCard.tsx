
'use client';
import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { type Flight, travelpayoutsApi } from '@/services/travelpayoutsApi';
import { format, parseISO, addMinutes, isValid } from 'date-fns';
import { Briefcase, ChevronDown, Copy, ExternalLink, XIcon, Building } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { OTA_DATA } from '@/lib/ota-data';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';

interface FlightCardProps {
  otaName: string;
  offers: Flight[];
  onBookFlight: (flight: Flight) => void;
  baggageFilter: 'all' | 'without' | 'with';
}

const AirArabiaLogo = () => (
    <div className="text-3xl font-bold" style={{color: '#d71921'}}>
        Air<span style={{color: '#d71921'}}>Arabia</span>
    </div>
);

const getOtaInfo = (code: string) => {
    const ota = OTA_DATA.find(o => o.code === code);
    return ota ? { name: ota.name, code: ota.code } : { name: code, code };
}

const FlightCard: React.FC<FlightCardProps> = ({ otaName, offers, onBookFlight, baggageFilter }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localBaggagePref, setLocalBaggagePref] = useState<'without' | 'with'>(baggageFilter === 'with' ? 'with' : 'without');
    const { toast } = useToast();

    // Determine the active baggage preference
    const actualBaggagePref = baggageFilter === 'all' ? localBaggagePref : baggageFilter;
    
    const otaInfo = getOtaInfo(otaName);

    // This is the core logic change: Sort ALL offers based on the current baggage preference.
    const sortedOffers = useMemo(() => {
        if (!offers) return [];
        return [...offers].sort((a, b) => 
            travelpayoutsApi.getFlightDisplayPrice(a, actualBaggagePref) - travelpayoutsApi.getFlightDisplayPrice(b, actualBaggagePref)
        );
    }, [offers, actualBaggagePref]);

    // The cheapest offer is now always the first in the sorted list.
    const cheapestOffer = sortedOffers[0];
    // Other offers are the rest of the list.
    const otherOffers = sortedOffers.slice(1);

    if (!cheapestOffer) {
        return null; // Don't render anything if there's no offer
    }

    const displayPrice = (flight: Flight): number => {
        return Math.round(travelpayoutsApi.getFlightDisplayPrice(flight, actualBaggagePref));
    };

    const formatTime = (dateString: string | Date | undefined) => {
        if (!dateString) return 'N/A';
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
    const formatDuration = (minutes: number | undefined) => {
        if (typeof minutes !== 'number' || isNaN(minutes)) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };
    
    const arrivalTime = useMemo(() => {
      if (cheapestOffer.arrival_at) {
        try {
          const apiArrival = parseISO(cheapestOffer.arrival_at);
          if(isValid(apiArrival)) return apiArrival;
        } catch { /* ignore invalid date */ }
      }
      if (!cheapestOffer.departure_at || typeof cheapestOffer.duration !== 'number') return undefined;
      try {
          const departure = parseISO(cheapestOffer.departure_at);
          if(!isValid(departure)) return undefined;
          return addMinutes(departure, cheapestOffer.duration);
      } catch {
          return undefined;
      }
    }, [cheapestOffer.arrival_at, cheapestOffer.departure_at, cheapestOffer.duration]);

    const handleCopyLink = () => {
        if (cheapestOffer.is_mock || !cheapestOffer.link || cheapestOffer.link === '#') {
            toast({ variant: 'destructive', title: "Demo Link", description: "This is a mock offer and does not have a real booking link." });
            return;
        }
        navigator.clipboard.writeText(cheapestOffer.link);
        toast({
            title: "Link Copied!",
            description: "The booking link has been copied to your clipboard.",
        });
    };
    
    // Group other offers by flight details to avoid repetition in the UI
    const groupedOtherOffers = useMemo(() => {
        const groups = new Map<string, Flight[]>();
        const getKey = (f: Flight) => `${f.airline_code}-${f.flight_number}-${f.duration}-${f.transfers}`;

        otherOffers.forEach(offer => {
            const key = getKey(offer);
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(offer);
        });

        return Array.from(groups.values()).map(group => group[0]); // Just take the first one from each group
    }, [otherOffers]);
    
    const handleBookFlight = (flight: Flight) => {
        if (flight.is_mock) {
            toast({
                variant: 'destructive',
                title: "Demo Offer",
                description: "This is a mock offer for demonstration purposes and cannot be booked.",
            });
            return;
        }
        onBookFlight(flight);
    }
    
    const transfers = cheapestOffer.transfers ?? 0;
    const baggagePrice = cheapestOffer.baggage?.checked?.price ?? 50;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                    {/* Left Column - OTA & Booking */}
                    <div className="w-full md:w-[280px] p-4 border-b md:border-b-0 md:border-r flex flex-col justify-between bg-gray-50/50">
                         <div>
                            <div className='flex items-start gap-3 mb-4'>
                                <Image 
                                    src={`https://pics.avs.io/100/50/${otaInfo.code}.png`}
                                    alt={otaInfo.name}
                                    width={50}
                                    height={50}
                                    className='rounded-md border bg-white'
                                    unoptimized
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                <div className='flex-1'>
                                    <p className='font-bold text-lg'>{otaInfo.name}</p>
                                    <p className='text-sm text-muted-foreground'>Best Price</p>
                                </div>
                                {cheapestOffer.is_mock && <Badge variant="destructive">Demo</Badge>}
                            </div>
                            
                            <Button 
                                className="w-full h-auto py-3 px-3 text-center bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-2xl mb-1"
                                onClick={() => handleBookFlight(cheapestOffer)}
                            >
                                ${displayPrice(cheapestOffer)}
                            </Button>
                            <div className='text-center'>
                                <CollapsibleTrigger asChild>
                                    <Button variant="link" size="sm" className='text-xs h-auto p-1'>
                                        View Flight Details
                                        <ChevronDown className={cn("ml-1 h-3 w-3 transition-transform", isOpen && "rotate-180")} />
                                    </Button>
                                </CollapsibleTrigger>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Flight Summary */}
                    <CollapsibleTrigger asChild className='w-full'>
                         <div className="w-full flex-1 p-6 flex flex-col justify-center cursor-pointer">
                            <div className="flex justify-start items-center mb-6">
                            {cheapestOffer.airline_code === 'G9' ? (
                                    <AirArabiaLogo />
                                ) : (
                                    <Image
                                        src={`https://pics.aviasales.com/160/80/${cheapestOffer.airline_code || ''}.png`}
                                        alt={`${cheapestOffer.airline || ''} logo`}
                                        width={120}
                                        height={40}
                                        className="object-contain"
                                        unoptimized
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                )}
                                {cheapestOffer.return_at && cheapestOffer.return_at !== cheapestOffer.departure_at && <Badge variant="secondary" className="ml-auto">Round Trip</Badge>}
                                <ChevronDown className={cn("ml-auto h-5 w-5 transition-transform", isOpen && "rotate-180")} />
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
                                            {transfers === 0 ? 'Direct Flight' : `${transfers} stop(s)`}
                                            </div>
                                            {transfers > 0 && 
                                                Array.from({ length: transfers }).map((_, i) => (
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
                    </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                    <div className="p-4 md:p-6 bg-gray-50/70 border-t grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Other Offers */}
                        <div className="md:col-span-1 space-y-4">
                            <h4 className="font-semibold text-muted-foreground flex items-center gap-2">
                                <Building className='h-4 w-4' />
                                More offers from {otaInfo.name}
                            </h4>
                            <div className="space-y-2">
                                {groupedOtherOffers.map((offer) => (
                                    <div key={offer.id} className="flex justify-between items-center bg-white p-3 rounded-md border hover:border-primary">
                                        <div>
                                            <p className="font-semibold">{formatDuration(offer.duration)}</p>
                                            <p className="text-xs text-muted-foreground">{offer.transfers === 0 ? 'Direct' : `${offer.transfers} stop(s)`}</p>
                                        </div>
                                        <Button 
                                            variant="ghost"
                                            size="sm"
                                            className="font-bold text-primary"
                                            onClick={() => handleBookFlight(offer)}
                                        >
                                            ${displayPrice(offer)} <ExternalLink className='w-3 h-3 ml-2'/>
                                        </Button>
                                    </div>
                                ))}
                                {groupedOtherOffers.length === 0 && <p className='text-sm text-muted-foreground'>No other flight routes from this partner.</p>}
                            </div>
                        </div>

                        {/* Flight & Baggage Details */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Baggage selector */}
                            <div>
                                <h4 className="font-semibold text-muted-foreground mb-2">Baggage Options</h4>
                                 <div className="flex rounded-md border border-gray-200 bg-white mb-4">
                                    <button
                                        onClick={() => setLocalBaggagePref('without')}
                                        className={cn(
                                            "flex-1 p-3 text-center rounded-l-md",
                                            actualBaggagePref === 'without' ? 'bg-blue-100 text-primary font-bold ring-1 ring-primary' : 'hover:bg-gray-100'
                                        )}
                                        disabled={baggageFilter !== 'all'}
                                    >
                                        <div className="relative inline-block">
                                            <Briefcase className="w-5 h-5 mx-auto text-gray-500" />
                                            <XIcon className="w-3 h-3 text-red-500 absolute -top-1 -right-1" strokeWidth={3} />
                                        </div>
                                        <p className="text-sm mt-1">Without checked baggage</p>
                                    </button>
                                    <button
                                        onClick={() => setLocalBaggagePref('with')}
                                        className={cn(
                                            "flex-1 p-3 text-center rounded-r-md border-l",
                                            actualBaggagePref === 'with' ? 'bg-blue-100 text-primary font-bold ring-1 ring-primary' : 'hover:bg-gray-100'
                                        )}
                                        disabled={baggageFilter !== 'all'}
                                    >
                                        <Briefcase className="w-5 h-5 mx-auto text-gray-500" />
                                        <p className="text-sm mt-1 font-semibold">With checked baggage (+${baggagePrice})</p>
                                    </button>
                                </div>
                            </div>
                        
                            <div>
                                <h4 className="font-semibold text-muted-foreground mb-2">Flight details</h4>
                                <div className="border rounded-lg p-4 bg-white">
                                    <div className="flex items-center gap-4">
                                        {cheapestOffer.airline_code === 'G9' ? (
                                            <AirArabiaLogo />
                                        ) : (
                                            <Image
                                                src={`https://pics.aviasales.com/160/80/${cheapestOffer.airline_code || ''}.png`}
                                                alt={`${cheapestOffer.airline || ''} logo`}
                                                width={60}
                                                height={20}
                                                className="object-contain"
                                                unoptimized
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        )}
                                        <div>
                                            <p className="font-bold">{formatTime(cheapestOffer.departure_at)} - {formatTime(arrivalTime)} ({formatDuration(cheapestOffer.duration)})</p>
                                            <p className="text-sm">{cheapestOffer.origin} → {cheapestOffer.destination}</p>
                                            <p className="text-xs text-muted-foreground">{cheapestOffer.flight_number} · {cheapestOffer.airline} · Airbus A320</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                             <Separator />

                            <div>
                                <Label htmlFor={`copy-link-${cheapestOffer.id}`} className='text-muted-foreground'>Copy link</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Input id={`copy-link-${cheapestOffer.id}`} value={cheapestOffer.link || ''} readOnly className="text-xs" />
                                    <Button size="icon" variant="outline" onClick={handleCopyLink}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
};

export default FlightCard;
