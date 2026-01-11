'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plane, 
  Shield, 
  Clock, 
  Globe,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import RealSearchForm from '@/components/search/RealSearchForm';
import RealApiTest from '@/components/api/RealApiTest';
import { travelpayoutsApi, type Flight } from '@/services/travelpayoutsApi';

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [cheapFlights, setCheapFlights] = useState<Flight[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Check API status
      const status = await travelpayoutsApi.testApiConnection();
      setApiStatus(status);

      // Load cheap flights if API is working
      if (status.success) {
        const flights = await travelpayoutsApi.getCheapFlights('MOW', 'USD');
        setCheapFlights(flights.slice(0, 4));
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

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
      <section id="search" className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent animate-slide"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              {apiStatus?.success ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">API Connected • Real Data</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Connecting to API...</span>
                </>
              )}
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Find Your Perfect Flight
              <span className="block text-blue-200 mt-2">With Real API Data</span>
            </h1>
            
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
              Powered by Travelpayouts API. Search real flights, compare prices, and book directly with airlines.
            </p>
          </div>
        </div>
      </section>

      {/* Search Form */}
      <section className="px-4 -mt-12 relative z-10">
        <div className="max-w-6xl mx-auto">
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

      {/* API Status & Test */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Real API Connection
              </h2>
              <p className="text-gray-600 mb-8">
                Our platform uses the official Travelpayouts API to provide real flight data.
                Below you can see the live status of our API connection and test endpoints.
              </p>
              
              {cheapFlights.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Sample Real Flights</h3>
                  <div className="space-y-3">
                    {cheapFlights.map((flight, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <div className="font-medium">{flight.origin} → {flight.destination}</div>
                          <div className="text-sm text-gray-500">{flight.airline}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">${flight.price}</div>
                          <div className="text-xs text-gray-500">One way</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <RealApiTest />
            </div>
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
