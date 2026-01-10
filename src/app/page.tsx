
'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Plane, Hotel, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/components/search/search-form';
import { Testimonials } from '@/components/home/Testimonials';

// Dynamically import components that might be heavy
const DestinationGrid = dynamic(() => import('@/components/home/DestinationGrid'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
});

const HeroSection = dynamic(() => import('@/components/home/HeroSection'), {
  loading: () => <div className="h-[600px] bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse" />
});

export default function HomePage() {
  const features = [
    {
      icon: <Plane className="h-10 w-10" />,
      title: "Best Flight Deals",
      description: "Find the cheapest flights from top airlines worldwide",
      color: "text-blue-600 bg-blue-100"
    },
    {
      icon: <Hotel className="h-10 w-10" />,
      title: "500k+ Hotels",
      description: "Luxury stays to budget rooms with best price guarantee",
      color: "text-green-600 bg-green-100"
    },
    {
      icon: <Shield className="h-10 w-10" />,
      title: "Secure Booking",
      description: "Your data is protected with bank-level security",
      color: "text-purple-600 bg-purple-100"
    },
    {
      icon: <TrendingUp className="h-10 w-10" />,
      title: "Price Tracking",
      description: "Get alerts when prices drop for your favorite routes",
      color: "text-orange-600 bg-orange-100"
    }
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <Suspense fallback={<div className="h-[600px] bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse" />}>
        <HeroSection />
      </Suspense>

      {/* Main Search */}
      <section className="py-8 md:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 -mt-24 relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Find Your Perfect Trip
              </h2>
              <p className="text-gray-600">
                Compare prices from 1000+ travel sites in one search
              </p>
            </div>
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Nomad Navigator
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We make travel planning simple, affordable, and enjoyable
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className={`inline-flex p-3 rounded-full ${feature.color} mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trending Destinations
            </h2>
            <p className="text-gray-600">
              Discover the most popular places to visit right now
            </p>
          </div>
          
          <Suspense fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg" />
              ))}
            </div>
          }>
            <DestinationGrid />
          </Suspense>
          
          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="px-8">
              View All Destinations
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">2M+</div>
              <div className="text-blue-100">Happy Travelers</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">150+</div>
              <div className="text-blue-100">Countries</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">4.8</div>
              <div className="text-blue-100">Rating</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Sign up today and get 10% off your first booking
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8 bg-white text-blue-600 hover:bg-gray-100">
              Create Free Account
            </Button>
            <Button size="lg" variant="outline" className="px-8 border-white text-white hover:bg-white/10">
              Explore Deals
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
