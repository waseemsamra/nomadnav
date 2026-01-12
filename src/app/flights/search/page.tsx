

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
  X
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { type Flight, travelpayoutsApi } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type FilterState = {
  sortBy: 'price' | 'duration' | 'departure';
};

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
        
        if (flightData.length > 0) {
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

  const handleResetFilters = () => {
    setFilters(initialFilterState);
    setSelectedAirlines(availableAirlines);
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
  
  const sortedFlights = useMemo(() => {
    let filtered = [...flights].filter(flight => selectedAirlines.includes(flight.airline));

    switch (filters.sortBy) {
        case 'price':
            filtered.sort((a,b) => a.price - b.price);
            break;
        case 'duration':
            filtered.sort((a,b) => (a.duration || 9999) - (b.duration || 9999));
            break;
        case 'departure':
            filtered.sort((a,b) => new Date(a.departure_at).getTime() - new Date(b.departure_at).getTime());
            break;
    }
    return filtered;
  }, [flights, filters, selectedAirlines]);

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
                <h3 className="font-bold text-lg">Sort & Filter</h3>
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

            {/* Airlines Filter */}
            {availableAirlines.length > 1 && (
                 <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Airlines</h4>
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
                 </div>
            )}
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
                            ${flight.price}
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
