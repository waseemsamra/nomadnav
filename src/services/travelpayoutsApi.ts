
'use client';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { cache } from 'react';
import type { Airport, Flight, FlightSearchParams, AirportOption, HotelSearchParams, Hotel } from '@/types/travel';


// Configuration
const API_TOKEN = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN || '';
const API_BASE = 'https://api.travelpayouts.com';
const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || '';

// Check if API token is configured
if (!API_TOKEN) {
  console.warn('⚠️ Travelpayouts API token is not configured. Please set NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN in .env.local');
}

class TravelpayoutsApiService {
  private static instance: TravelpayoutsApiService;
  private airportsCache: Airport[] | null = null;
  private airlinesCache: any[] | null = null;
  private citiesCache: any[] | null = null;
  private lastCacheUpdate: number = 0;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private realtimeApi: AxiosInstance;
  private hotelApi: AxiosInstance;
  private flightSearchApiV2: AxiosInstance;

  private constructor() {
    this.realtimeApi = axios.create({
        baseURL: 'https://api.travelpayouts.com/api/v3',
        headers: {
            'X-Access-Token': API_TOKEN,
            'Accept': 'application/json',
        },
        timeout: 30000,
    });
    
    this.flightSearchApiV2 = axios.create({
        baseURL: 'https://api.travelpayouts.com/v2',
        headers: {
            'X-Access-Token': API_TOKEN,
            'Accept': 'application/json',
        },
        timeout: 30000,
    });

    this.hotelApi = axios.create({
        baseURL: 'https://engine.hotellook.com/api/v2',
        headers: {
            'Accept': 'application/json',
        },
        timeout: 30000,
    });
  }

  public static getInstance(): TravelpayoutsApiService {
    if (!TravelpayoutsApiService.instance) {
      TravelpayoutsApiService.instance = new TravelpayoutsApiService();
    }
    return TravelpayoutsApiService.instance;
  }

  // ==================== FLIGHT SEARCH ====================
  async searchFlightsRealtime(params: any) {
    const segments = [{
      origin: params.origin,
      destination: params.destination,
      date: params.depart_date,
    }];

    if (params.return_date) {
      segments.push({
        origin: params.destination,
        destination: params.origin,
        date: params.return_date,
      });
    }

    const cabinClassMapping = {
        economy: 'Y',
        business: 'C',
        first: 'F',
    };

    const searchPayload = {
      segments: segments,
      passengers: {
        adults: params.passengers || 1,
        children: 0,
        infants: 0,
      },
      marker: MARKER,
      cabin_class: cabinClassMapping[params.cabin_class as keyof typeof cabinClassMapping] || 'Y',
    };
    
    const response = await this.flightSearchApiV2.post('/create_search', searchPayload);
    return response.data.search_id;
  }

  async getFlightSearchResults(searchId: string) {
    const response = await this.realtimeApi.get(`/flights_search_results?search_id=${searchId}&with_request=true`);
    return response.data;
  }
  
  async searchFlights(params: any): Promise<Flight[]> {
    const searchId = await this.searchFlightsRealtime(params);
    
    let results: any = {};
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        results = await this.getFlightSearchResults(searchId);
        // The API might return results before it is 'over'
        if (results.is_over || (results.tickets && results.tickets.length > 0)) {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
    }

    if (results.tickets) {
        return results.tickets.map((ticket: any) => ({
            value: ticket.price.value,
            trip_class: 0,
            origin: ticket.segments[0].origin_code,
            destination: ticket.segments[0].destination_code,
            depart_date: ticket.segments[0].departure.at,
            return_date: ticket.segments[1] ? ticket.segments[1].departure.at : undefined,
            number_of_changes: ticket.segments.reduce((acc: number, seg: any) => acc + seg.stops, 0),
            duration: ticket.total_duration,
            distance: 0, // not provided directly in this response
            gate: 'Unknown',
            link: ticket.search_url,
            airline: ticket.segments[0].marketing_airline,
            flight_number: ticket.segments[0].flight_number,
        }));
    }

    return [];
  }


  // ==================== AIRPORTS DATA ====================
  async getAirports(): Promise<Airport[]> {
    // Check cache first
    if (this.airportsCache && Date.now() - this.lastCacheUpdate < this.CACHE_TTL) {
      return this.airportsCache;
    }

    try {
      const response: AxiosResponse<Airport[]> = await axios.get(
        `${API_BASE}/data/en/airports.json`,
        { timeout: 10000 }
      );

      this.airportsCache = response.data;
      this.lastCacheUpdate = Date.now();
      
      return this.airportsCache;
    } catch (error) {
      console.error('Error fetching airports:', error);
      // Return cached data even if stale
      if (this.airportsCache) {
        return this.airportsCache;
      }
      throw error;
    }
  }

  async getAirportOptions(): Promise<AirportOption[]> {
    const airports = await this.getAirports();
    
    return airports
      .filter(airport => airport.name)
      .map(airport => ({
        value: airport.code,
        label: `${airport.city_name || airport.name} (${airport.code})`,
        city: airport.city_name,
        country: airport.country_name,
        fullLabel: `${airport.city_name || airport.name} (${airport.code}) - ${airport.country_name}`,
    })).sort((a, b) => a.label.localeCompare(b.label));
  }

  async searchAirports(query: string): Promise<AirportOption[]> {
    const options = await this.getAirportOptions();
    
    if (!query) return options.slice(0, 50); // Return popular airports
    
    const searchTerm = query.toLowerCase();
    
    return options
      .filter(option => 
        option.label.toLowerCase().includes(searchTerm) ||
        (option.city && option.city.toLowerCase().includes(searchTerm)) ||
        (option.country && option.country.toLowerCase().includes(searchTerm)) ||
        option.value.toLowerCase().includes(searchTerm)
      )
      .slice(0, 50);
  }

  // ==================== AIRLINES DATA ====================
  async getAirlines(): Promise<any[]> {
    if (this.airlinesCache && Date.now() - this.lastCacheUpdate < this.CACHE_TTL) {
      return this.airlinesCache;
    }

    try {
      const response: AxiosResponse<any[]> = await axios.get(
        `${API_BASE}/data/en/airlines.json`,
        { timeout: 10000 }
      );

      this.airlinesCache = response.data;
      return this.airlinesCache;
    } catch (error) {
      console.error('Error fetching airlines:', error);
      if (this.airlinesCache) return this.airlinesCache;
      throw error;
    }
  }

  // ==================== CITIES DATA ====================
  async getCities(): Promise<any[]> {
    if (this.citiesCache && Date.now() - this.lastCacheUpdate < this.CACHE_TTL) {
      return this.citiesCache;
    }

    try {
      const response: AxiosResponse<any[]> = await axios.get(
        `${API_BASE}/data/en/cities.json`,
        { timeout: 10000 }
      );

      this.citiesCache = response.data;
      return this.citiesCache;
    } catch (error) {
      console.error('Error fetching cities:', error);
      if (this.citiesCache) return this.citiesCache;
      throw error;
    }
  }

  // ==================== HOTEL SEARCH ====================
  async searchHotels(params: HotelSearchParams): Promise<Hotel[]> {
    try {
      const response: AxiosResponse<Hotel[]> = await this.hotelApi.get('/cache.json', {
        params: {
          location: params.location,
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          token: API_TOKEN,
          marker: MARKER,
          limit: 20,
          adults: params.guests,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error searching hotels:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const travelpayoutsApi = TravelpayoutsApiService.getInstance();

// React Server Component compatible cache function
export const getAirportOptions = cache(async (): Promise<AirportOption[]> => {
  return travelpayoutsApi.getAirportOptions();
});
