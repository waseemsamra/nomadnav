import Image from 'next/image';
import {SearchForm} from '@/components/search/search-form';
import {Suspense} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {PlaceHolderImages} from '@/lib/placeholder-images';
import {travelpayoutsApi} from '@/lib/travelpayouts';
import {Button} from '@/components/ui/button';
import Link from 'next/link';

const heroImage = PlaceHolderImages.find(img => img.id === 'hero');

const popularDestinations = PlaceHolderImages.filter(img =>
  ['flight-dest-1', 'flight-dest-2', 'flight-dest-3', 'flight-dest-4'].includes(
    img.id
  )
);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {popularDestinations.map(dest => (
          <div key={dest.id} className="relative group rounded-lg overflow-hidden h-64">
            <Image
              src={dest.imageUrl}
              alt={dest.description}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              data-ai-hint={dest.imageHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4 w-full flex justify-between items-center">
              <h3 className="text-white font-bold text-lg">{dest.description}</h3>
              <Button size="sm" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/#search">Explore</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Cheapest Flights from New York</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cheapFlights.slice(0, 5).map((flight: any) => (
            <div
              key={flight.destination}
              className="flex justify-between items-center p-3 bg-card border rounded-lg shadow-sm"
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
