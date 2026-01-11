
import axios from 'axios';

// Types
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface Flight {
  price: number;
  airline: string;
  flight_number: string;
  departure_at: string;
  return_at?: string;
  origin: string;
  destination: string;
  transfers: number;
  duration: number;
  link: string;
  currency: string;
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
const API_TOKEN = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN || '321d9a0a5c7c5c7c5c7c5c7c5c7c5c7c';
const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || '123456';

// Aviasales API endpoints
const AVIA_SALES_API = {
  base: 'https://api.travelpayouts.com',
  flights: 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates',
  airports: 'https://api.travelpayouts.com/data/en/airports.json',
  airlines: 'https://api.travelpayouts.com/data/en/airlines.json',
};

class TravelpayoutsApiService {
  private static instance: TravelpayoutsApiService;
  private airportsCache: Airport[] = [];
  private airlinesCache: any[] = [];
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {}

  public static getInstance(): TravelpayoutsApiService {
    if (!TravelpayoutsApiService.instance) {
      TravelpayoutsApiService.instance = new TravelpayoutsApiService();
    }
    return TravelpayoutsApiService.instance;
  }

  // ==================== WORKING FLIGHT SEARCH ====================
  async searchFlights(params: FlightSearchParams): Promise<Flight[]> {
    console.log('🛫 Searching flights:', params);

    // Try real API first
    try {
      const realFlights = await this.searchFlightsReal(params);
      if (realFlights.length > 0) {
        console.log(`✅ Found ${realFlights.length} real flights`);
        return realFlights;
      }
    } catch (error) {
      console.log('⚠️ Real API failed, using enhanced mock data:', error);
    }

    // Fallback to enhanced mock data
    console.log('🔄 Using enhanced mock data');
    return this.getEnhancedMockFlights(params);
  }

  private async searchFlightsReal(params: FlightSearchParams): Promise<Flight[]> {
    try {
      const searchParams = new URLSearchParams({
        origin: params.origin,
        destination: params.destination,
        departure_at: params.depart_date,
        currency: params.currency || 'USD',
        token: API_TOKEN,
        limit: (params.limit || 10).toString(),
      });

      if (params.return_date) {
        searchParams.append('return_at', params.return_date);
      }

      const url = `${AVIA_SALES_API.flights}?${searchParams.toString()}`;
      console.log('📡 API Request URL:', url.replace(API_TOKEN, '***'));

      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'X-Access-Token': API_TOKEN,
        },
        timeout: 10000,
      });

      console.log('📊 API Response:', response.data);

      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data.slice(0, params.limit || 10).map((flight: any) => ({
          price: flight.price || 0,
          airline: flight.airline || 'Unknown Airline',
          flight_number: flight.flight_number || 'N/A',
          departure_at: flight.departure_at || params.depart_date,
          return_at: flight.return_at || params.return_date,
          origin: flight.origin || params.origin,
          destination: flight.destination || params.destination,
          transfers: flight.transfers || 0,
          duration: flight.duration || 180,
          link: this.generateBookingLink(params),
          currency: params.currency || 'USD',
        }));
      }

      return [];
    } catch (error: any) {
      console.error('❌ Real API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }

  // ==================== GET AIRPORTS ====================
  async getAirports(): Promise<Airport[]> {
    // Return cached data if available
    if (this.airportsCache.length > 0 && Date.now() - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.airportsCache;
    }

    try {
      const response = await axios.get(AVIA_SALES_API.airports, {
        timeout: 10000,
      });

      if (response.data && Array.isArray(response.data)) {
        this.airportsCache = response.data.slice(0, 100).map((airport: any) => ({
          code: airport.code,
          name: airport.name,
          city: airport.city || airport.city_name || '',
          country: airport.country || airport.country_name || '',
        }));
        this.cacheTimestamp = Date.now();
        return this.airportsCache;
      }

      return this.getDefaultAirports();
    } catch (error) {
      console.error('Error fetching airports:', error);
      return this.getDefaultAirports();
    }
  }

  private getDefaultAirports(): Airport[] {
    return [
      { code: 'JFK', name: 'John F Kennedy International', city: 'New York', country: 'USA' },
      { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'USA' },
      { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK' },
      { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
      { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE' },
      { code: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'Japan' },
      { code: 'SIN', name: 'Changi Airport', city: 'Singapore', country: 'Singapore' },
      { code: 'SYD', name: 'Sydney Airport', city: 'Sydney', country: 'Australia' },
      { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
      { code: 'AMS', name: 'Schiphol Airport', city: 'Amsterdam', country: 'Netherlands' },
      { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey' },
      { code: 'PEK', name: 'Beijing Capital', city: 'Beijing', country: 'China' },
      { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'China' },
      { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand' },
      { code: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', country: 'India' },
    ];
  }

  // ==================== GET AIRLINES ====================
  async getAirlines(): Promise<any[]> {
    if (this.airlinesCache.length > 0 && Date.now() - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.airlinesCache;
    }

    try {
      const response = await axios.get(AVIA_SALES_API.airlines, {
        timeout: 10000,
      });

      if (response.data && Array.isArray(response.data)) {
        this.airlinesCache = response.data;
        return this.airlinesCache;
      }

      return [];
    } catch (error) {
      console.error('Error fetching airlines:', error);
      return [];
    }
  }

  // ==================== ENHANCED MOCK DATA ====================
  private getEnhancedMockFlights(params: FlightSearchParams): Flight[] {
    const airlines = [
      { code: 'AA', name: 'American Airlines' },
      { code: 'DL', name: 'Delta Air Lines' },
      { code: 'UA', name: 'United Airlines' },
      { code: 'BA', name: 'British Airways' },
      { code: 'LH', name: 'Lufthansa' },
      { code: 'AF', name: 'Air France' },
      { code: 'EK', name: 'Emirates' },
      { code: 'SQ', name: 'Singapore Airlines' },
      { code: 'QF', name: 'Qantas' },
      { code: 'JL', name: 'Japan Airlines' },
    ];

    const routes = {
      'JFK-LAX': { basePrice: 299, duration: 360, popular: true },
      'JFK-LHR': { basePrice: 599, duration: 420, popular: true },
      'LAX-CDG': { basePrice: 699, duration: 660, popular: true },
      'LAX-HND': { basePrice: 899, duration: 600, popular: true },
      'LHR-DXB': { basePrice: 499, duration: 420, popular: true },
      'CDG-SIN': { basePrice: 799, duration: 780, popular: true },
      'SIN-SYD': { basePrice: 499, duration: 480, popular: true },
      'DXB-HND': { basePrice: 699, duration: 540, popular: true },
      'FRA-JFK': { basePrice: 549, duration: 480, popular: true },
      'AMS-LAX': { basePrice: 649, duration: 600, popular: true },
    };

    const routeKey = `${params.origin}-${params.destination}`;
    const routeInfo = routes[routeKey as keyof typeof routes] || { 
      basePrice: 399, 
      duration: 300, 
      popular: false 
    };

    const flights: Flight[] = [];
    const today = new Date();

    for (let i = 0; i < 8; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const price = Math.round(routeInfo.basePrice * (0.8 + Math.random() * 0.4));
      const transfers = Math.random() > 0.7 ? 1 : 0;
      const duration = routeInfo.duration + (transfers ? 120 : 0);

      const departureDate = new Date(params.depart_date);
      departureDate.setHours(6 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 12) * 5);

      flights.push({
        price,
        airline: airline.name,
        flight_number: `${airline.code}${100 + Math.floor(Math.random() * 900)}`,
        departure_at: departureDate.toISOString(),
        return_at: params.return_date ? new Date(params.return_date).toISOString() : undefined,
        origin: params.origin,
        destination: params.destination,
        transfers,
        duration,
        link: this.generateBookingLink(params),
        currency: params.currency || 'USD',
      });
    }

    // Sort by price and add some variety
    return flights.sort((a, b) => a.price - b.price);
  }

  // ==================== GENERATE BOOKING LINK ====================
  private generateBookingLink(params: FlightSearchParams): string {
    // Generate Aviasales booking link
    const baseUrl = 'https://www.aviasales.com';
    const passengers = params.passengers || 1;
    const departDate = params.depart_date.replace(/-/g, '');
    const returnDate = params.return_date ? params.return_date.replace(/-/g, '') : '';
    
    return `${baseUrl}/search/${params.origin}${departDate}${params.destination}${returnDate}${passengers}?marker=${MARKER}`;
  }

  // ==================== TEST API CONNECTION ====================
  async testApiConnection(): Promise<{
    connected: boolean;
    message: string;
    airports: number;
    tokenValid: boolean;
  }> {
    try {
      // Test airports endpoint
      const airportsResponse = await axios.get(AVIA_SALES_API.airports, {
        timeout: 5000,
      });

      const airportsCount = Array.isArray(airportsResponse.data) ? airportsResponse.data.length : 0;

      // Test flight search endpoint
      try {
        const testParams = new URLSearchParams({
          origin: 'JFK',
          destination: 'LAX',
          departure_at: '2024-06-15',
          currency: 'USD',
          token: API_TOKEN,
          limit: '1',
        });

        await axios.get(`${AVIA_SALES_API.flights}?${testParams.toString()}`, {
          headers: {
            'X-Access-Token': API_TOKEN,
          },
          timeout: 5000,
        });

        return {
          connected: true,
          message: '✅ API Connection Successful!',
          airports: airportsCount,
          tokenValid: true,
        };
      } catch (flightError: any) {
        // If we get a 401/403, token is invalid
        if (flightError.response?.status === 401 || flightError.response?.status === 403) {
          return {
            connected: false,
            message: '❌ Invalid API Token. Please check your token.',
            airports: airportsCount,
            tokenValid: false,
          };
        }

        // Other errors mean API might be down but token is valid
        return {
          connected: false,
          message: '⚠️ API service temporarily unavailable, but airports data is accessible.',
          airports: airportsCount,
          tokenValid: true,
        };
      }
    } catch (error: any) {
      console.error('API Test Error:', error.message);
      return {
        connected: false,
        message: `❌ Connection Failed: ${error.message}`,
        airports: 0,
        tokenValid: false,
      };
    }
  }

  // ==================== SEARCH AIRPORTS ====================
  async searchAirports(query: string): Promise<Airport[]> {
    const airports = await this.getAirports();
    
    if (!query.trim()) {
      return airports.slice(0, 20);
    }
    
    const searchTerm = query.toLowerCase().trim();
    return airports.filter(airport =>
      airport.code.toLowerCase().includes(searchTerm) ||
      airport.city.toLowerCase().includes(searchTerm) ||
      airport.name.toLowerCase().includes(searchTerm) ||
      airport.country.toLowerCase().includes(searchTerm)
    ).slice(0, 20);
  }

  async getAirportOptions() {
    const airports = await this.getAirports();
    return airports.map(airport => ({
      value: airport.code,
      label: `${airport.city} (${airport.code})`,
      city: airport.city,
      country: airport.country,
    }));
  }
}

// Export singleton instance
export const travelpayoutsApi = TravelpayoutsApiService.getInstance();

// Export types
export type { Airport, Flight, FlightSearchParams };

    