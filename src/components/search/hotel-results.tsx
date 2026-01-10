'use client';
import Image from 'next/image';
import {Star, MapPin, Hotel} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Skeleton} from '../ui/skeleton';
import { HotelSearchParams } from '@/types/travel';
import { useHotelSearch } from '@/hooks/use-travel-search';

export function HotelResults({params}: {params: HotelSearchParams}) {
  const { data: hotels, isLoading } = useHotelSearch(params);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4 mb-4" />
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
        <Hotel /> Available Hotels
      </h2>
      {hotels && hotels.length > 0 ? (
        hotels.slice(0, 10).map(hotel => {
          return (
            <Card
              key={hotel.hotelId}
              className="transition-shadow hover:shadow-lg overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="relative h-48 md:h-full min-h-[150px]">
                  <Image
                    src={`https://photo.hotellook.com/image_v2/limit/${hotel.hotelId}/800/520.auto`}
                    alt={hotel.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="md:col-span-2 flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{hotel.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{hotel.locationName}</span>
                        </div>
                      </div>
                      {hotel.stars > 0 && (
                        <div className="flex items-center shrink-0 gap-1 bg-accent text-accent-foreground rounded-full px-2 py-1 text-sm font-bold">
                          <Star className="h-4 w-4 fill-current" />
                          <span>{hotel.stars}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex flex-col flex-grow justify-between">
                    <div>
                      {hotel.rating && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {hotel.rating} rating
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-4">
                      <div>
                        <p className="text-2xl font-bold">${hotel.priceAvg}</p>
                        <p className="text-xs text-muted-foreground">
                          per night
                        </p>
                      </div>
                      <Button asChild>
                        <a
                          href={`https://hotellook.com/hotels?hotelId=${hotel.hotelId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Select Hotel
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          );
        })
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No hotels found for this location. Try a different search.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
