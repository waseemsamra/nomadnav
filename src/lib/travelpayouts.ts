import axios from 'axios';

const API_TOKEN = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.travelpayouts.com';
const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'X-Access-Token': API_TOKEN,
    'Accept': 'application/json',
  }
});

let airportsCache: any[] | null = null;
let airlinesCache: any[] | null = null;
let citiesCache: any[] | null = null;

async function fetchWithCache(url: string, cacheVar: any[] | null, setter: (data: any) => void) {
  if (cacheVar) {
    return cacheVar;
  }
  try {
    const response = await axios.get(url);
    setter(response.data);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch data from ${url}`, error);
    return [];
  }
}

export const travelpayoutsApi = {
  // Flight APIs
  searchFlights: async (params: any) => {
    const response = await api.get('/v2/prices/latest', {
      params: {
        currency: 'USD',
        limit: 50,
        ...params,
        marker: MARKER
      }
    });
    return response.data.data || [];
  },

  getMonthPrices: async (origin: string, destination: string, month: string) => {
    const response = await api.get('/v2/prices/month-matrix', {
      params: {
        origin,
        destination,
        month,
        currency: 'USD',
        marker: MARKER
      }
    });
    return response.data.data || [];
  },

  // Hotel APIs
  searchHotels: async (location: string, checkIn: string, checkOut: string, adults: string = '1') => {
    const response = await axios.get('https://engine.hotellook.com/api/v2/cache.json', {
      params: {
        location,
        checkIn,
        checkOut,
        adults,
        currency: 'USD',
        limit: 20,
        token: API_TOKEN,
        marker: MARKER
      }
    });
    return response.data;
  },

  // Static Data APIs
  getAirports: async (query?: string) => {
    const allAirports = await fetchWithCache(
      `${API_BASE}/data/en/airports.json`,
      airportsCache,
      (data) => { airportsCache = data; }
    );
    if (query) {
        return allAirports.filter((airport: any) => 
            airport.name?.toLowerCase().includes(query.toLowerCase()) ||
            airport.city_name?.toLowerCase().includes(query.toLowerCase()) ||
            airport.code?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
    }
    return allAirports.slice(0,10);
  },

  getAirlines: async () => {
    return fetchWithCache(
      `${API_BASE}/data/en/airlines.json`,
      airlinesCache,
      (data) => { airlinesCache = data; }
    );
  },

  getCities: async () => {
    return fetchWithCache(
      `${API_...