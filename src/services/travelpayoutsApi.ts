
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
const HOTEL_API_BASE = 'https://engine.hotellook.com';
const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || 'your_marker_here';

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

    async searchFlightsRealtime(params: FlightSearchParams): Promise<string> {
        const cabinClassMapping: { [key: string]: string } = {
            economy: 'Y',
            business: 'C',
            first: 'F',
        };

        const segments = [{
            origin: params.origin,
            destination: params.destination,
            date: params.depart_date,
        }];

        if (params.trip_type === 'round' && params.return_date) {
            segments.push({
                origin: params.destination,
                destination: params.origin,
                date: params.return_date,
            });
        }
    
        const searchPayload = {
            segments: segments,
            passengers: {
                adults: params.passengers || 1,
                children: 0,
                infants: 0,
            },
            marker: MARKER,
            cabin_class: cabinClassMapping[params.cabin_class || 'economy'],
        };
        
        const response = await this.flightSearchApiV2.post('/create_search', searchPayload);
        return response.data.search_id;
    }

    async getFlightSearchResults(searchId: string): Promise<any> {
        const response = await this.realtimeApi.get('/flights_search_results', {
            params: { uuid: searchId },
        });
        return response.data;
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
    try {
      const options = await this.getAirportOptions();
      
      if (!query.trim()) {
        return options.slice(0, 50); // Return popular airports
      }
      
      const searchTerm = query.toLowerCase().trim();
      
      return options
        .filter(option => 
          (option.label && option.label.toLowerCase().includes(searchTerm)) ||
          (option.city && option.city.toLowerCase().includes(searchTerm)) ||
          (option.country && option.country.toLowerCase().includes(searchTerm)) ||
          (option.value && option.value.toLowerCase() === searchTerm)
        )
        .slice(0, 50);
    } catch (error) {
      console.error('Error searching airports:', error);
      return this.getBasicAirportOptions();
    }
  }

  // ==================== AIRLINES DATA ====================
  async getAirlines(): Promise<any[]> {
    if (this.cache.airlines && this.shouldUseCache()) {
      return this.cache.airlines;
    }

    try {
      const response: AxiosResponse<any[]> = await axios.get(
        `${API_BASE}/data/en/airlines.json`,
        { timeout: 10000 }
      );

      this.cache.airlines = response.data;
      return this.cache.airlines;
    } catch (error) {
      console.error('Error fetching airlines:', error);
      return this.cache.airlines || [];
    }
  }

  // ==================== HOTEL SEARCH ====================
  async searchHotels(params: {
    location: string;
    checkIn: string;
    checkOut: string;
    guests?: number;
    rooms?: number;
  }): Promise<any[]> {
    try {
      const searchParams = new URLSearchParams({
        location: params.location,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        token: API_TOKEN,
        marker: MARKER,
        limit: '20',
      });

      if (params.guests) {
        searchParams.append('adults', params.guests.toString());
      }
      if (params.rooms) {
        searchParams.append('rooms', params.rooms.toString());
      }

      const response = await axios.get(
        `${HOTEL_API_BASE}/api/v2/cache.json?${searchParams.toString()}`,
        { timeout: 10000 }
      );

      return response.data;
    } catch (error) {
      console.error('Error searching hotels:', error);
      return [];
    }
  }

  // ==================== CHEAP FLIGHTS ====================
  async getCheapestFlights(origin: string = 'NYC'): Promise<Flight[]> {
    try {
      const response = await this.api.get(
        '/v1/city-directions',
        {
          params: {
            origin,
            currency: 'USD',
          },
          headers: this.getApiHeaders(),
          timeout: 10000,
        }
      );

      if (response.data.data) {
        return Object.values(response.data.data)
          .map((flight: any) => ({
            ...flight,
            origin,
          }))
          .sort((a: any, b: any) => a.value - b.value)
          .slice(0, 10);
      }

      return [];
    } catch (error) {
      console.error('Error fetching cheapest flights:', error);
      return [];
    }
  }

  // ==================== MONTH PRICES ====================
  async getMonthPrices(origin: string, destination: string, month: string): Promise<Flight[]> {
    try {
      const response = await this.api.get(
        '/v2/prices/month-matrix',
        {
          params: {
            origin,
            destination,
            month,
            currency: 'USD',
          },
          headers: this.getApiHeaders(),
          timeout: 10000,
        }
      );

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching month prices:', error);
      return [];
    }
  }

  // ==================== HELPER METHODS ====================
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
      {
        code: 'DXB',
        name: 'Dubai International Airport',
        city_code: 'DXB',
        city_name: 'Dubai',
        country_code: 'AE',
        country_name: 'United Arab Emirates',
        timezone: 'Asia/Dubai',
        lat: 25.2532,
        lng: 55.3657,
      },
      {
        code: 'SIN',
        name: 'Changi Airport',
        city_code: 'SIN',
        city_name: 'Singapore',
        country_code: 'SG',
        country_name: 'Singapore',
        timezone: 'Asia/Singapore',
        lat: 1.3644,
        lng: 103.9915,
      },
      {
        code: 'SYD',
        name: 'Sydney Kingsford Smith Airport',
        city_code: 'SYD',
        city_name: 'Sydney',
        country_code: 'AU',
        country_name: 'Australia',
        timezone: 'Australia/Sydney',
        lat: -33.9399,
        lng: 151.1753,
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
          link: `/flights?${linkParams.toString()}`,
        };
      }).filter(flight => flight.link);
  
      return flightsWithLinks;
  }

  // ==================== API HEALTH CHECK ====================
  async checkApiHealth(): Promise<{
    airports: boolean;
    flights: boolean;
    airlines: boolean;
    hotels: boolean;
  }> {
    const results = {
      airports: false,
      flights: false,
      airlines: false,
      hotels: false,
    };

    try {
      // Test airports
      const airports = await this.getAirports();
      results.airports = airports.length > 0;

      // Test airlines
      const airlines = await this.getAirlines();
      results.airlines = airlines.length > 0;

      // Test flights (with short timeout)
      const testFlightParams: FlightSearchParams = {
        origin: 'JFK',
        destination: 'LAX',
        depart_date: '2024-06-15',
        limit: 1,
      };
      
      try {
        const searchId = await Promise.race([
          this.searchFlightsRealtime(testFlightParams),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('Flight API timeout')), 5000)
          ),
        ]);
        results.flights = !!searchId;
      } catch (flightError) {
        console.log('Flight API test skipped or failed:', flightError);
      }

      // Test hotels
      try {
        const hotels = await this.searchHotels({
          location: 'New York',
          checkIn: '2024-06-15',
          checkOut: '2024-06-20',
          guests: 2,
        });
        results.hotels = Array.isArray(hotels);
      } catch (hotelError) {
        console.log('Hotel API test skipped or failed:', hotelError);
      }

      return results;
    } catch (error) {
      console.error('API Health Check failed:', error);
      return results;
    }
  }
}

// Export singleton instance
export const travelpayoutsApi = TravelpayoutsApiService.getInstance();
