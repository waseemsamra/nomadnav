import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

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


export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;

    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');

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
            unique: 'false',
        });

        const departure_date = searchParams.get('depart_date');
        if (departure_date) {
            apiParams.append('departure_date', departure_date);
        }

        const return_date = searchParams.get('return_date');
        if (return_date) {
            apiParams.append('return_date', return_date);
        }

        const url = `${API_ENDPOINT}?${apiParams.toString()}`;
        
        const [apiResponse, airlines] = await Promise.all([
             axios.get(url, {
                headers: { 'x-access-token': API_TOKEN },
             }),
             getAirlinesData(),
        ]);


        if (apiResponse.data && apiResponse.data.success) {
            const flightsWithDetails = apiResponse.data.data.map((flight: any, index: number) => ({
                id: `${flight.origin}-${flight.destination}-${flight.departure_at}-${flight.price}-${index}`,
                price: flight.price,
                airline: airlines[flight.airline] || flight.airline,
                airline_code: flight.airline,
                flight_number: `TP${1000 + index}`,
                departure_at: flight.departure_at,
                return_at: flight.return_at,
                origin: flight.origin,
                destination: flight.destination,
                transfers: flight.number_of_changes,
                duration: flight.duration,
                link: flight.link,
                currency: apiParams.get('currency'),
            }));
            return NextResponse.json(flightsWithDetails);
        } else {
            console.warn('API returned success=false or no data', apiResponse.data);
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
