
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
import { formatDuration, formatDateString } from '@/lib/utils';


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
  
  const [allFlights, setAllFlights] = useState<Flight[]>([]);
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
  const [selectedOtas, setSelectedOtas] = useState<string[]>([]);

  // Memoized options derived from flight data
  const airlineOptions = useMemo(() => {
      if (!allFlights || allFlights.length === 0) return [];
      const uniqueAirlines = [...new Map(allFlights.map(f => [f.airline_code, { code: f.airline_code, name: f.airline }])).values()];
      return uniqueAirlines.sort((a,b) => a.name.localeCompare(b.name));
  }, [allFlights]);

  const stopOptions = useMemo(() => {
    if (!allFlights || allFlights.length === 0) return [];
    const stopsMap = new Map<number, number>();
    allFlights.forEach(flight => {
        const price = travelpayoutsApi.getFlightDisplayPrice(flight, baggageFilter);
        if (typeof flight.transfers !== 'number') return;
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
  }, [allFlights, baggageFilter]);
  
  const otaOptions = useMemo(() => {
      if (!allFlights || allFlights.length === 0) return [];
      const allOtasFromFlights = [...new Set(allFlights.map(f => f.gate).filter(Boolean))];
      const gatePrices: { [key: string]: number } = {};
      
      allFlights.forEach(flight => {
          const price = travelpayoutsApi.getFlightDisplayPrice(flight, 'all');
          if (flight.gate && (!gatePrices[flight.gate] || price < gatePrices[flight.gate])) {
              gatePrices[flight.gate] = price;
          }
      });
      
      const otaInfoFromData = OTA_DATA.filter(ota => allOtasFromFlights.includes(ota.code));
      
      // Add any mock OTAs that aren't in the static data
      allOtasFromFlights.forEach(otaCode => {
        if (!otaInfoFromData.some(ota => ota.code === otaCode)) {
          otaInfoFromData.push({ code: otaCode, name: otaCode, main_url: '#' });
        }
      });

      return otaInfoFromData
          .map(ota => ({
              id: ota.code,
              name: ota.name,
              price: gatePrices[ota.code] ? Math.round(gatePrices[ota.code]) : null
          }))
          .sort((a, b) => {
            if (a.price === null) return 1;
            if (b.price === null) return -1;
            if (a.price !== b.price) return a.price - b.price;
            return a.name.localeCompare(b.name);
          });
  }, [allFlights]);


  const baggagePriceOptions = useMemo(() => {
      if (!allFlights || allFlights.length === 0) return { without: null, with: null };
      const minWithout = Math.min(...allFlights.map(f => f.price));
      const minWith = Math.min(...allFlights.map(f => travelpayoutsApi.getFlightDisplayPrice(f, 'with')));
      return {
          without: isFinite(minWithout) ? Math.round(minWithout) : null,
          with: isFinite(minWith) ? Math.round(minWith) : null,
      };
  }, [allFlights]);


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
            cabin_class: cabin_class,
            limit: 100,
        });
        
        console.log(`Fetched ${flightData.length} flights`);
        
        if (flightData && flightData.length > 0) {
          toast.success(`Found ${flightData.length} flights`);
          setAllFlights(flightData);

          const prices = flightData.map(f => travelpayoutsApi.getFlightDisplayPrice(f, 'all'));
          const minPrice = Math.floor(Math.min(...prices.filter(p => isFinite(p))));
          const maxPrice = Math.ceil(Math.max(...prices.filter(p => isFinite(p))));
          
          const durations = flightData.map(f => f.duration).filter(d => typeof d === 'number');
          const minDuration = Math.min(...durations);
          const maxDuration = Math.max(...durations);
          
          setPriceRange({ min: minPrice, max: maxPrice });
          setSelectedPrice([minPrice, maxPrice]);
          setDurationRange({ min: minDuration, max: maxDuration });
          setSelectedDuration([minDuration, maxDuration]);

          // CORRECT INITIALIZATION: Default to all selected.
          const allAirlines = [...new Set(flightData.map(f => f.airline_code).filter(Boolean))];
          setSelectedAirlines(allAirlines);
          const allStops = [...new Set(flightData.map(f => f.transfers))];
          setSelectedStops(allStops);
          const allOtas = [...new Set(flightData.map(f => f.gate).filter(Boolean))];
          setSelectedOtas(allOtas);


        } else {
          toast.error(`No flights found for ${origin} to ${destination}.`);
          setAllFlights([]);
        }
      } catch (error: any) {
        console.error('Error fetching flights:', error);
        toast.error(error.message || 'Failed to load flight data.');
        setAllFlights([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAndInitialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, depart_date, return_date, passengers, cabin_class]);
  

  const handleBookFlight = (flight: Flight) => {
    if (flight.link && flight.link !== '#') {
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
    setSelectedOtas(checked ? otaOptions.map(ota => ota.id) : []);
  };


  const handleResetFilters = () => {
    setFilters(initialFilterState);
    setSelectedAirlines(airlineOptions.map(a => a.code));
    setSelectedStops(stopOptions.map(s => s.value));
    setSelectedOtas(otaOptions.map(o => o.id));
    setBaggageFilter('all');
    setSelectedDuration([durationRange.min, durationRange.max]);
    setSelectedPrice([priceRange.min, priceRange.max]);
  };


  const formatDate = (dateString: string) => {
    try {
      return formatDateString(dateString, 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };
  
  const sortedAndFilteredFlights = useMemo(() => {
    let filtered = allFlights.filter(flight => {
        const airlineMatch = selectedAirlines.includes(flight.airline_code);
        const stopMatch = typeof flight.transfers === 'number' && selectedStops.includes(flight.transfers);
        const otaMatch = flight.gate && selectedOtas.includes(flight.gate);
        
        const durationMatch = typeof flight.duration === 'number' && flight.duration >= selectedDuration[0] && flight.duration <= selectedDuration[1];
        
        const price = travelpayoutsApi.getFlightDisplayPrice(flight, baggageFilter);
        const priceMatch = price >= selectedPrice[0] && price <= selectedPrice[1];

        return airlineMatch && stopMatch && otaMatch && durationMatch && priceMatch;
    });

    // Apply sorting
    switch (filters.sortBy) {
        case 'price':
            filtered.sort((a, b) => travelpayoutsApi.getFlightDisplayPrice(a, baggageFilter) - travelpayoutsApi.getFlightDisplayPrice(b, baggageFilter));
            break;
        case 'duration':
            filtered.sort((a, b) => (a.duration || 9999) - (b.duration || 9999));
            break;
        case 'departure':
            filtered.sort((a, b) => {
                try {
                    if (!a.departure_at || !b.departure_at) return 0;
                    return new Date(a.departure_at).getTime() - new Date(b.departure_at).getTime();
                } catch(e) {
                    return 0;
                }
            });
            break;
    }
    return filtered;
  }, [allFlights, filters, selectedAirlines, selectedStops, baggageFilter, selectedDuration, selectedPrice, selectedOtas, durationRange, priceRange]);
  

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center p-8">
          <div
            className="w-16 h-16 border-4 border-primary border-t-transparent border-solid rounded-full animate-spin mx-auto"
          ></div>
          <p className="mt-4 text-lg font-semibold">Searching for the best flights...</p>
          <p className="text-muted-foreground mt-2">
              Searching {origin} → {destination} on {formatDate(depart_date)}
          </p>
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
    
    // Determine checkbox state for "Select All"
    const isAllAirlinesSelected = airlineOptions.length > 0 && selectedAirlines.length === airlineOptions.length;
    const isAllStopsSelected = stopOptions.length > 0 && selectedStops.length === stopOptions.length;
    const isAllOtasSelected = otaOptions.length > 0 && selectedOtas.length === otaOptions.length;


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

              <Accordion type="multiple" className="w-full border-t mt-4" defaultValue={['Numbers of stops', 'Baggage', 'TRAVEL TIME', 'Airfares', 'Airlines', 'Online travel agencies']}>
                  <FilterSection title="Numbers of stops" disabled={stopOptions.length === 0}>
                      <div className="space-y-2 pr-2">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="select-all-stops"
                                    checked={isAllStopsSelected}
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
                            {formatDuration(selectedDuration[0] * 60)} - {formatDuration(selectedDuration[1] * 60)}
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

                  <FilterSection title="Airlines" disabled={airlineOptions.length === 0}>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                          <div className="flex items-center space-x-2">
                              <Checkbox 
                                  id="select-all-airlines"
                                  checked={isAllAirlinesSelected}
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

                  <FilterSection title="Online travel agencies" disabled={otaOptions.length === 0}>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                             <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id="select-all-otas" 
                                      checked={isAllOtasSelected}
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

  const renderContent = () => {
    if (allFlights.length > 0 && sortedAndFilteredFlights.length === 0) {
      return (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-4">✈️</div>
          <h3 className="text-xl font-semibold">No flights match your filters</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria or clearing some filters.</p>
          <Button onClick={handleResetFilters} className="mt-4">Clear All Filters</Button>
        </div>
      );
    }

    if (allFlights.length === 0) {
      return (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-4">✈️</div>
          <h3 className="text-xl font-semibold">No flights found</h3>
          <p className="text-muted-foreground">We couldn't find any flights for the selected route and dates.</p>
          <Button onClick={() => router.push('/')} className="mt-4">Try a New Search</Button>
        </div>
      );
    }

    return (
      <div className='space-y-4'>
        <div className="p-4 bg-gray-50 rounded-lg text-sm text-muted-foreground">
            <p>Showing {sortedAndFilteredFlights.length} of {allFlights.length} flights. All prices are in USD and include estimated taxes.</p>
        </div>
        <div className="space-y-4">
            {sortedAndFilteredFlights.map((flight) => (
                <FlightCard 
                    key={flight.id}
                    flight={flight}
                    onBookFlight={handleBookFlight} 
                />
            ))}
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container py-8">
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
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filter Sidebar (Desktop) */}
            <div className="hidden lg:block">
                <FilterSidebar />
            </div>

          {/* Flights List */}
          <div className="lg:col-span-3">
             {renderContent()}
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
        <div className="text-center p-8">
            <div
                className="w-16 h-16 border-4 border-primary border-t-transparent border-solid rounded-full animate-spin mx-auto"
            ></div>
            <p className="mt-4 text-lg font-semibold">Loading search results...</p>
        </div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}

    

    
