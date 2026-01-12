import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GATES_URL = 'https://api.travelpayouts.com/data/en/gates.json';

export async function GET(req: NextRequest) {
    try {
        console.log('Fetching OTAs via server-side proxy...');
        const response = await axios.get(GATES_URL, {
            headers: { 
                'Accept-Encoding': 'gzip, deflate, compress',
                'Accept': 'application/json'
            },
            timeout: 10000,
        });

        if (response.status === 200 && response.data) {
            return NextResponse.json(response.data);
        } else {
            throw new Error(`Failed to fetch OTAs, status: ${response.status}`);
        }
    } catch (error: any) {
        console.error('Proxy API Error for OTAs:', error.message);
        
        // As a last resort, return a small fallback list
        const fallbackData = [
            { code: 'MYTR', name: 'Mytrip.com', main_url: 'https://mytrip.com' },
            { code: 'CITY', name: 'City.Travel', main_url: 'https://city.travel' },
            { code: 'WING', name: 'Wingie', main_url: 'https://wingie.com' },
            { code: 'TRIP', name: 'Trip.com', main_url: 'https://trip.com' }
        ];

        return NextResponse.json(fallbackData, { 
            status: 500,
            statusText: `Failed to fetch from Travelpayouts: ${error.message}`
        });
    }
}
