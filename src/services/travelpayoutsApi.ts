
'use client';

import axios, { type AxiosInstance } from 'axios';

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
}

// Configuration
const API_TOKEN = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN || '';
const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || 'your_marker_here';

if (!API_TOKEN) {
  console.warn('⚠️ Travelpayouts API token is not configured. Please set NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN in .env.local');
}

class TravelpayoutsApiService {
  private static instance: TravelpayoutsApiService;
  private api: AxiosInstance;

  private constructor() {
    this.api = axios.create({
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Access-Token': API_TOKEN,
      },
    });
  }

  public static getInstance(): TravelpayoutsApiService {
    if (!TravelpayoutsApiService.instance) {
      TravelpayoutsApiService.instance = new TravelpayoutsApiService();
    }
    return TravelpayoutsApiService.instance;
  }
  
  async createFlightSearch(params: FlightSearchParams): Promise<string> {
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
        trip_class: cabinClassMapping[params.cabin_class || 'economy'],
    };
    
    const response = await this.api.post('https://api.travelpayouts.com/v2/prices/create_search', searchPayload);
    return response.data.search_id;
  }

  async getFlightSearchResults(searchId: string): Promise<any> {
      const response = await this.api.get('https://api.travelpayouts.com/v2/prices/search-results', {
          params: { uuid: searchId },
      });
      return response.data;
  }

  async searchAirports(term: string): Promise<AirportOption[]> {
    if (!term || term.length < 2) {
      return [];
    }
    try {
      const response = await this.api.get('https://autocomplete.travelpayouts.com/jravia/places/v2', {
        params: {
          term: term,
          locale: 'en',
          types: ['city', 'airport']
        }
      });

      if (response.data && Array.isArray(response.data)) {
        return response.data.map((item: any) => ({
          value: item.code,
          label: `${item.name}, ${item.country_name} (${item.code})`,
          city: item.city_name || item.name,
          country: item.country_name,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error searching airports:', error);
      throw error;
    }
  }

}

export const travelpayoutsApi = TravelpayoutsApiService.getInstance();

    