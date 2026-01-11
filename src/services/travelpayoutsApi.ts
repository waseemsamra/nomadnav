
import axios from 'axios';

// Types
export interface Airport {
  code: string;
  name: string;
  city_code: string;
  city_name: string;
  country_code: string;
  country_name: string;
  timezone: string;
  lat: number;
  lng: number;
}

export interface Flight {
  value: number;
  trip_class: number;
  show_to_affiliates: boolean;
  origin: string;
  destination: string;
  gate: string;
  depart_date: string;
  return_date: string | null;
  number_of_changes: number;
  duration: number;
  distance: number;
  actual: boolean;
  found_at: string;
  airline?: string;
  flight_number?: string;
  link?: string;
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
  sort_by?: 'price' | 'duration' | 'route';
}

export interface AirportOption {
  value: string;
  label: string;
  city: string;
  country: string;
}

// Configuration
const API_TOKEN = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN || '';
const API_BASE = 'https://api.travelpayouts.com';
const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || 'your_marker';

// Check if API token is configured
if (!API_TOKEN && process.env.NODE_ENV === 'development') {
  console.warn('⚠️ Travelpayouts API token is not configured. Please set NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN in .env.local');
  console.warn('Using mock data for development');
}

class TravelpayoutsApiService {
  private static instance: TravelpayoutsApiService;
  private airportsCache: Airport[] | null = null;
  private lastCacheUpdate: number = 0;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {}

  public static getInstance(): TravelpayoutsApiService {
    if (!TravelpayoutsApiService.instance) {
      TravelpayoutsApiService.instance = new TravelpayoutsApiService();
    }
    return TravelpayoutsApiService.instance;
  }

  private getApiHeaders() {
    return {
      'X-Access-Token': API_TOKEN,
      'Accept': 'application/json',
    };
  }

  // ==================== FLIGHT SEARCH ====================
  async searchFlights(params: FlightSearchParams): Promise<Flight[]> {
    if (!API_TOKEN) {
      console.log('Using mock flight data because API token is missing.');
      return this.getMockFlights(params);
    }

    try {
      const searchParams = new URLSearchParams({
        currency: params.currency || 'USD',
        origin: params.origin,
        destination: params.destination,
        depart_date: params.depart_date,
        token: API_TOKEN,
        marker: MARKER,
        limit: (params.limit || 30).toString(),
      });

      if (params.return_date) {
        searchParams.append('return_date', params.return_date);
      }
      
      const url = `${API_BASE}/v1/prices/cheap?${searchParams.toString()}`;

      const response = await axios.get(url, {
        headers: this.getApiHeaders(),
        timeout: 15000,
      });

      if (response.data.data) {
        const flightsByDestination = response.data.data[params.destination];
        if (flightsByDestination) {
            return Object.values(flightsByDestination).map((flight: any) => ({
                value: flight.price,
                trip_class: 0, // Cheap endpoint doesn't provide class
                show_to_affiliates: true,
                origin: params.origin,
                destination: params.destination,
                gate: flight.gate || 'Travelpayouts',
                depart_date: flight.departure_at,
                return_date: flight.return_at || null,
                number_of_changes: flight.transfers,
                duration: flight.duration_to,
                distance: 0, // Not provided by this endpoint
                actual: true,
                found_at: new Date().toISOString(),
                airline: flight.airline,
                flight_number: flight.flight_number,
                link: `https://www.aviasales.com${flight.link}`
            }));
        }
      }
      return [];
    } catch (error: any) {
      console.error('Flight search error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      console.log('Falling back to mock flight data due to API error.');
      return this.getMockFlights(params);
    }
  }

  // ==================== AIRPORTS DATA (Live Search) ====================
  async searchAirports(query: string): Promise<AirportOption[]> {
    if (!query) return [];
    if (!API_TOKEN) {
        // Fallback for development without a token
        return this.getStaticAirportOptions().filter(opt => 
            opt.label.toLowerCase().includes(query.toLowerCase())
        );
    }
    
    try {
      const response = await axios.get(
        `${API_BASE}/v1/suggests/airports`,
        {
          params: { term: query, lang: 'en' },
          headers: this.getApiHeaders()
        }
      );

      if (response.data) {
        return response.data.map((airport: any) => ({
          value: airport.iata_code,
          label: `${airport.name} (${airport.iata_code})`,
          city: airport.city_name,
          country: airport.country_name,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error searching airports live:', error);
      return []; // Return empty array on error
    }
  }


  // ==================== STATIC DATA (Fallbacks) ====================
  private getStaticAirportOptions(): AirportOption[] {
    return [
        { value: 'JFK', label: 'New York (JFK)', city: 'New York', country: 'United States' },
        { value: 'LAX', label: 'Los Angeles (LAX)', city: 'Los Angeles', country: 'United States' },
        { value: 'LHR', label: 'London (LHR)', city: 'London', country: 'United Kingdom' },
        { value: 'CDG', label: 'Paris (CDG)', city: 'Paris', country: 'France' },
        { value: 'HND', label: 'Tokyo (HND)', city: 'Tokyo', country: 'Japan' },
        { value: 'DXB', label: 'Dubai (DXB)', city: 'Dubai', country: 'United Arab Emirates' },
        { value: 'SIN', label: 'Singapore (SIN)', city: 'Singapore', country: 'Singapore' },
        { value: 'SYD', label: 'Sydney (SYD)', city: 'Sydney', country: 'Australia' },
    ];
  }
  
  private getMockFlights(params: FlightSearchParams): Flight[] {
    const mockFlights: Flight[] = [
      {
        value: 299,
        trip_class: 0,
        show_to_affiliates: true,
        origin: params.origin,
        destination: params.destination,
        gate: 'Travelpayouts',
        depart_date: params.depart_date,
        return_date: params.return_date || null,
        number_of_changes: 0,
        duration: 360,
        distance: 4000,
        actual: true,
        found_at: new Date().toISOString(),
        airline: 'American Airlines',
        flight_number: 'AA123',
        link: `https://www.aviasales.com/search/${params.origin}${params.depart_date.replace(/-/g, '')}${params.destination}${params.return_date ? params.return_date.replace(/-/g, '') : ''}1`,
      },
      {
        value: 349,
        trip_class: 0,
        show_to_affiliates: true,
        origin: params.origin,
        destination: params.destination,
        gate: 'Travelpayouts',
        depart_date: params.depart_date,
        return_date: params.return_date || null,
        number_of_changes: 1,
        duration: 420,
        distance: 4000,
        actual: true,
        found_at: new Date().toISOString(),
        airline: 'Delta Airlines',
        flight_number: 'DL456',
        link: `https://www.aviasales.com/search/${params.origin}${params.depart_date.replace(/-/g, '')}${params.destination}${params.return_date ? params.return_date.replace(/-/g, '') : ''}1`,
      },
    ];

    // Sort by price
    return mockFlights.sort((a, b) => a.value - b.value);
  }
}

// Export singleton instance
export const travelpayoutsApi = TravelpayoutsApiService.getInstance();
