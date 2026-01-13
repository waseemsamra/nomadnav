
'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Plane, 
  Users,
  Filter,
  X,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { type Flight, travelpayoutsApi } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import FlightCard from '@/components/flights/FlightCard';
import { OTA_DATA } from '@/lib/ota-data';
import { ALLIANCE_DATA } from '@/lib/alliance-data';


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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // All filter states are managed here
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedStops, setSelectedStops] = useState<number[]>([]);
  const [baggageFilter, setBaggageFilter] = useState<BaggageFilterType>('all');
  const [durationRange, setDurationRange] = useState({ min: 0, max: 0 });
  const [selectedDuration, setSelectedDuration] = useState([0, 0]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [selectedPrice, setSelectedPrice] = useState([0, 0]);
  const [departureTimeRange, setDepartureTimeRange] = useState({ min: 0, max: 1440 });
  const [selectedDepartureTime, setSelectedDepartureTime] = useState([0, 1440]);
  const [selectedOtas, setSelectedOtas] = useState<string[]>([]);

  // Memoized options derived from flight data
  const airlineOptions = useMemo(() => {
      if (flights.length === 0) return [];
      const uniqueAirlines = [...new Map(flights.map(f => [f.airline_code, { code: f.airline_code, name: f.airline }])).values()];
      return uniqueAirlines.sort((a,b) => a.name.localeCompare(b.name));
  }, [flights]);

  const stopOptions = useMemo(() => {
    if (flights.length === 0) return [];
    const stopsMap = new Map<number, number>();
    flights.forEach(flight => {
        const price = travelpayoutsApi.getFlightDisplayPrice(flight, baggageFilter);
        const currentMinPrice = stopsMap.get(flight.transfers);
        if (currentMinPrice === undefined || price < currentMinPrice) {
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
  
  const otaOptions = useMemo(() => {
      const gatePrices: { [key: string]: number } = {};
      flights.forEach(flight => {
          const price = travelpayoutsApi.getFlightDisplayPrice(flight, 'all');
          if (flight.gate && (!gatePrices[flight.gate] || price < gatePrices[flight.gate])) {
              gatePrices[flight.gate] = price;
          }
      });
      return OTA_DATA
          .map(ota => ({
              id: ota.code,
              name: ota.name,
              price: gatePrices[ota.code] ? Math.round(gatePrices[ota.code]) : null
          }))
          .sort((a, b) => {
            if (a.price === null) return 1;
            if (b.price === null) return -1;
            return a.price - b.price;
          });
  }, [flights]);

  const baggagePriceOptions = useMemo(() => {
      if (flights.length === 0) return { without: null, with: null };
      const minWithout = Math.min(...flights.map(f => f.price));
      const minWith = Math.min(...flights.map(f => travelpayoutsApi.getFlightDisplayPrice(f, 'with')));
      return {
          without: isFinite(minWithout) ? Math.round(minWithout) : null,
          with: isFinite(minWith) ? Math.round(minWith) : null,
      };
  }, [flights]);


  // Extract search parameters
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const depart_date = searchParams.get('depart_date') || '';
  const return_date = searchParams.get('return_date') || '';
  const passengers = searchParams.get('passengers') || '1';
  const cabin_class = searchParams.get('cabin_class') || 'economy';

  // **EFFECT: Fetch flights and initialize filters atomically**
  useEffect(() => {
    async function fetchAndInitialize() {
      if (!origin || !destination) {
        router.push('/');
        return;
      }
      setLoading(true);
      try {
        const flightData = await travelpayoutsApi.searchFlights({
            origin,
            destination,
            depart_date: depart_date,
            return_date: return_date || undefined,
            passengers: parseInt(passengers),
            currency: 'USD',
            limit: 100,
        });
        
        console.log(`Fetched ${flightData.length} flights`);
        
        // **ATOMIC UPDATE**: Set flights and filters at the same time
        setFlights(flightData);
        
        if (flightData.length > 0) {
          toast.success(`Found ${flightData.length} flights`);

          // Initialize filters based on the new data
          const prices = flightData.map(f => travelpayoutsApi.getFlightDisplayPrice(f, 'all'));
          const minPrice = Math.floor(Math.min(...prices.filter(p => isFinite(p))));
          const maxPrice = Math.ceil(Math.max(...prices.filter(p => isFinite(p))));
          
          const durations = flightData.map(f => f.duration);
          const minDuration = Math.min(...durations);
          const maxDuration = Math.max(...durations);

          const uniqueAirlineCodes = [...new Set(flightData.map(f => f.airline_code))];
          const uniqueStops = [...new Set(flightData.map(f => f.transfers))];
          const uniqueOtas = [...new Set(flightData.map(f => f.gate).filter(Boolean))];

          setPriceRange({ min: minPrice, max: maxPrice });
          setSelectedPrice([minPrice, maxPrice]);
          setDurationRange({ min: minDuration, max: maxDuration });
          setSelectedDuration([minDuration, maxDuration]);
          setSelectedAirlines(uniqueAirlineCodes);
          setSelectedStops(uniqueStops);
          setSelectedOtas(uniqueOtas);
        } else {
          toast.error(`No flights found for ${origin} to ${destination}.`);
        }
      } catch (error: any) {
        console.error('Error fetching flights:', error);
        toast.error(error.message || 'Failed to load flight data.');
        setFlights([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAndInitialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, depart_date, return_date, passengers, cabin_class, router]);
  

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

  const handleAirlineSelection = (airlineCode: string) => {
    setSelectedAirlines(prev => 
      prev.includes(airlineCode)
        ? prev.filter(a => a !== airlineCode)
        : [...prev, airlineCode]
    );
  };
  
  const handleSelectAllAirlines = (checked: boolean) => {
    setSelectedAirlines(checked ? airlineOptions.map(a => a.code) : []);
  }

  const handleStopSelection = (stopCount: number) => {
    setSelectedStops(prev => 
        prev.includes(stopCount)
            ? prev.filter(s => s !== stopCount)
            : [...prev, stopCount]
    );
  };

  const handleSelectAllStops = (checked: boolean) => {
      setSelectedStops(checked ? stopOptions.map(opt => opt.value) : []);
  }
  
  const handleOtaSelection = (otaId: string) => {
    setSelectedOtas(prev => 
      prev.includes(otaId)
        ? prev.filter(id => id !== otaId)
        : [...prev, otaId]
    );
  };

  const handleSelectAllOtas = (checked: boolean) => {
    setSelectedOtas(checked ? otaOptions.filter(o => o.price !== null).map(ota => ota.id) : []);
  };


  const handleResetFilters = () => {
    setFilters(initialFilterState);
    if (flights.length > 0) {
        setSelectedAirlines([...new Set(flights.map(f => f.airline_code))]);
        setSelectedStops([...new Set(flights.map(f => f.transfers))]);
        setSelectedOtas([...new Set(flights.map(f => f.gate))].filter(Boolean));
        setSelectedDuration([durationRange.min, durationRange.max]);
        setSelectedPrice([priceRange.min, priceRange.max]);
        setSelectedDepartureTime([departureTimeRange.min, departureTimeRange.max]);
    }
    setBaggageFilter('all');
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
      if (!dateString) return '';
      // Create date object assuming UTC to avoid timezone shifts
      const date = new Date(dateString + 'T00:00:00Z');
      return format(date, 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };
  
  const sortedFlights = useMemo(() => {
    // Prevent filtering if flights or filters are not ready
    if (flights.length === 0 || selectedAirlines.length === 0) {
        return [];
    }
    return travelpayoutsApi.filterAndSortFlights({
        flights,
        filters,
        selectedAirlines,
        selectedStops,
        baggageFilter,
        selectedDuration,
        selectedPrice,
        selectedDepartureTime,
        selectedOtas,
    });
  }, [flights, filters, selectedAirlines, selectedStops, baggageFilter, selectedDuration, selectedPrice, selectedDepartureTime, selectedOtas]);

  const flightGroups = useMemo(() => {
    if (sortedFlights.length === 0) return [];
  
    const getFlightKey = (f: Flight) =>
      `${f.airline_code}-${f.flight_number}-${f.departure_at}-${f.duration}-${f.transfers}`;
  
    const groups = new Map<string, Flight[]>();
  
    for (const flight of sortedFlights) {
      const key = getFlightKey(flight);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(flight);
    }
  
    return Array.from(groups.values()).map(group => {
      group.sort((a, b) => travelpayoutsApi.getFlightDisplayPrice(a, baggageFilter) - travelpayoutsApi.getFlightDisplayPrice(b, baggageFilter));
      return group;
    });
  }, [sortedFlights, baggageFilter]);


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
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Filters</h3>
                   <Button variant="link" size="sm" onClick={handleResetFilters}>Clear all</Button>
              </div>

              <div className="space-y-2 border-t pt-4">
                  <label className="font-semibold text-sm text-muted-foreground">SORT</label>
                  <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value as 'price' | 'duration' | 'departure')}>
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

              <Accordion type="multiple" className="w-full border-t mt-4" defaultValue={['Numbers of stops', 'Baggage', 'TRAVEL TIME', 'Airfares', 'Departure/Arrival times', 'Airlines', 'Online travel agencies']}>
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
                  
                  <FilterSection title="TRAVEL TIME" disabled={durationRange.max === 0 || durationRange.min === durationRange.max}>
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

                   <FilterSection title="Airfares" disabled={priceRange.max === 0 || priceRange.min === priceRange.max}>
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

                  <FilterSection title="Airlines" disabled={airlineOptions.length === 0}>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                          <div className="flex items-center space-x-2">
                              <Checkbox 
                                  id="select-all-airlines"
                                  checked={selectedAirlines.length === airlineOptions.length}
                                  onCheckedChange={(checked) => handleSelectAllAirlines(!!checked)}
                              />
                              <Label htmlFor="select-all-airlines" className="font-medium">Select All</Label>
                          </div>
                          {airlineOptions.map((airline) => (
                               <div key={`${airline.code}-${airline.name}`} className="flex items-center space-x-2">
                                  <Checkbox
                                      id={`airline-${airline.name}`}
                                      checked={selectedAirlines.includes(airline.code)}
                                      onCheckedChange={() => handleAirlineSelection(airline.code)}
                                  />
                                  <Label htmlFor={`airline-${airline.name}`}>{airline.name}</Label>
                              </div>
                          ))}
                      </div>
                  </FilterSection>
                  
                   <FilterSection title="Airports" disabled>
                     <p className="p-2 text-sm text-muted-foreground">Airport filter is not available.</p>
                  </FilterSection>

                  <FilterSection title="Online travel agencies" disabled={otaOptions.length === 0}>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id="select-all-otas" 
                                      checked={selectedOtas.length === otaOptions.filter(o => o.price !== null).length}
                                      onCheckedChange={(checked) => handleSelectAllOtas(!!checked)}
                                    />
                                    <Label htmlFor="select-all-otas" className="font-medium">Select All</Label>
                                </div>
                            </div>
                            {otaOptions.map(ota => (
                               <div key={ota.id} className="flex items-center justify-between">
                                  <div className={`flex items-center space-x-2 ${ota.price === null ? 'opacity-50' : ''}`}>
                                      <Checkbox 
                                        id={`ota-${ota.id}`} 
                                        checked={selectedOtas.includes(ota.id)}
                                        onCheckedChange={() => handleOtaSelection(ota.id)}
                                        disabled={ota.price === null}
                                      />
                                      <Label htmlFor={`ota-${ota.id}`} className={ota.price === null ? 'cursor-not-allowed' : ''}>{ota.name}</Label>
                                  </div>
                                   {ota.price !== null && <span className="text-sm text-muted-foreground">${ota.price}</span>}
                              </div>
                            ))}
                        </div>
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
                Available Flights ({flightGroups.length})
              </h2>
              <p className="text-gray-600">
                Best prices from multiple airlines & travel agencies
              </p>
            </div>

            {flights.length > 0 && flightGroups.length === 0 ? (
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
            ) : flights.length === 0 && !loading ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No flights match your search
                  </h3>
                  <p className="text-gray-600 mb-4">
                    We couldn't find any flights for the selected route and dates. Try a different search.
                  </p>
                  <Button onClick={() => router.push('/')}>
                    Try a New Search
                  </Button>
                </div>
            ) : (
              <div className="space-y-4">
                {flightGroups.map((group, index) => (
                  <FlightCard 
                    key={`${group[0].id}-${index}`}
                    offers={group}
                    onBookFlight={handleBookFlight} 
                    baggageFilter={baggageFilter} 
                  />
                ))}
              </div>
            )}

            {/* Footer */}
            {flightGroups.length > 0 && (
              <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Showing {Math.min(flightGroups.length, 30)} of {flightGroups.length} unique flight routes
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

    