
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { type Flight } from '@/services/travelpayoutsApi';

const API_TOKEN = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN || '7783bdd07dade9d7dec9ac4b6a88fe51';
const LATEST_PRICES_ENDPOINT = 'https://api.travelpayouts.com/v2/prices/latest';
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

// Function to add estimated baggage prices
function addEstimatedBaggagePrices(flight: any): Flight {
  const basePrice = flight.price;
  const CARRY_ON_PRICE = 25; // Estimated cost for carry-on
  const CHECKED_BAGGAGE_PRICE = 50; // Estimated cost for checked baggage

  return {
    ...flight,
    baggage: {
        hand: {
            price: CARRY_ON_PRICE,
            has_baggage: !['FR', 'U2', 'W6'].includes(flight.airline), 
        },
        checked: {
            price: CHECKED_BAGGAGE_PRICE,
            has_baggage: basePrice > 400,
        },
    },
    price: basePrice,
  };
}

async function fetchFlightsFromApi(params: URLSearchParams) {
    const url = `${LATEST_PRICES_ENDPOINT}?${params.toString()}`;
    const response = await axios.get(url, {
        timeout: 15000,
        headers: { 'X-Access-Token': API_TOKEN, 'Accept-Encoding': 'gzip, deflate, compress' },
    });
    return response.data;
}


export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;

    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const depart_date = searchParams.get('depart_date'); 
    const return_date = searchParams.get('return_date');

    if (!origin || !destination) {
        return NextResponse.json({ message: 'Origin and destination are required' }, { status: 400 });
    }

    if (!API_TOKEN) {
      return NextResponse.json({ message: 'API token is not configured' }, { status: 500 });
    }

    try {
        const apiParams = new URLSearchParams({
            origin: origin,
            destination: destination,
            currency: searchParams.get('currency') || 'USD',
            limit: searchParams.get('limit') || '30',
            sorting: 'price',
            trip_class: searchParams.get('cabin_class') === 'business' ? '1' : '0',
            show_to_affiliates: 'true',
        });
        
        let apiResponse;

        // First attempt: search with specific depart_date if provided
        if (depart_date) {
            const specificDateParams = new URLSearchParams(apiParams);
            specificDateParams.set('depart_date', depart_date);
             if (return_date) {
                specificDateParams.set('return_date', return_date);
            }
            apiResponse = await fetchFlightsFromApi(specificDateParams);
        } else {
             apiResponse = await fetchFlightsFromApi(apiParams);
        }
        
        // Fallback: If no results with specific date, try without it
        if (!apiResponse.data || apiResponse.data.length === 0) {
            console.log('No results with specific date, trying fallback without date.');
            apiResponse = await fetchFlightsFromApi(apiParams);
        }

        const airlines = await getAirlinesData();
        
        if (apiResponse.success && apiResponse.data.length > 0) {
            const flightsWithDetails = apiResponse.data.map((flight: any) => {
                const airlineName = airlines[flight.airline] || flight.airline;
                const enrichedFlight = {
                    id: flight.link || `${flight.airline}-${flight.flight_number}-${flight.departure_at}`, 
                    price: flight.price,
                    airline: airlineName,
                    airline_code: flight.airline,
                    flight_number: flight.flight_number,
                    departure_at: flight.departure_at,
                    return_at: flight.return_at,
                    origin: flight.origin,
                    destination: flight.destination,
                    transfers: flight.transfers,
                    duration: flight.duration,
                    link: `https://www.travelpayouts.com${flight.link}`,
                    currency: apiParams.get('currency') || 'USD',
                    gate: flight.gate || 'Direct',
                };
                return addEstimatedBaggagePrices(enrichedFlight);
            });
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
