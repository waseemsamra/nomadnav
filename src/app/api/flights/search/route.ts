
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


function processFlights(flights: any[], airlines: { [key: string]: string }, currency: string): Flight[] {
    if (!Array.isArray(flights)) return [];
    
    return flights
        .filter(flight => flight && typeof flight.price === 'number')
        .map((flight: any) => {
            const airlineCode = flight.airline; // Data from /v1/prices/cheap uses 'airline'
            const airlineName = airlines[airlineCode] || airlineCode;
            const gate = flight.gate || 'unknown';
            
            const uniqueId = `${gate}-${flight.price}-${airlineCode}-${flight.flight_number}-${flight.departure_at}-${Math.random()}`;

            const enrichedFlight = {
                id: uniqueId,
                price: flight.price,
                airline: airlineName,
                airline_code: airlineCode,
                flight_number: flight.flight_number,
                departure_at: flight.departure_at,
                return_at: flight.return_at,
                arrival_at: flight.departure_at, // Placeholder, can be improved if API provides it
                origin: flight.origin,
                destination: flight.destination,
                transfers: flight.transfers,
                duration: flight.duration_to, // Use duration_to for one-way duration
                link: flight.link ? `https://www.aviasales.com${flight.link}?marker=${MARKER}` : '#',
                currency: currency,
                gate: gate,
                is_mock: flight.is_mock || false,
            };
            return addEstimatedBaggagePrices(enrichedFlight);
        }).filter((flight): flight is Flight => flight !== null);
}


export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;

    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const depart_date = searchParams.get('depart_date');
    const return_date = searchParams.get('return_date');
    const currency = searchParams.get('currency') || 'USD';

    console.log(`[API] Received search: ${origin} -> ${destination} on ${depart_date}`);

    if (!origin || !destination) {
        return NextResponse.json({ message: 'Origin and destination are required' }, { status: 400 });
    }
    if (!API_TOKEN) {
      console.error('[API] FATAL: API token not configured.');
      return NextResponse.json({ message: 'API token is not configured. Please add NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN to your .env file.' }, { status: 500 });
    }
    
    const apiParams = new URLSearchParams({
        origin: origin,
        destination: destination,
        currency: currency,
        limit: '100',
        trip_class: searchParams.get('cabin_class') === 'business' ? '1' : '0',
    });
    
    if (depart_date) apiParams.set('depart_date', depart_date);
    if (return_date) apiParams.set('return_date', return_date);

    const url = `${API_BASE_URL}/v1/prices/cheap?${apiParams.toString()}`;
    console.log(`[API] Requesting Travelpayouts URL: ${url}`);

    try {
        const response = await axios.get(url, {
            timeout: 20000,
            headers: { 'X-Access-Token': API_TOKEN, 'Accept-Encoding': 'gzip, deflate, compress' },
        });

        console.log('[API] Received response from Travelpayouts.');
        
        let rawFlights: any[] = [];

        if (response.data?.success && response.data?.data) {
            const destinationData = response.data.data[destination];
            if (destinationData && Object.keys(destinationData).length > 0) {
                // Map over the flights and add origin/destination, as the API doesn't provide it in the nested objects
                rawFlights = Object.values(destinationData).map((flight: any) => ({
                    ...flight,
                    origin: origin,
                    destination: destination
                }));
                console.log(`[API] SUCCESS: Found ${rawFlights.length} flight segments for key '${destination}'.`);
            } else {
                console.warn(`[API] WARN: API response successful, but no flight data found for destination key '${destination}'. Available keys: ${Object.keys(response.data.data)}`);
            }
        } else {
            console.warn('[API] WARN: API response was not successful or did not contain data field.', response.data);
        }

        if (rawFlights.length === 0) {
            console.log('[API] No flights found after processing. Returning empty array.');
            return NextResponse.json([]);
        }
        
        const airlines = await getAirlinesData();
        const processedFlights = processFlights(rawFlights, airlines, currency);
        
        console.log(`[API] Processed ${processedFlights.length} flights. Returning to client.`);
        return NextResponse.json(processedFlights);

    } catch (error: any) {
        console.error('[API] FATAL: Error during API call to Travelpayouts:', error.response?.data || error.message);
        return NextResponse.json(
            { message: 'Failed to fetch flight data from external API.', error: error.message },
            { status: 500 }
        );
    }
}
    

    
