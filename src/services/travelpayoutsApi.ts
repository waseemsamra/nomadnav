
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
const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || '123456';

// REAL WORKING ENDPOINTS
const ENDPOINTS = {
  // Static data (always works without token)
  cities: 'https://api.travelpayouts.com/data/en/cities.json',
  airports: 'https://api.travelpayouts.com/data/en/airports.json',
  airlines: 'https://api.travelpayouts.com/data/en/airlines.json',
  countries: 'https://api.travelpayouts.com/data/en/countries.json',
  
  // Flight prices (REAL endpoints that work)
  pricesForDates: 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates',
  latestPrices: 'https://api.travelpayouts.com/v2/prices/latest',
  monthMatrix: 'https://api.travelpayouts.com/v2/prices/month-matrix',
  weekMatrix: 'https://api.travelpayouts.com/v2/prices/week-matrix',
  
  // Cheap flights
  cheap: 'https://api.travelpayouts.com/v1/prices/cheap',
  
  // Calendar prices
  calendar: 'https://api.travelpayouts.com/v2/prices/calendar',
};

class TravelpayoutsApiService {
  private static instance: TravelpayoutsApiService;
  
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

      // Test flight endpoint (if token is available)
      if (API_TOKEN) {
        try {
          const flightParams = new URLSearchParams({
            origin: 'MOW',
            destination: 'LED',
            currency: 'USD',
            limit: '1',
          });
          
          const flightRes = await axios.get(`/api/flights/search?${flightParams.toString()}`, {
            timeout: 5000,
          });
          results.flights = flightRes.data.success === true;
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


  // ==================== SEARCH FLIGHTS (PROXIED API) ====================
  async searchFlights(params: FlightSearchParams): Promise<Flight[]> {
    console.log('🔍 Searching flights via internal API proxy with params:', params);
    try {
      const searchParams = new URLSearchParams({
        origin: params.origin,
        destination: params.destination,
        currency: params.currency || 'USD',
        limit: (params.limit || 30).toString(),
      });
  
      if (params.depart_date) {
        searchParams.append('depart_date', params.depart_date);
      }
  
      if (params.trip_type === 'round' && params.return_date) {
        searchParams.append('return_date', params.return_date);
      }
  
      const response = await axios.get(`/api/flights/search?${searchParams.toString()}`);
  
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        console.warn('API proxy returned success=false or no data');
        return [];
      }
    } catch (error: any) {
      console.error('API call failed, returning empty result:', error.response?.data || error.message);
      return [];
    }
  }
  
  // ==================== GET CHEAP FLIGHTS (PROXIED API) ====================
    async getCheapFlights(origin: string = 'MOW', currency: string = 'USD'): Promise<Flight[]> {
        try {
            const searchParams = new URLSearchParams({
                origin,
                currency,
            });

            const url = `/api/flights/cheap?${searchParams.toString()}`;
            console.log('📡 Calling cheap flights proxy:', url);

            const response = await axios.get(url);

            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            return [];
        } catch (error: any) {
            console.error('Error fetching cheap flights via proxy:', error.message);
            return [];
        }
    }


  // ==================== HELPER METHODS ====================
  private calculateFlightDuration(origin: string, destination: string): number {
    // Approximate flight times between major cities (in minutes)
    const durations: Record<string, number> = {
      'MOW-LED': 90,
      'MOW-AER': 150,
      'MOW-SIP': 180,
      'LED-AER': 180,
      'JFK-LAX': 360,
      'JFK-LHR': 420,
      'LAX-CDG': 660,
      'LHR-DXB': 420,
    };
    
    const key = `${origin}-${destination}`;
    return durations[key] || 180 + Math.floor(Math.random() * 240);
  }
  
  private calculateDistance(origin: string, destination: string): number {
    // Approximate distances in km
    const distances: Record<string, number> = {
      'MOW-LED': 634,
      'MOW-AER': 1368,
      'MOW-SIP': 1108,
      'LED-AER': 2284,
      'JFK-LAX': 3980,
      'JFK-LHR': 5560,
      'LAX-CDG': 9090,
      'LHR-DXB': 5490,
    };
    
    const key = `${origin}-${destination}`;
    return distances[key] || 1000 + Math.floor(Math.random() * 8000);
  }

  private generateBookingLink(params: FlightSearchParams): string {
    const baseUrl = 'https://www.aviasales.com';
    const passengers = params.passengers || 1;
    // Format date as DDMM
    const departDate = params.depart_date.slice(5).replace(/-/g, '');
    const returnDate = params.return_date ? params.return_date.slice(5).replace(/-/g, '') : '';
    
    return `${baseUrl}/search/${params.origin}${departDate}${params.destination}${returnDate}${passengers}?marker=${MARKER}`;
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
