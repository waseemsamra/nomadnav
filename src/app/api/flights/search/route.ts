
import { NextResponse, type NextRequest } from 'next/server';
import axios from 'axios';

const API_TOKEN = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN || '7783bdd07dade9d7dec9ac4b6a88fe51';
const LATEST_PRICES_URL = 'https://api.travelpayouts.com/v2/prices/latest';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const depart_date = searchParams.get('depart_date');
  const return_date = searchParams.get('return_date');
  const currency = searchParams.get('currency') || 'USD';
  const limit = searchParams.get('limit') || '30';

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

    const apiResponse = await axios.get(url, {
      headers: { 'Accept-Encoding': 'gzip,deflate,compress' },
    });
    
    if (apiResponse.data && apiResponse.data.success) {
       const flightsWithNumbers = apiResponse.data.data.map((flight: any, index: number) => ({
        ...flight,
        id: flight.id || `${flight.origin}-${flight.destination}-${index}`,
        transfers: parseInt(flight.transfers, 10) || 0,
        duration: flight.duration || 180 + Math.floor(Math.random() * 240),
        flight_number: flight.flight_number || `TP${1000 + index}`,
      }));
      return NextResponse.json({ success: true, data: flightsWithNumbers });
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
