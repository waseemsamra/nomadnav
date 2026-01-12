import { NextResponse } from 'next/server';
import axios from 'axios';

const GATES_URL = 'https://api.travelpayouts.com/data/en/gates.json';

export async function GET() {
    try {
        const response = await axios.get(GATES_URL, {
            headers: { 'Accept-Encoding': 'gzip, deflate, compress' },
        });
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error in /api/gates proxy:', error.message);
        return NextResponse.json(
            { message: 'Failed to fetch OTA data', error: error.message },
            { status: 500 }
        );
    }
}
