
import axios from 'axios';

// Types
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  country_code: string;
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
            departure_at: '2024-12-01',
            currency: 'USD',
            token: API_TOKEN,
            limit: '1',
          });
          
          const flightRes = await axios.get(`${ENDPOINTS.pricesForDates}?${flightParams.toString()}`, {
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

  // ==================== GET AIRPORTS (REAL DATA) ====================
  async getAirports(): Promise<Airport[]> {
    try {
      console.log('Fetching airports from:', ENDPOINTS.airports);
      const response = await axios.get(ENDPOINTS.airports, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.data && Array.isArray(response.data)) {
        const airports = response.data
          .filter((airport: any) => airport.code && airport.name && airport.country_code)
          .slice(0, 500) // Limit to 500 airports for performance
          .map((airport: any) => ({
            code: airport.code,
            name: airport.name,
            city: airport.city_code || airport.city_name || '',
            country: airport.country_code || airport.country_name || '',
            country_code: airport.country_code || '',
          }));

        console.log(`✅ Loaded ${airports.length} real airports from API`);
        return airports;
      }
      return this.getDefaultAirports();
    } catch (error: any) {
      console.error('Error fetching airports:', error.message);
      return this.getDefaultAirports();
    }
  }
  
  private getDefaultAirports(): Airport[] {
    console.log('🔄 Using default fallback airports');
    return [
      { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', country_code: 'US' },
      { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', country_code: 'US' },
      { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', country_code: 'GB' },
      { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', country_code: 'FR' },
      { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', country_code: 'AE' },
      { code: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', country_code: 'JP' },
      { code: 'MOW', name: 'Moscow', city: 'Moscow', country: 'Russia', country_code: 'RU' },
      { code: 'LED', name: 'Pulkovo Airport', city: 'Saint Petersburg', country: 'Russia', country_code: 'RU' },
    ];
  }


  // ==================== SEARCH FLIGHTS (REAL API) ====================
  async searchFlights(params: FlightSearchParams): Promise<Flight[]> {
    console.log('🔍 Searching REAL flights with params:', params);
    try {
      const searchParams = new URLSearchParams({
        origin: params.origin,
        destination: params.destination,
        currency: params.currency || 'USD',
        limit: (params.limit || 20).toString(),
        token: API_TOKEN,
      });

      const url = `${ENDPOINTS.latestPrices}?${searchParams.toString()}`;
      console.log('📡 Calling latestPrices:', url.replace(API_TOKEN, '***'));
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: { 'Accept': 'application/json' },
      });
      
      console.log('API Response:', response.data);

      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data.map((flight: any, index: number) => ({
          id: `flight-${flight.origin}-${flight.destination}-${index}`,
          price: flight.price || 0,
          airline: flight.airline || 'Multiple',
          airline_code: flight.airline || 'XX',
          flight_number: flight.flight_number || `FL${1000 + index}`,
          departure_at: flight.depart_date || params.depart_date,
          return_at: flight.return_date || params.return_date,
          origin: flight.origin || params.origin,
          destination: flight.destination || params.destination,
          transfers: flight.transfers || 0,
          duration: flight.duration || 0,
          link: this.generateBookingLink({
            ...params,
            depart_date: flight.depart_date || params.depart_date,
            return_date: flight.return_date || params.return_date,
          }),
          currency: params.currency || 'USD',
          actual: true,
          gate: flight.gate || 'aviasales',
          distance: flight.distance || 0,
          found_at: flight.found_at || new Date().toISOString(),
        }));
      }

      return [];
    } catch (error: any) {
      console.error('API call failed:', error.response?.data || error.message);
      // Throw the error so the UI can handle it
      throw new Error('Failed to fetch flight data from the API. Please check your search or try again later.');
    }
  }

  
  // ==================== GET CHEAP FLIGHTS ====================
  async getCheapFlights(origin: string = 'MOW', currency: string = 'USD'): Promise<Flight[]> {
    try {
      const searchParams = new URLSearchParams({
        origin,
        currency,
        token: API_TOKEN,
      });

      const url = `${ENDPOINTS.cheap}?${searchParams.toString()}`;
      console.log('📡 Calling cheap flights:', url.replace(API_TOKEN, '***'));

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'X-Access-Token': API_TOKEN,
        },
      });

      if (response.data.data) {
        return Object.entries(response.data.data)
          .slice(0, 4)
          .map(([destination, flightData]: [string, any], index: number) => ({
            id: `cheap-${origin}-${destination}-${index}`,
            price: flightData.price || 0,
            airline: 'Multiple',
            airline_code: 'XX',
            flight_number: `CH${1000 + index}`,
            departure_at: new Date().toISOString().split('T')[0],
            origin,
            destination,
            transfers: 0,
            duration: this.calculateFlightDuration(origin, destination),
            link: this.generateBookingLink({
              origin,
              destination,
              depart_date: new Date().toISOString().split('T')[0],
              currency,
            }),
            currency,
            actual: true,
            gate: 'aviasales',
            distance: this.calculateDistance(origin, destination),
            found_at: new Date().toISOString(),
          }));
      }
      return [];
    } catch (error: any) {
        console.error('Error fetching cheap flights:', error.message);
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
    const airports = await this.getAirports();
    return airports.map(airport => ({
      value: airport.code,
      label: `${airport.city ? airport.city + ' - ' : ''}${airport.name} (${airport.code})`,
      city: airport.city,
      country: airport.country,
      code: airport.code,
    }));
  }

  async searchAirports(query: string) {
    const airports = await this.getAirports();
    if (!query.trim()) {
      return airports.slice(0, 50);
    }
    
    const searchTerm = query.toLowerCase().trim();
    return airports
      .filter(airport =>
        airport.code.toLowerCase().includes(searchTerm) ||
        airport.city.toLowerCase().includes(searchTerm) ||
        airport.name.toLowerCase().includes(searchTerm) ||
        airport.country.toLowerCase().includes(searchTerm)
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
