
'use client';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { travelpayoutsApi } from '@/services/travelpayoutsApi';
import { useToast } from '@/hooks/use-toast';
import type {
  Flight,
  Hotel,
  FlightSearchParams,
  HotelSearchParams,
  Airport,
  Airline,
  City,
  AirportOption,
} from '@/types/travel';

// Flight Search Hook
export const useFlightSearch = (
  params: FlightSearchParams,
  enabled: boolean = false,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) => {
    const { toast } = useToast();
    return useQuery<any, Error>({
        queryKey: ['flights', params],
        queryFn: async () => {
            const searchId = await travelpayoutsApi.searchFlightsRealtime(params);
            
            let results: any = {};
            let attempts = 0;
            const maxAttempts = 10;
            
            while (attempts < maxAttempts) {
                results = await travelpayoutsApi.getFlightSearchResults(searchId);
                if (results.is_over || (results.tickets && results.tickets.length > 0)) {
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempts++;
            }
            return results;
        },
        enabled,
        ...options,
        onSuccess: () => {
            toast({ title: 'Flights found!' });
        },
        onError: (error: Error) => {
            toast({ variant: "destructive", title: `Failed to search flights: ${error.message}` });
        },
    });
};


// Hotel Search Hook
export const useHotelSearch = (
  params: HotelSearchParams | null,
  options?: Omit<UseQueryOptions<Hotel[], Error>, 'queryKey' | 'queryFn'>
) => {
  const { toast } = useToast();
  return useQuery<Hotel[], Error>({
    queryKey: ['hotels', params],
    queryFn: () => {
      if (!params?.location || !params.checkIn || !params.checkOut) {
        return Promise.resolve([]);
      }
      return travelpayoutsApi.searchHotels(params);
    },
    enabled: !!params?.location && !!params.checkIn && !!params.checkOut,
    ...options,
    onError: (error: Error) => {
      toast({ variant: "destructive", title: `Failed to search hotels: ${error.message}`});
    },
  });
};

// Airports Hook
export const useAirportSearch = (query: string, enabled: boolean = true) => {
  return useQuery<AirportOption[], Error>({
    queryKey: ['airports', query],
    queryFn: () => travelpayoutsApi.searchAirports(query),
    enabled,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};


// Static Data Hooks
export const useAirlines = (enabled: boolean = true) => {
  return useQuery<Airline[], Error>({
    queryKey: ['airlines'],
    queryFn: () => travelpayoutsApi.getAirlines(),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useCities = (enabled: boolean = true) => {
  return useQuery<City[], Error>({
    queryKey: ['cities'],
    queryFn: () => travelpayoutsApi.getCities(),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  });
};
