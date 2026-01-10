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

// Cache for airports and airlines
let cache = {
  airports: null,
  airlines: null,
  cities: null,
  lastUpdated: null
};

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
  searchHotels: async (location: string, checkIn: string, checkOut: string) => {
    const hotelResponse = await axios.get('https://engine.hotellook.com/api/v2/cache.json', {
      params: {
        location,
        checkIn,
        checkOut,
        token: API_TOKEN,
        marker: MARKER
      }
    });
    return hotelResponse.data;
  },

  // Static Data APIs
  getAirports: async () => {
    if (cache.airports && Date.now() - cache.lastUpdated < 24 * 60 * 60 * 1000) {
      return cache.airports;
    }
    
    const response = await axios.get(`${API_BASE}/data/en/airports.json`);
    cache.airports = response.data;
    cache.lastUpdated = Date.now();
    return response.data;
  },

  getAirlines: async () => {
    if (cache.airlines) return cache.airlines;
    
    const response = await axios.get(`${API_BASE}/data/en/airlines.json`);
    cache.airlines = response.data;
    return response.data;
  },

  getCities: async () => {
    if (cache.cities) return cache.cities;
    
    const response = await axios.get(`${API_BASE}/data/en/cities.json`);
    cache.cities = response.data;
    return response.data;
  },

  // Flight Inspiration
  getCheapestFlights: async () => {
    const response = await api.get('/v1/city-directions', {
      params: {
        origin: 'NYC',
        currency: 'USD',
        marker: MARKER
      }
    });
    return response.data.data || [];
  }
};
