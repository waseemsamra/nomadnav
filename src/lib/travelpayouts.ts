
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  Airport,
  Airline,
  City,
  Flight,
  Hotel,
  ApiResponse,
  FlightSearchParams,
  HotelSearchParams
} from '../types/travel';

const API_TOKEN = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN as string;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.travelpayouts.com';
const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER as string;

interface Cache<T> {
  data: T | null;
  lastUpdated: number | null;
}

class TravelpayoutsApi {
  private api: AxiosInstance;
  private realtimeApi: AxiosInstance;
  private hotelApi: AxiosInstance;

  private cache: {
    airports: Cache<Airport[]>;
    airlines: Cache<Airline[]>;
    cities: Cache<City[]>;
  };

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE,
      headers: {
        'X-Access-Token': API_TOKEN,
        'Accept': 'application/json',
      },
      timeout: 30000,
    });
    
    this.realtimeApi = axios.create({
        baseURL: 'https://api.travelpayouts.com/api/v3',
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


    this.cache = {
      airports: { data: null, lastUpdated: null },
      airlines: { data: null, lastUpdated: null },
      cities: { data: null, lastUpdated: null },
    };
  }

  private shouldUseCache<T>(cache: Cache<T>, maxAge: number = 24 * 60 * 60 * 1000): boolean {
    if (!cache.data || !cache.lastUpdated) return false;
    return Date.now() - cache.lastUpdated < maxAge;
  }

  private async fetchWithCache<T>(
    cacheKey: keyof typeof this.cache,
    fetchFn: () => Promise<T>,
    maxAge: number = 24 * 60 * 60 * 1000
  ): Promise<T> {
    const cache = this.cache[cacheKey];
    
    if (this.shouldUseCache(cache, maxAge) && cache.data) {
      return cache.data as T;
    }

    try {
      const data = await fetchFn();
      this.cache[cacheKey] = {
        data,
        lastUpdated: Date.now(),
      };
      return data;
    } catch (error) {
      console.error(`Error fetching ${cacheKey}:`, error);
      throw error;
    }
  }

  // Flight APIs
  async searchFlights(params: FlightSearchParams): Promise<Flight[]> {
    try {
      const response: AxiosResponse<ApiResponse<Flight[]>> = await this.api.get('/v2/prices/latest', {
        params: {
          currency: 'USD',
          limit: 50,
          ...params,
          marker: MARKER,
        },
      });

      if (response.data.error) {
        throw new Error(response.data.error || 'Failed to fetch flights');
      }

      return response.data.data || [];
    } catch (error) {
      console.error('Error searching flights:', error);
      throw error;
    }
  }

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

    const searchPayload = {
      segments: segments,
      passengers: {
        adults: params.passengers || 1,
        children: 0,
        infants: 0,
      },
      trip_class: 'Y', // Y for economy
      marker: MARKER,
      "know_english": "true"
    };
    
    const response = await this.realtimeApi.post('/create_search', searchPayload);
    return response.data.search_id;
  }

  async getFlightSearchResults(searchId: string) {
    const response = await this.realtimeApi.get(`/flights_search_results?search_id=${searchId}&with_request=true`);
    return response.data;
  }

  async getMonthPrices(
    origin: string,
    destination: string,
    month: string
  ): Promise<Flight[]> {
    try {
      const response: AxiosResponse<ApiResponse<Flight[]>> = await this.api.get('/v2/prices/month-matrix', {
        params: {
          origin,
          destination,
          month,
          currency: 'USD',
          marker: MARKER,
        },
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching month prices:', error);
      throw error;
    }
  }

  // Hotel APIs
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

  // Static Data APIs
  async getAirports(): Promise<Airport[]> {
    return this.fetchWithCache('airports', async () => {
      const response: AxiosResponse<Airport[]> = await axios.get(`${API_BASE}/data/en/airports.json`);
      return response.data;
    });
  }

  async getAirlines(): Promise<Airline[]> {
    return this.fetchWithCache('airlines', async () => {
      const response: AxiosResponse<Airline[]> = await axios.get(`https://api.travelpayouts.com/data/en/airlines.json`);
      return response.data;
    });
  }

  async getCities(): Promise<City[]> {
    return this.fetchWithCache('cities', async () => {
      const response: AxiosResponse<City[]> = await axios.get(`${API_BASE}/data/en/cities.json`);
      return response.data;
    });
  }

  // Flight Inspiration
  async getCheapestFlights(origin: string = 'JFK'): Promise<any> {
    try {
      const response = await this.api.get('/v1/prices/cheap', {
        params: {
          origin,
          currency: 'USD',
          marker: MARKER,
        },
      });
      if (!response.data.success || !response.data.data) {
        return {};
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching cheapest flights:', error);
      return {};
    }
  }
}

export const travelpayoutsApi = new TravelpayoutsApi();
