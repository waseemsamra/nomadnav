import Image from 'next/image';
import { Star, MapPin, Hotel } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockHotels } from '@/lib/placeholder-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function HotelResults() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold font-headline flex items-center gap-2"><Hotel /> Available Hotels</h2>
      {mockHotels.map((hotel) => {
        const hotelImage = PlaceHolderImages.find((img) => img.id === hotel.imageId);
        return (
          <Card key={hotel.id} className="transition-shadow hover:shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="relative h-48 md:h-full min-h-[150px]">
                {hotelImage && (
                  <Image
                    src={hotelImage.imageUrl}
                    alt={hotelImage.description}
                    fill
                    className="object-cover"
                    data-ai-hint={hotelImage.imageHint}
                  />
                )}
              </div>
              <div className="md:col-span-2 flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{hotel.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>Paris, France</span>
                      </div>
                    </div>
                    <div className="flex items-center shrink-0 gap-1 bg-accent text-accent-foreground rounded-full px-2 py-1 text-sm font-bold">
                      <Star className="h-4 w-4 fill-current" />
                      <span>{hotel.rating}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex flex-col flex-grow justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">{hotel.reviews} reviews</p>
                    <div className="flex flex-wrap gap-2">
                      {hotel.amenities.map(amenity => (
                        <Badge key={amenity} variant="secondary">{amenity}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <div>
                      <p className="text-2xl font-bold">${hotel.pricePerNight}</p>
                      <p className="text-xs text-muted-foreground">per night</p>
                    </div>
                    <Button>Select Hotel</Button>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
