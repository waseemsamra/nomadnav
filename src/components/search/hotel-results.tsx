'use client';
import Image from 'next/image';
import {Star, MapPin, Hotel} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {useEffect, useState} from 'react';
import {travelpayoutsApi} from '@/lib/travelpayouts';
import {Skeleton} from '../ui/skeleton';

export function HotelResults({params}: {params: any}) {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotels = async () => {
      if (params.location) {
        setLoading(true);
        try {
          const results = await travelpayoutsApi.searchHotels(
            params.location,
            params.checkIn,
            params.checkOut
          );
          setHotels(results);
        } catch (error) {
          console.error('Failed to fetch hotels:', error);
        }
        setLoading(false);
      }
    };
    fetchHotels();
  }, [params]);

  if (loading) {
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
      {hotels.length > 0 ? (
        hotels.slice(0, 5).map(hotel => {
          return (
            <Card
              key={hotel.hotelId}
              className="transition-shadow hover:shadow-lg overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="relative h-48 md:h-full min-h-[150px]">
                  <Image
                    src={`https://photo.hotellook.com/image_v2/limit/${hotel.hotelId}/800/520.auto`}
                    alt={hotel.label}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="md:col-span-2 flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{hotel.label}</CardTitle>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{hotel.location.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center shrink-0 gap-1 bg-accent text-accent-foreground rounded-full px-2 py-1 text-sm font-bold">
                        <Star className="h-4 w-4 fill-current" />
                        <span>{hotel.stars}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex flex-col flex-grow justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {hotel.rating} rating
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-4">
                      <div>
                        <p className="text-2xl font-bold">${hotel.priceAvg}</p>
                        <p className="text-xs text-muted-foreground">
                          per night
                        </p>
                      </div>
                      <Button>Select Hotel</Button>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          );
        })
      ) : (
        <p>No hotels found for this location.</p>
      )}
    </div>
  );
}
