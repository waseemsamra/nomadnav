export interface Airline {
  code: string;
  name: string;
  is_lowcost: boolean;
}

export interface City {
  code: string;
  name: string;
  country_code: string;
}

export interface Hotel {
  hotelId: string;
  name: string;
  locationName: string;
  stars: number;
  priceAvg: number;
  rating: number;
  location: {
    lat: number;
    lon: number;
  };
}

export interface HotelSearchParams {
  location?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  guests?: string | null;
}

export interface SearchFormData {
    origin: string;
    destination: string;
    departDate: Date;
    returnDate: Date;
    tripType: 'round' | 'oneway';
    passengers: number;
    cabinClass: 'economy' | 'business' | 'first';
}


export interface FilterState {
  maxPrice: number;
  maxStops: number;
  airlines: string[];
  sortBy: 'price' | 'duration' | 'departure';
  departureTime: [number, number];
  arrivalTime: [number, number];
}
