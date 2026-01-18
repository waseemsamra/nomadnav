
import axios from 'axios';
import { getHours, getMinutes } from 'date-fns';
import { OTA_DATA } from '@/lib/ota-data';

// Types
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  country_code: string;
  flightable: boolean;
}

export interface Gate {
  code: string;
  name: string;
  main_url: string;
}


export interface BaggageInfo {
    price: number;
    has_baggage: boolean;
}

export interface Flight {
  id: string;
  price: number;
  airline: string;
  airline_code: string;
  flight_number: string;
  departure_at: string;
  return_at: string;
  arrival_at?: string;
  origin: string;
  destination: string;
  transfers: number;
  duration: number;
  link: string;
  currency: string;
  baggage: {
    hand: BaggageInfo;
    checked: BaggageInfo;
  };
  gate: string; // This will be the OTA code
  is_mock?: boolean;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  depart_date: string;
  return_date?: string;
  currency?: string;
  trip_type?: 'oneway' | 'round';
  passengers?: number;
  cabin_class?: string;
  limit?: number;
}

// Configuration
const API_TOKEN = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN;

// REAL WORKING ENDPOINTS
const ENDPOINTS = {
  // Static data (always works without token)
  cities: 'https://api.travelpayouts.com/data/en/cities.json',
  airports: 'https://api.travelpayouts.com/data/en/airports.json',
  airlines: 'https://api.travelpayouts.com/data/en/airlines.json',
  
  // Internal proxy for flight search
  flightSearch: '/api/flights/search'
};

class TravelpayoutsApiService {
  private static instance: TravelpayoutsApiService;
  private airlinesCache: { [key: string]: string } | null = null;
  private airlinesCacheTimestamp = 0;
  private readonly CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours
  
  private constructor() {}

  public static getInstance(): TravelpayoutsApiService {
    if (!TravelpayoutsApiService.instance) {
      TravelpayoutsApiService.instance = new TravelpayoutsApiService();
    }
    return TravelpayoutsApiService.instance;
  }

  // ==================== TEST API CONNECTION ====================
  async testApiConnection(): Promise<{
    success: boolean;
    message: string;
    endpoints: {
      airports: boolean;
      airlines: boolean;
      cities: boolean;
      flights: boolean;
    };
    tokenValid: boolean;
  }> {
    const results = {
      airports: false,
      airlines: false,
      cities: false,
      flights: false,
    };

    const checkEndpoint = async (endpoint: keyof typeof results, url: string) => {
      try {
        const response = await axios.get(url, { timeout: 5000, headers: { 'Accept-Encoding': 'gzip,deflate,compress' } });
        results[endpoint] = response.status === 200 && Array.isArray(response.data) && response.data.length > 0;
      } catch (error) {
        console.warn(`Endpoint test for ${endpoint} failed:`, (error as Error).message);
        results[endpoint] = false;
      }
    };
    
    // Check static data endpoints
    await Promise.all([
      checkEndpoint('airports', ENDPOINTS.airports),
      checkEndpoint('airlines', ENDPOINTS.airlines),
      checkEndpoint('cities', ENDPOINTS.cities),
    ]);
    
    // Check flight search endpoint if token is present
    if (API_TOKEN) {
      try {
        const flightParams: FlightSearchParams = {
          origin: 'JFK',
          destination: 'LAX',
          depart_date: '2026-08-01',
          limit: 1,
        };
        const flightResponse = await this.searchFlights(flightParams);
        // The test is successful if the API call doesn't throw and returns an array (can be empty)
        results.flights = true;
      } catch (flightError: any) {
        console.warn('Flight API test failed:', flightError.message);
        results.flights = false;
      }
    }


    const workingEndpoints = Object.values(results).filter(v => v).length;
    const totalEndpoints = Object.values(results).length;
    const allGood = workingEndpoints === totalEndpoints;

    return {
      success: allGood,
      message: allGood ? 'All services are operational.' : `Connected to ${workingEndpoints}/${totalEndpoints} endpoints`,
      endpoints: results,
      tokenValid: !!API_TOKEN && API_TOKEN.length === 32,
    };
  }


  // ==================== SEARCH FLIGHTS (VIA PROXY) ====================
  async searchFlights(params: FlightSearchParams): Promise<Flight[]> {
    console.log('🔍 Searching flights via internal proxy with params:', params);

    try {
      const searchParams = new URLSearchParams({
        origin: params.origin,
        destination: params.destination,
        depart_date: params.depart_date,
        currency: params.currency || 'USD',
        cabin_class: params.cabin_class || 'economy',
      });

      if (params.return_date) {
        searchParams.append('return_date', params.return_date);
      }
      
      const response = await axios.get(ENDPOINTS.flightSearch, { params: searchParams });
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }

      return [];

    } catch (error: any) {
      console.error('API call failed, returning empty result:', error.response?.data || error.message);
      if (axios.isAxiosError(error) && error.response?.data.message) {
          throw new Error(error.response.data.message);
      }
      throw new Error('Failed to search for flights.');
    }
  }

  // ==================== FILTERING & SORTING (CLIENT-SIDE) ====================
    public getFlightDisplayPrice(flight: Flight, baggageFilter: 'all' | 'without' | 'with'): number {
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
        return flight.price;
    }


  // ==================== HELPER METHODS ====================
  
  private async getAirlinesData() {
    const now = Date.now();
    if (this.airlinesCache && (now - this.airlinesCacheTimestamp < this.CACHE_DURATION)) {
        return this.airlinesCache;
    }

    try {
        const response = await axios.get(ENDPOINTS.airlines, {
            headers: { 'Accept-Encoding': 'gzip,deflate,compress' },
        });
        if (response.data) {
            this.airlinesCache = response.data.reduce((acc: any, airline: any) => {
                acc[airline.code] = airline.name;
                return acc;
            }, {});
            this.airlinesCacheTimestamp = now;
            return this.airlinesCache;
        }
    } catch (error) {
        console.error('Failed to fetch airlines:', error);
    }
    return {};
  }
  
  // ==================== PUBLIC METHODS ====================
  async getAirportOptions() {
    try {
      console.log('Fetching airports from:', ENDPOINTS.airports);
      const response = await axios.get(ENDPOINTS.airports, {
        timeout: 30000,
        headers: { 'Accept': 'application/json' },
      });

      if (response.data && Array.isArray(response.data)) {
        const flightableAirports = response.data
          .filter((airport: any) => airport.flightable === true && airport.code && airport.name)
          .map((airport: any) => ({
            value: airport.code,
            label: `${airport.city || airport.name} – ${airport.name} (${airport.code})`,
          }));
        
        console.log(`✅ Loaded ${flightableAirports.length} real flightable airports from API`);
        return flightableAirports;
      }
      throw new Error("Invalid data format from airports API");
    } catch (error: any) {
      console.error('Error fetching airports, using fallback:', error.message);
      // Fallback in case the API fails
      return [
        { value: 'JFK', label: 'New York – John F. Kennedy International Airport (JFK)' },
        { value: 'LAX', label: 'Los Angeles – Los Angeles International Airport (LAX)' },
        { value: 'LHR', label: 'London – London Heathrow Airport (LHR)' },
        { value: 'CDG', label: 'Paris – Charles de Gaulle Airport (CDG)' },
        { value: 'DXB', label: 'Dubai – Dubai International Airport (DXB)' },
        { value: 'KHI', label: 'Karachi – Jinnah International Airport (KHI)' },
        { value: 'HND', label: 'Tokyo – Tokyo Haneda Airport (HND)' },
        { value: 'MOW', label: 'Moscow – All Airports (MOW)' },
        { value: 'LED', label: 'Saint Petersburg – Pulkovo Airport (LED)' },
      ];
    }
  }

  async searchAirports(query: string) {
    const airports = await this.getAirportOptions(); // Use the new single source of truth
    if (!query.trim()) {
      return airports.slice(0, 50);
    }
    
    const searchTerm = query.toLowerCase().trim();
    return airports
      .filter(airport =>
        airport.label.toLowerCase().includes(searchTerm)
      )
      .slice(0, 50);
  }

  async getAirlines() {
    try {
      const response = await axios.get(ENDPOINTS.airlines, { timeout: 5000 });
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching airlines:', error.message);
      return [];
    }
  }

  async getCities() {
    try {
      const response = await axios.get(ENDPOINTS.cities, { timeout: 5000 });
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching cities:', error.message);
      return [];
    }
  }
}

// Export singleton instance
export const travelpayoutsApi = TravelpayoutsApiService.getInstance();

// Export types
export type { Airport, Flight, FlightSearchParams, Gate };
