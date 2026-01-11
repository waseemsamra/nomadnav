
'use client';

import React from 'react';
import { 
  Plane, 
  Shield, 
  Clock, 
  Globe,
} from 'lucide-react';
import RealSearchForm from '@/components/search/RealSearchForm';

export default function HomePage() {

  const features = [
    {
      icon: <Plane className="h-10 w-10" />,
      title: "Real Flight Data",
      description: "Live prices from Travelpayouts API with 1000+ airlines",
      color: "text-blue-600 bg-blue-100"
    },
    {
      icon: <Shield className="h-10 w-10" />,
      title: "Secure Booking",
      description: "Direct booking with airline partners via secure links",
      color: "text-green-600 bg-green-100"
    },
    {
      icon: <Clock className="h-10 w-10" />,
      title: "Real-time Prices",
      description: "Prices updated every 10 minutes from global APIs",
      color: "text-purple-600 bg-purple-100"
    },
    {
      icon: <Globe className="h-10 w-10" />,
      title: "Global Coverage",
      description: "Access to flights in 150+ countries worldwide",
      color: "text-orange-600 bg-orange-100"
    }
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section id="search" className="relative h-[60vh] min-h-[500px] flex items-center justify-center text-white">
        <div className="hero-bg" data-ai-hint="aurora winter"></div>
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4">
            <div className='text-center mb-8'>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
                    Find Your Next Adventure
                </h1>
                <p className="text-lg text-gray-200 drop-shadow-md">
                    Search flights, hotels, and car rentals from one place.
                </p>
            </div>
            <RealSearchForm />
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powered by Real Travel Data
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform connects directly to Travelpayouts API for live flight information
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
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


      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Search Real Flights?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Start searching with live data from Travelpayouts API
          </p>
          <a 
            href="#search" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
          >
            <Plane className="w-5 h-5" />
            Start Searching Real Flights
          </a>
        </div>
      </section>
    </main>
  );
}

    