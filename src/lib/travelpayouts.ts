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

  searchFlightsRealtime: async (params: any) => {
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
    
    const response = await api.post('https://api.travelpayouts.com/api/v3/create_search', searchPayload);
    return response.data.search_id;
  },

  getFlightSearchResults: async (searchId: string) => {
    const response = await api.get(`https://api.travelpayouts.com/api/v3/flights_search_results?search_id=${searchId}&with_request=true`);
    return response.data;
  },

  getCheapestFlights: async () => {
    try {
      const response = await api.get('/v1/prices/cheap', {
        params: {
          origin: 'JFK',
          currency: 'USD',
          marker: MARKER
        }
      });
      return response.data.data || {};
    } catch (error) {
      console.error('Failed to fetch cheapest flights:', error);
      return {};
    }
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
      `https://api.travelpayouts.com/data/en/airlines.json`,
      airlinesCache,
      (data) => { airlinesCache = data; }
    );
  },

  getCities: async () => {
    return fetchWithCache(
      `${API_BASE}/data/en/cities.json`,
      citiesCache,
      (data) => { citiesCache = data; }
    );
  }
};
