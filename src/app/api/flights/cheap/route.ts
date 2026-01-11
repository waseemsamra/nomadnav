import { NextResponse, type NextRequest } from 'next/server';
import axios from 'axios';

const API_TOKEN = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN || '7783bdd07dade9d7dec9ac4b6a88fe51';
const CHEAP_PRICES_URL = 'https://api.travelpayouts.com/v1/prices/cheap';
const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || '123456';


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
    const departDate = params.depart_date.slice(5).replace(/-/g, '');
    const returnDate = params.return_date ? params.return_date.slice(5).replace(/-/g, '') : '';
    
    return `${baseUrl}/search/${params.origin}${departDate}${params.destination}${returnDate}${passengers}?marker=${MARKER}`;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const origin = searchParams.get('origin') || 'MOW';
    const currency = searchParams.get('currency') || 'USD';

    try {
        const apiParams = new URLSearchParams({
            origin,
            currency,
            token: API_TOKEN,
        });

        const url = `${CHEAP_PRICES_URL}?${apiParams.toString()}`;
        console.log(`📡 Calling Cheap Flights API: ${url.replace(API_TOKEN, '***')}`);
        
        const apiResponse = await axios.get(url, {
            headers: { 'Accept-Encoding': 'gzip,deflate,compress' },
        });

        if (apiResponse.data && apiResponse.data.success) {
            const flightEntries = Object.entries(apiResponse.data.data);
            const formattedFlights = flightEntries
                .slice(0, 4)
                .map(([destination, flightData]: [string, any], index: number) => ({
                    id: `cheap-${origin}-${destination}-${index}`,
                    price: flightData.price || 0,
                    airline: flightData.airline || 'Multiple',
                    airline_code: flightData.airline || 'XX',
                    flight_number: `CH${1000 + index}`,
                    departure_at: flightData.departure_at || new Date().toISOString().split('T')[0],
                    origin,
                    destination,
                    transfers: parseInt(flightData.transfers, 10) || 0,
                    duration: 180 + Math.floor(Math.random() * 240), // Placeholder
                    link: generateBookingLink({
                        origin,
                        destination,
                        depart_date: flightData.departure_at || new Date().toISOString().split('T')[0],
                        currency,
                    }),
                    currency,
                    actual: true,
                    gate: 'aviasales',
                    distance: 1000 + Math.floor(Math.random() * 8000), // Placeholder
                    found_at: new Date().toISOString(),
                }));
            
            return NextResponse.json({ success: true, data: formattedFlights });
        } else {
            return NextResponse.json({ success: false, data: [] });
        }
    } catch (error: any) {
        console.error('Error in cheap flights API route:', error.message);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch cheap flight data.' },
            { status: 500 }
        );
    }
}
