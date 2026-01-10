'use client';

import {Suspense} from 'react';
import {useSearchParams} from 'next/navigation';
import {FlightResults} from '@/components/search/flight-results';
import {HotelResults} from '@/components/search/hotel-results';
import {ResultsSkeleton} from '@/components/search/results-skeleton';

function SearchResults() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'flights';
  const destination = searchParams.get('destination');
  const origin = searchParams.get('origin');
  const checkin = searchParams.get('checkin');
  const checkout = searchParams.get('checkout');
  const travelers = searchParams.get('travelers');

  const flightParams = {
    origin,
    destination,
    depart_date: checkin,
    return_date: checkout,
    passengers: travelers,
  };

  const hotelParams = {
    location: destination,
    checkIn: checkin,
    checkOut: checkout,
    guests: travelers,
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold font-headline mb-2">
        Search Results for{' '}
        <span className="text-primary capitalize">{destination}</span>
      </h1>
      <p className="text-muted-foreground mb-8">
        Review the available options below and make your selection.
      </p>

      <div className="flex flex-col gap-8">
        {(type === 'flights' || type === 'combined') && (
          <FlightResults params={flightParams} />
        )}
        {(type === 'hotels' || type === 'combined') && (
          <HotelResults params={hotelParams} />
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <SearchResults />
    </Suspense>
  );
}
