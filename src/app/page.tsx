import Image from 'next/image';
import {SearchForm} from '@/components/search/search-form';
import {Suspense} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {MapPin} from 'lucide-react';
import {PlaceHolderImages} from '@/lib/placeholder-images';
import {travelpayoutsApi} from '@/lib/travelpayouts';

const heroImage = PlaceHolderImages.find(img => img.id === 'hero');

async function TravelInspiration() {
  const cheapFlightsData = await travelpayoutsApi.getCheapestFlights();
  const cheapFlights = cheapFlightsData ? Object.values(cheapFlightsData) : [];

  return (
    <section className="container text-center">
      <h2 className="text-3xl font-bold font-headline mb-2">
        Travel Inspiration
      </h2>
      <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
        Get inspired for your next adventure with our curated list of must-visit
        locations around the globe.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Cheapest Flights from New York</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cheapFlights.slice(0, 5).map((flight: any) => (
            <div
              key={flight.destination}
              className="flex justify-between items-center p-3 bg-secondary rounded-lg"
            >
              <div>
                <p className="font-bold">{flight.destination_name}</p>
                <p className="text-sm text-muted-foreground">
                  {flight.origin_name} to {flight.destination_name}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-primary">${flight.price}</p>
                <p className="text-xs text-muted-foreground">Round trip</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      <section className="relative h-[60vh] w-full">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
          <h1 className="text-4xl md:text-6xl font-bold font-headline drop-shadow-lg">
            Your Journey, Reimagined
          </h1>
          <p className="mt-4 max-w-2xl text-lg md:text-xl drop-shadow">
            Discover and book flights and hotels with personalized
            recommendations. Nomad Navigator makes travel planning effortless.
          </p>
        </div>
      </section>

      <div id="search" className="container -mt-48 z-20">
        <Suspense
          fallback={
            <div className="h-48 w-full bg-background rounded-lg shadow-2xl animate-pulse" />
          }
        >
          <SearchForm />
        </Suspense>
      </div>
      <Suspense fallback={<div className='container text-center'>Loading...</div>}>
        <TravelInspiration />
      </Suspense>
    </div>
  );
}
