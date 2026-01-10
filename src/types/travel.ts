
export interface Airport {
  code: string;
  name: string;
  city_name: string;
  country_code: string;
}

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

export interface Flight {
  value: number;
  trip_class: number;
  origin: string;
  destination: string;
  depart_date: string;
  return_date?: string;
  number_of_changes: number;
  duration: number;
  distance: number;
  gate: string;
  link: string;
  airline: string;
  flight_number: string;
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface FlightSearchParams {
  origin?: string | null;
  destination?: string | null;
  depart_date?: string;
  return_date?: string;
  passengers?: string | null;
}

export interface HotelSearchParams {
  location?: string | null;
  checkIn?: string;
  checkOut?: string;
  guests?: string | null;
}
