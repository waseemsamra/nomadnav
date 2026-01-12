
import axios from 'axios';

// Types
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  country_code: string;
  flightable: boolean;
}

export interface Flight {
  id: string;
  price: number;
  airline: string;
  airline_code: string;
  flight_number: string;
  departure_at: string;
  return_at?: string;
  origin: string;
  destination: string;
  transfers: number;
  duration: number;
  link: string;
  currency: string;
  actual: boolean;
  gate: string;
  distance: number;
  found_at: string;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  depart_date: string;
  return_date?: string;
  currency?: string;
  trip_type?: 'oneway' | 'round';
  passengers?: number;
  limit?: number;
}

// Configuration
const API_TOKEN = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN || '7783bdd07dade9d7dec9ac4b6a88fe51';

// REAL WORKING ENDPOINTS
const ENDPOINTS = {
  // Static data (always works without token)
  cities: 'https://api.travelpayouts.com/data/en/cities.json',
  airports: 'https://api.travelpayouts.com/data/en/airports.json',
  airlines: 'https://api.travelpayouts.com/data/en/airlines.json',
  countries: 'https://api.travelpayouts.com/data/en/countries.json',
  
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

    try {
      // Test airports endpoint
      const airportsRes = await axios.get(ENDPOINTS.airports, { timeout: 5000 });
      results.airports = Array.isArray(airportsRes.data) && airportsRes.data.length > 0;

      // Test airlines endpoint
      const airlinesRes = await axios.get(ENDPOINTS.airlines, { timeout: 5000 });
      results.airlines = Array.isArray(airlinesRes.data) && airlinesRes.data.length > 0;

      // Test cities endpoint
      const citiesRes = await axios.get(ENDPOINTS.cities, { timeout: 5000 });
      results.cities = Array.isArray(citiesRes.data) && citiesRes.data.length > 0;

      // Test flight endpoint via proxy
      if (API_TOKEN) {
        try {
            const flightParams: FlightSearchParams = {
                origin: 'JFK',
                destination: 'LAX',
                depart_date: '2025-08-01',
                limit: 1,
            };
            await this.searchFlights(flightParams);
            results.flights = true; 
        } catch (flightError: any) {
          console.log('Flight API test warning:', flightError.message);
          results.flights = false;
        }
      }

      const workingEndpoints = Object.values(results).filter(v => v).length;
      const totalEndpoints = Object.values(results).length;

      return {
        success: workingEndpoints > 0,
        message: `Connected to ${workingEndpoints}/${totalEndpoints} endpoints`,
        endpoints: results,
        tokenValid: !!API_TOKEN && API_TOKEN.length === 32,
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        endpoints: results,
        tokenValid: !!API_TOKEN && API_TOKEN.length === 32,
      };
    }
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
        limit: (params.limit || 30).toString(),
      });

      if (params.return_date) {
        searchParams.append('return_date', params.return_date);
      }
      
      const response = await axios.get(ENDPOINTS.flightSearch, { params: searchParams });
      return response.data;

    } catch (error: any) {
      console.error('API call failed, returning empty result:', error.response?.data || error.message);
      if (axios.isAxiosError(error) && error.response?.data.message) {
          throw new Error(error.response.data.message);
      }
      throw new Error('Failed to search for flights.');
    }
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
        timeout: 10000,
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
export type { Airport, Flight, FlightSearchParams };

    
