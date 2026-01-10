'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Filter, 
  SortAsc, 
  Clock, 
  Plane, 
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Flight, travelpayoutsApi, FlightSearchParams } from '@/services/travelpayoutsApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { formatDuration, formatDateString } from '@/lib/utils';
import { toast as hotToast } from 'react-hot-toast';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [flights, setFlights] = useState<Flight[]>([]);
  const [filters, setFilters] = useState({
    maxPrice: 5000,
    maxStops: 2,
    airlines: [] as string[],
    sortBy: 'price' as 'price' | 'duration' | 'departure',
  });

  const searchData = useMemo(() => ({
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || '',
    depart_date: searchParams.get('depart_date') || '',
    return_date: searchParams.get('return_date') || '',
    passengers: parseInt(searchParams.get('passengers') || '1'),
    cabin_class: (searchParams.get('cabin_class') || 'economy') as 'economy' | 'business' | 'first',
    trip_type: searchParams.get('trip_type') || 'round',
  }), [searchParams]);

  const { data: searchId, error: searchIdError } = useQuery({
    queryKey: ['flightSearchId', searchData],
    queryFn: () => {
        if (!searchData.origin || !searchData.destination || !searchData.depart_date) {
            throw new Error('Missing search parameters');
        }
        hotToast.loading('Finding the best flights...');
        return travelpayoutsApi.searchFlightsRealtime(searchData as FlightSearchParams);
    },
    enabled: !!searchData.origin && !!searchData.destination && !!searchData.depart_date,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { data: searchResults, isLoading: resultsLoading, error: resultsError } = useQuery({
    queryKey: ['flightSearchResults', searchId],
    queryFn: async () => {
      const results = await travelpayoutsApi.getFlightSearchResults(searchId!);
      // The actual flight tickets are nested in the response
      const tickets = results?.tickets || [];
      return tickets.map((ticket: any) => ({
        ...ticket,
        value: ticket.price,
        depart_date: ticket.departure_at,
        return_date: ticket.return_at,
        number_of_changes: ticket.transfers,
        link: ticket.link,
      }));
    },
    enabled: !!searchId,
    refetchInterval: (data) => (data && data.length > 0 ? false : 2000), // poll every 2s until we get results
    onSuccess: (data) => {
        if (data && data.length > 0) {
            hotToast.dismiss();
            hotToast.success('We found flights for you!');
            setFlights(data);
        }
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (searchIdError) {
      hotToast.dismiss();
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: searchIdError.message || "Could not initiate flight search."
      });
      router.push('/');
    }
  }, [searchIdError, router, toast]);

  useEffect(() => {
    if (resultsError) {
        hotToast.dismiss();
        toast({
            variant: "destructive",
            title: 'Failed to Load Flights',
            description: resultsError.message || 'There was an error fetching flight data. Please try again later.'
        });
    }
  }, [resultsError, toast]);

  const filteredFlights = useMemo(() => (flights || [])
    .filter(flight => {
      const priceFilter = flight.value <= filters.maxPrice;
      const stopsFilter = flight.number_of_changes <= filters.maxStops;
      const airlineFilter = filters.airlines.length === 0 || 
        (flight.airline && filters.airlines.includes(flight.airline));
      
      return priceFilter && stopsFilter && airlineFilter;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'price':
          return a.value - b.value;
        case 'duration':
          return a.duration - b.duration;
        case 'departure':
          return new Date(a.depart_date).getTime() - new Date(b.depart_date).getTime();
        default:
          return 0;
      }
    }), [flights, filters]);

  const handleBookFlight = (flight: Flight) => {
    if (flight.link) {
      window.open(`https://www.aviasales.com${flight.link}`, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        variant: "destructive",
        title: "Booking Unavailable",
        description: "A booking link is not available for this flight."
      });
    }
  };
  
  const isLoading = resultsLoading || (flights.length === 0 && !resultsError);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="text-center py-20">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Searching for the best flights...</p>
            <p className="text-sm text-muted-foreground/50">This may take a moment.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/50">
      <header className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {searchData.origin} <ArrowRight className="inline-block h-6 w-6" /> {searchData.destination}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-primary-foreground/80">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDateString(searchData.depart_date, 'MMM dd, yyyy')}
                  {searchData.return_date && ` - ${formatDateString(searchData.return_date, 'MMM dd, yyyy')}`}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {searchData.passengers} {searchData.passengers === 1 ? 'Passenger' : 'Passengers'}
                </div>
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  <span className="capitalize">{searchData.cabin_class}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
            >
              New Search
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <Card className="sticky top-24 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Filter className="h-5 w-5"/>
                    Filters
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({
                      maxPrice: 5000,
                      maxStops: 2,
                      airlines: [],
                      sortBy: 'price',
                    })}
                  >
                    Clear All
                  </Button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Max Price: <span className="font-bold text-primary">${filters.maxPrice}</span>
                    </label>
                    <Slider
                      min={0}
                      max={5000}
                      step={100}
                      value={[filters.maxPrice]}
                      onValueChange={(value) => setFilters(prev => ({
                        ...prev,
                        maxPrice: value[0],
                      }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Max Stops
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 0, label: 'Non-stop' },
                        { value: 1, label: '1 stop max' },
                        { value: 2, label: '2 stops max' },
                      ].map((stop) => (
                        <Button
                          key={stop.value}
                          variant={filters.maxStops === stop.value ? 'default' : 'secondary'}
                          onClick={() => setFilters(prev => ({
                            ...prev,
                            maxStops: stop.value,
                          }))}
                          className="w-full justify-start"
                        >
                          {stop.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Sort By
                    </label>
                    <div className="space-y-2">
                    {([
                        { value: 'price', label: 'Price', icon: SortAsc },
                        { value: 'duration', label: 'Duration', icon: Clock },
                        { value: 'departure', label: 'Departure', icon: Clock },
                    ] as const).map((sort) => (
                        <Button
                          key={sort.value}
                          variant={filters.sortBy === sort.value ? 'default' : 'secondary'}
                          onClick={() => setFilters(prev => ({ ...prev, sortBy: sort.value }))}
                          className="w-full justify-between"
                        >
                          <span>{sort.label}</span>
                          <sort.icon className="h-4 w-4" />
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          <section className="lg:col-span-3">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {filteredFlights.length} Flights Found
                </h2>
                <p className="text-muted-foreground">
                  Showing best prices from {flights.length} options
                </p>
              </div>
              <Badge variant="outline">Prices per passenger</Badge>
            </div>

            {filteredFlights.length === 0 ? (
              <Card className="p-8 text-center shadow-lg">
                <CardContent>
                  <Plane className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No flights found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search criteria.
                  </p>
                  <Button onClick={() => router.push('/')}>
                    New Search
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredFlights.map((flight, index) => (
                  <Card
                    key={`${flight.origin}-${flight.destination}-${flight.depart_date}-${index}`}
                    className="shadow-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-2xl font-bold">
                              {flight.origin} <ArrowRight className="inline h-5 w-5"/> {flight.destination}
                            </h3>
                            <Badge variant={flight.number_of_changes === 0 ? 'secondary' : 'outline'}>
                              {flight.number_of_changes === 0 ? 'Non-stop' : `${flight.number_of_changes} stop(s)`}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">
                            {formatDateString(flight.depart_date, 'EEE, MMM dd')}
                            {flight.return_date && ` - ${formatDateString(flight.return_date, 'EEE, MMM dd')}`}
                          </p>
                        </div>
                        <div className="mt-4 md:mt-0 text-left md:text-right">
                          <p className="text-3xl font-bold text-primary">
                            ${flight.value}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 border-t pt-6">
                          <div className="flex items-center gap-3">
                            <Plane className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Airline</p>
                              <p className="font-medium">
                                {flight.airline || 'Multiple'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Duration</p>
                              <p className="font-medium">
                                {formatDuration(flight.duration)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Distance</p>
                              <p className="font-medium">
                                {(flight.distance / 1000).toFixed(0)} km
                              </p>
                            </div>
                          </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          onClick={() => handleBookFlight(flight)}
                          className="flex-1 py-3"
                        >
                          Book Now <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 py-3"
                          onClick={() => {
                            toast({ title: 'Feature coming soon!', description: 'Detailed flight information will be shown here.'});
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading search results...</p>
        </div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
