
'use client';

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
  private api: AxiosInstance;
  private cache: {
    airports: Airport[] | null;
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
  
  private shouldUseCache(maxAge: number = 24 * 60 * 60 * 1000): boolean {
    return Date.now() - this.cache.lastUpdated < maxAge;
  }

  async searchFlights(params: FlightSearchParams): Promise<Flight[]> {
    try {
      const response = await this.api.get('/v2/prices/latest', {
        params: {
          origin: params.origin,
          destination: params.destination,
          depart_date: params.depart_date,
          return_date: params.return_date,
          currency: params.currency || 'USD',
          limit: params.limit || 30,
          token: API_TOKEN
        }
      });
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch(e) {
       console.error("Could not fetch flights", e);
       return [];
    }
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

export const travelpayoutsApi = TravelpayoutsApiService.getInstance();
