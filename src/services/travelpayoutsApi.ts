
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

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
  link?: string;
  airline?: string;
  flight_number?: string;
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
  cabin_class?: 'economy' | 'business' | 'first';
}

export interface AirportOption {
  value: string;
  label: string;
  city: string;
  country: string;
  fullLabel?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Configuration
const API_TOKEN = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN || '';
const API_BASE = 'https://api.travelpayouts.com';
const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || '403383';

// Check if API token is configured
if (!API_TOKEN) {
  console.warn('⚠️ Travelpayouts API token is not configured. Please set NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN in .env.local');
}

class TravelpayoutsApiService {
  private static instance: TravelpayoutsApiService;
  private api: AxiosInstance;
  private flightSearchApiV2: AxiosInstance;
  private realtimeApi: AxiosInstance;
  private cache: {
    airports: Airport[] | null;
    airlines: any[] | null;
    cities: any[] | null;
    lastUpdated: number;
  };

  private constructor() {
    this.api = axios.create({
      baseURL: API_BASE,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Access-Token': API_TOKEN,
      },
    });

    this.flightSearchApiV2 = axios.create({
        baseURL: `${API_BASE}/v2`,
        timeout: 30000,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Access-Token': API_TOKEN,
        },
    });
    
    this.realtimeApi = axios.create({
        baseURL: `${API_BASE}/api/v3`,
        timeout: 30000,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Access-Token': API_TOKEN,
        },
    });

    this.cache = {
      airports: null,
      airlines: null,
      cities: null,
      lastUpdated: 0,
    };
  }

  public static getInstance(): TravelpayoutsApiService {
    if (!TravelpayoutsApiService.instance) {
      TravelpayoutsApiService.instance = new TravelpayoutsApiService();
    }
    return TravelpayoutsApiService.instance;
  }

  private getApiHeaders() {
    return {
      'X-Access-Token': API_TOKEN,
    };
  }

  private shouldUseCache(maxAge: number = 24 * 60 * 60 * 1000): boolean {
    return Date.now() - this.cache.lastUpdated < maxAge;
  }

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

      if (response.data.success && response.data.data) {
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
                link: `https://www.aviasales.com${flight.link}?marker=${MARKER}`
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
  // ==================== AIRPORTS DATA ====================
  async getAirports(): Promise<Airport[]> {
    if (this.cache.airports && this.shouldUseCache()) {
      return this.cache.airports;
    }

    try {
      const response: AxiosResponse<Airport[]> = await axios.get(
        `${API_BASE}/data/en/airports.json`,
        { timeout: 10000 }
      );

      this.cache.airports = response.data;
      this.cache.lastUpdated = Date.now();
      return this.cache.airports;
    } catch (error: any) {
      console.error('Error fetching airports:', error.message);
      
      // Fallback to static airports data
      if (this.cache.airports) {
        return this.cache.airports;
      }
      
      // Return basic airports if all fails
      return this.getBasicAirports();
    }
  }

  async getAirportOptions(): Promise<AirportOption[]> {
    try {
      const airports = await this.getAirports();
      
      return airports
        .map(airport => ({
          value: airport.code,
          label: `${airport.city_name || airport.name} (${airport.code})`,
          city: airport.city_name,
          country: airport.country_name,
          fullLabel: `${airport.city_name || airport.name} (${airport.code}) - ${airport.country_name}`,
        }))
        .sort((a, b) => (a.label || '').localeCompare(b.label || ''));
    } catch (error) {
      console.error('Error getting airport options:', error);
      return this.getBasicAirportOptions();
    }
  }

  async searchAirports(query: string): Promise<AirportOption[]> {
    if (!query) return [];
    
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
       // Fallback for development without a token
        return this.getBasicAirportOptions().filter(opt => 
            opt.label.toLowerCase().includes(query.toLowerCase())
        );
    }
  }

  private getBasicAirports(): Airport[] {
    return [
      {
        code: 'JFK',
        name: 'John F Kennedy International Airport',
        city_code: 'NYC',
        city_name: 'New York',
        country_code: 'US',
        country_name: 'United States',
        timezone: 'America/New_York',
        lat: 40.6413,
        lng: -73.7781,
      },
      {
        code: 'LAX',
        name: 'Los Angeles International Airport',
        city_code: 'LAX',
        city_name: 'Los Angeles',
        country_code: 'US',
        country_name: 'United States',
        timezone: 'America/Los_Angeles',
        lat: 33.9416,
        lng: -118.4085,
      },
      {
        code: 'LHR',
        name: 'Heathrow Airport',
        city_code: 'LON',
        city_name: 'London',
        country_code: 'GB',
        country_name: 'United Kingdom',
        timezone: 'Europe/London',
        lat: 51.4700,
        lng: -0.4543,
      },
      {
        code: 'CDG',
        name: 'Charles de Gaulle Airport',
        city_code: 'PAR',
        city_name: 'Paris',
        country_code: 'FR',
        country_name: 'France',
        timezone: 'Europe/Paris',
        lat: 49.0097,
        lng: 2.5479,
      },
      {
        code: 'HND',
        name: 'Haneda Airport',
        city_code: 'TYO',
        city_name: 'Tokyo',
        country_code: 'JP',
        country_name: 'Japan',
        timezone: 'Asia/Tokyo',
        lat: 35.5494,
        lng: 139.7798,
      },
    ];
  }

  private getBasicAirportOptions(): AirportOption[] {
    return this.getBasicAirports().map(airport => ({
      value: airport.code,
      label: `${airport.city_name} (${airport.code})`,
      city: airport.city_name,
      country: airport.country_name,
      fullLabel: `${airport.city_name} (${airport.code}) - ${airport.country_name}`,
    }));
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
      },
      {
        value: 399,
        trip_class: 1,
        show_to_affiliates: true,
        origin: params.origin,
        destination: params.destination,
        gate: 'Travelpayouts',
        depart_date: params.depart_date,
        return_date: params.return_date || null,
        number_of_changes: 0,
        duration: 350,
        distance: 4000,
        actual: true,
        found_at: new Date().toISOString(),
        airline: 'United Airlines',
        flight_number: 'UA789',
      },
    ];

    const flightsWithLinks = mockFlights.map(flight => {
        const linkParams = new URLSearchParams({
          origin_iata: flight.origin,
          destination_iata: flight.destination,
          depart_date: flight.depart_date,
          adults: (params.passengers || 1).toString(),
          children: '0',
          infants: '0',
          trip_class: flight.trip_class.toString(),
          marker: MARKER,
        });
        if (flight.return_date) {
          linkParams.append('return_date', flight.return_date);
        }
        return {
          ...flight,
          link: `https://www.aviasales.com/search?${linkParams.toString()}`,
        };
      }).filter(flight => flight.link);
  
      return flightsWithLinks;
  }
}

// Export singleton instance
export const travelpayoutsApi = TravelpayoutsApiService.getInstance();
