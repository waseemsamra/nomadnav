
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
  const airlineCode = flight.airline_code || flight.airline;


  return {
    ...flight,
    baggage: {
        hand: {
            price: CARRY_ON_PRICE,
            has_baggage: !['FR', 'U2', 'W6'].includes(airlineCode), 
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
    const endpoints = [
        '/v2/prices/latest',
        '/v2/prices/month-matrix',
        '/v2/prices/week-matrix',
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Attempting search with ${endpoint}...`);
            const currentParams = new URLSearchParams(params);
            
            if (endpoint === '/v2/prices/latest') {
                currentParams.set('sorting', 'price');
                currentParams.set('show_to_affiliates', 'true');
            } else if (endpoint.includes('matrix')) {
                const departDate = currentParams.get('depart_date');
                if (departDate) {
                    currentParams.set('depart_date', departDate.substring(0, 7));
                }
            }

            const apiResponse = await fetchWithEndpoint(endpoint, currentParams);
            
            if (apiResponse.success && apiResponse.data.length > 0) {
                console.log(`✓ Success with ${endpoint}. Found ${apiResponse.data.length} flights.`);
                return apiResponse;
            }
            console.log(`No results from ${endpoint}.`);
        } catch (e: any) {
            console.warn(`${endpoint} failed:`, e.message);
        }
    }
    
    return { success: false, data: [] };
}

function getMockOTAs(baseFlight: any) {
    if (!baseFlight) return [];
    
    const mockGates = [
      { gate: 'MYTR', priceModifier: 0.95, name: 'Mytrip.com' },
      { gate: 'CITY', priceModifier: 1.02, name: 'City.Travel' },
      { gate: 'GOTO', priceModifier: 0.98, name: 'Gotogate' },
      { gate: 'TRIP', priceModifier: 1.05, name: 'Trip.com' },
    ];

    return mockGates.map(mock => {
      const newPrice = Math.round(baseFlight.price * mock.priceModifier);
      return {
        ...baseFlight, // Correctly copy all properties from the base flight
        price: newPrice,
        gate: mock.gate,
        id: `${baseFlight.id}-mock-${mock.gate}`,
        link: '#', 
        is_mock: true
      };
    });
}


function processFlights(flights: any[], airlines: { [key: string]: string }, currency: string): Flight[] {
    if (!Array.isArray(flights)) return [];
    
    return flights
        .filter(flight => flight && typeof flight.price === 'number') // Filter out flights with invalid price
        .map((flight: any) => {
            const airlineCode = flight.airline_code || flight.airline;
            const airlineName = airlines[airlineCode] || airlineCode;
            const gate = flight.gate || flight.ota_code || 'unknown';
            
            const uniqueId = `${gate}-${flight.price}-${airlineCode}-${flight.flight_number}-${flight.departure_at}`;

            const enrichedFlight = {
                id: uniqueId,
                price: flight.price,
                airline: airlineName,
                airline_code: airlineCode,
                flight_number: flight.flight_number,
                departure_at: flight.departure_at,
                return_at: flight.return_at,
                arrival_at: flight.arrival_at,
                origin: flight.origin,
                destination: flight.destination,
                transfers: flight.transfers,
                duration: flight.duration,
                link: flight.link ? `https://www.aviasales.com${flight.link}?marker=${MARKER}` : '#',
                currency: currency,
                gate: gate,
                is_mock: flight.is_mock || false,
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
      return NextResponse.json({ message: 'API token is not configured. Please add NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN to your .env file.' }, { status: 500 });
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
        
        if (allFlights.length > 0) {
            const uniqueGates = new Set(allFlights.map(f => f.gate).filter(Boolean));
            if (uniqueGates.size < 3) {
                console.log(`Injecting mock OTA data because only ${uniqueGates.size} real gates were found.`);
                const cheapestFlight = allFlights.sort((a,b) => a.price - b.price)[0];
                if (cheapestFlight) {
                    const mockFlights = getMockOTAs(cheapestFlight);
                    allFlights.push(...mockFlights);
                }
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
