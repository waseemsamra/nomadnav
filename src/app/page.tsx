import Image from "next/image";
import { SearchForm } from "@/components/search/search-form";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Suspense } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const heroImage = PlaceHolderImages.find((img) => img.id === "hero");

export default function Home() {
  const featuredDestinations = [
    { name: "Paris, France", imageId: "flight-dest-1" },
    { name: "Kyoto, Japan", imageId: "flight-dest-2" },
    { name: "New York, USA", imageId: "hotel-1" },
    { name: "Santorini, Greece", imageId: "hotel-2" },
  ];

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
            Discover and book flights and hotels with personalized recommendations. Nomad Navigator makes travel planning effortless.
          </p>
        </div>
      </section>

      <div id="search" className="container -mt-48 z-20">
        <Suspense fallback={<div className="h-48 w-full bg-background rounded-lg shadow-2xl animate-pulse" />}>
          <SearchForm />
        </Suspense>
      </div>

      <section className="container text-center">
        <h2 className="text-3xl font-bold font-headline mb-2">Featured Destinations</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">Get inspired for your next adventure with our curated list of must-visit locations around the globe.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredDestinations.map((dest) => {
            const destImage = PlaceHolderImages.find((img) => img.id === dest.imageId);
            return (
              <Card key={dest.name} className="overflow-hidden group text-left shadow-md hover:shadow-xl transition-shadow">
                {destImage && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={destImage.imageUrl}
                      alt={destImage.description}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={destImage.imageHint}
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-accent" />
                    {dest.name}
                  </CardTitle>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
