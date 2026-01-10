
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

// Configuration
const API_TOKEN = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN || '';
const API_BASE = 'https://api.travelpayouts.com';
const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || 'your_marker_here';

if (!API_TOKEN) {
  console.warn('⚠️ Travelpayouts API token is not configured. Please set NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN in .env.local');
}

class TravelpayoutsApiService {
  private static instance: TravelpayoutsApiService;
  private flightSearchApi: AxiosInstance;
  private cache: {
    airports: Airport[] | null;
    lastUpdated: number;
  };

  private constructor() {
    this.flightSearchApi = axios.create({
        timeout: 30000,
    });

    this.cache = {
      airports: null,
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
      'Accept': 'application/json',
      'Content-Type': 'application/json',
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
      
      const response = await this.flightSearchApi.post(`${API_BASE}/v2/prices/create_search`, searchPayload, { 
        headers: this.getApiHeaders() 
      });
      return response.data.search_id;
  }

  async getFlightSearchResults(searchId: string): Promise<any> {
      const response = await this.flightSearchApi.get(`${API_BASE}/v2/prices/search-results`, {
          params: { uuid: searchId },
          headers: this.getApiHeaders()
      });
      return response.data;
  }

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
      return [];
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
      return [];
    }
  }
}

const travelpayoutsApi = TravelpayoutsApiService.getInstance();

export async function searchFlightsRealtime(params: FlightSearchParams): Promise<string> {
  return travelpayoutsApi.searchFlightsRealtime(params);
}

export async function getFlightSearchResults(searchId: string): Promise<any> {
  return travelpayoutsApi.getFlightSearchResults(searchId);
}

export async function getAirportOptions(): Promise<AirportOption[]> {
    return travelpayoutsApi.getAirportOptions();
}
