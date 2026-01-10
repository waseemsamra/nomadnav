
'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';

const DestinationGrid: React.FC = () => {
  const popularDestinations = PlaceHolderImages.filter(img => 
    ['paris', 'tokyo', 'new-york', 'bali', 'rome', 'dubai'].includes(img.id)
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 justify-center">
        {['All', 'Europe', 'Asia', 'America', 'Beach', 'City'].map((filter) => (
          <button
            key={filter}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'All'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Destinations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {popularDestinations.map((destination) => (
          <div
            key={destination.id}
            className="group bg-card rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="relative h-64 overflow-hidden">
              <Image
                src={destination.imageUrl}
                alt={destination.description}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                data-ai-hint={destination.imageHint}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute top-4 right-4">
                <button className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                  <span className="text-red-500 text-xl">♥</span>
                </button>
              </div>
              <div className="absolute bottom-4 left-4">
                <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-foreground">
                  From ${destination.price}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-foreground">
                  {destination.description}
                </h3>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-semibold">{destination.rating}</span>
                </div>
              </div>
              
              <div className="flex items-center text-muted-foreground mb-4">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-sm">{destination.country}</span>
              </div>
              
              <p className="text-muted-foreground text-sm mb-6 line-clamp-2">
                {destination.summary}
              </p>
              
              <div className="flex gap-3">
                <Button asChild className="flex-1">
                    <Link href={`/search?type=flights&destination=${destination.iata}`}>Explore</Link>
                </Button>
                <Button variant="outline" className="flex-1">
                  Quick View
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DestinationGrid;
