
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { type Flight } from '@/services/travelpayoutsApi';

const API_TOKEN = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN || '7783bdd07dade9d7dec9ac4b6a88fe51';
const API_ENDPOINT = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates';
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
        if (response.data) {
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
            // A simple heuristic for free carry-on for legacy carriers
            has_baggage: !['FR', 'U2', 'W6'].includes(flight.airline), 
        },
        checked: {
            price: CHECKED_BAGGAGE_PRICE,
            // A simple heuristic for free checked baggage on more expensive flights
            has_baggage: basePrice > 400,
        },
    },
    // The main price should be the base price without extras
    price: basePrice,
  };
}


export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;

    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const departure_date = searchParams.get('depart_date'); // Changed from depart_date

    if (!origin || !destination) {
        return NextResponse.json({ message: 'Origin and destination are required' }, { status: 400 });
    }

    if (!API_TOKEN) {
      return NextResponse.json({ message: 'API token is not configured' }, { status: 500 });
    }

    try {
        const apiParams: { [key: string]: any } = {
            origin: origin,
            destination: destination,
            currency: searchParams.get('currency') || 'USD',
            limit: searchParams.get('limit') || '30',
            sorting: 'price',
            unique: false,
        };

        if (departure_date) {
            apiParams['departure_at'] = departure_date; 
        }

        const return_date = searchParams.get('return_date');
        if (return_date) {
            apiParams['return_at'] = return_date; 
        }

        const url = `${API_ENDPOINT}?${new URLSearchParams(apiParams).toString()}`;
        
        const [apiResponse, airlines] = await Promise.all([
             axios.get(url, { 
                timeout: 15000,
                headers: { 'X-Access-Token': API_TOKEN }
             }),
             getAirlinesData(),
        ]);
        
        if (apiResponse.data && apiResponse.data.success && apiResponse.data.data.length > 0) {
            const flightsWithDetails = apiResponse.data.data.map((flight: any) => {
                const enrichedFlight = {
                    id: flight.link, 
                    price: flight.price,
                    airline: airlines[flight.airline] || flight.airline, // Correctly lookup airline name
                    airline_code: flight.airline,
                    flight_number: flight.flight_number,
                    departure_at: flight.departure_at,
                    return_at: flight.return_at,
                    origin: flight.origin,
                    destination: flight.destination,
                    transfers: flight.transfers,
                    duration: flight.duration,
                    link: `https://www.travelpayouts.com${flight.link}`,
                    currency: apiParams.currency,
                    gate: 'Direct',
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
