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
  const depart_date = searchParams.get('depart_date');
  const return_date = searchParams.get('return_date');
  const travelers = searchParams.get('travelers');

  const flightParams = {
    origin,
    destination,
    depart_date: depart_date,
    return_date: return_date,
    passengers: travelers,
  };

  const hotelParams = {
    location: destination,
    checkIn: depart_date,
    checkOut: return_date,
    guests: travelers,
  };

  return (
    <div className="bg-primary/10">
      <div className="container py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
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
