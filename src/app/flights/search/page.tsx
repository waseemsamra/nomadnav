

'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Plane, 
  Clock, 
  Calendar,
  Users,
  Wind,
  Filter,
  X,
  ChevronRight
} from 'lucide-react';
import { format, getHours, getMinutes } from 'date-fns';
import toast from 'react-hot-toast';
import { type Flight, travelpayoutsApi } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';


type FilterState = {
  sortBy: 'price' | 'duration' | 'departure';
};

type BaggageFilterType = 'all' | 'without' | 'with';


const initialFilterState: FilterState = {
  sortBy: 'price',
};


function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [availableAirlines, setAvailableAirlines] = useState<string[]>([]);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedStops, setSelectedStops] = useState<number[]>([]);
  
  const [baggageFilter, setBaggageFilter] = useState<BaggageFilterType>('all');
  
  const [durationRange, setDurationRange] = useState({ min: 0, max: 0 });
  const [selectedDuration, setSelectedDuration] = useState([0, 0]);

  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [selectedPrice, setSelectedPrice] = useState([0, 0]);

  const [departureTimeRange, setDepartureTimeRange] = useState({ min: 0, max: 1440 });
  const [selectedDepartureTime, setSelectedDepartureTime] = useState([0, 1440]);


  // Extract search parameters
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const depart_date = searchParams.get('depart_date') || '';
  const return_date = searchParams.get('return_date') || '';
  const passengers = searchParams.get('passengers') || '1';
  const cabin_class = searchParams.get('cabin_class') || 'economy';

  // Fetch flights
  useEffect(() => {
    const fetchFlights = async () => {
      if (!origin || !destination || !depart_date) {
        router.push('/');
        return;
      }

      setLoading(true);

      try {
        const flightData = await travelpayoutsApi.searchFlights({
          origin,
          destination,
          depart_date,
          return_date: return_date || undefined,
          passengers: parseInt(passengers),
          currency: 'USD',
          limit: 30,
        });
        
        console.log('Fetched flights:', flightData.length);
        setFlights(flightData);

        const uniqueAirlines = [...new Set(flightData.map(f => f.airline))].sort();
        setAvailableAirlines(uniqueAirlines);
        setSelectedAirlines(uniqueAirlines);
        
        const uniqueStops = [...new Set(flightData.map(f => f.transfers))];
        setSelectedStops(uniqueStops);

        if (flightData.length > 0) {
          toast.success(`Found ${flightData.length} flights`);
          
          const durations = flightData.map(f => f.duration).filter(d => d > 0);
          const minDuration = Math.min(...durations);
          const maxDuration = Math.max(...durations);
          setDurationRange({ min: minDuration, max: maxDuration });
          setSelectedDuration([minDuration, maxDuration]);

          const prices = flightData.map(f => f.price);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          setPriceRange({ min: minPrice, max: maxPrice });
          setSelectedPrice([minPrice, maxPrice]);
        }
      } catch (error: any) {
        console.error('Error fetching flights:', error);
        toast.error(error.message || 'Failed to load flights.');
        setFlights([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [origin, destination, depart_date, return_date, passengers, router]);


  const handleBookFlight = (flight: Flight) => {
    if (flight.link) {
      window.open(flight.link, '_blank', 'noopener,noreferrer');
      toast.success('Opening booking page...');
    } else {
        toast.error('Booking link is not available for this flight.');
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({...prev, [key]: value}));
  };

  const handleAirlineSelection = (airline: string) => {
    setSelectedAirlines(prev => 
      prev.includes(airline)
        ? prev.filter(a => a !== airline)
        : [...prev, airline]
    );
  };
  
  const handleSelectAllAirlines = (checked: boolean) => {
    setSelectedAirlines(checked ? availableAirlines : []);
  }

  const handleStopSelection = (stopCount: number) => {
    setSelectedStops(prev => 
        prev.includes(stopCount)
            ? prev.filter(s => s !== stopCount)
            : [...prev, stopCount]
    );
  };

  const handleSelectAllStops = (checked: boolean) => {
      const allStops = stopOptions.map(opt => opt.value);
      setSelectedStops(checked ? allStops : []);
  }

  const handleResetFilters = () => {
    setFilters(initialFilterState);
    setSelectedAirlines(availableAirlines);
    const allStops = stopOptions.map(opt => opt.value);
    setSelectedStops(allStops);
    setBaggageFilter('all');
    setSelectedDuration([durationRange.min, durationRange.max]);
    setSelectedPrice([priceRange.min, priceRange.max]);
    setSelectedDepartureTime([departureTimeRange.min, departureTimeRange.max]);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const minutes = (totalMinutes % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const getFlightDisplayPrice = (flight: Flight): number => {
    if (baggageFilter === 'with') {
        let baggageCost = 0;
        if (!flight.baggage.hand.has_baggage) {
            baggageCost += flight.baggage.hand.price;
        }
         if (!flight.baggage.checked.has_baggage) {
            baggageCost += flight.baggage.checked.price;
        }
        return flight.price + baggageCost;
    }
    // 'all' and 'without' show base price
    return flight.price;
  }
  
  const stopOptions = useMemo(() => {
    const stopsMap = new Map<number, number>();
    flights.forEach(flight => {
        const price = getFlightDisplayPrice(flight);
        const currentMinPrice = stopsMap.get(flight.transfers);
        if (!currentMinPrice || price < currentMinPrice) {
            stopsMap.set(flight.transfers, price);
        }
    });
    return Array.from(stopsMap.entries())
        .map(([value, price]) => ({
            value: value,
            label: value === 0 ? 'Direct' : `${value} stop${value > 1 ? 's' : ''}`,
            price: Math.round(price),
        }))
        .sort((a,b) => a.value - b.value);
  }, [flights, baggageFilter]);

  const baggagePriceOptions = useMemo(() => {
    if (flights.length === 0) return { without: null, with: null };

    const pricesWithout = flights.map(f => f.price);
    const minWithout = Math.min(...pricesWithout);

    const pricesWith = flights.map(f => getFlightDisplayPrice({...f, baggage: { hand: { has_baggage: false, price: 25 }, checked: { has_baggage: false, price: 50} }}));
    const minWith = Math.min(...pricesWith);

    return {
      without: isFinite(minWithout) ? Math.round(minWithout) : null,
      with: isFinite(minWith) ? Math.round(minWith) : null,
    };
  }, [flights]);

  const sortedFlights = useMemo(() => {
    let filtered = [...flights]
        .filter(flight => selectedAirlines.includes(flight.airline))
        .filter(flight => selectedStops.includes(flight.transfers))
        .filter(flight => flight.duration >= selectedDuration[0] && flight.duration <= selectedDuration[1])
        .filter(flight => {
          const price = getFlightDisplayPrice(flight);
          return price >= selectedPrice[0] && price <= selectedPrice[1];
        })
        .filter(flight => {
            const departureDate = new Date(flight.departure_at);
            const departureMinutes = getHours(departureDate) * 60 + getMinutes(departureDate);
            return departureMinutes >= selectedDepartureTime[0] && departureMinutes <= selectedDepartureTime[1];
        });

    if (baggageFilter === 'without') {
      // No filtering logic yet, placeholder
    } else if (baggageFilter === 'with') {
      // No filtering logic yet, placeholder
    }


    switch (filters.sortBy) {
        case 'price':
            filtered.sort((a,b) => getFlightDisplayPrice(a) - getFlightDisplayPrice(b));
            break;
        case 'duration':
            filtered.sort((a,b) => (a.duration || 9999) - (b.duration || 9999));
            break;
        case 'departure':
            filtered.sort((a,b) => new Date(a.departure_at).getTime() - new Date(b.departure_at).getTime());
            break;
    }
    return filtered;
  }, [flights, filters, selectedAirlines, selectedStops, baggageFilter, selectedDuration, selectedPrice, selectedDepartureTime]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Searching for the best flights...</p>
            <p className="text-sm text-gray-500 mt-2">
              Searching {origin} → {destination} on {formatDate(depart_date)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const FilterSidebar = () => {
    
    const FilterSection = ({ title, children, disabled = false }: { title: string, children: React.ReactNode, disabled?: boolean }) => (
      <AccordionItem value={title} disabled={disabled}>
        <AccordionTrigger className={`py-4 text-sm font-semibold ${disabled ? 'text-muted-foreground/50 cursor-not-allowed' : ''}`}>
           {title.toUpperCase()}
        </AccordionTrigger>
        <AccordionContent>
          {children}
        </AccordionContent>
      </AccordionItem>
    );

    return (
      <Card className="lg:sticky lg:top-24">
          <CardContent className="p-4">
              <div className="space-y-4">
                  <RadioGroup defaultValue="all-tickets" className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all-tickets" id="all-tickets" />
                        <Label htmlFor="all-tickets">All tickets</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="best-tickets" id="best-tickets" />
                        <Label htmlFor="best-tickets">Best tickets</Label>
                      </div>
                  </RadioGroup>

                  <div className="space-y-2 border-t pt-4">
                      <label className="font-semibold text-sm text-muted-foreground">SORT</label>
                      <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                          <SelectTrigger>
                              <SelectValue placeholder="Sort by..." />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="price">by price</SelectItem>
                              <SelectItem value="duration">by duration</SelectItem>
                              <SelectItem value="departure">by departure</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>

              <Accordion type="multiple" className="w-full border-t mt-4" defaultValue={['Numbers of stops', 'Baggage', 'Travel time', 'Airfares', 'Departure/Arrival times', 'Airlines']}>
                  <FilterSection title="Numbers of stops" disabled={stopOptions.length === 0}>
                      <div className="space-y-2 pr-2">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="select-all-stops"
                                    checked={selectedStops.length === stopOptions.length}
                                    onCheckedChange={(checked) => handleSelectAllStops(!!checked)}
                                />
                                <Label htmlFor="select-all-stops" className="font-medium">All</Label>
                              </div>
                          </div>
                          {stopOptions.map(opt => (
                               <div key={`stop-opt-${opt.value}`} className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`stop-${opt.value}`}
                                        checked={selectedStops.includes(opt.value)}
                                        onCheckedChange={() => handleStopSelection(opt.value)}
                                    />
                                    <Label htmlFor={`stop-${opt.value}`}>{opt.label}</Label>
                                  </div>
                                  <span className="text-sm text-muted-foreground">${opt.price}</span>
                              </div>
                          ))}
                      </div>
                  </FilterSection>

                  <FilterSection title="Baggage">
                     <RadioGroup value={baggageFilter} onValueChange={(value: BaggageFilterType) => setBaggageFilter(value)} className="space-y-2 pr-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="all" id="baggage-all"/>
                              <Label htmlFor="baggage-all" className="font-medium">All</Label>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="without" id="baggage-without"/>
                              <Label htmlFor="baggage-without">Without baggage</Label>
                          </div>
                          {baggagePriceOptions.without !== null && (
                              <span className="text-sm text-muted-foreground">${baggagePriceOptions.without}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="with" id="baggage-with"/>
                              <Label htmlFor="baggage-with">Luggage and carry-on</Label>
                          </div>
                          {baggagePriceOptions.with !== null && (
                              <span className="text-sm text-muted-foreground">${baggagePriceOptions.with}</span>
                          )}
                        </div>
                      </RadioGroup>
                  </FilterSection>
                  
                  <FilterSection title="Travel time" disabled={durationRange.max === 0}>
                      <div className="p-2">
                        <p className="text-sm text-center mb-2 text-muted-foreground">
                            {formatDuration(selectedDuration[0])} - {formatDuration(selectedDuration[1])}
                        </p>
                        <Slider
                            min={durationRange.min}
                            max={durationRange.max}
                            step={10}
                            value={selectedDuration}
                            onValueChange={setSelectedDuration}
                            minStepsBetweenThumbs={1}
                        />
                      </div>
                  </FilterSection>

                   <FilterSection title="Airfares" disabled={priceRange.max === 0}>
                     <div className="p-2">
                        <p className="text-sm text-center mb-2 text-muted-foreground">
                            From ${Math.round(selectedPrice[0])} to ${Math.round(selectedPrice[1])}
                        </p>
                        <Slider
                            min={priceRange.min}
                            max={priceRange.max}
                            step={10}
                            value={selectedPrice}
                            onValueChange={setSelectedPrice}
                            minStepsBetweenThumbs={1}
                        />
                      </div>
                  </FilterSection>
                  <FilterSection title="Departure/Arrival times">
                     <div className="p-2 space-y-4">
                        <div>
                          <p className="text-sm text-center mb-2 text-muted-foreground">
                              Departure time: {formatTime(selectedDepartureTime[0])} - {formatTime(selectedDepartureTime[1])}
                          </p>
                          <Slider
                              min={departureTimeRange.min}
                              max={departureTimeRange.max}
                              step={15}
                              value={selectedDepartureTime}
                              onValueChange={setSelectedDepartureTime}
                              minStepsBetweenThumbs={1}
                          />
                        </div>
                         <div className="opacity-50">
                          <p className="text-sm text-center mb-2 text-muted-foreground">
                              Arrival time: 00:00 - 23:59
                          </p>
                          <Slider
                              defaultValue={[0, 1440]}
                              min={0}
                              max={1440}
                              step={15}
                              minStepsBetweenThumbs={1}
                              disabled
                          />
                        </div>
                      </div>
                  </FilterSection>
                  
                   <FilterSection title="Connecting airports" disabled>
                     <p className="p-2 text-sm text-muted-foreground">Connecting airports filter is not available with this API.</p>
                  </FilterSection>

                  <FilterSection title="Airlines" disabled={availableAirlines.length === 0}>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                          <div className="flex items-center space-x-2">
                              <Checkbox 
                                  id="select-all-airlines"
                                  checked={selectedAirlines.length === availableAirlines.length}
                                  onCheckedChange={(checked) => handleSelectAllAirlines(!!checked)}
                              />
                              <Label htmlFor="select-all-airlines" className="font-medium">Select All</Label>
                          </div>
                          {availableAirlines.map(airline => (
                               <div key={airline} className="flex items-center space-x-2">
                                  <Checkbox
                                      id={`airline-${airline}`}
                                      checked={selectedAirlines.includes(airline)}
                                      onCheckedChange={() => handleAirlineSelection(airline)}
                                  />
                                  <Label htmlFor={`airline-${airline}`}>{airline}</Label>
                              </div>
                          ))}
                      </div>
                  </FilterSection>
                  
                  <FilterSection title="Airports" disabled>
                     <p className="p-2 text-sm text-muted-foreground">Airport filter is not available.</p>
                  </FilterSection>

                   <FilterSection title="Online travel agencies" disabled>
                     <p className="p-2 text-sm text-muted-foreground">Agency filter is not available.</p>
                  </FilterSection>
              </Accordion>
          </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {origin} → {destination}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDate(depart_date)}
                  {return_date && ` → ${formatDate(return_date)}`}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  {passengers} {parseInt(passengers) === 1 ? 'Passenger' : 'Passengers'}
                </div>
                <div className="flex items-center">
                  <Plane className="w-4 h-4 mr-2" />
                  {cabin_class.charAt(0).toUpperCase() + cabin_class.slice(1)}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
                <Button
                  onClick={() => setIsFilterOpen(true)}
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 lg:hidden"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  New Search
                </Button>
            </div>
          </div>
        </div>
      </div>
      
        {/* Mobile Filter Sheet */}
        {isFilterOpen && (
            <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsFilterOpen(false)}>
                <div className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-background z-50 p-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(false)} className="absolute top-2 right-2">
                        <X />
                    </Button>
                    <FilterSidebar />
                </div>
            </div>
        )}


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filter Sidebar (Desktop) */}
            <div className="hidden lg:block">
                <FilterSidebar />
            </div>

          {/* Flights List */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Available Flights ({sortedFlights.length})
              </h2>
              <p className="text-gray-600">
                Best prices from multiple airlines
              </p>
            </div>

            {flights.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No flights match your search
                </h3>
                <p className="text-gray-600 mb-4">
                  We couldn't find any flights for the selected route and dates.
                </p>
                <Button onClick={() => router.push('/')}>
                  Try a New Search
                </Button>
              </div>
            ) : sortedFlights.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No flights match your filters
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters to see more results.
                </p>
                <Button onClick={handleResetFilters}>
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedFlights.map((flight) => (
                  <div
                    key={flight.id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                  >
                    <div className="p-6 md:grid md:grid-cols-4 md:gap-6 items-center">
                      
                      {/* Airline Info */}
                      <div className="col-span-1 flex items-center gap-4 mb-4 md:mb-0">
                        <Image
                          src={`https://pics.aviasales.com/92/92/${flight.airline_code}.png`}
                          alt={`${flight.airline || 'Airline'} logo`}
                          width={40}
                          height={40}
                          className="rounded-full bg-gray-100"
                          unoptimized
                        />
                        <div>
                           <div className="font-bold text-gray-900">{flight.airline || flight.airline_code}</div>
                           <div className="text-sm text-gray-500">{flight.flight_number}</div>
                        </div>
                      </div>

                      {/* Flight Details */}
                      <div className="col-span-2 space-y-4 md:space-y-0 md:flex justify-around items-center text-center border-y md:border-y-0 md:border-x py-4 md:py-0">
                          <div className="flex items-center gap-2 justify-center">
                            <Calendar className="w-4 h-4 text-gray-400"/>
                            <div>
                              <div className="text-gray-500 text-sm">Depart</div>
                              <div className="font-medium">{formatDate(flight.departure_at)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 justify-center">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-gray-500 text-sm">Duration</div>
                              <div className="font-medium">
                                {flight.duration ? formatDuration(flight.duration) : 'N/A'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 justify-center">
                             <Wind className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-gray-500 text-sm">Stops</div>
                              <div className={`font-medium ${flight.transfers > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                  {flight.transfers === 0 ? 'Non-stop' : `${flight.transfers} stop(s)`}
                              </div>
                            </div>
                          </div>
                      </div>

                      {/* Price & Booking */}
                       <div className="col-span-1 text-center md:text-right mt-4 md:mt-0">
                          <div className="text-3xl font-bold text-blue-600">
                            ${Math.round(getFlightDisplayPrice(flight))}
                          </div>
                           <div className="text-sm text-gray-500 mb-4">
                            per passenger
                          </div>
                          <Button
                            onClick={() => handleBookFlight(flight)}
                            className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            disabled={!flight.link}
                          >
                            <Plane className="w-5 h-5 mr-2" />
                            Book Now
                          </Button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            {sortedFlights.length > 0 && (
              <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Showing {Math.min(sortedFlights.length, 30)} of {sortedFlights.length} flights
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                      Back to Top
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/')}
                    >
                      New Search
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading search results...</p>
        </div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
