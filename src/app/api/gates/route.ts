import { NextResponse } from 'next/server';
import axios from 'axios';

const GATES_ENDPOINT = 'https://api.travelpayouts.com/data/en/gates.json';

export async function GET() {
  try {
    const response = await axios.get(GATES_ENDPOINT, {
      headers: { 'Accept-Encoding': 'gzip, deflate, compress' },
      timeout: 10000,
    });
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error proxying gates endpoint:', error.message);
    return NextResponse.json(
      { message: 'Failed to fetch gates data', error: error.message },
      { status: 500 }
    );
  }
}
