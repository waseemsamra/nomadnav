

'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Plane, 
  Clock, 
  Calendar,
  Users,
  ArrowRight,
  Wind,
  Filter,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { type Flight, travelpayoutsApi } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

type FilterState = {
  maxPrice: number;
  maxStops: number;
  airlines: string[];
  sortBy: 'price' | 'duration' | 'departure';
  departureTime: [number, number];
};

const initialFilterState: FilterState = {
  maxPrice: 5000,
  maxStops: 3,
  airlines: [],
  sortBy: 'price',
  departureTime: [0, 24],
};


function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
        
        if (flightData.length === 0) {
          toast('No flights found for this route.');
        } else {
          toast.success(`Found ${flightData.length} flights`);
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
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({...prev, [key]: value}));
  };

  const handleAirlineToggle = (airlineCode: string) => {
    const newAirlines = filters.airlines.includes(airlineCode)
      ? filters.airlines.filter(a => a !== airlineCode)
      : [...filters.airlines, airlineCode];
    handleFilterChange('airlines', newAirlines);
  };
  
  const handleResetFilters = () => {
    setFilters(initialFilterState);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };
  
  const availableAirlines = useMemo(() => {
    const airlineSet = new Set<string>();
    flights.forEach(flight => airlineSet.add(flight.airline_code));
    return [...airlineSet].map(code => ({ code, name: flights.find(f => f.airline_code === code)?.airline || code }));
  }, [flights]);

  const filteredFlights = useMemo(() => {
    let sorted = [...flights]
      .filter(f => f.price <= filters.maxPrice)
      .filter(f => f.transfers <= filters.maxStops)
      .filter(f => filters.airlines.length === 0 || filters.airlines.includes(f.airline_code))
      .filter(f => {
          const departureHour = new Date(f.departure_at).getHours();
          return departureHour >= filters.departureTime[0] && departureHour <= filters.departureTime[1];
      });

    switch (filters.sortBy) {
        case 'price':
            sorted.sort((a,b) => a.price - b.price);
            break;
        case 'duration':
            sorted.sort((a,b) => (a.duration || 9999) - (b.duration || 9999));
            break;
        case 'departure':
            sorted.sort((a,b) => new Date(a.departure_at).getTime() - new Date(b.departure_at).getTime());
            break;
    }
    return sorted;
  }, [flights, filters]);

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

  const FilterSidebar = () => (
    <Card className="lg:sticky lg:top-24">
        <CardContent className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Filters</h3>
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>Reset</Button>
            </div>

            {/* Sort by */}
            <div className="space-y-2">
                <label className="font-semibold text-sm">Sort by</label>
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="duration">Duration</SelectItem>
                        <SelectItem value="departure">Departure Time</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Price slider */}
            <div className="space-y-2">
                <label className="font-semibold text-sm">Max Price: ${filters.maxPrice}</label>
                <Slider 
                    value={[filters.maxPrice]} 
                    onValueChange={(val) => handleFilterChange('maxPrice', val[0])}
                    min={0}
                    max={5000}
                    step={50}
                />
            </div>

            {/* Stops */}
            <div className="space-y-2">
                <label className="font-semibold text-sm">Max Stops: {filters.maxStops}</label>
                <Slider 
                    value={[filters.maxStops]} 
                    onValueChange={(val) => handleFilterChange('maxStops', val[0])}
                    min={0}
                    max={3}
                    step={1}
                />
            </div>
            
             {/* Departure Time */}
            <div className="space-y-2">
                <label className="font-semibold text-sm">Departure Time: {filters.departureTime[0]}:00 - {filters.departureTime[1]}:00</label>
                <Slider 
                    value={filters.departureTime} 
                    onValueChange={(val) => handleFilterChange('departureTime', val)}
                    min={0}
                    max={24}
                    step={1}
                />
            </div>

            {/* Airlines */}
            <div className="space-y-2">
                <label className="font-semibold text-sm">Airlines</label>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                    {availableAirlines.map(airline => (
                        <div key={airline.code} className="flex items-center space-x-2">
                            <Checkbox id={airline.code} checked={filters.airlines.includes(airline.code)} onCheckedChange={() => handleAirlineToggle(airline.code)} />
                            <label htmlFor={airline.code} className="text-sm">{airline.name}</label>
                        </div>
                    ))}
                </div>
            </div>
        </CardContent>
    </Card>
  )

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
                <div className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-background z-50 p-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
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
                Available Flights ({filteredFlights.length})
              </h2>
              <p className="text-gray-600">
                Best prices from multiple airlines
              </p>
            </div>

            {filteredFlights.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No flights match your filters
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or reset them.
                </p>
                <Button onClick={handleResetFilters}>
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFlights.map((flight) => (
                  <div
                    key={flight.id || `${flight.origin}-${flight.destination}-${flight.price}-${flight.departure_at}`}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Flight Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                           <Image
                            src={`https://pics.aviasales.com/92/92/${flight.airline_code}.png`}
                            alt={`${flight.airline} logo`}
                            width={40}
                            height={40}
                            className="rounded-full bg-gray-100"
                          />
                          <div>
                            <div className="text-2xl font-bold">
                              {flight.origin} → {flight.destination}
                            </div>
                            <div className="text-gray-600">
                              {flight.airline}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 md:mt-0 text-right">
                          <div className="text-3xl font-bold text-blue-600">
                            ${flight.price}
                          </div>
                          <div className="text-sm text-gray-500">
                            per passenger
                          </div>
                        </div>
                      </div>

                      {/* Flight Details */}
                      <div className="border-y py-4 mb-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400"/>
                          <div>
                            <div className="text-gray-500">Depart</div>
                            <div className="font-medium">{formatDate(flight.departure_at)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-gray-500">Duration</div>
                            <div className="font-medium">
                              {flight.duration ? formatDuration(flight.duration) : 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <Wind className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-gray-500">Stops</div>
                            <div className={`font-medium ${flight.transfers > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                {flight.transfers === 0 ? 'Non-stop' : `${flight.transfers} stop(s)`}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          onClick={() => handleBookFlight(flight)}
                          className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <ArrowRight className="w-5 h-5 mr-2" />
                          Book Now
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 py-3"
                          onClick={() => {
                            toast.success('Flight details: ' + (flight.airline || 'Multiple airlines') + 
                              ' • ' + (flight.duration ? formatDuration(flight.duration) : 'N/A') + ' • $' + flight.price);
                          }}
                        >
                          View Details
                        </Button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            {filteredFlights.length > 0 && (
              <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Showing {Math.min(filteredFlights.length, 30)} of {filteredFlights.length} flights
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

