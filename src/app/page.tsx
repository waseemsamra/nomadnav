'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { MapPin, Star, Plane, Briefcase, Award, LifeBuoy } from 'lucide-react';
import { useCheapestFlights } from '@/hooks/use-travel-search';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Testimonials } from '@/components/home/testimonials';
import { SearchForm } from '@/components/search/search-form';

const popularDestinations = PlaceHolderImages.filter(img =>
  ['dest-paris', 'dest-tokyo', 'dest-new-york', 'dest-bali', 'dest-rome', 'dest-dubai'].includes(img.id)
);

const filters = [
    { id: 'all', label: 'All' },
    { id: 'europe', label: 'Europe' },
    { id: 'asia', label: 'Asia' },
    { id: 'america', label: 'America' },
    { id: 'beach', label: 'Beach' },
    { id: 'city', label: 'City' }
];

const features = [
  {
    icon: <Briefcase className="feature-icon" />,
    title: 'Curated Packages',
    description: 'Explore our hand-picked selection of travel packages that suit every taste and budget.'
  },
  {
    icon: <Award className="feature-icon" />,
    title: 'Best-Price Guarantee',
    description: 'We offer competitive pricing and ensure you get the best value for your money.'
  },
  {
    icon: <LifeBuoy className="feature-icon" />,
    title: '24/7 Support',
    description: 'Our dedicated team is here to assist you anytime, ensuring a smooth and worry-free journey.'
  }
];


function DestinationGrid() {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  return (
    <section className="destinations-section">
      <div className='container'>
        <div className="section-header">
            <h2 className="section-title">Top Destinations</h2>
            <p className="section-subtitle">Explore our handpicked selection of the world's most captivating places. Your next great adventure starts here.</p>
        </div>
        <div className="destination-grid-container">
            <div className="destination-filters">
                {filters.map(filter => (
                    <button
                        key={filter.id}
                        className={`destination-filter ${activeFilter === filter.id ? 'active' : ''}`}
                        onClick={() => setActiveFilter(filter.id)}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>
            <div className="destinations-grid">
                {popularDestinations.map((dest, index) => (
                    <div
                      key={dest.id}
                      className="destination-card"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="destination-image">
                        <Image 
                          src={dest.imageUrl} 
                          alt={dest.description}
                          fill
                          className="object-cover"
                          data-ai-hint={dest.imageHint}
                        />
                        <div className="destination-overlay">
                          <button className="destination-wishlist">
                            ♥
                          </button>
                          <div className="destination-price">
                            From ${dest.price}
                          </div>
                        </div>
                      </div>
                      <div className="destination-content">
                        <div className="destination-header">
                          <h3 className="destination-name">{dest.description}</h3>
                          <div className="destination-rating">
                            <Star className="star-icon" />
                            <span>{dest.rating}</span>
                          </div>
                        </div>
                        <div className="destination-location">
                          <MapPin className="location-icon" />
                          <span>{dest.country}</span>
                        </div>
                        <p className="destination-description">{dest.summary}</p>
                        <div className="destination-footer">
                          <Link 
                            href={`/search?type=flights&destination=${dest.iata}`}
                            className="destination-explore"
                          >
                            Explore
                          </Link>
                          <button className="destination-quick-view">
                            Quick View
                          </button>
                        </div>
                      </div>
                    </div>
                ))}
            </div>
             <div className="destination-cta">
                <Link href="/search" className="view-all-destinations">
                View All Destinations
                </Link>
            </div>
        </div>
      </div>
    </section>
  );
}


function CheapestFlights() {
    const { data: cheapFlightsData, isLoading } = useCheapestFlights('JFK');
    const cheapFlights = cheapFlightsData ? Object.values(cheapFlightsData) : [];

    return (
        <div className="cheap-flights-section">
            <h3 className="cheap-flights-title">Cheapest Flights Right Now</h3>
            {isLoading ? (
                <p className="text-center">Loading best deals...</p>
            ) : (
                <div className="container">
                  <div className="cheap-flights-grid">
                      {cheapFlights.slice(0, 6).map((flight: any) => (
                          <div key={flight.destination} className="cheap-flight-card">
                              <div className="cheap-flight-route">
                                  <span className="cheap-flight-origin">{flight.origin}</span>
                                  <span className="cheap-flight-arrow">→</span>
                                  <span className="cheap-flight-destination">{flight.destination}</span>
                              </div>
                              <div className="cheap-flight-price">${flight.price}</div>
                              <Button size="sm" className="cheap-flight-book">
                                Book Now
                              </Button>
                          </div>
                      ))}
                  </div>
                </div>
            )}
        </div>
    )
}


export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero');
  return (
    <div className="homepage">
      <section className="hero-section">
        {heroImage && 
          <div 
            className="hero-background"
            style={{backgroundImage: `url(${heroImage.imageUrl})`}}
            data-ai-hint={heroImage.imageHint}
          />
        }
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">
            Your Journey, <span className="text-gradient">Reimagined</span>
          </h1>
          <p className="hero-subtitle">
            Discover and book flights and hotels with personalized
            recommendations. Nomad Navigator makes travel planning effortless.
          </p>
           <div className='hero-buttons'>
              <Link href="/search" className="btn-primary">
                <Plane className='mr-2'/> Start Your Adventure
              </Link>
              <Link href="/dashboard" className="btn-secondary">
                My Dashboard
              </Link>
            </div>
        </div>
      </section>

      <section className='main-search-section'>
        <div className='container'>
            <div className='search-wrapper search-card-animated'>
              <SearchForm />
            </div>
        </div>
      </section>
      
      <section className='features-section'>
        <div className='container'>
            <div className="section-header">
                <h2 className="section-title">Why Choose Us</h2>
                <p className="section-subtitle">We provide a seamless and personalized travel experience, making your dream vacation a reality.</p>
            </div>
            <div className='features-grid'>
              {features.map((feature, index) => (
                <div key={index} className='feature-card' style={{animationDelay: `${index * 0.1}s`}}>
                  <div className='feature-icon-wrapper' style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
                    {feature.icon}
                  </div>
                  <h3 className='feature-title'>{feature.title}</h3>
                  <p className='feature-description'>{feature.description}</p>
                </div>
              ))}
            </div>
        </div>
      </section>

      <DestinationGrid />

      <Testimonials />
    </div>
  );
}
