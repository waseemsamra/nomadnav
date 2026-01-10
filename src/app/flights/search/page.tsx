'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Filter, 
  Plane, 
  Clock, 
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  Shield,
  Check,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { type Flight, travelpayoutsApi } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    maxPrice: 1000,
    maxStops: 2,
    sortBy: 'price' as 'price' | 'duration',
  });

  // Extract search parameters
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const depart_date = searchParams.get('depart_date') || '';
  const return_date = searchParams.get('return_date') || '';
  const passengers = searchParams.get('passengers') || '1';
  const cabin_class = searchParams.get('cabin_class') || 'economy';
  const trip_type = searchParams.get('trip_type') || 'round';

  // Fetch flights
  useEffect(() => {
    const fetchFlights = async () => {
      if (!origin || !destination || !depart_date) {
        router.push('/');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Fetching flights with:', {
          origin,
          destination,
          depart_date,
          return_date,
          passengers: parseInt(passengers),
        });

        const flightData = await travelpayoutsApi.searchFlights({
          origin,
          destination,
          depart_date,
          return_date: return_date || undefined,
          passengers: parseInt(passengers),
          currency: 'USD',
          limit: 20,
        });
        
        console.log('Fetched flights:', flightData.length);
        setFlights(flightData);
        
        if (flightData.length === 0) {
          toast('No flights found. Try different dates or airports.');
        } else {
          toast.success(`Found ${flightData.length} flights`);
        }
      } catch (error: any) {
        console.error('Error fetching flights:', error);
        setError(error.message || 'Failed to load flights');
        toast.error('Failed to load flights. Showing mock data.');
        
        // Show mock data even on error
        const mockFlights = await travelpayoutsApi.searchFlights({
          origin,
          destination,
          depart_date,
          return_date: return_date || undefined,
          passengers: parseInt(passengers),
          currency: 'USD',
          limit: 20,
        });
        setFlights(mockFlights);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [origin, destination, depart_date, return_date, passengers, router]);

  // Filter and sort flights
  const filteredFlights = flights
    .filter(flight => {
      const priceFilter = flight.value <= filters.maxPrice;
      const stopsFilter = flight.number_of_changes <= filters.maxStops;
      return priceFilter && stopsFilter;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'price':
          return a.value - b.value;
        case 'duration':
          return a.duration - b.duration;
        default:
          return 0;
      }
    });

  const handleBookFlight = (flight: Flight) => {
    if (flight.link) {
      window.open(`https://www.aviasales.com${flight.link}`, '_blank', 'noopener,noreferrer');
      toast.success('Opening booking page...');
    } else {
      // Generate Aviasales link
      const aviasalesLink = `https://www.aviasales.com/search/${origin}${depart_date.replace(/-/g, '')}${destination}${return_date ? return_date.replace(/-/g, '') : ''}${passengers}`;
      window.open(aviasalesLink, '_blank', 'noopener,noreferrer');
    }
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

  const getCabinClass = (tripClass: number) => {
    switch (tripClass) {
      case 0: return 'Economy';
      case 1: return 'Business';
      case 2: return 'First Class';
      default: return 'Economy';
    }
  };

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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-yellow-500 mr-2" />
              <div>
                <p className="text-yellow-700 font-medium">Showing demo data</p>
                <p className="text-yellow-600 text-sm">API Error: {error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                </h2>
                <span className="text-sm text-gray-500">
                  {filteredFlights.length} flights
                </span>
              </div>

              {/* Price Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price: ${filters.maxPrice}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="50"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    maxPrice: parseInt(e.target.value),
                  }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$0</span>
                  <span>$1000</span>
                  <span>$2000</span>
                </div>
              </div>

              {/* Stops Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Stops
                </label>
                <div className="space-y-2">
                  {[
                    { value: 0, label: 'Non-stop' },
                    { value: 1, label: '1 stop max' },
                    { value: 2, label: '2 stops max' },
                    { value: 3, label: 'Any stops' },
                  ].map((stop) => (
                    <button
                      key={stop.value}
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        maxStops: stop.value,
                      }))}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        filters.maxStops === stop.value
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {stop.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, sortBy: 'price' }))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      filters.sortBy === 'price'
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span>Price (Lowest)</span>
                    {filters.sortBy === 'price' && <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, sortBy: 'duration' }))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      filters.sortBy === 'duration'
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span>Duration (Shortest)</span>
                    {filters.sortBy === 'duration' && <Check className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Flights List */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Available Flights
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
                  Try adjusting your filters or search criteria
                </p>
                <Button onClick={() => setFilters({ maxPrice: 1000, maxStops: 2, sortBy: 'price' })}>
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFlights.map((flight, index) => (
                  <div
                    key={`${flight.origin}-${flight.destination}-${flight.depart_date}-${index}`}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Flight Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                        <div>
                          <div className="flex items-center mb-2">
                            <div className="text-2xl font-bold">
                              {flight.origin} → {flight.destination}
                            </div>
                            <div className={`ml-4 px-2 py-1 text-xs font-semibold rounded ${
                              flight.number_of_changes === 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {flight.number_of_changes === 0 ? 'Non-stop' : `${flight.number_of_changes} stop(s)`}
                            </div>
                          </div>
                          <div className="text-gray-600">
                            {formatDate(flight.depart_date)}
                            {flight.return_date && ` → ${formatDate(flight.return_date)}`}
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0">
                          <div className="text-3xl font-bold text-blue-600">
                            ${flight.value}
                          </div>
                          <div className="text-sm text-gray-500 text-right">
                            per passenger
                          </div>
                        </div>
                      </div>

                      {/* Flight Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="flex items-center">
                          <Plane className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">Airline</div>
                            <div className="font-medium">
                              {flight.airline || 'Multiple airlines'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">Duration</div>
                            <div className="font-medium">
                              {formatDuration(flight.duration)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">Distance</div>
                            <div className="font-medium">
                              {Math.round(flight.distance / 1000)}k km
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-5 h-5 mr-3 flex items-center justify-center">
                            <div className="w-4 h-4 border border-gray-400 rounded"></div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Class</div>
                            <div className="font-medium">
                              {getCabinClass(flight.trip_class)}
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
                              ' • ' + formatDuration(flight.duration) + ' • $' + flight.value);
                          }}
                        >
                          View Details
                        </Button>
                      </div>

                      {/* Additional Info */}
                      {flight.actual && (
                        <div className="mt-4 text-sm text-green-600 flex items-center">
                          <Check className="w-4 h-4 mr-1" />
                          Actual flight data • Updated recently
                        </div>
                      )}
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
                    Showing {Math.min(filteredFlights.length, 20)} of {flights.length} flights
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
