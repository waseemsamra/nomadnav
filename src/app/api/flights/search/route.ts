
import { NextResponse, type NextRequest } from 'next/server';
import axios from 'axios';

const API_TOKEN = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN || '7783bdd07dade9d7dec9ac4b6a88fe51';
const LATEST_PRICES_URL = 'https://api.travelpayouts.com/v2/prices/latest';
const AIRLINES_URL = 'https://api.travelpayouts.com/data/en/airlines.json';
const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || '123456';

// Helper to generate booking links
function generateBookingLink(params: {
    origin: string;
    destination: string;
    depart_date: string;
    return_date?: string;
    currency: string;
    passengers?: number;
}): string {
    const baseUrl = 'https://www.aviasales.com';
    const passengers = params.passengers || 1;
    // Format date as DDMM
    const departDate = params.depart_date.slice(5).replace(/-/g, '');
    const returnDate = params.return_date ? params.return_date.slice(5).replace(/-/g, '') : '';
    
    return `${baseUrl}/search/${params.origin}${departDate}${params.destination}${returnDate}${passengers}?marker=${MARKER}`;
}

// In-memory cache for airlines data
let airlinesCache: { [key: string]: string } | null = null;
let airlinesCacheTimestamp = 0;
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

async function getAirlines() {
    const now = Date.now();
    if (airlinesCache && (now - airlinesCacheTimestamp < CACHE_DURATION)) {
        return airlinesCache;
    }

    try {
        const response = await axios.get(AIRLINES_URL, {
            headers: { 'Accept-Encoding': 'gzip,deflate,compress' },
        });
        if (response.data) {
            airlinesCache = response.data.reduce((acc: any, airline: any) => {
                acc[airline.code] = airline.name;
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const depart_date = searchParams.get('depart_date');
  const return_date = searchParams.get('return_date');
  const currency = searchParams.get('currency') || 'USD';
  const limit = searchParams.get('limit') || '30';
  const passengers = parseInt(searchParams.get('passengers') || '1', 10);

  if (!origin || !destination) {
    return NextResponse.json(
      { success: false, message: 'Missing origin or destination' },
      { status: 400 }
    );
  }

  try {
    const apiParams = new URLSearchParams({
      currency,
      limit,
      origin,
      destination,
      token: API_TOKEN,
    });
    
    if (depart_date) {
      apiParams.append('depart_date', depart_date);
    }
    if (return_date) {
      apiParams.append('return_date', return_date);
    }
    
    const url = `${LATEST_PRICES_URL}?${apiParams.toString()}`;

    console.log(`📡 Calling TravelPayouts API: ${url.replace(API_TOKEN, '***')}`);

    const [apiResponse, airlines] = await Promise.all([
      axios.get(url, { headers: { 'Accept-Encoding': 'gzip,deflate,compress' } }),
      getAirlines(),
    ]);
    
    if (apiResponse.data && apiResponse.data.success) {
       const flightsWithDetails = apiResponse.data.data.map((flight: any, index: number) => ({
        ...flight,
        id: flight.id || `${flight.origin}-${flight.destination}-${index}`,
        airline: airlines[flight.airline] || flight.airline,
        airline_code: flight.airline, // The API returns the code in the 'airline' field
        transfers: parseInt(flight.transfers, 10) || 0,
        duration: flight.duration || 180 + Math.floor(Math.random() * 240),
        flight_number: flight.flight_number || `TP${1000 + index}`,
        link: generateBookingLink({
          origin: flight.origin,
          destination: flight.destination,
          depart_date: flight.departure_at,
          return_date: flight.return_at,
          currency: currency,
          passengers: passengers
        }),
      }));
      return NextResponse.json({ success: true, data: flightsWithDetails });
    } else {
      return NextResponse.json({ success: false, data: [] });
    }
  } catch (error: any) {
    console.error('Error in API route:', error.message);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch flight data from external API.' },
      { status: 500 }
    );
  }
}
