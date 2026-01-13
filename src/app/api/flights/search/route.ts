
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { type Flight } from '@/services/travelpayoutsApi';

const API_TOKEN = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN;
const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER;
const API_BASE_URL = 'https://api.travelpayouts.com';
const AIRLINES_ENDPOINT = 'https://api.travelpayouts.com/data/en/airlines.json';

let airlinesCache: { [key: string]: string } | null = null;
let airlinesCacheTimestamp = 0;
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

const airportAlternatives: { [key: string]: string[] } = {
    'DXB': ['DXB', 'SHJ', 'AUH', 'DWC'],
    'MOW': ['SVO', 'DME', 'VKO', 'ZIA'],
    'LON': ['LHR', 'LGW', 'STN', 'LTN', 'LCY'],
    'NYC': ['JFK', 'LGA', 'EWR'],
    'TYO': ['HND', 'NRT'],
    'PAR': ['CDG', 'ORY'],
};

async function getAirlinesData() {
    const now = Date.now();
    if (airlinesCache && (now - airlinesCacheTimestamp < CACHE_DURATION)) {
        return airlinesCache;
    }

    try {
        const response = await axios.get(AIRLINES_ENDPOINT, {
            headers: { 'Accept-Encoding': 'gzip, deflate, compress' },
        });
        if (response.data && Array.isArray(response.data)) {
            airlinesCache = response.data.reduce((acc: any, airline: any) => {
                if (airline.code && airline.name) {
                  acc[airline.code] = airline.name;
                }
                return acc;
            }, {});
            airlinesCacheTimestamp = now;
            return airlinesCache;
        }
    } catch (error) {
        console.error('Failed to fetch airlines:', error);
    }
    return {};
}

function addEstimatedBaggagePrices(flight: any): Flight {
  const basePrice = flight.price;
  const CARRY_ON_PRICE = 25;
  const CHECKED_BAGGAGE_PRICE = 50;

  return {
    ...flight,
    baggage: {
        hand: {
            price: CARRY_ON_PRICE,
            has_baggage: !['FR', 'U2', 'W6'].includes(flight.airline_code), 
        },
        checked: {
            price: CHECKED_BAGGAGE_PRICE,
            has_baggage: basePrice > 400,
        },
    },
    price: basePrice,
  };
}

async function fetchWithEndpoint(endpoint: string, params: URLSearchParams) {
    const url = `${API_BASE_URL}${endpoint}?${params.toString()}`;
    const response = await axios.get(url, {
        timeout: 15000,
        headers: { 'X-Access-Token': API_TOKEN, 'Accept-Encoding': 'gzip, deflate, compress' },
    });
    return response.data;
}

async function searchWithStrategy(params: URLSearchParams) {
    let apiResponse = null;

    // STRATEGY: Use v2/prices/latest as it gives a broad range of offers from different gates.
    try {
        console.log('Attempting search with v2/prices/latest...');
        const v2Params = new URLSearchParams(params);
        v2Params.set('sorting', 'price');
        v2Params.set('show_to_affiliates', 'true'); // Get all public and affiliate offers
        
        apiResponse = await fetchWithEndpoint('/v2/prices/latest', v2Params);
        if (apiResponse.success && apiResponse.data.length > 0) {
            console.log(`✓ Success with v2/prices/latest. Found ${apiResponse.data.length} flights.`);
            return apiResponse;
        }
        console.log('No results from v2/prices/latest.');
    } catch (e: any) {
        console.warn('v2/prices/latest failed:', e.message);
    }
    
    return apiResponse || { success: false, data: [] }; // Return last result or empty
}

function processFlights(flights: any[], airlines: { [key: string]: string }, currency: string): Flight[] {
    if (!Array.isArray(flights)) return [];
    
    return flights.map((flight: any) => {
        const airlineCode = flight.airline;
        const airlineName = airlines[airlineCode] || airlineCode;
        
        // A combination of link, gate, and price usually guarantees uniqueness. Add random to be certain.
        const uniqueId = `${flight.link || ''}-${flight.gate || ''}-${flight.price}-${Math.random()}`;

        const enrichedFlight = {
            id: uniqueId,
            price: flight.price,
            airline: airlineName,
            airline_code: airlineCode,
            flight_number: flight.flight_number,
            departure_at: flight.departure_at,
            return_at: flight.return_at,
            arrival_at: flight.arrival_at, // Pass arrival_at if it exists
            origin: flight.origin,
            destination: flight.destination,
            transfers: flight.transfers,
            duration: flight.duration,
            link: `https://www.aviasales.com${flight.link}?marker=${MARKER}`,
            currency: currency,
            gate: flight.gate,
        };
        return addEstimatedBaggagePrices(enrichedFlight);
    }).filter(flight => flight !== null) as Flight[];
}


export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;

    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const depart_date = searchParams.get('depart_date');

    if (!origin || !destination) {
        return NextResponse.json({ message: 'Origin and destination are required' }, { status: 400 });
    }
    if (!API_TOKEN) {
      return NextResponse.json({ message: 'API token is not configured' }, { status: 500 });
    }
    
    const currency = searchParams.get('currency') || 'USD';
    const baseApiParams = new URLSearchParams({
        origin: origin,
        destination: destination,
        currency: currency,
        limit: searchParams.get('limit') || '100',
        trip_class: searchParams.get('cabin_class') === 'business' ? '1' : '0',
    });
    
    if (depart_date) baseApiParams.set('depart_date', depart_date);
    const return_date = searchParams.get('return_date');
    if (return_date) baseApiParams.set('return_date', return_date);

    try {
        let apiResponse = await searchWithStrategy(new URLSearchParams(baseApiParams));
        let allFlights: any[] = apiResponse.data || [];

        // If no flights, try alternative airports
        if (allFlights.length === 0) {
            console.log('No flights on direct route, trying alternatives...');
            const originAlts = airportAlternatives[origin] || [origin];
            const destAlts = airportAlternatives[destination] || [destination];
            
            if (originAlts.length > 1 || destAlts.length > 1) {
                const alternativeSearches = [];
                for (const altOrigin of originAlts) {
                    for (const altDest of destAlts) {
                        if (altOrigin === origin && altDest === destination) continue;
                        
                        const altParams = new URLSearchParams(baseApiParams);
                        altParams.set('origin', altOrigin);
                        altParams.set('destination', altDest);
                        alternativeSearches.push(searchWithStrategy(altParams));
                    }
                }
                const results = await Promise.allSettled(alternativeSearches);
                results.forEach(result => {
                    if (result.status === 'fulfilled' && result.value.success) {
                        allFlights.push(...result.value.data);
                    }
                });
                console.log(`Found ${allFlights.length} flights via alternative routes.`);
            }
        }

        const airlines = await getAirlinesData();
        
        if (allFlights.length > 0) {
            const flightsWithDetails = processFlights(allFlights, airlines, currency);
            return NextResponse.json(flightsWithDetails);
        } else {
            return NextResponse.json([]);
        }

    } catch (error: any) {
        console.error('Proxy API Error:', error.response?.data || error.message);
        return NextResponse.json(
            { message: 'Failed to fetch flight data', error: error.message },
            { status: 500 }
        );
    }
}
